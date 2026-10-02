import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Gamepad2,
  LogIn,
  Play,
  ShieldCheck,
} from "lucide-react";

import { getLaunchAccess } from "@/lib/server/product-access";
import { getPublishedProductBySlug } from "@/lib/server/products";

export const dynamic = "force-dynamic";

type LaunchPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function productHref(kind: string, slug: string) {
  return kind === "GAME"
    ? `/games/${encodeURIComponent(slug)}`
    : `/products/${encodeURIComponent(slug)}`;
}

export default async function LaunchPage({
  params,
}: LaunchPageProps) {
  const { slug } = await params;

  const product =
    await getPublishedProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const access =
    await getLaunchAccess(product);

  const backHref =
    productHref(product.kind, product.slug);

  if (!access.ok) {
    const launchReturnTo =
      `/launch/${encodeURIComponent(product.slug)}`;

    const content = {
      not_web: {
        title: "Web versiya mavjud emas",
        text: "Bu mahsulot hozir faqat yuklab olinadigan formatda mavjud.",
      },
      runtime_missing: {
        title: "Web runtime hali tayyor emas",
        text: "Bu mahsulot uchun Owner Tool orqali aktiv web build yoki external runtime ulanishi kerak.",
      },
      login_required: {
        title: "SysOne ID talab qilinadi",
        text: "Bu web mahsulotni ishga tushirish uchun akkauntingizga kiring.",
      },
      entitlement_required: {
        title: "Mahsulotga ruxsat kerak",
        text: "Bu mahsulotni ishga tushirish uchun faol entitlement yoki xarid talab qilinadi.",
      },
    }[access.reason];

    return (
      <div className="v4LaunchPage">
        <div className="v4LaunchState">
          <div>
            <ShieldCheck size={30} />
            <h1>{content.title}</h1>
            <p>{content.text}</p>

            {access.reason === "login_required" ? (
              <Link
                className="button buttonPrimary"
                href={`/login?returnTo=${encodeURIComponent(
                  launchReturnTo,
                )}`}
              >
                <LogIn size={16} />
                Kirish
              </Link>
            ) : (
              <Link
                className="button buttonPrimary"
                href={backHref}
              >
                <ArrowLeft size={16} />
                Mahsulotga qaytish
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (access.embedMode === "NEW_TAB") {
    return (
      <div className="v4LaunchPage">
        <div className="v4LaunchTop">
          <Link href={backHref}>
            <ArrowLeft size={15} />
            Orqaga
          </Link>

          <div className="v4LaunchIdentity">
            <strong>{product.name}</strong>
            <small>
              {product.kind === "GAME"
                ? "SYSONE GAME"
                : "SYSONE WEB APP"}
            </small>
          </div>
        </div>

        <div className="v4LaunchState">
          <div>
            {product.kind === "GAME" ? (
              <Gamepad2 size={34} />
            ) : (
              <Play size={34} />
            )}

            <h1>{product.name}</h1>
            <p>
              Bu mahsulot alohida oynada ishga tushiriladi.
            </p>

            <a
              className="button buttonPrimary"
              href={access.url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} />
              {product.kind === "GAME"
                ? "Oyinni ochish"
                : "Web dasturni ochish"}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="v4LaunchPage">
      <div className="v4LaunchTop">
        <Link href={backHref}>
          <ArrowLeft size={15} />
          Orqaga
        </Link>

        <div className="v4LaunchIdentity">
          <strong>{product.name}</strong>
          <small>
            {product.kind === "GAME"
              ? "SYSONE GAME"
              : "SYSONE WEB APP"}
          </small>
        </div>

        <div className="v4LaunchTopActions">
          <a
            href={access.url}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={14} />
            Yangi oynada
          </a>
        </div>
      </div>

      <iframe
        className="v4RuntimeFrame"
        src={access.url}
        title={product.name}
        allow="fullscreen; clipboard-read; clipboard-write; gamepad; autoplay"
        allowFullScreen={access.supportsFullscreen}
      />
    </div>
  );
}
