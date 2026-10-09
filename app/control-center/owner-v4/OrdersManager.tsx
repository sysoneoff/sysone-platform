"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ShoppingBag, X } from "lucide-react";
import { DataTable, TableSearch, type Column } from "./DataTable";
import { Workspace,json,formatDate } from "./shared";

type OrderRow={id:string;userId:string;customerName:string;customerEmail:string|null;status:string;totalMinor:number;currency:string;createdAt:string;paidAt:string|null;itemCount:number;canCancel?:number};
type OrderDetail=OrderRow&{subtotalMinor:number;discountMinor:number;paymentProvider:string|null;items:{id:string;productName:string;slug:string;quantity:number;unitPriceMinor:number}[]};
const OPTIONS=["","PENDING","PAID","CANCELLED","FAILED","REFUNDED"];
export function money(value:number,currency:string){try{return new Intl.NumberFormat("uz-UZ",{style:"currency",currency}).format(value/100)}catch{return `${(value/100).toLocaleString("uz-UZ")} ${currency}`}}

export function OrdersManager(){
  const [rows,setRows]=useState<OrderRow[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(1),[draft,setDraft]=useState(""),[search,setSearch]=useState(""),[status,setStatus]=useState(""),[sort,setSort]=useState<"newest"|"oldest">("newest"),[tick,setTick]=useState(0);
  const [loading,setLoading]=useState(true),[error,setError]=useState(""),[detail,setDetail]=useState<OrderDetail|null>(null),[busy,setBusy]=useState(false),[detailError,setDetailError]=useState("");
  useEffect(()=>{let live=true;const params=new URLSearchParams({page:String(page),size:"20",sort});if(search)params.set("q",search);if(status)params.set("status",status);
    (async()=>{setLoading(true);setError("");try{const data=await json(await fetch(`/api/admin/v4/orders?${params}`,{cache:"no-store"}));if(live){setRows(data.rows);setTotal(data.total)}}catch(e){if(live)setError(e instanceof Error?e.message:"orders_unavailable")}finally{if(live)setLoading(false)}})();return()=>{live=false};
  },[page,search,status,sort,tick]);
  async function open(id:string){setDetailError("");setDetail(null);try{const data=await json(await fetch(`/api/admin/v4/orders/${encodeURIComponent(id)}`,{cache:"no-store"}));setDetail(data.order)}catch(e){setDetailError(e instanceof Error?e.message:"order_unavailable")}}
  async function cancel(){if(!detail||detail.canCancel!==1)return;if(!window.confirm("Faqat hali to'lanmagan buyurtmani bekor qilasizmi? Bu to'lovni qaytarmaydi."))return;
    setBusy(true);setDetailError("");try{await json(await fetch(`/api/admin/v4/orders/${encodeURIComponent(detail.id)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"CANCEL_PENDING"})}));setDetail(null);setTick(v=>v+1)}catch(e){setDetailError(e instanceof Error?e.message:"cancel_failed")}finally{setBusy(false)}}
  const columns:Column<OrderRow>[]=[
    {key:"id",title:"Buyurtma",render:r=><><strong>{r.id.slice(0,12)}</strong><small>{formatDate(r.createdAt)}</small></>,exportValue:r=>r.id},
    {key:"customerName",title:"Mijoz",render:r=><><strong>{r.customerName}</strong><small>{r.customerEmail??"—"}</small></>,exportValue:r=>r.customerName},
    {key:"status",title:"Holat",render:r=><span className={`ovP2Status ${r.status.toLowerCase()}`}>{r.status}</span>},
    {key:"totalMinor",title:"Summa",render:r=><strong>{money(r.totalMinor,r.currency)}</strong>,exportValue:r=>money(r.totalMinor,r.currency)},
    {key:"itemCount",title:"Mahsulot",render:r=><span>{r.itemCount} ta</span>},
    {key:"actions",title:"Amal",render:r=><button type="button" onClick={()=>void open(r.id)}>Batafsil</button>,exportValue:r=>r.id},
  ];
  return <Workspace eyebrow="COMMERCE / ORDERS" title="Buyurtmalar boshqaruvi" description="Buyurtmalarni kuzatish, filtrlash va faqat to'lanmaganlarini bekor qilish. To'lov tasdiqlash alohida jarayonda bajariladi."
    actions={<button type="button" className="ovIconBtn" aria-label="Yangilash" onClick={()=>setTick(v=>v+1)}><RefreshCw size={16}/></button>}>
    <div className="ovP2Filters"><TableSearch draft={draft} onDraftChange={setDraft} onSearch={()=>{setSearch(draft.trim());setPage(1)}} placeholder="ID, mijoz yoki email"/>
      <select aria-label="Buyurtma holati" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>{OPTIONS.map(o=><option key={o} value={o}>{o||"Barcha holatlar"}</option>)}</select>
      <select aria-label="Tartiblash" value={sort} onChange={e=>{setSort(e.target.value as "newest"|"oldest");setPage(1)}}><option value="newest">Yangilari avval</option><option value="oldest">Eskilari avval</option></select></div>
    {error?<div role="alert" className="ovError">{error}</div>:null}
    {detailError&&!detail?<div role="alert" className="ovError">{detailError}</div>:null}
    <DataTable rows={rows} columns={columns} total={total} page={page} size={20} loading={loading} onPageChange={setPage} fileName="sysone-orders-page.csv"/>
    {detail?<div className="ovModal" role="dialog" aria-modal="true" aria-label="Buyurtma tafsilotlari"><div className="ovDrawer"><header><div><span>ORDER DETAIL</span><h3>{detail.id.slice(0,16)}</h3><p>{detail.customerName} · {detail.customerEmail??""}</p></div><button type="button" aria-label="Yopish" onClick={()=>setDetail(null)}><X/></button></header>
      <div className="ovP2Detail"><div className="ovP2Summary"><span className={`ovP2Status ${detail.status.toLowerCase()}`}>{detail.status}</span><strong>{money(detail.totalMinor,detail.currency)}</strong><small>{formatDate(detail.createdAt)}</small></div>
      <h4>Mahsulotlar</h4>{detail.items.map(item=><div key={item.id} className="ovP2Item"><span><strong>{item.productName}</strong><small>{item.slug} · {item.quantity} dona</small></span><strong>{money(item.unitPriceMinor,detail.currency)}</strong></div>)}
      <p className="ovP2Note">To'lov provayderi: {detail.paymentProvider??"Belgilanmagan"}. Pulni qaytarish va to'lovni tasdiqlash ushbu oynada bajarilmaydi.</p>
      {detailError?<div role="alert" className="ovError">{detailError}</div>:null}</div>
      <footer><button type="button" className="button buttonGhost" onClick={()=>setDetail(null)}>Yopish</button>{detail.canCancel===1?<button type="button" className="button" disabled={busy} onClick={()=>void cancel()}><ShoppingBag size={14}/> To'lanmagan buyurtmani bekor qilish</button>:null}</footer>
      </div></div>:null}
  </Workspace>;
}
