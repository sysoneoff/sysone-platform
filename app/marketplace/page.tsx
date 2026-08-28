import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import {
  listPublishedProducts,
  type PublicProduct,
} from "@/lib/server/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store",
  description:
    "Browse published SysOne software, games, AI tools and digital products.",
};

type StoreSection = {
  kind: string;
  title: string;
  description: string;
};

const STORE_SECTIONS: StoreSection[] = [
  {
    kind: "SOFTWARE",
    title: "Software",
    description:
      "Applications and tools published by SysOne.",
  },
  {
    kind: "GAME",
    title: "Games",
    description:
      "Published games and playable experiences from SysOne Games.",
  },
  {
    kind: "AI_TOOL",
    title: "AI Tools",
    description:
      "AI-powered products available through the SysOne ecosystem.",
  },
  {
    kind: "DIGITAL_PRODUCT",
    title: "Digital Products",
    description:
      "Downloadable digital products published by SysOne.",
  },
];

function groupProducts(products: PublicProduct[]) {
  const groups = new Map<string, PublicProduct[]>();

  for (const product of products) {
    const list = groups.get(product.kind) ?? [];
    list.push(product);
    groups.set(product.kind, list);
  }

  return groups;
}

export default async function MarketplacePage() {
  const products = await listPublishedProducts();
  const groups = groupProducts(products);

  return (
    <div className="pageWrap">
      <section className="pageHero shell marketplaceHero">
        <span className="eyebrow">SYSONE STORE</span>

        <h1>Software, games, AI tools and digital products.</h1>

        <p>
          Explore products currently published in the SysOne catalog.
          Availability, pricing and platform information comes directly
          from the live store database.
        </p>
      </section>

      <section className="section compactTop">
        <div className="shell">
          <div className="sectionMiniHead">
            <div>
              <h2>Store catalog</h2>
            </div>

            <span>
              {products.length}{" "}
              {products.length === 1 ? "product" : "products"}
            </span>
          </div>

          {products.length === 0 ? (
            <div className="surface emptyState">
              <h2>No products are currently published.</h2>

              <p>
                The SysOne Store does not currently contain any
                publicly available products.
              </p>
            </div>
          ) : (
            STORE_SECTIONS.map((section) => {
              const sectionProducts =
                groups.get(section.kind) ?? [];

              if (sectionProducts.length === 0) {
                return null;
              }

              return (
                <section
                  key={section.kind}
                  className="marketCatalogSection"
                >
                  <div className="sectionMiniHead marketSecond">
                    <div>
                      <h2>{section.title}</h2>
                    </div>

                    <span>
                      {sectionProducts.length}{" "}
                      {sectionProducts.length === 1
                        ? "product"
                        : "products"}
                    </span>
                  </div>

                  <p className="marketSectionDescription">
                    {section.description}
                  </p>

                  <div className="cardGrid3">
                    {sectionProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}