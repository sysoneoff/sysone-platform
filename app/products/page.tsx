import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { listPublishedProducts } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Software",
  description: "Browse published SysOne software products.",
};

export default async function ProductsPage() {
  const products = await listPublishedProducts("SOFTWARE");

  return (
    <div className="pageWrap">
      <section className="pageHero shell">
        <span className="eyebrow">SOFTWARE</span>

        <h1>Software by SysOne.</h1>

        <p>
          Browse published SysOne software, release information,
          supported platforms and current availability.
        </p>
      </section>

      <section className="section compactTop">
        <div className="shell">
          {products.length > 0 ? (
            <div className="cardGrid3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="surface emptyState">
              <h2>No software available yet.</h2>

              <p>
                There are currently no published software products
                in the SysOne catalog.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}