import type { ReactNode } from "react";

export async function json(response:Response){
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||`request_${response.status}`);
  return data;
}
export function bytes(n:number){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
export function formatDate(v:any){if(!v)return "вЂ”";const d=new Date(String(v));return Number.isNaN(+d)?String(v):d.toLocaleString("uz-UZ")}

export function Workspace({eyebrow,title,description,actions,children}:{eyebrow:string;title:string;description?:string;actions?:ReactNode;children:ReactNode}){
  return <section className="ovWorkspace">
    <header className="ovWorkspaceHead"><div><span>{eyebrow}</span><h2>{title}</h2>{description?<p>{description}</p>:null}</div>{actions?<div>{actions}</div>:null}</header>
    {children}
  </section>;
}

