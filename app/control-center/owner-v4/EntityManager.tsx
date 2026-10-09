"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Workspace, json } from "./shared";
type AnyRow=Record<string,any>;

export function EntityManager({entity,title,description}:{entity:string;title:string;description:string}){
  const [rows,setRows]=useState<AnyRow[]>([]),[editable,setEditable]=useState<string[]>([]),[pk,setPk]=useState("id"),[deletable,setDeletable]=useState(false),[selected,setSelected]=useState<AnyRow|null>(null),[error,setError]=useState("");
  async function load(){try{const d=await json(await fetch(`/api/admin/v4/entities/${entity}`,{cache:"no-store"}));setRows(d.rows??[]);setEditable(d.editable??[]);setPk(d.pk??"id");setDeletable(Boolean(d.deletable))}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[entity]);
  const cols=useMemo(()=>{const set=new Set<string>();rows.slice(0,15).forEach(r=>Object.keys(r).forEach(k=>set.add(k)));return [...set].slice(0,7)},[rows]);
  async function save(e:FormEvent){e.preventDefault();if(!selected)return;const changes:Record<string,any>={};editable.forEach(k=>changes[k]=selected[k]);try{await json(await fetch(`/api/admin/v4/entities/${entity}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:String(selected[pk]),changes})}));setSelected(null);await load()}catch(err){setError(err instanceof Error?err.message:"update_failed")}}
  async function remove(row:AnyRow){const id=String(row[pk]??"");if(!id||!confirm("Bu yozuv o'chirilsinmi?"))return;try{await json(await fetch(`/api/admin/v4/entities/${entity}?id=${encodeURIComponent(id)}`,{method:"DELETE"}));await load()}catch(err){setError(err instanceof Error?err.message:"delete_failed")}}
  return <Workspace eyebrow="DATABASE" title={title} description={description} actions={<button className="ovIconBtn" onClick={()=>void load()}><RefreshCw size={15}/></button>}>
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovTableWrap"><table className="ovTable"><thead><tr>{cols.map(c=><th key={c}>{c}</th>)}{(editable.length||deletable)?<th/>:null}</tr></thead><tbody>
      {rows.map((r,i)=><tr key={String(r[pk]??i)}>{cols.map(c=><td key={c}>{typeof r[c]==="object"?JSON.stringify(r[c]):String(r[c]??"вЂ”")}</td>)}{(editable.length||deletable)?<td><div className="ovRowActions">{editable.length?<button className="ovIconBtn" onClick={()=>setSelected({...r})}><Pencil size={13}/></button>:null}{deletable?<button className="danger" onClick={()=>void remove(r)}><Trash2 size={13}/></button>:null}</div></td>:null}</tr>)}
    </tbody></table></div>
    {selected?<div className="ovModal"><form className="ovDrawer" onSubmit={save}><header><div><span>DATABASE EDITOR</span><h3>{title}</h3></div><button type="button" onClick={()=>setSelected(null)}><X/></button></header>
      <div className="ovForm">{editable.map(k=><label className="wide" key={k}><span>{k}</span>{["enabled","published"].includes(k)
        ?<select value={selected[k]?1:0} onChange={e=>setSelected({...selected,[k]:e.target.value==="1"})}><option value={1}>true</option><option value={0}>false</option></select>
        :<input value={selected[k]??""} onChange={e=>setSelected({...selected,[k]:e.target.value})}/>}</label>)}</div>
      <footer><button type="button" className="button buttonGhost" onClick={()=>setSelected(null)}>Bekor</button><button className="button buttonPrimary"><Save size={15}/> Saqlash</button></footer>
    </form></div>:null}
  </Workspace>;
}


