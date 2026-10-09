"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, BadgeCheck, BellRing, Boxes, ChevronRight, Database, FileArchive,
  Flag, Gamepad2, Gauge, Image as ImageIcon, LayoutDashboard, LifeBuoy,
  LoaderCircle, LogOut, Megaphone, MonitorDown, Package, Pencil, Plus, RefreshCw, Save,
  Search, Settings, ShieldCheck, ShoppingCart, Trash2, Upload, UserRound, Users,
  Workflow, X,
} from "lucide-react";

import { ReleaseManager } from "./ReleaseManager";
import { ProjectRequestsManager } from "./ProjectRequestsManager";
import { SupportTicketsManager } from "./SupportTicketsManager";
import { Workspace, json, bytes, formatDate } from "./owner-v4/shared";
import { NAV } from "./owner-v4/navigation";
import { Overview } from "./owner-v4/Overview";
import { EntityManager } from "./owner-v4/EntityManager";

type Product={
  id:string;slug:string;name:string;kind:string;category:string|null;description:string|null;
  status:string;pricingModel:string;priceMinor:number;currency:string;featured:boolean;published:boolean;
};
type RuntimeProduct={
  productId:string;slug:string;name:string;kind:string;published:boolean;deliveryMode:string;runtimeType:string;
  launchUrl:string|null;embedMode:string;activeBuildId:string|null;requiresAuth:boolean;requiresEntitlement:boolean;
  supportsFullscreen:boolean;healthcheckUrl:string|null;buildCount:number;activeVersion:string|null;activePrefix:string|null;
};
type Announcement={id:string;label:string|null;title:string;href:string|null;style:string;priority:number;enabled:boolean;startsAt:string|null;endsAt:string|null};





function Announcements(){
  const [items,setItems]=useState<Announcement[]>([]),[editing,setEditing]=useState<any>(null),[error,setError]=useState("");
  async function load(){try{setItems((await json(await fetch("/api/admin/v4/announcements",{cache:"no-store"}))).announcements??[])}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[]);
  async function save(e:FormEvent){e.preventDefault();try{
    await json(await fetch(editing.id?`/api/admin/v4/announcements/${editing.id}`:"/api/admin/v4/announcements",{
      method:editing.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing),
    }));setEditing(null);await load();
  }catch(err){setError(err instanceof Error?err.message:"save_failed")}}
  async function remove(id:string){if(!confirm("E'lon o'chirilsinmi?"))return;await json(await fetch(`/api/admin/v4/announcements/${id}`,{method:"DELETE"}));await load()}
  const blank={label:"YANGI",title:"",href:"",style:"NEW",priority:0,enabled:true,startsAt:"",endsAt:""};

  return <Workspace eyebrow="HEADER TICKER" title="E'lon va reklama lentasi" description="Bosh sahifa header tepasidagi yangi o'yin, dastur, update va aksiyalar."
    actions={<button className="button buttonPrimary" onClick={()=>setEditing({...blank})}><Plus size={15}/> Yangi e'lon</button>}>
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovCards">{items.map(item=><article key={item.id} className="ovCard">
      <div className="ovCardMain"><span className={`ovTag ${item.enabled?"live":""}`}>{item.enabled?"LIVE":"OFF"}</span><div><small>{item.label??item.style}</small><strong>{item.title}</strong><p>{item.href||"Link yo'q"} / priority {item.priority}</p></div></div>
      <div className="ovRowActions"><button onClick={()=>setEditing({...item,startsAt:item.startsAt??"",endsAt:item.endsAt??""})}><Pencil size={14}/></button><button className="danger" onClick={()=>void remove(item.id)}><Trash2 size={14}/></button></div>
    </article>)}</div>
    {editing?<div className="ovModal"><form className="ovDrawer" onSubmit={save}>
      <header><div><span>ANNOUNCEMENT</span><h3>{editing.id?"E'lonni tahrirlash":"Yangi e'lon"}</h3></div><button type="button" onClick={()=>setEditing(null)}><X/></button></header>
      <div className="ovForm">
        <label className="wide"><span>Matn</span><input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})} required/></label>
        <label><span>Label</span><input value={editing.label??""} onChange={e=>setEditing({...editing,label:e.target.value})}/></label>
        <label><span>Style</span><select value={editing.style} onChange={e=>setEditing({...editing,style:e.target.value})}>{["DEFAULT","NEW","UPDATE","GAME","APP","SALE"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="wide"><span>Link</span><input value={editing.href??""} onChange={e=>setEditing({...editing,href:e.target.value})} placeholder="/games/my-game"/></label>
        <label><span>Priority</span><input type="number" value={editing.priority} onChange={e=>setEditing({...editing,priority:Number(e.target.value)})}/></label>
        <label className="ovCheck"><input type="checkbox" checked={editing.enabled} onChange={e=>setEditing({...editing,enabled:e.target.checked})}/><span>Faol</span></label>
        <label><span>Boshlanish</span><input value={editing.startsAt??""} onChange={e=>setEditing({...editing,startsAt:e.target.value})} placeholder="2026-10-02T10:00:00"/></label>
        <label><span>Tugash</span><input value={editing.endsAt??""} onChange={e=>setEditing({...editing,endsAt:e.target.value})}/></label>
      </div>
      <footer><button type="button" className="button buttonGhost" onClick={()=>setEditing(null)}>Bekor</button><button className="button buttonPrimary"><Save size={15}/> Saqlash</button></footer>
    </form></div>:null}
  </Workspace>;
}


function ProductDetailsDrawer({product,onClose}:{product:Product;onClose:()=>void}){
  const [d,setD]=useState<any>(null),[assets,setAssets]=useState<any[]>([]),[error,setError]=useState(""),[saving,setSaving]=useState(false);
  const [mediaKey,setMediaKey]=useState(""),[mediaType,setMediaType]=useState("COVER");
  async function load(){
    setError("");
    try{
      const [detailData,mediaData]=await Promise.all([
        json(await fetch(`/api/admin/v4/products/${product.id}/details`,{cache:"no-store"})),
        json(await fetch("/api/admin/media",{cache:"no-store"})),
      ]);
      const raw=detailData.details;
      const promo=raw.promotions?.[0];
      setD({...raw,
        promotion:promo?{enabled:Boolean(promo.enabled),salePriceMinor:Number(promo.sale_price_minor??0),currency:promo.currency??"UZS",startsAt:promo.starts_at??"",endsAt:promo.ends_at??""}:null,
        relatedProductIds:(raw.relations??[]).map((r:any)=>r.related_product_id),
      });
      setAssets(mediaData.assets??[]);
    }catch(e){setError(e instanceof Error?e.message:"details_load_failed")}
  }
  useEffect(()=>{void load()},[product.id]);
  async function save(e:FormEvent){e.preventDefault();if(!d)return;setSaving(true);setError("");try{
    await json(await fetch(`/api/admin/v4/products/${product.id}/details`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}));
    onClose();
  }catch(err){setError(err instanceof Error?err.message:"details_save_failed")}finally{setSaving(false)}}
  function addMedia(){if(!mediaKey||!d)return; if((d.media??[]).some((m:any)=>m.key===mediaKey))return; const item=assets.find(a=>a.key===mediaKey);setD({...d,media:[...(d.media??[]),{key:mediaKey,type:mediaType,alt:product.name,sortOrder:(d.media??[]).length,width:null,height:null,durationSeconds:null}]});setMediaKey(item?"":"")}
  if(!d)return <div className="ovModal"><div className="ovDrawer ovDetailsDrawer"><header><div><span>PRODUCT DETAILS</span><h3>{product.name}</h3></div><button onClick={onClose}><X/></button></header>{error?<div className="ovError">{error}</div>:<div className="ovLoading"><LoaderCircle className="spin"/> Detallar yuklanmoqda...</div>}</div></div>;
  return <div className="ovModal"><form className="ovDrawer ovDetailsDrawer" onSubmit={save}>
    <header><div><span>FULL STORE EDITOR</span><h3>{product.name}</h3><p>Store metadata, platformalar, media, features va promotion.</p></div><button type="button" onClick={onClose}><X/></button></header>
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovDetailSections">
      <section><h4>Store profile</h4><div className="ovForm">
        <label className="wide"><span>Tagline</span><input value={d.profile.tagline} onChange={e=>setD({...d,profile:{...d.profile,tagline:e.target.value}})}/></label>
        <label className="wide"><span>Short description</span><textarea rows={3} value={d.profile.shortDescription} onChange={e=>setD({...d,profile:{...d.profile,shortDescription:e.target.value}})}/></label>
        <label><span>Developer</span><input value={d.profile.developerName} onChange={e=>setD({...d,profile:{...d.profile,developerName:e.target.value}})}/></label>
        <label><span>Release date</span><input value={d.profile.releaseDate} onChange={e=>setD({...d,profile:{...d.profile,releaseDate:e.target.value}})}/></label>
        <label><span>Age rating</span><input value={d.profile.ageRating} onChange={e=>setD({...d,profile:{...d.profile,ageRating:e.target.value}})}/></label>
        <label><span>Featured rank</span><input type="number" min={0} value={d.profile.featuredRank} onChange={e=>setD({...d,profile:{...d.profile,featuredRank:Number(e.target.value)}})}/></label>
        <label className="wide"><span>Tags / vergul bilan</span><input value={(d.tags??[]).join(", ")} onChange={e=>setD({...d,tags:e.target.value.split(",").map((x:string)=>x.trim()).filter(Boolean)})}/></label>
      </div></section>

      <section><div className="ovDetailSectionHead"><h4>Platformalar va tizim talablari</h4><button type="button" onClick={()=>setD({...d,platforms:[...(d.platforms??[]),{platform:"WEB",architecture:"",minOs:"",minSystem:"",recommendedSystem:""}]})}><Plus size={13}/> Qo'shish</button></div>
        <div className="ovRepeatList">{(d.platforms??[]).map((row:any,i:number)=><div className="ovRepeatRow" key={i}>
          <input placeholder="Platform" value={row.platform} onChange={e=>{const a=[...d.platforms];a[i]={...row,platform:e.target.value};setD({...d,platforms:a})}}/>
          <input placeholder="Architecture" value={row.architecture??""} onChange={e=>{const a=[...d.platforms];a[i]={...row,architecture:e.target.value};setD({...d,platforms:a})}}/>
          <input placeholder="Min OS" value={row.minOs??""} onChange={e=>{const a=[...d.platforms];a[i]={...row,minOs:e.target.value};setD({...d,platforms:a})}}/>
          <input className="wideField" placeholder="Minimum system" value={row.minSystem??""} onChange={e=>{const a=[...d.platforms];a[i]={...row,minSystem:e.target.value};setD({...d,platforms:a})}}/>
          <input className="wideField" placeholder="Recommended" value={row.recommendedSystem??""} onChange={e=>{const a=[...d.platforms];a[i]={...row,recommendedSystem:e.target.value};setD({...d,platforms:a})}}/>
          <button type="button" className="danger" onClick={()=>setD({...d,platforms:d.platforms.filter((_:any,n:number)=>n!==i)})}><Trash2 size={13}/></button>
        </div>)}</div>
      </section>

      <section><div className="ovDetailSectionHead"><h4>Features</h4><button type="button" onClick={()=>setD({...d,features:[...(d.features??[]),{title:"",description:"",sortOrder:(d.features??[]).length}]})}><Plus size={13}/> Feature</button></div>
        <div className="ovRepeatList">{(d.features??[]).map((row:any,i:number)=><div className="ovRepeatRow feature" key={i}>
          <input placeholder="Nomi" value={row.title} onChange={e=>{const a=[...d.features];a[i]={...row,title:e.target.value};setD({...d,features:a})}}/>
          <input className="wideField" placeholder="Tavsif" value={row.description??""} onChange={e=>{const a=[...d.features];a[i]={...row,description:e.target.value};setD({...d,features:a})}}/>
          <button type="button" className="danger" onClick={()=>setD({...d,features:d.features.filter((_:any,n:number)=>n!==i)})}><Trash2 size={13}/></button>
        </div>)}</div>
      </section>

      <section><div className="ovDetailSectionHead"><h4>Media biriktirish</h4><small>Avval Media kutubxonasiga yuklang, keyin mahsulotga ulang.</small></div>
        <div className="ovAttachMedia"><select value={mediaKey} onChange={e=>setMediaKey(e.target.value)}><option value="">Media tanlang</option>{assets.map(a=><option key={a.key} value={a.key}>{a.key.split("/").pop()}</option>)}</select><select value={mediaType} onChange={e=>setMediaType(e.target.value)}>{["COVER","HERO","BANNER","ICON","SCREENSHOT","GALLERY","VIDEO"].map(x=><option key={x}>{x}</option>)}</select><button type="button" onClick={addMedia}><Plus size={13}/> Biriktirish</button></div>
        <div className="ovAttachedMedia">{(d.media??[]).map((m:any,i:number)=><div key={`${m.key}-${i}`}><span><strong>{m.type}</strong><small>{m.key}</small></span><input placeholder="Alt text" value={m.alt??""} onChange={e=>{const a=[...d.media];a[i]={...m,alt:e.target.value};setD({...d,media:a})}}/><button type="button" className="danger" onClick={()=>setD({...d,media:d.media.filter((_:any,n:number)=>n!==i)})}><Trash2 size={13}/></button></div>)}</div>
      </section>

      <section><h4>Promotion</h4>{!d.promotion?<button type="button" className="ovAddInline" onClick={()=>setD({...d,promotion:{enabled:true,salePriceMinor:0,currency:product.currency||"UZS",startsAt:"",endsAt:""}})}><Plus size={13}/> Aksiya qo'shish</button>:<div className="ovForm">
        <label><span>Sale price / minor</span><input type="number" min={0} value={d.promotion.salePriceMinor} onChange={e=>setD({...d,promotion:{...d.promotion,salePriceMinor:Number(e.target.value)}})}/></label>
        <label><span>Currency</span><input value={d.promotion.currency} onChange={e=>setD({...d,promotion:{...d.promotion,currency:e.target.value}})}/></label>
        <label><span>Starts</span><input value={d.promotion.startsAt??""} onChange={e=>setD({...d,promotion:{...d.promotion,startsAt:e.target.value}})}/></label>
        <label><span>Ends</span><input value={d.promotion.endsAt??""} onChange={e=>setD({...d,promotion:{...d.promotion,endsAt:e.target.value}})}/></label>
        <button type="button" className="ovDangerText" onClick={()=>setD({...d,promotion:null})}>Promotion'ni olib tashlash</button>
      </div>}</section>

      <section><h4>Related products</h4><div className="ovRelationGrid">{(d.availableProducts??[]).map((p:any)=><label key={p.id}><input type="checkbox" checked={(d.relatedProductIds??[]).includes(p.id)} onChange={e=>setD({...d,relatedProductIds:e.target.checked?[...(d.relatedProductIds??[]),p.id]:(d.relatedProductIds??[]).filter((x:string)=>x!==p.id)})}/><span><strong>{p.name}</strong><small>{p.kind} / {p.slug}</small></span></label>)}</div></section>
    </div>
    <footer><button type="button" className="button buttonGhost" onClick={onClose}>Bekor</button><button className="button buttonPrimary" disabled={saving}>{saving?<LoaderCircle className="spin" size={15}/>:<Save size={15}/>} Barcha detallarni saqlash</button></footer>
  </form></div>;
}

function Catalog(){
  const [products,setProducts]=useState<Product[]>([]),[edit,setEdit]=useState<any>(null),[detailsProduct,setDetailsProduct]=useState<Product|null>(null),[query,setQuery]=useState(""),[error,setError]=useState("");
  async function load(){try{setProducts((await json(await fetch("/api/admin/products",{cache:"no-store"}))).products??[])}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[]);
  const list=useMemo(()=>products.filter(p=>`${p.name} ${p.slug} ${p.kind} ${p.category??""}`.toLowerCase().includes(query.toLowerCase())),[products,query]);
  const blank={slug:"",name:"",kind:"SOFTWARE",category:"",description:"",status:"DRAFT",pricingModel:"FREE",priceMinor:0,currency:"UZS",featured:false,published:false};
  async function save(e:FormEvent){e.preventDefault();try{await json(await fetch(edit.id?`/api/admin/products/${edit.id}`:"/api/admin/products",{method:edit.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(edit)}));setEdit(null);await load()}catch(err){setError(err instanceof Error?err.message:"save_failed")}}
  async function remove(p:Product){if(!confirm(`${p.name} o'chirilsinmi?`))return;await json(await fetch(`/api/admin/products/${p.id}`,{method:"DELETE"}));await load()}

  return <Workspace eyebrow="PRODUCT CATALOG" title="Katalog" description="Software, game va boshqa mahsulotlarning asosiy metadata qismi."
    actions={<button className="button buttonPrimary" onClick={()=>setEdit({...blank})}><Plus size={15}/> Mahsulot</button>}>
    <div className="ovToolbar"><label><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Qidirish..."/></label><button className="ovIconBtn" onClick={()=>void load()}><RefreshCw size={14}/></button></div>
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovTableWrap"><table className="ovTable"><thead><tr><th>Product</th><th>Kind</th><th>Status</th><th>Price</th><th>Publish</th><th/></tr></thead><tbody>
      {list.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small>{p.slug}<br/>{p.category??"вЂ”"}</small></td><td>{p.kind}</td><td>{p.status}</td><td>{p.pricingModel}<small>{p.priceMinor} {p.currency}</small></td><td><span className={`ovTag ${p.published?"live":""}`}>{p.published?"LIVE":"DRAFT"}</span></td><td><div className="ovRowActions"><button title="Store detallar" onClick={()=>setDetailsProduct(p)}><Gauge size={14}/></button><button title="Asosiy metadata" onClick={()=>setEdit({...p,category:p.category??"",description:p.description??""})}><Pencil size={14}/></button><button className="danger" onClick={()=>void remove(p)}><Trash2 size={14}/></button></div></td></tr>)}
    </tbody></table></div>
    {detailsProduct?<ProductDetailsDrawer product={detailsProduct} onClose={()=>setDetailsProduct(null)}/>:null}
    {edit?<div className="ovModal"><form className="ovDrawer" onSubmit={save}><header><div><span>PRODUCT EDITOR</span><h3>{edit.id?"Tahrirlash":"Yangi mahsulot"}</h3></div><button type="button" onClick={()=>setEdit(null)}><X/></button></header>
      <div className="ovForm">
        <label className="wide"><span>Nomi</span><input value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})} required/></label>
        <label><span>Slug</span><input value={edit.slug} onChange={e=>setEdit({...edit,slug:e.target.value})}/></label>
        <label><span>Kind</span><select value={edit.kind} onChange={e=>setEdit({...edit,kind:e.target.value})}>{["SOFTWARE","GAME","AI_TOOL","DIGITAL_PRODUCT"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Kategoriya</span><input value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})}/></label>
        <label><span>Status</span><select value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>{["DRAFT","ALPHA","BETA","COMING_SOON","ACTIVE","RELEASED","ARCHIVED"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Pricing</span><select value={edit.pricingModel} onChange={e=>setEdit({...edit,pricingModel:e.target.value})}>{["FREE","FREEMIUM","ONE_TIME","SUBSCRIPTION","CUSTOM","TBD"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Narx minor</span><input type="number" value={edit.priceMinor} onChange={e=>setEdit({...edit,priceMinor:Number(e.target.value)})}/></label>
        <label><span>Currency</span><input value={edit.currency} onChange={e=>setEdit({...edit,currency:e.target.value})}/></label>
        <label className="wide"><span>Tavsif</span><textarea rows={6} value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})}/></label>
        <label className="ovCheck"><input type="checkbox" checked={edit.featured} onChange={e=>setEdit({...edit,featured:e.target.checked})}/><span>Featured</span></label>
        <label className="ovCheck"><input type="checkbox" checked={edit.published} onChange={e=>setEdit({...edit,published:e.target.checked})}/><span>Published</span></label>
      </div><footer><button type="button" className="button buttonGhost" onClick={()=>setEdit(null)}>Bekor</button><button className="button buttonPrimary"><Save size={15}/> Saqlash</button></footer>
    </form></div>:null}
  </Workspace>;
}

function RuntimeManager(){
  const [products,setProducts]=useState<RuntimeProduct[]>([]),[edit,setEdit]=useState<any>(null),[buildProduct,setBuildProduct]=useState<RuntimeProduct|null>(null),[builds,setBuilds]=useState<any[]>([]),[error,setError]=useState("");
  const [file,setFile]=useState<File|null>(null),[version,setVersion]=useState("1.0.0"),[busy,setBusy]=useState(false);

  async function load(){try{setProducts((await json(await fetch("/api/admin/v4/runtimes",{cache:"no-store"}))).products??[])}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[]);
  async function save(e:FormEvent){e.preventDefault();setBusy(true);try{await json(await fetch(`/api/admin/v4/runtimes/${edit.productId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(edit)}));setEdit(null);await load()}catch(err){setError(err instanceof Error?err.message:"save_failed")}finally{setBusy(false)}}
  async function openBuilds(p:RuntimeProduct){setBuildProduct(p);setFile(null);setVersion(p.activeVersion??"1.0.0");try{setBuilds((await json(await fetch(`/api/admin/v4/runtimes/${p.productId}`,{cache:"no-store"}))).builds??[])}catch(e){setError(e instanceof Error?e.message:"builds_failed")}}
  async function upload(e:FormEvent){e.preventDefault();if(!buildProduct||!file)return;setBusy(true);try{const body=new FormData();body.append("file",file);body.append("version",version);body.append("activate","true");await json(await fetch(`/api/admin/v4/runtimes/${buildProduct.productId}/upload`,{method:"POST",body}));await openBuilds(buildProduct);await load()}catch(err){setError(err instanceof Error?err.message:"upload_failed")}finally{setBusy(false)}}
  async function activate(id:string){if(!buildProduct)return;await json(await fetch(`/api/admin/v4/builds/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:buildProduct.productId,action:"activate"})}));await openBuilds(buildProduct);await load()}
  async function removeBuild(id:string){if(!buildProduct||!confirm("Build o'chirilsinmi?"))return;await json(await fetch(`/api/admin/v4/builds/${id}?productId=${encodeURIComponent(buildProduct.productId)}`,{method:"DELETE"}));await openBuilds(buildProduct);await load()}

  return <Workspace eyebrow="WEB RUNTIME" title="Web Apps & Games" description="Web mahsulotni external URL bilan ulang yoki ZIP static buildni SysOne Runtime R2'ga yuklang."
    actions={<button className="ovIconBtn" onClick={()=>void load()}><RefreshCw size={15}/></button>}>
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovCards">{products.map(p=><article key={p.productId} className="ovRuntimeCard">
      <div className="ovRuntimeIdentity"><span className="ovRuntimeIcon">{p.kind==="GAME"?<Gamepad2 size={18}/>:<Boxes size={18}/>}</span><div><strong>{p.name}</strong><small>{p.slug} / {p.kind}</small></div></div>
      <div className="ovRuntimeMeta"><span>{p.deliveryMode}</span><span>{p.runtimeType}</span><span>{p.activeVersion?`v${p.activeVersion}`:`${p.buildCount} builds`}</span></div>
      <div className="ovRowActions"><button onClick={()=>setEdit({...p})}><Settings size={14}/></button><button onClick={()=>void openBuilds(p)}><Upload size={14}/></button></div>
    </article>)}</div>

    {edit?<div className="ovModal"><form className="ovDrawer" onSubmit={save}><header><div><span>RUNTIME PROFILE</span><h3>{edit.name}</h3></div><button type="button" onClick={()=>setEdit(null)}><X/></button></header>
      <div className="ovForm">
        <label><span>Delivery</span><select value={edit.deliveryMode} onChange={e=>setEdit({...edit,deliveryMode:e.target.value})}>{["DOWNLOAD","WEB","HYBRID"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Runtime</span><select value={edit.runtimeType} onChange={e=>setEdit({...edit,runtimeType:e.target.value})}>{["NONE","INTERNAL","EXTERNAL"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Embed</span><select value={edit.embedMode} onChange={e=>setEdit({...edit,embedMode:e.target.value})}>{["FRAME","NEW_TAB"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="wide"><span>External launch URL</span><input value={edit.launchUrl??""} onChange={e=>setEdit({...edit,launchUrl:e.target.value})} placeholder="https://app.sysone.top"/></label>
        <label className="wide"><span>Healthcheck URL</span><input value={edit.healthcheckUrl??""} onChange={e=>setEdit({...edit,healthcheckUrl:e.target.value})}/></label>
        <label className="ovCheck"><input type="checkbox" checked={edit.requiresAuth} onChange={e=>setEdit({...edit,requiresAuth:e.target.checked})}/><span>SysOne ID talab qilinsin</span></label>
        <label className="ovCheck"><input type="checkbox" checked={edit.requiresEntitlement} onChange={e=>setEdit({...edit,requiresEntitlement:e.target.checked})}/><span>Entitlement talab qilinsin</span></label>
        <label className="ovCheck"><input type="checkbox" checked={edit.supportsFullscreen} onChange={e=>setEdit({...edit,supportsFullscreen:e.target.checked})}/><span>Fullscreen</span></label>
      </div><footer><button type="button" className="button buttonGhost" onClick={()=>setEdit(null)}>Bekor</button><button className="button buttonPrimary" disabled={busy}><Save size={15}/> Saqlash</button></footer>
    </form></div>:null}

    {buildProduct?<div className="ovModal"><div className="ovDrawer ovBuildDrawer"><header><div><span>STATIC WEB BUILDS</span><h3>{buildProduct.name}</h3></div><button onClick={()=>setBuildProduct(null)}><X/></button></header>
      <form className="ovBuildUpload" onSubmit={upload}>
        <label><span>Version</span><input value={version} onChange={e=>setVersion(e.target.value)} required/></label>
        <label className="wide"><span>ZIP static bundle / index.html root'da bo'lsin / max 25 MB</span><input type="file" accept=".zip,application/zip" onChange={e=>setFile(e.target.files?.[0]??null)} required/></label>
        <button className="button buttonPrimary" disabled={busy||!file}>{busy?<LoaderCircle className="spin" size={15}/>:<Upload size={15}/>} Yuklash va aktivlashtirish</button>
      </form>
      <div className="ovBuildList">{builds.map((b:any)=><div key={b.id} className={b.id===buildProduct.activeBuildId?"active":""}>
        <span><FileArchive size={15}/><div><strong>v{b.version}</strong><small>{b.file_count} files / {bytes(Number(b.size_bytes??0))} / {formatDate(b.created_at)}</small></div></span>
        <div className="ovRowActions">{b.id!==buildProduct.activeBuildId?<button onClick={()=>void activate(b.id)}><BadgeCheck size={14}/></button>:<span className="ovTag live">ACTIVE</span>}<button className="danger" disabled={b.id===buildProduct.activeBuildId} onClick={()=>void removeBuild(b.id)}><Trash2 size={14}/></button></div>
      </div>)}</div>
    </div></div>:null}
  </Workspace>;
}

function Media(){
  const [items,setItems]=useState<any[]>([]),[file,setFile]=useState<File|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function load(){try{setItems((await json(await fetch("/api/admin/media",{cache:"no-store"}))).assets??[])}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[]);
  async function upload(e:FormEvent){e.preventDefault();if(!file)return;setBusy(true);try{const body=new FormData();body.append("file",file);await json(await fetch("/api/admin/v4/media/upload",{method:"POST",body}));setFile(null);await load()}catch(err){setError(err instanceof Error?err.message:"upload_failed")}finally{setBusy(false)}}
  async function remove(key:string){if(!confirm("Media o'chirilsinmi?"))return;await json(await fetch(`/api/admin/media?key=${encodeURIComponent(key)}`,{method:"DELETE"}));await load()}
  return <Workspace eyebrow="R2 MEDIA" title="Media kutubxonasi" description="Cover, screenshot, banner va video fayllari.">
    <form className="ovMediaUpload" onSubmit={upload}><input type="file" accept="image/*,video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0]??null)}/><button className="button buttonPrimary" disabled={!file||busy}><Upload size={15}/> Yuklash</button></form>
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovMediaGrid">{items.map(a=><article key={a.key}>{a.contentType?.startsWith("image/")?<img src={a.url} alt=""/>:<div className="ovMediaPlaceholder"><FileArchive/></div>}<div><strong>{a.key.split("/").pop()}</strong><small>{bytes(a.size)} / {formatDate(a.uploaded)}</small></div><button className="danger" onClick={()=>void remove(a.key)}><Trash2 size={14}/></button></article>)}</div>
  </Workspace>;
}


function ExperienceManager(){
  const defaultHome={
    overline:"SYSONE / DIGITAL PRODUCTS",
    titleLine1:"Yuklab oling.",
    titleLine2:"Yoki shu yerning o'zida ishlating.",
    description:"Dasturlar, web ilovalar, o'yinlar va AI vositalari. SysOne mahsulotlari bitta katalog, bitta akkaunt va bitta boshqaruv tizimida.",
    primaryLabel:"Katalogni ochish",primaryHref:"/marketplace",
    secondaryLabel:"O'yinlar",secondaryHref:"/games",
    showAnnouncementBar:true,announcementSpeed:34,showWebApps:true,showWebGames:true,showRuntimeBand:true,
  };
  const defaultDock=[
    {key:"home",label:"Home",href:"/",icon:"home",enabled:true},
    {key:"store",label:"Do'kon",href:"/marketplace",icon:"store",enabled:true},
    {key:"apps",label:"Dasturlar",href:"/products",icon:"apps",enabled:true},
    {key:"games",label:"O'yinlar",href:"/games",icon:"games",enabled:true},
    {key:"ai",label:"AI",href:"/ai",icon:"ai",enabled:true},
    {key:"account",label:"Hisob",href:"/account",icon:"account",enabled:true},
  ];
  const [home,setHome]=useState<any>(defaultHome),[dock,setDock]=useState<any[]>(defaultDock),[error,setError]=useState(""),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);

  async function load(){
    setError("");
    try{
      const data=await json(await fetch("/api/admin/v4/settings",{cache:"no-store"}));
      const homeRaw=data.settings?.find((s:any)=>s.key==="home")?.value??{};
      const dockRaw=data.settings?.find((s:any)=>s.key==="dock")?.value??{};
      setHome({...defaultHome,...homeRaw});
      setDock(Array.isArray(dockRaw.items)&&dockRaw.items.length?dockRaw.items:defaultDock);
    }catch(e){setError(e instanceof Error?e.message:"load_failed")}
  }
  useEffect(()=>{void load()},[]);

  async function save(e:FormEvent){
    e.preventDefault();setBusy(true);setSaved(false);setError("");
    try{
      for(const payload of [{key:"home",value:home},{key:"dock",value:{items:dock}}]){
        await json(await fetch("/api/admin/v4/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}));
      }
      setSaved(true);
    }catch(err){setError(err instanceof Error?err.message:"save_failed")}finally{setBusy(false)}
  }

  function updateDock(index:number,patch:any){const next=[...dock];next[index]={...next[index],...patch};setDock(next)}
  function move(index:number,dir:number){const target=index+dir;if(target<0||target>=dock.length)return;const next=[...dock];[next[index],next[target]]=[next[target],next[index]];setDock(next)}
  function addDock(){setDock([...dock,{key:`item-${Date.now()}`,label:"Yangi",href:"/",icon:"apps",enabled:true}])}
  function removeDock(index:number){setDock(dock.filter((_,i)=>i!==index))}
  const icons=["home","store","apps","games","ai","account","support","web"];

  return <Workspace eyebrow="PUBLIC EXPERIENCE" title="Bosh sahifa & Dock" description="Hero matnlari, public navigation va web runtime ko'rinishini kodsiz boshqaring."
    actions={<button className="ovIconBtn" onClick={()=>void load()}><RefreshCw size={15}/></button>}>
    {error?<div className="ovError">{error}</div>:null}
    {saved?<div className="ovSuccess">Saqlandi. Public sahifa keyingi ochilishda yangi sozlamalarni oladi.</div>:null}
    <form onSubmit={save} className="ovExperienceForm">
      <section className="ovPanel">
        <div className="ovPanelHead"><strong>Homepage hero</strong><small>sysone.top</small></div>
        <div className="ovForm ovExperienceFields">
          <label className="wide"><span>Eyebrow</span><input value={home.overline} onChange={e=>setHome({...home,overline:e.target.value})}/></label>
          <label className="wide"><span>Sarlavha / 1-qator</span><input value={home.titleLine1} onChange={e=>setHome({...home,titleLine1:e.target.value})}/></label>
          <label className="wide"><span>Sarlavha / 2-qator</span><input value={home.titleLine2} onChange={e=>setHome({...home,titleLine2:e.target.value})}/></label>
          <label className="wide"><span>Tavsif</span><textarea rows={4} value={home.description} onChange={e=>setHome({...home,description:e.target.value})}/></label>
          <label><span>Asosiy tugma</span><input value={home.primaryLabel} onChange={e=>setHome({...home,primaryLabel:e.target.value})}/></label>
          <label><span>Asosiy link</span><input value={home.primaryHref} onChange={e=>setHome({...home,primaryHref:e.target.value})}/></label>
          <label><span>Ikkinchi tugma</span><input value={home.secondaryLabel} onChange={e=>setHome({...home,secondaryLabel:e.target.value})}/></label>
          <label><span>Ikkinchi link</span><input value={home.secondaryHref} onChange={e=>setHome({...home,secondaryHref:e.target.value})}/></label>
          <label><span>Announcement tezligi (sek)</span><input type="number" min={10} max={120} value={home.announcementSpeed} onChange={e=>setHome({...home,announcementSpeed:Number(e.target.value)})}/></label>
          <label className="ovCheck"><input type="checkbox" checked={home.showAnnouncementBar} onChange={e=>setHome({...home,showAnnouncementBar:e.target.checked})}/><span>E'lon lentasi</span></label>
          <label className="ovCheck"><input type="checkbox" checked={home.showRuntimeBand} onChange={e=>setHome({...home,showRuntimeBand:e.target.checked})}/><span>Web Runtime bloki</span></label>
          <label className="ovCheck"><input type="checkbox" checked={home.showWebApps} onChange={e=>setHome({...home,showWebApps:e.target.checked})}/><span>Web Apps shelf</span></label>
          <label className="ovCheck"><input type="checkbox" checked={home.showWebGames} onChange={e=>setHome({...home,showWebGames:e.target.checked})}/><span>Web Games shelf</span></label>
        </div>
      </section>

      <section className="ovPanel">
        <div className="ovPanelHead"><strong>Desktop + Mobile Dock</strong><button type="button" className="ovTextBtn" onClick={addDock}><Plus size={13}/> Item</button></div>
        <div className="ovDockEditor">
          {dock.map((item:any,i:number)=><div className="ovDockConfigRow" key={item.key??i}>
            <div className="ovDockOrder">
              <button type="button" disabled={i===0} onClick={()=>move(i,-1)}>^</button>
              <button type="button" disabled={i===dock.length-1} onClick={()=>move(i,1)}>v</button>
            </div>
            <label><span>Nomi</span><input value={item.label??""} onChange={e=>updateDock(i,{label:e.target.value})}/></label>
            <label><span>Link</span><input value={item.href??""} onChange={e=>updateDock(i,{href:e.target.value})}/></label>
            <label><span>Icon</span><select value={item.icon??"apps"} onChange={e=>updateDock(i,{icon:e.target.value})}>{icons.map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="ovCheck"><input type="checkbox" checked={item.enabled!==false} onChange={e=>updateDock(i,{enabled:e.target.checked})}/><span>Ko'rinsin</span></label>
            <button type="button" className="danger ovDockRemove" onClick={()=>removeDock(i)}><Trash2 size={14}/></button>
          </div>)}
        </div>
      </section>

      <div className="ovExperienceSave">
        <button className="button buttonPrimary" disabled={busy}>{busy?<LoaderCircle className="spin" size={15}/>:<Save size={15}/>} Barchasini saqlash</button>
      </div>
    </form>
  </Workspace>;
}
function SettingsManager(){
  const [settings,setSettings]=useState<any[]>([]),[edit,setEdit]=useState<any>(null),[error,setError]=useState("");
  async function load(){try{setSettings((await json(await fetch("/api/admin/v4/settings",{cache:"no-store"}))).settings??[])}catch(e){setError(e instanceof Error?e.message:"load_failed")}}
  useEffect(()=>{void load()},[]);
  async function save(e:FormEvent){e.preventDefault();try{let value;try{value=JSON.parse(edit.raw)}catch{throw new Error("invalid_json")}await json(await fetch("/api/admin/v4/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:edit.key,value})}));setEdit(null);await load()}catch(err){setError(err instanceof Error?err.message:"save_failed")}}
  return <Workspace eyebrow="PLATFORM CONFIG" title="Settings" description="Runtime, bosh sahifa va platforma sozlamalari.">
    {error?<div className="ovError">{error}</div>:null}
    <div className="ovCards">{settings.map(s=><article className="ovCard" key={s.key}><div className="ovCardMain"><Settings size={16}/><div><strong>{s.key}</strong><p>{JSON.stringify(s.value)}</p></div></div><button className="ovIconBtn" onClick={()=>setEdit({key:s.key,raw:JSON.stringify(s.value,null,2)})}><Pencil size={14}/></button></article>)}</div>
    {edit?<div className="ovModal"><form className="ovDrawer" onSubmit={save}><header><div><span>SETTING</span><h3>{edit.key}</h3></div><button type="button" onClick={()=>setEdit(null)}><X/></button></header><div className="ovForm"><label className="wide"><span>JSON</span><textarea rows={16} value={edit.raw} onChange={e=>setEdit({...edit,raw:e.target.value})}/></label></div><footer><button className="button buttonPrimary"><Save size={15}/> Saqlash</button></footer></form></div>:null}
  </Workspace>;
}

export function OwnerToolV4(){
  const [active,setActive]=useState("overview"),[logoutBusy,setLogoutBusy]=useState(false);
  async function logout(){setLogoutBusy(true);try{await fetch("/api/admin/session",{method:"DELETE"});location.reload()}finally{setLogoutBusy(false)}}

  function content(){
    if(active==="overview")return <Overview/>;
    if(active==="announcements")return <Announcements/>;
    if(active==="experience")return <ExperienceManager/>;
    if(active==="catalog")return <Catalog/>;
    if(active==="runtime")return <RuntimeManager/>;
    if(active==="releases")return <ReleaseManager/>;
    if(active==="media")return <Media/>;
    if(active==="projects")return <ProjectRequestsManager/>;
    if(active==="support")return <SupportTicketsManager/>;
    if(active==="settings")return <SettingsManager/>;
    const mapping:Record<string,[string,string]>={
      users:["Users","SysOne ID foydalanuvchilari, rollar va locale."],
      sessions:["Sessions","Faol login sessionlari; kerak bo'lsa sessionni revoke qiling."],
      notifications:["Notifications","Foydalanuvchi bildirishnomalari va read holati."],
      organizations:["Organizations","Tashkilotlar va owner bog'lanishi."],
      orders:["Buyurtmalar","Order status va payment metadata."],
      entitlements:["Entitlements","Mahsulotga egalik huquqlari."],
      licenses:["Litsenziyalar","License holati, device limit va expiry."],
      devices:["License devices","Aktivatsiya qilingan qurilmalar va oxirgi faollik."],
      reviews:["Reviews","Review moderatsiyasi, rating va verified purchase holati."],
      content:["Content","CMS content entries va publish holati."],
      flags:["Feature Flags","Platforma funksiyalarini serverdan boshqarish."],
      ai:["AI Usage","AI feature, provider, model va usage hisoblari."],
      audit:["Audit","Owner va admin amallari tarixi."],
    };
    const info=mapping[active]??["Data","Platform data"];
    return <EntityManager entity={active} title={info[0]} description={info[1]}/>;
  }

  const activeLabel=(NAV as readonly (readonly [string, readonly (readonly [string,string,unknown])[]])[]).flatMap(([,items])=>items).find(([,key])=>key===active)?.[0]??"Owner Tool";

  return <div className="ownerV4">
    <aside className="ovSidebar">
      <div className="ovBrand"><img src="/brand/sysone-symbol.webp" alt=""/><span><strong>SysOne</strong><small>OWNER TOOL V4</small></span></div>
      <div className="ovNav">{NAV.map(([group,items])=><section key={group}><span>{group}</span>{items.map(([label,key,Icon])=><button key={key} className={active===key?"active":""} onClick={()=>setActive(key)}><Icon size={15}/><em>{label}</em><ChevronRight size={12}/></button>)}</section>)}</div>
      <button className="ovLogout" onClick={()=>void logout()} disabled={logoutBusy}>{logoutBusy?<LoaderCircle className="spin" size={15}/>:<LogOut size={15}/>} Chiqish</button>
    </aside>

    <main className="ovMain">
      <header className="ovTop"><div><span>PRIVATE / OWNER</span><h1>{activeLabel}</h1></div><div className="ovOwnerChip"><ShieldCheck size={15}/><span><strong>Owner</strong><small>Secure session</small></span></div></header>
      {content()}
    </main>
  </div>;
}

