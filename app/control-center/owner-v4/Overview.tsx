"use client";
import { useEffect, useState } from "react";
import { BadgeCheck, Boxes, Gamepad2, LifeBuoy, LoaderCircle, Megaphone,
  RefreshCw, ShieldCheck, ShoppingCart, Users, Workflow } from "lucide-react";
import { Workspace, json, formatDate } from "./shared";

export function Overview(){
  const [data,setData]=useState<any>(null),[error,setError]=useState("");
  async function load(){setError("");try{setData(await json(await fetch("/api/admin/v4/overview",{cache:"no-store"})))}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[]);
  const cards=data?.counts?[
    ["Products",data.counts.products,Boxes],["Live",data.counts.liveProducts,BadgeCheck],["Users",data.counts.users,Users],
    ["Orders",data.counts.orders,ShoppingCart],["Licenses",data.counts.licenses,ShieldCheck],["Web builds",data.counts.webBuilds,Gamepad2],
    ["Projects",data.counts.projects,Workflow],["Open tickets",data.counts.openTickets,LifeBuoy],["Announcements",data.counts.announcements,Megaphone],
  ]:[];

  return <Workspace eyebrow="OWNER OVERVIEW" title="SysOne holati" description="D1, R2, commerce va runtime bo'yicha qisqa ko'rinish."
    actions={<button className="ovIconBtn" onClick={()=>void load()}><RefreshCw size={15}/></button>}>
    {error?<div className="ovError">{error}</div>:null}
    {!data?<div className="ovLoading"><LoaderCircle className="spin"/> Ma'lumotlar yuklanmoqda...</div>:<>
      <div className="ovStats">{cards.map(([name,value,Icon]:any)=><article key={name}><Icon size={17}/><span><small>{name}</small><strong>{value}</strong></span></article>)}</div>
      <div className="ovPanel">
        <div className="ovPanelHead"><strong>So'nggi audit</strong><small>Owner actions</small></div>
        <div className="ovAuditList">{(data.audit??[]).map((row:any)=><div key={row.id}><span><strong>{row.action}</strong><small>{row.entity_type} / {row.entity_id??"вЂ”"}</small></span><time>{formatDate(row.created_at)}</time></div>)}</div>
      </div>
    </>}
  </Workspace>;
}

