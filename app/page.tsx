import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  BrainCircuit,
  BriefcaseBusiness,
  FlaskConical,
  Gamepad2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import { ProductCard } from "@/components/ProductCard";
import { T } from "@/components/T";
import type { TranslationKey } from "@/lib/i18n";
import {
  listPublishedProducts,
  type PublicProduct,
} from "@/lib/server/products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "SysOne — Software, AI Tools and Digital Products" },
  description:
    "Discover SysOne software, AI tools, games and digital products from the official SysOne platform.",
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

function sortByUpdated(products: PublicProduct[]) {
  return [...products].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime(),
  );
}

const divisions = [
  {
    labelKey: "common.software",
    detailKey: "home.div.software.detail",
    href: "/products",
    icon: Box,
  },
  {
    labelKey: "common.ai",
    detailKey: "home.div.ai.detail",
    href: "/ai",
    icon: BrainCircuit,
  },
  {
    labelKey: "common.games",
    detailKey: "home.div.games.detail",
    href: "/games",
    icon: Gamepad2,
  },
  {
    labelKey: "home.div.business",
    detailKey: "home.div.business.detail",
    href: "/contact",
    icon: BriefcaseBusiness,
  },
  {
    labelKey: "common.labs",
    detailKey: "home.div.labs.detail",
    href: "/labs",
    icon: FlaskConical,
  },
] as const satisfies readonly {
  labelKey: TranslationKey;
  detailKey: TranslationKey;
  href: string;
  icon: typeof Box;
}[];

function StoreSection({
  eyebrowKey,
  titleKey,
  descriptionKey,
  products,
  href,
  linkLabelKey,
}: {
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  products: PublicProduct[];
  href: string;
  linkLabelKey: TranslationKey;
}) {
  if (products.length === 0) return null;

  return (
    <section className="v3CatalogSection">
      <div className="shell">
        <div className="v3SectionHead">
          <div>
            <span className="v3Kicker"><T id={eyebrowKey} /></span>
            <h2><T id={titleKey} /></h2>
            <p><T id={descriptionKey} /></p>
          </div>

          <Link href={href} className="v3SectionLink">
            <T id={linkLabelKey} />
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="v3ProductGrid">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
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

  const featured = products
    .filter(
      (product) => product.featured || product.featuredRank > 0,
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
    featured[0] ?? sortByUpdated(products)[0] ?? null;

  const newest = sortByUpdated(products).slice(0, 8);

  return (
    <>
      <section className="v3Hero">
        <div className="shell v3HeroLayout">
          <div className="v3HeroCopy">
            <span className="v3Kicker v3KickerLive">
              <i />
              <T id="home.kicker" />
            </span>

            <h1>
              <T id="home.hero.line1" />
              <br />
              <span><T id="home.hero.line2" /></span>
            </h1>

            <p><T id="home.hero.description" /></p>

            <div className="v3HeroActions">
              <Link className="button buttonPrimary" href="/marketplace">
                <ShoppingBag size={17} />
                <T id="home.exploreStore" />
                <ArrowRight size={17} />
              </Link>

              <Link className="button buttonGhost" href="/about">
                <T id="home.about" />
              </Link>
            </div>

            {products.length > 0 && (
              <div className="v3LiveCatalog">
                <span>
                  <i />
                  <T id="home.liveCatalog" />
                </span>
                <strong>{products.length}</strong>
                <small><T id="home.publishedProducts" /></small>
              </div>
            )}
          </div>

          <div className="v3SystemCore" aria-hidden="true">
            <div className="v3CoreGrid" />
            <div className="v3CoreGlow" />
            <div className="v3CoreOrbit orbitOne"><i /></div>
            <div className="v3CoreOrbit orbitTwo"><i /></div>
            <div className="v3CoreOrbit orbitThree" />

            <div className="v3CoreMark">
              <Image
                src="/brand/sysone-symbol.webp"
                width={94}
                height={94}
                alt=""
                priority
              />
              <span>SYSONE</span>
            </div>

            <span className="v3CoreTag tagSoftware">
              <Box size={14} />
              <T id="common.software" />
            </span>
            <span className="v3CoreTag tagAi">
              <BrainCircuit size={14} />
              <T id="common.ai" />
            </span>
            <span className="v3CoreTag tagGames">
              <Gamepad2 size={14} />
              <T id="common.games" />
            </span>
            <span className="v3CoreTag tagLabs">
              <Sparkles size={14} />
              <T id="common.labs" />
            </span>
          </div>
        </div>
      </section>

      <section className="v3DivisionRail">
        <div className="shell v3DivisionGrid">
          {divisions.map(({ labelKey, detailKey, href, icon: Icon }) => (
            <Link href={href} key={href}>
              <span className="v3DivisionIcon">
                <Icon size={20} />
              </span>
              <span>
                <strong><T id={labelKey} /></strong>
                <small><T id={detailKey} /></small>
              </span>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>

      {heroProduct && (
        <section className="v3Spotlight">
          <div className="shell v3SpotlightLayout">
            <div className="v3SpotlightCopy">
              <span className="v3Kicker"><T id="home.featuredProduct" /></span>
              <h2>{heroProduct.name}</h2>

              {productDescription(heroProduct) && (
                <p>{productDescription(heroProduct)}</p>
              )}

              <div className="v3SpotlightMeta">
                <span>
                  {heroProduct.category ??
                    heroProduct.kind.replaceAll("_", " ")}
                </span>
                <span>
                  {heroProduct.status.replaceAll("_", " ").toLowerCase()}
                </span>
              </div>

              <Link
                href={productHref(heroProduct)}
                className="button buttonGhost"
              >
                <T id="home.openProduct" />
                <ArrowRight size={16} />
              </Link>
            </div>

            <ProductCard product={heroProduct} />
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section className="v3EnvironmentEmpty">
          <div className="shell">
            <div>
              <ShoppingBag size={28} />
              <span className="v3Kicker"><T id="home.catalogState" /></span>
              <h2><T id="home.noPublished" /></h2>
              <p><T id="home.noPublishedText" /></p>
            </div>
          </div>
        </section>
      )}

      <StoreSection
        eyebrowKey="home.selected"
        titleKey="home.featuredReleases"
        descriptionKey="home.featuredReleasesText"
        products={featured}
        href="/marketplace"
        linkLabelKey="home.viewStore"
      />

      <StoreSection
        eyebrowKey="home.recent"
        titleKey="home.newUpdated"
        descriptionKey="home.newUpdatedText"
        products={newest}
        href="/marketplace"
        linkLabelKey="home.browseCatalog"
      />

      <StoreSection
        eyebrowKey="home.softwareKicker"
        titleKey="home.builtForWork"
        descriptionKey="home.builtForWorkText"
        products={software}
        href="/products"
        linkLabelKey="home.allSoftware"
      />

      <section className="v3Closing">
        <div className="shell v3ClosingLayout">
          <div>
            <span className="v3Kicker"><T id="home.customKicker" /></span>
            <h2><T id="home.needSystem" /></h2>
            <p><T id="home.needSystemText" /></p>
          </div>

          <Link href="/contact" className="button buttonPrimary">
            <T id="home.startProject" />
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
