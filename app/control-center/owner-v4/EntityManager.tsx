"use client";

// SysOne V4.4 entity empty-state and readability fix.
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database, LoaderCircle, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Workspace, json } from "./shared";

type AnyRow = Record<string, unknown>;

function displayCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function EntityManager({ entity, title, description }: { entity: string; title: string; description: string }) {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [editable, setEditable] = useState<string[]>([]);
  const [pk, setPk] = useState("id");
  const [deletable, setDeletable] = useState(false);
  const [selected, setSelected] = useState<AnyRow | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const request = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const data = await json(await fetch(`/api/admin/v4/entities/${encodeURIComponent(entity)}`, { cache: "no-store" }));
      if (request !== requestVersion.current) return;
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setEditable(Array.isArray(data.editable) ? data.editable : []);
      setPk(typeof data.pk === "string" ? data.pk : "id");
      setDeletable(Boolean(data.deletable));
    } catch (caught) {
      if (request !== requestVersion.current) return;
      setRows([]);
      setError(caught instanceof Error ? caught.message : "load_failed");
    } finally {
      if (request === requestVersion.current) setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    void load();
    return () => { requestVersion.current += 1; };
  }, [load]);

  const columns = useMemo(() => {
    const columnSet = new Set<string>();
    rows.slice(0, 15).forEach((row) => Object.keys(row).forEach((key) => columnSet.add(key)));
    return [...columnSet].slice(0, 7);
  }, [rows]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const changes: Record<string, unknown> = {};
    editable.forEach((key) => { changes[key] = selected[key]; });
    setError("");
    try {
      await json(await fetch(`/api/admin/v4/entities/${encodeURIComponent(entity)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: String(selected[pk]), changes }),
      }));
      setSelected(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "update_failed");
    }
  }

  async function remove(row: AnyRow) {
    const id = String(row[pk] ?? "");
    if (!id || !confirm("Bu yozuv o'chirilsinmi?")) return;
    setError("");
    try {
      await json(await fetch(`/api/admin/v4/entities/${encodeURIComponent(entity)}?id=${encodeURIComponent(id)}`, { method: "DELETE" }));
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "delete_failed");
    }
  }

  return <Workspace eyebrow="DATABASE" title={title} description={description}
    actions={<button type="button" className="ovIconBtn" aria-label="Yangilash" title="Yangilash" disabled={loading} onClick={() => void load()}><RefreshCw size={15}/></button>}>
    {error ? <div role="alert" className="ovError">Ma'lumotlarni olishda xatolik: {error} <button type="button" className="ovEntityRetry" onClick={() => void load()}>Qayta urinish</button></div> : null}
    {!error && loading ? <div className="ovEntityEmpty ovEntityLoading" role="status"><LoaderCircle className="spin" size={23}/><span>Ma'lumotlar yuklanmoqda...</span></div> : null}
    {!error && !loading && rows.length === 0 ? <div className="ovEntityEmpty" role="status">
      <Database size={28} strokeWidth={1.5}/>
      <h3>Hozircha ma'lumot yo'q</h3>
      <p>Bu bo'limda hali yozuvlar mavjud emas. Ma'lumotlar paydo bo'lganda ular shu yerda ko'rsatiladi.</p>
      <button type="button" className="ovEntityRetry" onClick={() => void load()}><RefreshCw size={14}/> Yangilash</button>
    </div> : null}
    {!error && !loading && rows.length > 0 ? <>
      <div className="ovEntitySummary" aria-live="polite">{rows.length.toLocaleString("uz-UZ")} ta yozuv ko'rsatilmoqda</div>
      <div className="ovTableWrap"><table className="ovTable ovEntityTable"><thead><tr>
        {columns.map((column) => <th key={column} scope="col">{column}</th>)}
        {(editable.length > 0 || deletable) ? <th scope="col">Amallar</th> : null}
      </tr></thead><tbody>
        {rows.map((row, index) => <tr key={String(row[pk] ?? index)}>
          {columns.map((column) => <td key={column} title={displayCell(row[column])}>{displayCell(row[column])}</td>)}
          {(editable.length > 0 || deletable) ? <td><div className="ovRowActions">
            {editable.length > 0 ? <button type="button" className="ovIconBtn" title="Tahrirlash" aria-label="Tahrirlash" onClick={() => setSelected({ ...row })}><Pencil size={14}/></button> : null}
            {deletable ? <button type="button" className="danger" title="O'chirish" aria-label="O'chirish" onClick={() => void remove(row)}><Trash2 size={14}/></button> : null}
          </div></td> : null}
        </tr>)}
      </tbody></table></div>
    </> : null}
    {selected ? <div className="ovModal"><form className="ovDrawer" onSubmit={save}>
      <header><div><span>DATABASE EDITOR</span><h3>{title}</h3></div><button type="button" aria-label="Yopish" onClick={() => setSelected(null)}><X/></button></header>
      <div className="ovForm">{editable.map((key) => <label className="wide" key={key}><span>{key}</span>
        {["enabled", "published"].includes(key) ?
          <select value={selected[key] ? "1" : "0"} onChange={(event) => setSelected({ ...selected, [key]: event.target.value === "1" })}>
            <option value="1">true</option><option value="0">false</option>
          </select> :
          <input value={String(selected[key] ?? "")} onChange={(event) => setSelected({ ...selected, [key]: event.target.value })}/>}
      </label>)}</div>
      <footer><button type="button" className="button buttonGhost" onClick={() => setSelected(null)}>Bekor</button><button type="submit" className="button buttonPrimary"><Save size={15}/> Saqlash</button></footer>
    </form></div> : null}
  </Workspace>;
}
