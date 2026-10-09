"use client";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { toCsv } from "@/lib/owner-phase2-query";
export type Column<T> = { key:string; title:string; render:(row:T)=>ReactNode; exportValue?:(row:T)=>unknown };
export function DataTable<T extends {id:string}>({rows,columns,total,page,size,loading,onPageChange,empty="Hozircha ma'lumot yo'q",fileName="sysone-export.csv"}:{
  rows:T[];columns:Column<T>[];total:number;page:number;size:number;loading:boolean;
  onPageChange:(page:number)=>void;empty?:string;fileName?:string;
}){
  const pages=Math.max(1,Math.ceil(total/size));
  function exportPage(){
    // Export only the current, already-authorized page; no client-side full-database dump.
    const csv=toCsv(columns.map(c=>c.title),rows.map(row=>columns.map(c=>c.exportValue?c.exportValue(row):String((row as Record<string,unknown>)[c.key]??""))));
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fileName;a.click();URL.revokeObjectURL(url);
  }
  return <div className="ovP2Data">
    <div className="ovP2TableTools"><span>{total.toLocaleString("uz-UZ")} ta yozuv · {page}-sahifa</span><button type="button" onClick={exportPage} disabled={!rows.length}><Download size={14}/> Joriy sahifa CSV</button></div>
    <div className="ovTableWrap"><table className="ovTable ovP2Table"><thead><tr>{columns.map(c=><th key={c.key} scope="col">{c.title}</th>)}</tr></thead><tbody>
      {rows.map(row=><tr key={row.id}>{columns.map(c=><td key={c.key}>{c.render(row)}</td>)}</tr>)}
      {!rows.length?<tr><td colSpan={columns.length} className="ovP2Empty">{loading?"Yuklanmoqda...":empty}</td></tr>:null}
    </tbody></table></div>
    <div className="ovP2Pager"><span>{Math.min(total,(page-1)*size+1)}–{Math.min(total,page*size)} / {total}</span>
      <div><button type="button" aria-label="Oldingi sahifa" disabled={loading||page<=1} onClick={()=>onPageChange(page-1)}><ChevronLeft size={16}/></button>
      <span>{page} / {pages}</span>
      <button type="button" aria-label="Keyingi sahifa" disabled={loading||page>=pages} onClick={()=>onPageChange(page+1)}><ChevronRight size={16}/></button></div>
    </div>
  </div>;
}

export function TableSearch({draft,onDraftChange,onSearch,placeholder}:{draft:string;onDraftChange:(value:string)=>void;onSearch:()=>void;placeholder:string}){
  return <form className="ovP2Search" onSubmit={e=>{e.preventDefault();onSearch()}}><Search size={15}/><input aria-label="Qidiruv" placeholder={placeholder} value={draft} maxLength={100} onChange={e=>onDraftChange(e.target.value)}/><button type="submit">Qidirish</button></form>;
}
