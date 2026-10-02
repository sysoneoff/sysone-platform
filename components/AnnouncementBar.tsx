"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Item={id:string;label:string|null;title:string;href:string|null;style:string};

export function AnnouncementBar(){
  const pathname=usePathname();
  const [items,setItems]=useState<Item[]>([]);
  const [hidden,setHidden]=useState(false);

  useEffect(()=>{
    if(pathname!=="/") return;
    let alive=true;
    fetch("/api/announcements",{cache:"no-store"})
      .then(r=>r.ok?r.json():Promise.reject())
      .then(data=>{if(alive)setItems(data.announcements??[])})
      .catch(()=>{if(alive)setItems([])});
    return()=>{alive=false};
  },[pathname]);

  const marquee=useMemo(()=>items.length>1?[...items,...items]:items,[items]);
  if(pathname!=="/"||hidden||!items.length) return null;

  return <div className="v4AnnouncementBar" role="region" aria-label="SysOne announcements">
    <div className="v4AnnouncementViewport">
      <div className={`v4AnnouncementTrack ${items.length>1?"moving":""}`}>
        {marquee.map((item,index)=>{
          const content=<>
            {item.label?<span className={`v4AnnouncementLabel style-${item.style.toLowerCase()}`}>{item.label}</span>:null}
            <strong>{item.title}</strong>
            {item.href?<ArrowUpRight size={13}/>:null}
          </>;
          return item.href
            ? <Link href={item.href} key={`${item.id}-${index}`}>{content}</Link>
            : <span key={`${item.id}-${index}`}>{content}</span>;
        })}
      </div>
    </div>
    <button type="button" onClick={()=>setHidden(true)} aria-label="E’lon lentasini yopish"><X size={14}/></button>
  </div>;
}
