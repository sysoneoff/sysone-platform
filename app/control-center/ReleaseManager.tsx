"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Box, CheckCircle2, Download, FileArchive, LoaderCircle, Pencil, Plus, RefreshCw,
  Save, Search, ShieldCheck, Trash2, Upload, X,
} from "lucide-react";

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
};

type ReleaseFile = {
  id: string;
  productVersionId: string;
  platform: string;
  r2Key: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  createdAt: string;
};

type Release = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productKind: string;
  version: string;
  channel: string;
  changelog: string | null;
  minSystem: string | null;
  publishedAt: string | null;
  files: ReleaseFile[];
};

type ReleaseDraft = {
  id?: string;
  productId: string;
  version: string;
  channel: string;
  changelog: string;
  minSystem: string;
  published: boolean;
};

const blankRelease: ReleaseDraft = {
  productId: "",
  version: "",
  channel: "STABLE",
  changelog: "",
  minSystem: "",
  published: false,
};

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `request_failed_${response.status}`);
  return data;
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function shortHash(value: string | null) {
  if (!value) return "—";
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

async function sha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function ReleaseManager() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ReleaseDraft | null>(null);
  const [uploadRelease, setUploadRelease] = useState<Release | null>(null);
  const [uploadPlatform, setUploadPlatform] = useState("WINDOWS");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await readJson(await fetch("/api/admin/releases", { cache: "no-store" }));
      setReleases(data.releases ?? []);
      setProducts(data.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "releases_load_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return releases;
    return releases.filter((release) =>
      `${release.productName} ${release.productSlug} ${release.version} ${release.channel} ${release.productKind}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query, releases]);

  function editRelease(release: Release) {
    setEditing({
      id: release.id,
      productId: release.productId,
      version: release.version,
      channel: release.channel,
      changelog: release.changelog ?? "",
      minSystem: release.minSystem ?? "",
      published: Boolean(release.publishedAt),
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await readJson(await fetch(editing.id ? `/api/admin/releases/${editing.id}` : "/api/admin/releases", {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      }));
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "release_save_failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeRelease(release: Release) {
    const detail = release.files.length ? ` Unga tegishli ${release.files.length} ta private build ham R2’dan o‘chadi.` : "";
    if (!window.confirm(`${release.productName} ${release.version} release’ini o‘chirasizmi?${detail}`)) return;
    setError("");
    try {
      await readJson(await fetch(`/api/admin/releases/${release.id}`, { method: "DELETE" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "release_delete_failed");
    }
  }

  function chooseUpload(release: Release) {
    setUploadRelease(release);
    setUploadPlatform(release.productKind === "GAME" ? "WINDOWS" : "WINDOWS");
    setUploadFile(null);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setUploadFile(event.target.files?.[0] ?? null);
  }

  async function uploadBuild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadRelease || !uploadFile) return;
    if (uploadFile.size > 95 * 1024 * 1024) {
      setError("release_file_too_large");
      return;
    }

    setUploading(true);
    setHashing(true);
    setError("");
    try {
      const checksumSha256 = await sha256(uploadFile);
      setHashing(false);
      const body = new FormData();
      body.append("file", uploadFile);
      body.append("platform", uploadPlatform);
      body.append("checksumSha256", checksumSha256);

      await readJson(await fetch(`/api/admin/releases/${uploadRelease.id}/files`, {
        method: "POST",
        body,
      }));
      setUploadRelease(null);
      setUploadFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "release_upload_failed");
    } finally {
      setHashing(false);
      setUploading(false);
    }
  }

  async function removeFile(file: ReleaseFile) {
    if (!window.confirm("Bu build faylini private R2 va D1’dan o‘chirasizmi?")) return;
    setError("");
    try {
      await readJson(await fetch(`/api/admin/release-files/${file.id}`, { method: "DELETE" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "release_file_delete_failed");
    }
  }

  return <section className="adminWorkspace releaseWorkspace">
    <div className="adminWorkspaceHead">
      <div>
        <span className="eyebrow">PRIVATE R2 DISTRIBUTION</span>
        <h2>Releases</h2>
        <p>Mahsulot versiyalari, platforma buildlari va SHA-256 nazorati.</p>
      </div>
      <button
        className="button buttonPrimary"
        onClick={() => setEditing({ ...blankRelease, productId: products[0]?.id ?? "" })}
        disabled={!products.length}
      >
        <Plus size={16}/> Yangi release
      </button>
    </div>

    <div className="releaseSecurity">
      <ShieldCheck size={17}/>
      <div>
        <strong>Private distribution</strong>
        <span>Buildlar SYSONE_DOWNLOADS ichida private saqlanadi. Hozir faqat Owner session orqali yuklab olinadi.</span>
      </div>
      <em>SHA-256</em>
    </div>

    <div className="adminToolbar releaseToolbar">
      <label className="adminSearch">
        <Search size={15}/>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product, version yoki channel..."/>
      </label>
      <div className="releaseCount">{releases.length} releases</div>
      <button onClick={() => void load()} className="adminIconBtn" title="Yangilash"><RefreshCw size={16}/></button>
    </div>

    {error ? <div className="adminInlineError">{error}</div> : null}

    {loading ? <div className="adminLoading"><LoaderCircle className="spin"/> Releases yuklanmoqda...</div> :
      <div className="releaseList">
        {filtered.map((release) => <article className="releaseCard" key={release.id}>
          <div className="releaseHead">
            <div className="releaseIdentity">
              <div className="releaseIcon"><Box size={19}/></div>
              <div>
                <strong>{release.productName}</strong>
                <span>{release.productKind} · {release.productSlug}</span>
              </div>
            </div>
            <div className="releaseVersion">
              <strong>v{release.version}</strong>
              <span className={`releaseChannel ${release.channel.toLowerCase()}`}>{release.channel}</span>
              <span className={release.publishedAt ? "releaseLive" : "releaseDraft"}>
                {release.publishedAt ? "PUBLISHED" : "DRAFT"}
              </span>
            </div>
            <div className="releaseActions">
              <button onClick={() => chooseUpload(release)} title="Build yuklash"><Upload size={15}/></button>
              <button onClick={() => editRelease(release)} title="Tahrirlash"><Pencil size={15}/></button>
              <button className="danger" onClick={() => void removeRelease(release)} title="O‘chirish"><Trash2 size={15}/></button>
            </div>
          </div>

          {(release.changelog || release.minSystem) ? <div className="releaseNotes">
            {release.changelog ? <div><small>CHANGELOG</small><p>{release.changelog}</p></div> : null}
            {release.minSystem ? <div><small>MIN SYSTEM</small><p>{release.minSystem}</p></div> : null}
          </div> : null}

          <div className="releaseFiles">
            <div className="releaseFilesHead">
              <span><FileArchive size={14}/> Builds</span>
              <small>{release.files.length} file</small>
            </div>
            {release.files.length ? release.files.map((file) => <div className="releaseFile" key={file.id}>
              <div className="releaseFilePlatform">{file.platform}</div>
              <div className="releaseFileName">
                <strong>{file.r2Key.split("/").pop()?.replace(/^[0-9a-f-]{36}-/i, "")}</strong>
                <span>{formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleString()}</span>
              </div>
              <code title={file.checksumSha256 ?? ""}>{shortHash(file.checksumSha256)}</code>
              <div className="releaseFileActions">
                <a href={`/api/admin/release-files/${file.id}/download`} title="Owner download"><Download size={14}/></a>
                <button className="danger" onClick={() => void removeFile(file)} title="O‘chirish"><Trash2 size={14}/></button>
              </div>
            </div>) : <div className="releaseNoFiles">Bu release uchun build hali yuklanmagan.</div>}
          </div>
        </article>)}
        {!filtered.length ? <div className="adminEmpty">Release topilmadi.</div> : null}
      </div>
    }

    {editing ? <div className="adminDrawerBackdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) setEditing(null);
    }}>
      <form className="adminDrawer" onSubmit={save}>
        <div className="adminDrawerHead">
          <div><span className="eyebrow">RELEASE EDITOR</span><h3>{editing.id ? "Release’ni tahrirlash" : "Yangi release"}</h3></div>
          <button type="button" onClick={() => setEditing(null)} disabled={saving}><X/></button>
        </div>
        <div className="adminFormGrid">
          <label className="wide">
            <span>Mahsulot / o‘yin</span>
            <select value={editing.productId} onChange={(event) => setEditing({ ...editing, productId: event.target.value })} required>
              <option value="">Tanlang</option>
              {products.map((product) => <option value={product.id} key={product.id}>{product.name} · {product.kind}</option>)}
            </select>
          </label>
          <label>
            <span>Versiya</span>
            <input value={editing.version} onChange={(event) => setEditing({ ...editing, version: event.target.value })} placeholder="3.2.0" required/>
          </label>
          <label>
            <span>Channel</span>
            <select value={editing.channel} onChange={(event) => setEditing({ ...editing, channel: event.target.value })}>
              {["STABLE", "BETA", "ALPHA", "NIGHTLY"].map((channel) => <option key={channel}>{channel}</option>)}
            </select>
          </label>
          <label className="wide">
            <span>Release notes / changelog</span>
            <textarea rows={7} value={editing.changelog} onChange={(event) => setEditing({ ...editing, changelog: event.target.value })} placeholder="Nimalar yangilandi?"/>
          </label>
          <label className="wide">
            <span>Minimal tizim talabi</span>
            <textarea rows={4} value={editing.minSystem} onChange={(event) => setEditing({ ...editing, minSystem: event.target.value })} placeholder="Windows 10+, Android 10+ ..."/>
          </label>
        </div>
        <button type="button" className={`releasePublishToggle ${editing.published ? "on" : ""}`} onClick={() => setEditing({ ...editing, published: !editing.published })}>
          <CheckCircle2 size={17}/>
          <span><strong>{editing.published ? "Published" : "Draft"}</strong><small>Release public katalog uchun tayyor deb belgilanadi.</small></span>
        </button>
        <div className="adminDrawerFoot">
          <button type="button" className="button buttonGhost" onClick={() => setEditing(null)} disabled={saving}>Bekor qilish</button>
          <button className="button buttonPrimary" disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={16}/> : <Save size={16}/>} Saqlash
          </button>
        </div>
      </form>
    </div> : null}

    {uploadRelease ? <div className="adminDrawerBackdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !uploading) setUploadRelease(null);
    }}>
      <form className="adminDrawer releaseUploadDrawer" onSubmit={uploadBuild}>
        <div className="adminDrawerHead">
          <div><span className="eyebrow">PRIVATE BUILD UPLOAD</span><h3>{uploadRelease.productName} · v{uploadRelease.version}</h3></div>
          <button type="button" onClick={() => setUploadRelease(null)} disabled={uploading}><X/></button>
        </div>

        <div className="releaseUploadHero">
          <div><Upload size={24}/></div>
          <strong>SYSONE_DOWNLOADS</strong>
          <span>Fayl public URL olmaydi. SHA-256 brauzerda hisoblanadi va metadata bilan D1’ga yoziladi.</span>
        </div>

        <div className="adminFormGrid">
          <label className="wide">
            <span>Platforma</span>
            <select value={uploadPlatform} onChange={(event) => setUploadPlatform(event.target.value)}>
              {["WINDOWS", "ANDROID", "MACOS", "LINUX", "WEB", "OTHER"].map((platform) => <option key={platform}>{platform}</option>)}
            </select>
          </label>
          <label className="wide releaseFilePicker">
            <span>Build fayli · maksimal 95 MB</span>
            <input
              type="file"
              accept=".exe,.msi,.apk,.aab,.zip,.dmg,.pkg,.deb,.rpm,.appimage,.tar,.gz,.tgz"
              onChange={onFileChange}
              required
            />
          </label>
        </div>

        {uploadFile ? <div className="releaseSelectedFile">
          <FileArchive size={18}/>
          <div><strong>{uploadFile.name}</strong><span>{formatBytes(uploadFile.size)}</span></div>
        </div> : null}

        <div className="adminDrawerFoot">
          <button type="button" className="button buttonGhost" onClick={() => setUploadRelease(null)} disabled={uploading}>Bekor qilish</button>
          <button className="button buttonPrimary" disabled={uploading || !uploadFile}>
            {uploading ? <LoaderCircle className="spin" size={16}/> : <Upload size={16}/>}
            {hashing ? "SHA-256 hisoblanmoqda..." : uploading ? "R2’ga yuklanmoqda..." : "Build yuklash"}
          </button>
        </div>
      </form>
    </div> : null}
  </section>;
}
