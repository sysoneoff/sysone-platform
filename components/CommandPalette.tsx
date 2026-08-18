"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ArrowUpRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const items = [
  { label: "Marketplace", description: "Software, games and digital products", href: "/marketplace" },
  { label: "SysOne Games", description: "Mobile, PC and web games", href: "/games" },
  { label: "SysOne AI", description: "Intelligent product layer", href: "/ai" },
  { label: "Start a project", description: "Tell SysOne what you want to build", href: "/contact" },
  { label: "Documentation", description: "Product and developer guides", href: "/docs" },
  { label: "Support", description: "Help center and tickets", href: "/support" },
  { label: "SysOne Labs", description: "Experimental technology", href: "/labs" }
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => items.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button className="searchButton" onClick={() => setOpen(true)} aria-label="Search SysOne">
        <Search size={16} /><span>Search</span><kbd>⌘ K</kbd>
      </button>
      {open && (
        <div className="commandBackdrop" onMouseDown={() => setOpen(false)}>
          <div className="commandPanel" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search SysOne">
            <div className="commandInput"><Search size={18}/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products, games, docs and services..." /></div>
            <div className="commandResults">
              {filtered.map((item) => (
                <button key={item.href} onClick={() => go(item.href)}>
                  <span className="commandIcon">{item.label.includes("AI") ? <Sparkles size={17}/> : <ArrowUpRight size={17}/>}</span>
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                </button>
              ))}
              {!filtered.length && <div className="commandEmpty">No matching SysOne content.</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
