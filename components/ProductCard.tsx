import Link from "next/link";
import { ArrowUpRight, Box, CheckCircle2 } from "lucide-react";
import type { Product } from "@/data/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className={`surface productCard accent-${product.accent}`}>
      <div className="productVisual"><div className="productMonogram"><Box size={28}/></div><span className="statusPill">{product.status}</span></div>
      <div className="cardBody">
        <div className="metaLine"><span>{product.category}</span><span>v{product.version}</span></div>
        <h3>{product.name}</h3><p>{product.description}</p>
        <div className="platformRow">{product.platforms.map((p) => <span key={p}>{p}</span>)}</div>
        <div className="cardFooter"><strong>{product.price}</strong><Link href={`/products/${product.slug}`}>Details <ArrowUpRight size={15}/></Link></div>
      </div>
    </article>
  );
}
