"use client";
import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { DataTable, TableSearch, type Column } from "./DataTable";
import { Workspace,json,formatDate } from "./shared";
import { money } from "./OrdersManager";

type CustomerRow={id:string;name:string;email:string|null;role:string;locale:string;createdAt:string;orderCount:number;activeProducts:number;openTickets:number};
type CustomerDetail={customer:CustomerRow;orders:{id:string;status:string;totalMinor:number;currency:string;createdAt:string}[];products:{id:string;status:string;productName:string;slug:string;endsAt:string|null}[];tickets:{id:string;subject:string;status:string;priority:string}[];projects:{id:string;title:string;status:string;progress:number}[]};
export function CustomersManager(){
  const [rows,setRows]=useState<CustomerRow[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[draft,setDraft]=useState(""),[search,setSearch]=useState(""),[sort,setSort]=useState<"newest"|"oldest">("newest"),[tick,setTick]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState(""),[detail,setDetail]=useState<CustomerDetail|null>(null),[detailError,setDetailError]=useState("");
  useEffect(()=>{let live=true;const params=new URLSearchParams({page:String(page),size:"20",sort});if(search)params.set("q",search);
    (async()=>{setLoading(true);setError("");try{const data=await json(await fetch(`/api/admin/v4/customers?${params}`,{cache:"no-store"}));if(live){setRows(data.rows);setTotal(data.total)}}catch(e){if(live)setError(e instanceof Error?e.message:"customers_unavailable")}finally{if(live)setLoading(false)}})();return()=>{live=false};
  },[page,search,sort,tick]);
  async function open(id:string){setDetailError("");setDetail(null);try{const d=await json(await fetch(`/api/admin/v4/customers/${encodeURIComponent(id)}`,{cache:"no-store"}));setDetail(d)}catch(e){setDetailError(e instanceof Error?e.message:"customer_unavailable")}}
  const columns:Column<CustomerRow>[]=[
    {key:"name",title:"Mijoz",render:r=><><strong>{r.name}</strong><small>{r.email??"Email mavjud emas"}</small></>,exportValue:r=>r.name},
    {key:"id",title:"SysOne ID",render:r=><span title={r.id}>{r.id.slice(0,14)}...</span>,exportValue:r=>r.id},
    {key:"orderCount",title:"Buyurtmalar",render:r=><strong>{r.orderCount}</strong>},
    {key:"activeProducts",title:"Faol mahsulotlar",render:r=><strong>{r.activeProducts}</strong>},
    {key:"openTickets",title:"Ochiq murojaatlar",render:r=><span className={r.openTickets?"ovP2Warn":""}>{r.openTickets}</span>},
    {key:"createdAt",title:"Ro'yxatdan o'tgan",render:r=><span>{formatDate(r.createdAt)}</span>},
    {key:"actions",title:"Profil",render:r=><button type="button" onClick={()=>void open(r.id)}>Customer 360</button>,exportValue:r=>r.id},
  ];
  return <Workspace eyebrow="CUSTOMERS / SYSOne ID" title="Customer 360" description="Mijozning buyurtmalari, faol mahsulot huquqlari, loyihalari va murojaatlari — bir oynada."
    actions={<button type="button" className="ovIconBtn" aria-label="Yangilash" onClick={()=>setTick(x=>x+1)}><RefreshCw size={16}/></button>}>
    <div className="ovP2Filters"><TableSearch draft={draft} onDraftChange={setDraft} onSearch={()=>{setSearch(draft.trim());setPage(1)}} placeholder="Ism, email yoki SysOne ID"/>
      <select aria-label="Tartiblash" value={sort} onChange={e=>{setSort(e.target.value as "newest"|"oldest");setPage(1)}}><option value="newest">Yangi foydalanuvchilar</option><option value="oldest">Eski foydalanuvchilar</option></select></div>
    {error?<div role="alert" className="ovError">{error}</div>:null}{detailError&&!detail?<div role="alert" className="ovError">{detailError}</div>:null}
    <DataTable rows={rows} columns={columns} total={total} page={page} size={20} loading={loading} onPageChange={setPage} fileName="sysone-customers-page.csv"/>
    {detail?<div className="ovModal" role="dialog" aria-modal="true" aria-label="Mijoz tafsilotlari"><div className="ovDrawer ovP2Drawer"><header><div><span>CUSTOMER 360</span><h3>{detail.customer.name}</h3><p>{detail.customer.email??"Email mavjud emas"}</p></div><button type="button" aria-label="Yopish" onClick={()=>setDetail(null)}><X/></button></header>
      <div className="ovP2Detail"><div className="ovP2Kpis"><div><small>Buyurtmalar</small><strong>{detail.orders.length}{detail.orders.length===15?"+":""}</strong></div><div><small>Mahsulot huquqlari</small><strong>{detail.products.length}{detail.products.length===15?"+":""}</strong></div><div><small>Murojaatlar</small><strong>{detail.tickets.length}{detail.tickets.length===15?"+":""}</strong></div></div>
      <p className="ovP2Note">SysOne ID: {detail.customer.id} · Til: {detail.customer.locale} · Ro'yxatdan o'tgan: {formatDate(detail.customer.createdAt)}. Ro'yxatlar oxirgi 15 ta yozuvni ko'rsatadi.</p>
      <h4>So'nggi buyurtmalar</h4>{detail.orders.length?detail.orders.map(row=><div key={row.id} className="ovP2Item"><span><strong>{row.id.slice(0,12)}</strong><small>{formatDate(row.createdAt)}</small></span><span><small>{row.status}</small><strong>{money(row.totalMinor,row.currency)}</strong></span></div>):<p className="ovP2Note">Buyurtmalar yo'q.</p>}
      <h4>Mahsulot huquqlari</h4>{detail.products.length?detail.products.map(row=><div key={row.id} className="ovP2Item"><span><strong>{row.productName}</strong><small>{row.slug}</small></span><small>{row.status}</small></div>):<p className="ovP2Note">Huquqlar yo'q.</p>}
      <h4>Murojaatlar</h4>{detail.tickets.length?detail.tickets.map(row=><div key={row.id} className="ovP2Item"><span><strong>{row.subject}</strong><small>{row.priority}</small></span><small>{row.status}</small></div>):<p className="ovP2Note">Murojaatlar yo'q.</p>}
      <h4>Loyihalar</h4>{detail.projects.length?detail.projects.map(row=><div key={row.id} className="ovP2Item"><span><strong>{row.title}</strong><small>{row.progress}% bajarilgan</small></span><small>{row.status}</small></div>):<p className="ovP2Note">Loyihalar yo'q.</p>}
      </div><footer><button type="button" className="button buttonGhost" onClick={()=>setDetail(null)}>Yopish</button></footer></div></div>:null}
  </Workspace>;
}
