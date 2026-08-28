import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import {
  listPublishedProducts,
  type PublicProduct,
} from "@/lib/server/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SysOne Store",
  description:
    "Discover software, games, AI tools and digital products published by SysOne.",
};

function productHref(product: PublicProduct) {
  return product.kind === "GAME"
    ? `/games/${product.slug}`
    : `/products/${product.slug}`;
}

function productDescription(product: PublicProduct) {
  return (
    product.shortDescription ??
    product.tagline ??
    product.description ??
    null
  );
}

function sortByUpdated(
  products: PublicProduct[],
) {
  return [...products].sort((a, b) => {
    return (
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
    );
  });
}

function StoreSection({
  title,
  description,
  products,
  href,
  linkLabel = "View all",
}: {
  title: string;
  description: string;
  products: PublicProduct[];
  href: string;
  linkLabel?: string;
}) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="section">
      <div className="shell">
        <div className="sectionMiniHead">
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          <Link href={href}>
            {linkLabel}
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="cardGrid3">
          {products.slice(0, 6).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const products = await listPublishedProducts();

  const software = products.filter(
    (product) => product.kind === "SOFTWARE",
  );

  const games = products.filter(
    (product) => product.kind === "GAME",
  );

  const aiTools = products.filter(
    (product) => product.kind === "AI_TOOL",
  );

  const digitalProducts = products.filter(
    (product) => product.kind === "DIGITAL_PRODUCT",
  );

  const featured = products
    .filter(
      (product) =>
        product.featured ||
        product.featuredRank > 0,
    )
    .sort((a, b) => {
      if (b.featuredRank !== a.featuredRank) {
        return b.featuredRank - a.featuredRank;
      }

      return (
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
      );
    });

  const heroProduct =
    featured[0] ??
    sortByUpdated(products)[0] ??
    null;

  const newest = sortByUpdated(products).slice(
    0,
    6,
  );

  return (
    <>
      <section className="heroSection">
        <div className="shell">
          <div className="pageHero">
            <span className="eyebrow">
              SYSONE STORE
            </span>

            {heroProduct ? (
              <>
                <p className="metaLine">
                  <span>
                    {heroProduct.category ??
                      heroProduct.kind.replaceAll(
                        "_",
                        " ",
                      )}
                  </span>

                  <span>
                    {heroProduct.status
                      .replaceAll("_", " ")
                      .toLowerCase()}
                  </span>
                </p>

                <h1>{heroProduct.name}</h1>

                {productDescription(heroProduct) && (
                  <p>
                    {productDescription(
                      heroProduct,
                    )}
                  </p>
                )}

                <div className="heroActions">
                  <Link
                    className="button buttonPrimary buttonLarge"
                    href={productHref(
                      heroProduct,
                    )}
                  >
                    View product
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    className="button buttonGhost buttonLarge"
                    href="/marketplace"
                  >
                    Browse store
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1>
                  Software, games, AI tools
                  and digital products.
                </h1>

                <p>
                  The SysOne Store currently
                  has no published products.
                </p>

                <div className="heroActions">
                  <Link
                    className="button buttonPrimary buttonLarge"
                    href="/marketplace"
                  >
                    Open store
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {products.length > 0 && (
        <section className="brandStrip">
          <div className="shell brandStripInner">
            <span>
              {products.length} Published
            </span>

            <i />

            <span>
              {software.length} Software
            </span>

            <i />

            <span>
              {games.length} Games
            </span>

            <i />

            <span>
              {aiTools.length} AI Tools
            </span>

            <i />

            <span>
              {digitalProducts.length} Digital
            </span>
          </div>
        </section>
      )}

      <StoreSection
        title="Featured"
        description="Products currently highlighted in the SysOne Store."
        products={featured}
        href="/marketplace"
        linkLabel="Explore store"
      />

      <StoreSection
        title="New & updated"
        description="Recently added or updated products from the live SysOne catalog."
        products={newest}
        href="/marketplace"
      />

      <StoreSection
        title="Software"
        description="Applications and utilities published by SysOne."
        products={software}
        href="/products"
        linkLabel="All software"
      />

      <StoreSection
        title="Games"
        description="Games and interactive experiences from SysOne Games."
        products={games}
        href="/games"
        linkLabel="All games"
      />

      <StoreSection
        title="AI Tools"
        description="AI-powered products published in the SysOne ecosystem."
        products={aiTools}
        href="/marketplace"
        linkLabel="Explore AI tools"
      />

      <StoreSection
        title="Digital Products"
        description="Downloadable digital products available through SysOne."
        products={digitalProducts}
        href="/marketplace"
        linkLabel="Explore digital products"
      />
    </>
  );
}