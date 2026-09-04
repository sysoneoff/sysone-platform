"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type AdminEntitlement = {
  id: string;
  userId: string;
  userEmail: string | null;
  userName: string;
  productId: string;
  productSlug: string;
  productName: string;
  orderId: string | null;
  status: string;
  startsAt: string;
  endsAt: string | null;
};

type AdminUser = {
  id: string;
  email: string | null;
  name: string;
};

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
};

type EntitlementDraft = {
  id?: string;
  userId: string;
  productId: string;
  orderId: string;
  status: string;
  endsAt: string;
};

const blankEntitlement: EntitlementDraft = {
  userId: "",
  productId: "",
  orderId: "",
  status: "ACTIVE",
  endsAt: "",
};

const entitlementStatuses = [
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "REVOKED",
];

async function readJson(response: Response) {
  const data = await response
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

function formatDate(value: string | null) {
  if (!value) {
    return "Cheklanmagan";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function toDateTimeLocal(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60_000,
  );

  return local
    .toISOString()
    .slice(0, 16);
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("invalid_ends_at");
  }

  return date.toISOString();
}

function statusClass(status: string) {
  return status === "ACTIVE"
    ? "good"
    : "";
}

export function EntitlementsManager() {
  const [
    entitlements,
    setEntitlements,
  ] = useState<AdminEntitlement[]>([]);

  const [users, setUsers] = useState<
    AdminUser[]
  >([]);

  const [products, setProducts] =
    useState<AdminProduct[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [editing, setEditing] =
    useState<EntitlementDraft | null>(
      null,
    );

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        entitlementData,
        userData,
        productData,
      ] = await Promise.all([
        readJson(
          await fetch(
            "/api/admin/entitlements",
            {
              cache: "no-store",
            },
          ),
        ),

        readJson(
          await fetch(
            "/api/admin/users",
            {
              cache: "no-store",
            },
          ),
        ),

        readJson(
          await fetch(
            "/api/admin/products",
            {
              cache: "no-store",
            },
          ),
        ),
      ]);

      setEntitlements(
        entitlementData.entitlements ?? [],
      );

      setUsers(
        userData.users ?? [],
      );

      setProducts(
        productData.products ?? [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "entitlements_load_failed",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query
      .trim()
      .toLowerCase();

    return entitlements.filter(
      (entitlement) => {
        const matchesStatus =
          status === "ALL" ||
          entitlement.status === status;

        const haystack = [
          entitlement.userName,
          entitlement.userEmail ?? "",
          entitlement.productName,
          entitlement.productSlug,
          entitlement.orderId ?? "",
          entitlement.status,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          (!needle ||
            haystack.includes(needle))
        );
      },
    );
  }, [
    entitlements,
    query,
    status,
  ]);

  function createNew() {
    setEditing({
      ...blankEntitlement,
      userId:
        users[0]?.id ?? "",
      productId:
        products[0]?.id ?? "",
    });
  }

  function editEntitlement(
    entitlement: AdminEntitlement,
  ) {
    setEditing({
      id: entitlement.id,
      userId: entitlement.userId,
      productId:
        entitlement.productId,
      orderId:
        entitlement.orderId ?? "",
      status:
        entitlement.status,
      endsAt:
        toDateTimeLocal(
          entitlement.endsAt,
        ),
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
      if (editing.id) {
        await readJson(
          await fetch(
            `/api/admin/entitlements/${encodeURIComponent(editing.id)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                status:
                  editing.status,
                endsAt:
                  toIsoOrNull(
                    editing.endsAt,
                  ),
              }),
            },
          ),
        );
      } else {
        await readJson(
          await fetch(
            "/api/admin/entitlements",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                userId:
                  editing.userId,
                productId:
                  editing.productId,
                orderId:
                  editing.orderId
                    .trim() ||
                  null,
                status:
                  editing.status,
                endsAt:
                  toIsoOrNull(
                    editing.endsAt,
                  ),
              }),
            },
          ),
        );
      }

      setEditing(null);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "entitlement_save_failed",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeCount =
    entitlements.filter(
      (item) =>
        item.status === "ACTIVE",
    ).length;

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            ACCESS CONTROL / D1
          </span>

          <h2>
            Entitlements
          </h2>

          <p>
            Foydalanuvchilarga
            Software, Games va boshqa
            SysOne mahsulotlariga
            foydalanish huquqini
            boshqaring.
          </p>
        </div>

        <button
          className="button buttonPrimary"
          onClick={createNew}
          disabled={
            !users.length ||
            !products.length
          }
        >
          <Plus size={16} />
          Yangi entitlement
        </button>
      </div>

      <div className="releaseSecurity">
        <ShieldCheck size={17} />

        <div>
          <strong>
            Access lifecycle
          </strong>

          <span>
            Entitlement yozuvlari
            tarixni saqlash uchun hard
            delete qilinmaydi. Access
            status va tugash sanasi
            orqali boshqariladi.
          </span>
        </div>

        <em>
          {activeCount} ACTIVE
        </em>
      </div>

      <div className="adminToolbar">
        <label className="adminSearch">
          <Search size={15} />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="User, email, product yoki order..."
          />
        </label>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value,
            )
          }
        >
          <option value="ALL">
            Barcha statuslar
          </option>

          {entitlementStatuses.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ),
          )}
        </select>

        <button
          className="adminIconBtn"
          onClick={() =>
            void load()
          }
          title="Yangilash"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error ? (
        <div className="adminInlineError">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="adminLoading">
          <LoaderCircle className="spin" />

          Entitlements D1 bazadan
          yuklanmoqda...
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>User</th>
                <th>Product</th>
                <th>Status</th>
                <th>Access period</th>
                <th>Order</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (entitlement) => (
                  <tr
                    key={
                      entitlement.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          entitlement.userName
                        }
                      </strong>

                      <small>
                        {entitlement.userEmail ??
                          "Email mavjud emas"}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {
                          entitlement.productName
                        }
                      </strong>

                      <small>
                        {
                          entitlement.productSlug
                        }
                      </small>
                    </td>

                    <td>
                      <span
                        className={`adminStatus ${statusClass(entitlement.status)}`}
                      >
                        {
                          entitlement.status
                        }
                      </span>
                    </td>

                    <td>
                      <strong>
                        <CalendarClock
                          size={13}
                        />{" "}
                        {formatDate(
                          entitlement.startsAt,
                        )}
                      </strong>

                      <small>
                        Ends:{" "}
                        {formatDate(
                          entitlement.endsAt,
                        )}
                      </small>
                    </td>

                    <td>
                      <span className="adminBadge">
                        {entitlement.orderId ??
                          "MANUAL"}
                      </span>
                    </td>

                    <td>
                      <div className="adminRowActions">
                        <button
                          onClick={() =>
                            editEntitlement(
                              entitlement,
                            )
                          }
                          title="Tahrirlash"
                        >
                          <Pencil
                            size={15}
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
              Mos entitlement
              topilmadi.
            </div>
          ) : null}
        </div>
      )}

      {editing ? (
        <div
          className="adminDrawerBackdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              setEditing(null);
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
                  ACCESS EDITOR
                </span>

                <h3>
                  {editing.id
                    ? "Entitlementni tahrirlash"
                    : "Yangi entitlement"}
                </h3>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setEditing(null)
                }
              >
                <X />
              </button>
            </div>

            <div className="adminFormGrid">
              <label className="wide">
                <span>
                  Foydalanuvchi
                </span>

                <select
                  value={
                    editing.userId
                  }
                  disabled={
                    Boolean(
                      editing.id,
                    )
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,
                      userId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Tanlang
                  </option>

                  {users.map(
                    (user) => (
                      <option
                        key={user.id}
                        value={user.id}
                      >
                        {user.name}
                        {user.email
                          ? ` · ${user.email}`
                          : ""}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="wide">
                <span>
                  Mahsulot / o‘yin
                </span>

                <select
                  value={
                    editing.productId
                  }
                  disabled={
                    Boolean(
                      editing.id,
                    )
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,
                      productId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Tanlang
                  </option>

                  {products.map(
                    (product) => (
                      <option
                        key={
                          product.id
                        }
                        value={
                          product.id
                        }
                      >
                        {
                          product.name
                        }{" "}
                        ·{" "}
                        {
                          product.kind
                        }
                      </option>
                    ),
                  )}
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
                        event.target
                          .value,
                    })
                  }
                >
                  {entitlementStatuses.map(
                    (item) => (
                      <option
                        key={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Tugash sanasi
                </span>

                <input
                  type="datetime-local"
                  value={
                    editing.endsAt
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,
                      endsAt:
                        event.target
                          .value,
                    })
                  }
                />
              </label>

              {!editing.id ? (
                <label className="wide">
                  <span>
                    Order ID
                    (ixtiyoriy)
                  </span>

                  <input
                    value={
                      editing.orderId
                    }
                    onChange={(
                      event,
                    ) =>
                      setEditing({
                        ...editing,
                        orderId:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Manual entitlement uchun bo‘sh qoldiring"
                  />
                </label>
              ) : null}
            </div>

            <div className="releaseSecurity">
              <ShieldCheck
                size={17}
              />

              <div>
                <strong>
                  Immutable ownership
                </strong>

                <span>
                  Yaratilgandan keyin
                  user va product
                  almashtirilmaydi;
                  faqat status va access
                  muddati boshqariladi.
                </span>
              </div>
            </div>

            <div className="adminDrawerFoot">
              <button
                type="button"
                className="button buttonGhost"
                disabled={saving}
                onClick={() =>
                  setEditing(null)
                }
              >
                Bekor qilish
              </button>

              <button
                className="button buttonPrimary"
                disabled={
                  saving ||
                  !editing.userId ||
                  !editing.productId
                }
              >
                {saving ? (
                  <LoaderCircle
                    className="spin"
                    size={16}
                  />
                ) : (
                  <Save size={16} />
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