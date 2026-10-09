"use client";
import { useEffect,useState } from "react";
import { Activity, BadgeCheck, Boxes, Gamepad2, LifeBuoy, Megaphone, RefreshCw, ShieldCheck, ShoppingCart, Users, Workflow } from "lucide-react";
import { Workspace,json,formatDate } from "./shared";
import { money } from "./OrdersManager";

type Analytics={
  counts:{products:number;liveProducts:number;users:number;orders:number;licenses:number;projects:number;openTickets:number;webBuilds:number;announcements:number};
  paidRevenueByCurrency:{currency:string;totalMinor:number;orders:number}[];
  orderStatuses:{status:string;total:number}[];
  dailyOrders:{day:string;total:number}[];
  recentOrders:{id:string;customerName:string;status:string;totalMinor:number;currency:string;createdAt:string}[];
  audit:{id:string;action:string;entity_type:string;entity_id:string|null;created_at:string}[];
};
const cards=[
  ["Mahsulotlar","products",Boxes],["Nashrdagi","liveProducts",BadgeCheck],["Mijozlar","users",Users],
  ["Buyurtmalar","orders",ShoppingCart],["Litsenziyalar","licenses",ShieldCheck],["Web builds","webBuilds",Gamepad2],
  ["Loyihalar","projects",Workflow],["Ochiq ticket","openTickets",LifeBuoy],["E'lonlar","announcements",Megaphone],
] as const;
export function Overview(){
  const [data,setData]=useState<Analytics|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[tick,setTick]=useState(0);
  useEffect(()=>{let live=true;(async()=>{setBusy(true);setError("");try{const result=await json(await fetch("/api/admin/v4/analytics",{cache:"no-store"}));if(live)setData(result)}catch(e){if(live)setError(e instanceof Error?e.message:"analytics_unavailable")}finally{if(live)setBusy(false)}})();return()=>{live=false}},[tick]);
  const max=Math.max(1,...(data?.dailyOrders??[]).map(x=>x.total));
  return <Workspace eyebrow="OWNER / COMMAND CENTER" title="Platforma holati" description="Mahsulotlar, buyurtmalar, faol mijozlar va auditorlik tarixi — bitta professional boshqaruv markazida."
    actions={<button className="ovIconBtn" aria-label="Yangilash" onClick={()=>setTick(v=>v+1)} disabled={busy}><RefreshCw size={16}/></button>}>
    {error?<div className="ovError" role="alert">{error}</div>:null}
    {busy&&!data?<div className="ovLoading">Dashboard yuklanmoqda...</div>:null}
    {data?<>
      <div className="ovStats">{cards.map(([title,key,Icon])=><article key={key}><Icon size={17}/><span><small>{title}</small><strong>{data.counts[key].toLocaleString("uz-UZ")}</strong></span></article>)}</div>
      <div className="ovP2Analytics"><section className="ovPanel"><div className="ovPanelHead"><strong>So'nggi 14 kun — buyurtmalar</strong><small>Yaratilgan buyurtmalar soni</small></div>
        <div className="ovP2Chart" role="img" aria-label="Buyurtmalar bo'yicha kunlik ustunli grafik">{data.dailyOrders.length?data.dailyOrders.map(x=><div className="ovP2BarGroup" key={x.day} title={`${x.day}: ${x.total}`}><span>{x.total}</span><div style={{height:`${Math.max(x.total?7:2,x.total/max*100)}%`}}/><small>{x.day.slice(5)}</small></div>):<p className="ovP2Note">Bu davrda buyurtma mavjud emas.</p>}</div>
      </section><section className="ovPanel"><div className="ovPanelHead"><strong>To'langan buyurtmalar</strong><small>Valyuta bo'yicha alohida</small></div>
        <div className="ovP2Revenue">{data.paidRevenueByCurrency.length?data.paidRevenueByCurrency.map(row=><div className="ovP2RevenueLine" key={row.currency}><span><small>{row.currency}</small><strong>{money(row.totalMinor,row.currency)}</strong></span><small>{row.orders} ta to'langan</small></div>):<p className="ovP2Note">To'langan buyurtmalar hozircha yo'q.</p>}</div>
        <div className="ovP2StatusGrid">{data.orderStatuses.map(row=><div key={row.status}><span className={`ovP2Status ${row.status.toLowerCase()}`}>{row.status}</span><strong>{row.total}</strong></div>)}</div>
        <p className="ovP2Note">Daromad faqat PAID holatidagi buyurtmalar yig'indisi; qaytarishlar va haqiqiy bank to'lovlari alohida tekshiriladi.</p>
      </section></div>
      <div className="ovP2Analytics"><section className="ovPanel"><div className="ovPanelHead"><strong>Oxirgi buyurtmalar</strong><small>{data.recentOrders.length} ta</small></div>
        {data.recentOrders.length?data.recentOrders.map(row=><div className="ovP2Item" key={row.id}><span><strong>{row.customerName}</strong><small>{formatDate(row.createdAt)}</small></span><span><strong>{money(row.totalMinor,row.currency)}</strong><small className="ovP2End">{row.status}</small></span></div>):<p className="ovP2Note">Ma'lumot yo'q.</p>}
      </section><section className="ovPanel"><div className="ovPanelHead"><strong>So'nggi audit</strong><small><Activity size={13}/></small></div>
        {data.audit.length?data.audit.map(row=><div className="ovP2Item" key={row.id}><span><strong>{row.action}</strong><small>{row.entity_type} / {row.entity_id??"—"}</small></span><small>{formatDate(row.created_at)}</small></div>):<p className="ovP2Note">Audit yozuvlari yo'q.</p>}
      </section></div>
    </>:null}
  </Workspace>;
}
