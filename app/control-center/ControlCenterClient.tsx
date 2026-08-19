"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, Boxes, BrainCircuit, ChevronDown, Clipboard, Database, FileText,
  Gamepad2, Image as ImageIcon, LayoutDashboard, LifeBuoy, LoaderCircle, LockKeyhole, LogOut,
  Menu, Package, Pencil, Plus, RefreshCw, Save, Search, Settings, ShieldCheck, ToggleLeft,
  ToggleRight, Trash2, Upload, Users, Workflow, X,
} from "lucide-react";
import { adminStats, featureFlags as initialFlags, recentActivity } from "@/data/admin";

type AdminProduct = {
  id: string; slug: string; name: string; kind: string; category: string | null; description: string | null;
  status: string; pricingModel: string; priceMinor: number; currency: string; featured: boolean; published: boolean;
  createdAt: string; updatedAt: string;
};

type MediaAsset = { key: string; size: number; uploaded: string; contentType: string | null; url: string };

type ProductDraft = {
  id?: string; slug: string; name: string; kind: string; category: string; description: string; status: string;
  pricingModel: string; priceMinor: number; currency: string; featured: boolean; published: boolean;
};

const blankProduct: ProductDraft = {
  slug: "", name: "", kind: "SOFTWARE", category: "", description: "", status: "DRAFT",
  pricingModel: "FREE", priceMinor: 0, currency: "UZS", featured: false, published: false,
};

const groups = [
  { label: "Overview", items: [["Dashboard", LayoutDashboard], ["Analytics", BarChart3]] },
  { label: "Content", items: [["Pages", FileText], ["Navigation", Menu], ["Media", ImageIcon], ["Resources", Boxes]] },
  { label: "Commerce", items: [["Marketplace", Package], ["Products", Boxes], ["Orders", Workflow]] },
  { label: "Games", items: [["Game Studio", Gamepad2], ["Players", Users]] },
  { label: "Customers", items: [["Users", Users], ["Projects", Workflow], ["Support", LifeBuoy]] },
  { label: "Intelligence", items: [["SysOne AI", BrainCircuit], ["Notifications", Bell]] },
  { label: "System", items: [["Security", ShieldCheck], ["Database", Database], ["Settings", Settings]] },
] as const;

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `request_failed_${response.status}`);
  return data;
}

function money(value: number, currency: string) {
  if (value === 0) return "Free / TBD";
  return `${new Intl.NumberFormat("uz-UZ").format(value)} ${currency}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProductsManager() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("ALL");
  const [editing, setEditing] = useState<ProductDraft | null>(null);

  async function load() {
    setLoading(true); setError("");
    try {
      const data = await readJson(await fetch("/api/admin/products", { cache: "no-store" }));
      setProducts(data.products ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "load_failed"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesKind = kind === "ALL" || product.kind === kind;
    const haystack = `${product.name} ${product.slug} ${product.category ?? ""}`.toLowerCase();
    return matchesKind && haystack.includes(query.toLowerCase());
  }), [products, query, kind]);

  function editProduct(product: AdminProduct) {
    setEditing({ ...product, category: product.category ?? "", description: product.description ?? "" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(editing.id ? `/api/admin/products/${editing.id}` : "/api/admin/products", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      await readJson(response);
      setEditing(null);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "save_failed"); }
    finally { setSaving(false); }
  }

  async function remove(product: AdminProduct) {
    if (!window.confirm(`“${product.name}” mahsulotini o‘chirishni tasdiqlaysizmi?`)) return;
    try {
      await readJson(await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" }));
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "delete_failed"); }
  }

  return <section className="adminWorkspace">
    <div className="adminWorkspaceHead">
      <div><span className="eyebrow">D1 PRODUCT CATALOG</span><h2>Products & Games</h2><p>Public katalogni production bazadan boshqaring.</p></div>
      <button className="button buttonPrimary" onClick={() => setEditing({ ...blankProduct })}><Plus size={16}/> Yangi mahsulot</button>
    </div>
    <div className="adminToolbar">
      <label className="adminSearch"><Search size={15}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Nom, slug yoki kategoriya..."/></label>
      <select value={kind} onChange={(e)=>setKind(e.target.value)}><option value="ALL">Barchasi</option><option value="SOFTWARE">Software</option><option value="GAME">Games</option></select>
      <button onClick={()=>void load()} className="adminIconBtn" title="Yangilash"><RefreshCw size={16}/></button>
    </div>
    {error ? <div className="adminInlineError">{error}</div> : null}
    {loading ? <div className="adminLoading"><LoaderCircle className="spin"/> D1 katalog yuklanmoqda...</div> :
      <div className="adminTableWrap"><table className="adminTable"><thead><tr><th>Product</th><th>Kind</th><th>Status</th><th>Pricing</th><th>Publish</th><th/></tr></thead><tbody>{filtered.map((product)=><tr key={product.id}>
        <td><strong>{product.name}</strong><small>{product.slug}<br/>{product.category || "—"}</small></td>
        <td><span className="adminBadge">{product.kind}</span></td>
        <td><span className={`adminStatus ${product.status === "ACTIVE" || product.status === "RELEASED" ? "good" : ""}`}>{product.status}</span></td>
        <td><strong>{product.pricingModel}</strong><small>{money(product.priceMinor, product.currency)}</small></td>
        <td><div className="adminPublishCell"><span className={product.published ? "live" : "draft"}>{product.published ? "LIVE" : "DRAFT"}</span>{product.featured ? <small>Featured</small> : null}</div></td>
        <td><div className="adminRowActions"><button onClick={()=>editProduct(product)}><Pencil size={15}/></button><button onClick={()=>void remove(product)} className="danger"><Trash2 size={15}/></button></div></td>
      </tr>)}</tbody></table>{!filtered.length ? <div className="adminEmpty">Mos mahsulot topilmadi.</div> : null}</div>}

    {editing ? <div className="adminDrawerBackdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget&&!saving)setEditing(null)}}><form className="adminDrawer" onSubmit={save}>
      <div className="adminDrawerHead"><div><span className="eyebrow">PRODUCT EDITOR</span><h3>{editing.id ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h3></div><button type="button" onClick={()=>setEditing(null)} disabled={saving}><X/></button></div>
      <div className="adminFormGrid">
        <label className="wide"><span>Nomi</span><input value={editing.name} onChange={(e)=>setEditing({...editing,name:e.target.value})} required/></label>
        <label><span>Slug</span><input value={editing.slug} onChange={(e)=>setEditing({...editing,slug:e.target.value})} placeholder="auto from name"/></label>
        <label><span>Kategoriya</span><input value={editing.category} onChange={(e)=>setEditing({...editing,category:e.target.value})}/></label>
        <label><span>Turi</span><select value={editing.kind} onChange={(e)=>setEditing({...editing,kind:e.target.value})}><option>SOFTWARE</option><option>GAME</option></select></label>
        <label><span>Status</span><select value={editing.status} onChange={(e)=>setEditing({...editing,status:e.target.value})}>{["DRAFT","ALPHA","BETA","COMING_SOON","ACTIVE","RELEASED","ARCHIVED"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Pricing model</span><select value={editing.pricingModel} onChange={(e)=>setEditing({...editing,pricingModel:e.target.value})}>{["FREE","FREEMIUM","ONE_TIME","SUBSCRIPTION","CUSTOM","TBD"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span>Narx (minor unit)</span><input type="number" min={0} step={1} value={editing.priceMinor} onChange={(e)=>setEditing({...editing,priceMinor:Number(e.target.value)})}/></label>
        <label><span>Valyuta</span><input maxLength={3} value={editing.currency} onChange={(e)=>setEditing({...editing,currency:e.target.value.toUpperCase()})}/></label>
        <label className="wide"><span>Tavsif</span><textarea rows={7} value={editing.description} onChange={(e)=>setEditing({...editing,description:e.target.value})}/></label>
      </div>
      <div className="adminSwitches"><button type="button" onClick={()=>setEditing({...editing,published:!editing.published})}>{editing.published?<ToggleRight className="on"/>:<ToggleLeft/>}<span><strong>Published</strong><small>Public API’da ko‘rinsin</small></span></button><button type="button" onClick={()=>setEditing({...editing,featured:!editing.featured})}>{editing.featured?<ToggleRight className="on"/>:<ToggleLeft/>}<span><strong>Featured</strong><small>Katalogda ustuvor</small></span></button></div>
      <div className="adminDrawerFoot"><button type="button" className="button buttonGhost" onClick={()=>setEditing(null)} disabled={saving}>Bekor qilish</button><button className="button buttonPrimary" disabled={saving}>{saving?<LoaderCircle className="spin" size={16}/>:<Save size={16}/>} Saqlash</button></div>
    </form></div> : null}
  </section>;
}

function MediaManager() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try { const data = await readJson(await fetch("/api/admin/media", { cache: "no-store" })); setAssets(data.assets ?? []); }
    catch (err) { setError(err instanceof Error ? err.message : "media_load_failed"); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ void load(); }, []);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const body = new FormData(); body.append("file", file);
      await readJson(await fetch("/api/admin/uploads", { method: "POST", body }));
      event.target.value = "";
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "upload_failed"); }
    finally { setUploading(false); }
  }

  async function remove(asset: MediaAsset) {
    if (!window.confirm("Bu media faylini R2’dan o‘chirasizmi?")) return;
    try { await readJson(await fetch(`/api/admin/media?key=${encodeURIComponent(asset.key)}`, { method: "DELETE" })); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "delete_failed"); }
  }

  return <section className="adminWorkspace">
    <div className="adminWorkspaceHead"><div><span className="eyebrow">R2 MEDIA LIBRARY</span><h2>Media</h2><p>Private R2 bucket ichida saqlanadigan public product media.</p></div><label className={`button buttonPrimary adminUploadButton ${uploading?"disabled":""}`}>{uploading?<LoaderCircle className="spin" size={16}/>:<Upload size={16}/>} Rasm yuklash<input type="file" accept="image/png,image/jpeg,image/webp,image/avif" onChange={upload} disabled={uploading}/></label></div>
    <div className="adminMediaInfo"><ShieldCheck size={17}/><span>PNG, JPG, WEBP, AVIF · maksimal 10 MB · R2 bucket public qilinmaydi.</span></div>
    {error ? <div className="adminInlineError">{error}</div> : null}
    {loading ? <div className="adminLoading"><LoaderCircle className="spin"/> R2 media yuklanmoqda...</div> : <div className="adminMediaGrid">{assets.map(asset=><article className="adminMediaCard" key={asset.key}><div className="adminMediaPreview"><img src={asset.url} alt="" loading="lazy"/></div><div className="adminMediaMeta"><strong>{asset.key.split("/").pop()}</strong><small>{formatBytes(asset.size)} · {new Date(asset.uploaded).toLocaleString()}</small><code>{asset.key}</code><div><button onClick={()=>navigator.clipboard.writeText(new URL(asset.url, window.location.origin).toString())}><Clipboard size={14}/> URL</button><button className="danger" onClick={()=>void remove(asset)}><Trash2 size={14}/></button></div></div></article>)}</div>}
    {!loading && !assets.length ? <div className="adminEmpty">Media kutubxonasi bo‘sh.</div> : null}
  </section>;
}

function Dashboard() {
  const [flags, setFlags] = useState(initialFlags);
  return <><div className="adminStatGrid">{adminStats.map(s=><article className="adminStat" key={s.label}><small>{s.label}</small><strong>{s.value}</strong><span>{s.change}</span></article>)}</div><div className="adminDashboardGrid"><article className="adminPanel"><div className="adminPanelHead"><span><strong>Platform overview</strong><small>Operational foundation</small></span><button>30 days <ChevronDown/></button></div><div className="fakeChart">{[42,55,48,70,62,88,76,94,82,100,92,112].map((v,i)=><i key={i} style={{height:`${v}px`}}/>)}</div><div className="chartLabels"><span>Users</span><span>Marketplace</span><span>Games</span></div></article><article className="adminPanel"><div className="adminPanelHead"><span><strong>Recent activity</strong><small>Audit-ready event stream</small></span><Activity/></div><div className="activityList">{recentActivity.map(a=><div key={a.time+a.action}><span>{a.time}</span><div><strong>{a.action}</strong><small>{a.detail}</small></div></div>)}</div></article><article className="adminPanel featurePanel"><div className="adminPanelHead"><span><strong>Feature flags</strong><small>UI preview — KV wiring keyingi qadamda</small></span></div>{flags.map((f,i)=><button className="flagRow" onClick={()=>setFlags(flags.map((x,n)=>n===i?{...x,enabled:!x.enabled}:x))} key={f.key}><span><strong>{f.name}</strong><small>{f.key}</small></span>{f.enabled?<ToggleRight className="on"/>:<ToggleLeft/>}</button>)}</article><article className="adminPanel"><div className="adminPanelHead"><span><strong>System health</strong><small>Production bindings</small></span><ShieldCheck/></div>{["Website","D1 Database","R2 Assets","R2 Downloads","KV Config","Admin Session"].map(x=><div className="healthRow" key={x}><span>{x}</span><em><i/>Operational</em></div>)}</article></div></>;
}

export function ControlCenterClient() {
  const [active, setActive] = useState("Dashboard");
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try { await fetch("/api/admin/session", { method: "DELETE" }); }
    finally { window.location.reload(); }
  }

  return <div className="controlWrap"><div className="controlShell"><aside className="controlNav"><div className="controlBrand"><img src="/brand/sysone-symbol.webp" alt=""/><span><strong>Control Center</strong><small>OWNER / PRODUCTION</small></span></div>{groups.map(group=><div className="controlGroup" key={group.label}><span>{group.label}</span>{group.items.map(([label,Icon])=><button onClick={()=>setActive(label)} className={active===label?"active":""} key={label}><Icon size={16}/>{label}</button>)}</div>)}</aside><main className="controlMain"><header className="controlTop"><div><span className="eyebrow">PRIVATE ADMIN</span><h1>{active}</h1></div><div className="controlTopActions"><button className="controlTopIcon"><Search/></button><button className="controlTopIcon"><Bell/></button><div className="ownerChip"><span>SO</span><div><strong>Owner</strong><small>Secure session</small></div><ShieldCheck/></div><button className="controlTopIcon danger" onClick={()=>void logout()} disabled={loggingOut}>{loggingOut?<LoaderCircle className="spin"/>:<LogOut/>}</button></div></header><div className="adminNotice"><LockKeyhole/><span><strong>Production security:</strong> admin secret server-side Cloudflare secret sifatida saqlanadi; session HttpOnly cookie bilan imzolanadi.</span></div>{active==="Dashboard"?<Dashboard/>:active==="Products"?<ProductsManager/>:active==="Media"?<MediaManager/>:<section className="adminModulePlaceholder"><div className="placeholderIcon"><Settings/></div><span className="eyebrow">MODULE FOUNDATION</span><h2>{active} management</h2><p>Bu modul master arxitekturada mavjud. Stage 2 davomida u D1/R2/KV, permissions va audit log workflow bilan real ishlashga ulanadi.</p><div className="placeholderActions"><button className="button buttonPrimary">Create item</button><button className="button buttonGhost">View roadmap</button></div></section>}</main></div></div>;
}
