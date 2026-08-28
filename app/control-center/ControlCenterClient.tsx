"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Boxes,
  Clipboard,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Workflow,
  X,
} from "lucide-react";

import {
  ReleaseManager,
} from "./ReleaseManager";

import {
  ProjectRequestsManager,
} from "./ProjectRequestsManager";

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  category: string | null;
  description: string | null;
  status: string;
  pricingModel: string;
  priceMinor: number;
  currency: string;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type MediaAsset = {
  key: string;
  size: number;
  uploaded: string;
  contentType: string | null;
  url: string;
};

type ProductDraft = {
  id?: string;
  slug: string;
  name: string;
  kind: string;
  category: string;
  description: string;
  status: string;
  pricingModel: string;
  priceMinor: number;
  currency: string;
  featured: boolean;
  published: boolean;
};

const blankProduct: ProductDraft = {
  slug: "",
  name: "",
  kind: "SOFTWARE",
  category: "",
  description: "",
  status: "DRAFT",
  pricingModel: "FREE",
  priceMinor: 0,
  currency: "UZS",
  featured: false,
  published: false,
};

const groups = [
  {
    label: "Content",
    items: [
      [
        "Media",
        ImageIcon,
      ],
    ],
  },

  {
    label: "Commerce",
    items: [
      [
        "Products",
        Boxes,
      ],
      [
        "Releases",
        Package,
      ],
    ],
  },

  {
    label: "Customers",
    items: [
      [
        "Project Requests",
        Workflow,
      ],
    ],
  },
] as const;

async function readJson(
  response: Response,
) {
  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        `request_failed_${response.status}`,
    );
  }

  return data;
}

function money(
  value: number,
  currency: string,
) {
  if (value === 0) {
    return "Free / TBD";
  }

  return `${new Intl.NumberFormat(
    "uz-UZ",
  ).format(value)} ${currency}`;
}

function formatBytes(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function ProductsManager() {
  const [
    products,
    setProducts,
  ] =
    useState<AdminProduct[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    kind,
    setKind,
  ] = useState("ALL");

  const [
    editing,
    setEditing,
  ] =
    useState<ProductDraft | null>(
      null,
    );

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data =
        await readJson(
          await fetch(
            "/api/admin/products",
            {
              cache:
                "no-store",
            },
          ),
        );

      setProducts(
        data.products ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "load_failed",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered =
    useMemo(
      () =>
        products.filter(
          (product) => {
            const matchesKind =
              kind ===
                "ALL" ||
              product.kind ===
                kind;

            const haystack =
              `${product.name} ${product.slug} ${product.category ?? ""}`
                .toLowerCase();

            return (
              matchesKind &&
              haystack.includes(
                query.toLowerCase(),
              )
            );
          },
        ),
      [
        products,
        query,
        kind,
      ],
    );

  function editProduct(
    product: AdminProduct,
  ) {
    setEditing({
      ...product,

      category:
        product.category ??
        "",

      description:
        product.description ??
        "",
    });
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editing) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          editing.id
            ? `/api/admin/products/${editing.id}`
            : "/api/admin/products",
          {
            method:
              editing.id
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                editing,
              ),
          },
        );

      await readJson(
        response,
      );

      setEditing(null);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "save_failed",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(
    product: AdminProduct,
  ) {
    if (
      !window.confirm(
        `“${product.name}” mahsulotini o‘chirishni tasdiqlaysizmi?`,
      )
    ) {
      return;
    }

    try {
      await readJson(
        await fetch(
          `/api/admin/products/${product.id}`,
          {
            method:
              "DELETE",
          },
        ),
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "delete_failed",
      );
    }
  }

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            D1 PRODUCT CATALOG
          </span>

          <h2>
            Products & Games
          </h2>

          <p>
            D1 katalogini
            real admin API orqali
            boshqaring.
          </p>
        </div>

        <button
          type="button"
          className="button buttonPrimary"
          onClick={() =>
            setEditing({
              ...blankProduct,
            })
          }
        >
          <Plus
            size={16}
          />

          Yangi mahsulot
        </button>
      </div>

      <div className="adminToolbar">
        <label className="adminSearch">
          <Search
            size={15}
          />

          <input
            value={query}
            onChange={(
              event,
            ) =>
              setQuery(
                event.target
                  .value,
              )
            }
            placeholder="Nom, slug yoki kategoriya..."
          />
        </label>

        <select
          value={kind}
          onChange={(
            event,
          ) =>
            setKind(
              event.target
                .value,
            )
          }
        >
          <option value="ALL">
            Barchasi
          </option>

          <option value="SOFTWARE">
            Software
          </option>

          <option value="GAME">
            Games
          </option>
        </select>

        <button
          type="button"
          onClick={() =>
            void load()
          }
          className="adminIconBtn"
          title="Yangilash"
        >
          <RefreshCw
            size={16}
          />
        </button>
      </div>

      {error ? (
        <div className="adminInlineError">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="adminLoading">
          <LoaderCircle
            className="spin"
          />

          D1 katalog
          yuklanmoqda...
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>
                  Product
                </th>

                <th>
                  Kind
                </th>

                <th>
                  Status
                </th>

                <th>
                  Pricing
                </th>

                <th>
                  Publish
                </th>

                <th />
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (product) => (
                  <tr
                    key={
                      product.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          product.name
                        }
                      </strong>

                      <small>
                        {
                          product.slug
                        }

                        <br />

                        {product.category ||
                          "—"}
                      </small>
                    </td>

                    <td>
                      <span className="adminBadge">
                        {
                          product.kind
                        }
                      </span>
                    </td>

                    <td>
                      <span
                        className={`adminStatus ${
                          product.status ===
                            "ACTIVE" ||
                          product.status ===
                            "RELEASED"
                            ? "good"
                            : ""
                        }`}
                      >
                        {
                          product.status
                        }
                      </span>
                    </td>

                    <td>
                      <strong>
                        {
                          product.pricingModel
                        }
                      </strong>

                      <small>
                        {money(
                          product.priceMinor,
                          product.currency,
                        )}
                      </small>
                    </td>

                    <td>
                      <div className="adminPublishCell">
                        <span
                          className={
                            product.published
                              ? "live"
                              : "draft"
                          }
                        >
                          {product.published
                            ? "LIVE"
                            : "DRAFT"}
                        </span>

                        {product.featured ? (
                          <small>
                            Featured
                          </small>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <div className="adminRowActions">
                        <button
                          type="button"
                          onClick={() =>
                            editProduct(
                              product,
                            )
                          }
                        >
                          <Pencil
                            size={
                              15
                            }
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void remove(
                              product,
                            )
                          }
                          className="danger"
                        >
                          <Trash2
                            size={
                              15
                            }
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>

          {!filtered.length ? (
            <div className="adminEmpty">
              Mos mahsulot
              topilmadi.
            </div>
          ) : null}
        </div>
      )}

      {editing ? (
        <div
          className="adminDrawerBackdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              setEditing(
                null,
              );
            }
          }}
        >
          <form
            className="adminDrawer"
            onSubmit={save}
          >
            <div className="adminDrawerHead">
              <div>
                <span className="eyebrow">
                  PRODUCT EDITOR
                </span>

                <h3>
                  {editing.id
                    ? "Mahsulotni tahrirlash"
                    : "Yangi mahsulot"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(
                    null,
                  )
                }
                disabled={
                  saving
                }
              >
                <X />
              </button>
            </div>

            <div className="adminFormGrid">
              <label className="wide">
                <span>
                  Nomi
                </span>

                <input
                  value={
                    editing.name
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      name:
                        event
                          .target
                          .value,
                    })
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Slug
                </span>

                <input
                  value={
                    editing.slug
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      slug:
                        event
                          .target
                          .value,
                    })
                  }
                  placeholder="auto from name"
                />
              </label>

              <label>
                <span>
                  Kategoriya
                </span>

                <input
                  value={
                    editing.category
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      category:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Turi
                </span>

                <select
                  value={
                    editing.kind
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      kind:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  <option>
                    SOFTWARE
                  </option>

                  <option>
                    GAME
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Status
                </span>

                <select
                  value={
                    editing.status
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      status:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  {[
                    "DRAFT",
                    "ALPHA",
                    "BETA",
                    "COMING_SOON",
                    "ACTIVE",
                    "RELEASED",
                    "ARCHIVED",
                  ].map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Pricing model
                </span>

                <select
                  value={
                    editing.pricingModel
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      pricingModel:
                        event
                          .target
                          .value,
                    })
                  }
                >
                  {[
                    "FREE",
                    "FREEMIUM",
                    "ONE_TIME",
                    "SUBSCRIPTION",
                    "CUSTOM",
                    "TBD",
                  ].map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                      >
                        {
                          item
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Narx
                  (minor unit)
                </span>

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={
                    editing.priceMinor
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      priceMinor:
                        Number(
                          event
                            .target
                            .value,
                        ),
                    })
                  }
                />
              </label>

              <label>
                <span>
                  Valyuta
                </span>

                <input
                  maxLength={3}
                  value={
                    editing.currency
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      currency:
                        event
                          .target
                          .value
                          .toUpperCase(),
                    })
                  }
                />
              </label>

              <label className="wide">
                <span>
                  Tavsif
                </span>

                <textarea
                  rows={7}
                  value={
                    editing.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,

                      description:
                        event
                          .target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <div className="adminSwitches">
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    ...editing,

                    published:
                      !editing.published,
                  })
                }
              >
                {editing.published ? (
                  <ToggleRight className="on" />
                ) : (
                  <ToggleLeft />
                )}

                <span>
                  <strong>
                    Published
                  </strong>

                  <small>
                    Public API’da
                    ko‘rinsin
                  </small>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditing({
                    ...editing,

                    featured:
                      !editing.featured,
                  })
                }
              >
                {editing.featured ? (
                  <ToggleRight className="on" />
                ) : (
                  <ToggleLeft />
                )}

                <span>
                  <strong>
                    Featured
                  </strong>

                  <small>
                    Katalogda
                    ustuvor
                  </small>
                </span>
              </button>
            </div>

            <div className="adminDrawerFoot">
              <button
                type="button"
                className="button buttonGhost"
                onClick={() =>
                  setEditing(
                    null,
                  )
                }
                disabled={
                  saving
                }
              >
                Bekor qilish
              </button>

              <button
                className="button buttonPrimary"
                disabled={
                  saving
                }
              >
                {saving ? (
                  <LoaderCircle
                    className="spin"
                    size={16}
                  />
                ) : (
                  <Save
                    size={16}
                  />
                )}

                Saqlash
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function MediaManager() {
  const [
    assets,
    setAssets,
  ] =
    useState<MediaAsset[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const data =
        await readJson(
          await fetch(
            "/api/admin/media",
            {
              cache:
                "no-store",
            },
          ),
        );

      setAssets(
        data.assets ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "media_load_failed",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const body =
        new FormData();

      body.append(
        "file",
        file,
      );

      await readJson(
        await fetch(
          "/api/admin/uploads",
          {
            method:
              "POST",

            body,
          },
        ),
      );

      event.target.value =
        "";

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "upload_failed",
      );
    } finally {
      setUploading(false);
    }
  }

  async function remove(
    asset: MediaAsset,
  ) {
    if (
      !window.confirm(
        "Bu media faylini R2’dan o‘chirasizmi?",
      )
    ) {
      return;
    }

    try {
      await readJson(
        await fetch(
          `/api/admin/media?key=${encodeURIComponent(
            asset.key,
          )}`,
          {
            method:
              "DELETE",
          },
        ),
      );

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "delete_failed",
      );
    }
  }

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            R2 MEDIA LIBRARY
          </span>

          <h2>
            Media
          </h2>

          <p>
            Private R2 bucket
            ichida saqlanadigan
            public product media.
          </p>
        </div>

        <label
          className={`button buttonPrimary adminUploadButton ${
            uploading
              ? "disabled"
              : ""
          }`}
        >
          {uploading ? (
            <LoaderCircle
              className="spin"
              size={16}
            />
          ) : (
            <Upload
              size={16}
            />
          )}

          Rasm yuklash

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={
              upload
            }
            disabled={
              uploading
            }
          />
        </label>
      </div>

      <div className="adminMediaInfo">
        <ShieldCheck
          size={17}
        />

        <span>
          PNG, JPG, WEBP,
          AVIF · maksimal
          10 MB · R2 bucket
          public qilinmaydi.
        </span>
      </div>

      {error ? (
        <div className="adminInlineError">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="adminLoading">
          <LoaderCircle
            className="spin"
          />

          R2 media
          yuklanmoqda...
        </div>
      ) : (
        <div className="adminMediaGrid">
          {assets.map(
            (asset) => (
              <article
                className="adminMediaCard"
                key={
                  asset.key
                }
              >
                <div className="adminMediaPreview">
                  <img
                    src={
                      asset.url
                    }
                    alt=""
                    loading="lazy"
                  />
                </div>

                <div className="adminMediaMeta">
                  <strong>
                    {asset.key
                      .split(
                        "/",
                      )
                      .pop()}
                  </strong>

                  <small>
                    {formatBytes(
                      asset.size,
                    )}
                    {" · "}
                    {new Date(
                      asset.uploaded,
                    ).toLocaleString()}
                  </small>

                  <code>
                    {
                      asset.key
                    }
                  </code>

                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          new URL(
                            asset.url,
                            window.location.origin,
                          ).toString(),
                        )
                      }
                    >
                      <Clipboard
                        size={
                          14
                        }
                      />

                      URL
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        void remove(
                          asset,
                        )
                      }
                    >
                      <Trash2
                        size={
                          14
                        }
                      />
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}

      {!loading &&
      !assets.length ? (
        <div className="adminEmpty">
          Media kutubxonasi
          bo‘sh.
        </div>
      ) : null}
    </section>
  );
}

export function ControlCenterClient() {
  const [
    active,
    setActive,
  ] =
    useState(
      "Products",
    );

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  async function logout() {
    setLoggingOut(true);

    try {
      await fetch(
        "/api/admin/session",
        {
          method:
            "DELETE",
        },
      );
    } finally {
      window.location.reload();
    }
  }

  function renderWorkspace() {
    if (
      active ===
      "Products"
    ) {
      return (
        <ProductsManager />
      );
    }

    if (
      active ===
      "Releases"
    ) {
      return (
        <ReleaseManager />
      );
    }

    if (
      active ===
      "Media"
    ) {
      return (
        <MediaManager />
      );
    }

    if (
      active ===
      "Project Requests"
    ) {
      return (
        <ProjectRequestsManager />
      );
    }

    return (
      <ProductsManager />
    );
  }

  return (
    <div className="controlWrap">
      <div className="controlShell">
        <aside className="controlNav">
          <div className="controlBrand">
            <img
              src="/brand/sysone-symbol.webp"
              alt=""
            />

            <span>
              <strong>
                Control Center
              </strong>

              <small>
                OWNER /
                ADMIN
              </small>
            </span>
          </div>

          {groups.map(
            (group) => (
              <div
                className="controlGroup"
                key={
                  group.label
                }
              >
                <span>
                  {
                    group.label
                  }
                </span>

                {group.items.map(
                  ([
                    label,
                    Icon,
                  ]) => (
                    <button
                      type="button"
                      onClick={() =>
                        setActive(
                          label,
                        )
                      }
                      className={
                        active ===
                        label
                          ? "active"
                          : ""
                      }
                      key={
                        label
                      }
                    >
                      <Icon
                        size={
                          16
                        }
                      />

                      {label}
                    </button>
                  ),
                )}
              </div>
            ),
          )}
        </aside>

        <main className="controlMain">
          <header className="controlTop">
            <div>
              <span className="eyebrow">
                PRIVATE ADMIN
              </span>

              <h1>
                {active}
              </h1>
            </div>

            <div className="controlTopActions">

              <div className="ownerChip">
                <span>
                  SO
                </span>

                <div>
                  <strong>
                    Owner
                  </strong>

                  <small>
                    Secure session
                  </small>
                </div>

                <ShieldCheck />
              </div>

              <button
                type="button"
                className="controlTopIcon danger"
                onClick={() =>
                  void logout()
                }
                disabled={
                  loggingOut
                }
              >
                {loggingOut ? (
                  <LoaderCircle className="spin" />
                ) : (
                  <LogOut />
                )}
              </button>
            </div>
          </header>

          <div className="adminNotice">
            <LockKeyhole />

            <span>
              <strong>
                Security
                model:
              </strong>{" "}
              admin secret
              server-side
              Cloudflare secret
              sifatida
              saqlanadi;
              session HttpOnly
              cookie bilan
              imzolanadi.
            </span>
          </div>

          {renderWorkspace()}
        </main>
      </div>
    </div>
  );
}