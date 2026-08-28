"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Clipboard,
  KeyRound,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

type AdminLicense = {
  id: string;
  entitlementId: string;
  userId: string;
  userEmail: string | null;
  userName: string;
  productId: string;
  productSlug: string;
  productName: string;
  deviceLimit: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
};

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

type LicenseDraft = {
  id?: string;
  entitlementId: string;
  deviceLimit: number;
  status: string;
  expiresAt: string;
};

type CreatedLicenseKey = {
  license: AdminLicense;
  key: string;
};

const licenseStatuses = [
  "ACTIVE",
  "SUSPENDED",
  "EXPIRED",
  "REVOKED",
];

const blankLicense: LicenseDraft = {
  entitlementId: "",
  deviceLimit: 1,
  status: "ACTIVE",
  expiresAt: "",
};

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
    throw new Error(
      "invalid_expires_at",
    );
  }

  return date.toISOString();
}

function statusClass(status: string) {
  return status === "ACTIVE"
    ? "good"
    : "";
}

export function LicensesManager() {
  const [licenses, setLicenses] =
    useState<AdminLicense[]>([]);

  const [
    entitlements,
    setEntitlements,
  ] = useState<AdminEntitlement[]>([]);

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
    useState<LicenseDraft | null>(
      null,
    );

  const [
    createdLicenseKey,
    setCreatedLicenseKey,
  ] =
    useState<CreatedLicenseKey | null>(
      null,
    );

  const [copied, setCopied] =
    useState(false);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        licenseData,
        entitlementData,
      ] = await Promise.all([
        readJson(
          await fetch(
            "/api/admin/licenses",
            {
              cache: "no-store",
            },
          ),
        ),

        readJson(
          await fetch(
            "/api/admin/entitlements",
            {
              cache: "no-store",
            },
          ),
        ),
      ]);

      setLicenses(
        licenseData.licenses ?? [],
      );

      setEntitlements(
        entitlementData.entitlements ??
          [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "licenses_load_failed",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeEntitlements =
    useMemo(
      () =>
        entitlements.filter(
          (entitlement) =>
            entitlement.status ===
            "ACTIVE",
        ),
      [entitlements],
    );

  const filtered = useMemo(() => {
    const needle = query
      .trim()
      .toLowerCase();

    return licenses.filter(
      (license) => {
        const matchesStatus =
          status === "ALL" ||
          license.status === status;

        const haystack = [
          license.userName,
          license.userEmail ?? "",
          license.productName,
          license.productSlug,
          license.status,
          license.id,
        ]
          .join(" ")
          .toLowerCase();

        return (
          matchesStatus &&
          (!needle ||
            haystack.includes(
              needle,
            ))
        );
      },
    );
  }, [
    licenses,
    query,
    status,
  ]);

  function createNew() {
    setCreatedLicenseKey(null);
    setCopied(false);

    setEditing({
      ...blankLicense,
      entitlementId:
        activeEntitlements[0]?.id ??
        "",
    });
  }

  function editLicense(
    license: AdminLicense,
  ) {
    setCreatedLicenseKey(null);
    setCopied(false);

    setEditing({
      id: license.id,
      entitlementId:
        license.entitlementId,
      deviceLimit:
        license.deviceLimit,
      status:
        license.status,
      expiresAt:
        toDateTimeLocal(
          license.expiresAt,
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
            `/api/admin/licenses/${encodeURIComponent(editing.id)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                deviceLimit:
                  editing.deviceLimit,
                status:
                  editing.status,
                expiresAt:
                  toIsoOrNull(
                    editing.expiresAt,
                  ),
              }),
            },
          ),
        );

        setEditing(null);

        await load();

        return;
      }

      const data = await readJson(
        await fetch(
          "/api/admin/licenses",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              entitlementId:
                editing.entitlementId,
              deviceLimit:
                editing.deviceLimit,
              status:
                editing.status,
              expiresAt:
                toIsoOrNull(
                  editing.expiresAt,
                ),
            }),
          },
        ),
      );

      const license =
        data.license as
          | AdminLicense
          | undefined;

      const licenseKey =
        typeof data.licenseKey ===
        "string"
          ? data.licenseKey
          : "";

      if (
        !license ||
        !licenseKey
      ) {
        throw new Error(
          "license_key_missing",
        );
      }

      setEditing(null);

      setCreatedLicenseKey({
        license,
        key: licenseKey,
      });

      setCopied(false);

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "license_save_failed",
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyLicenseKey() {
    if (!createdLicenseKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        createdLicenseKey.key,
      );

      setCopied(true);
    } catch {
      setError(
        "clipboard_unavailable",
      );
    }
  }

  function closeLicenseKey() {
    if (
      !window.confirm(
        "License key oynasi yopilgach, bu raw key Control Center orqali qayta ko‘rsatilmaydi. Nusxa olganingizga ishonchingiz komilmi?",
      )
    ) {
      return;
    }

    setCreatedLicenseKey(null);
    setCopied(false);
  }

  const activeCount =
    licenses.filter(
      (license) =>
        license.status === "ACTIVE",
    ).length;

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            LICENSE & DEVICE ACCESS
          </span>

          <h2>
            Licenses
          </h2>

          <p>
            Entitlement asosida
            license yarating, device
            limit va access lifecycle
            holatini boshqaring.
          </p>
        </div>

        <button
          className="button buttonPrimary"
          onClick={createNew}
          disabled={
            !activeEntitlements.length
          }
        >
          <Plus size={16} />
          Yangi license
        </button>
      </div>

      <div className="releaseSecurity">
        <ShieldCheck size={17} />

        <div>
          <strong>
            Hashed license storage
          </strong>

          <span>
            Raw license key D1
            bazasida saqlanmaydi.
            Faqat SHA-256 hash
            saqlanadi va yangi key
            faqat yaratilgan paytda
            bir marta ko‘rsatiladi.
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
            placeholder="User, email, product yoki license ID..."
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

          {licenseStatuses.map(
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

          Licenses D1 bazadan
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
                <th>Devices</th>
                <th>Expires</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (license) => (
                  <tr
                    key={
                      license.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          license.userName
                        }
                      </strong>

                      <small>
                        {license.userEmail ??
                          "Email mavjud emas"}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {
                          license.productName
                        }
                      </strong>

                      <small>
                        {
                          license.productSlug
                        }
                      </small>
                    </td>

                    <td>
                      <span
                        className={`adminStatus ${statusClass(license.status)}`}
                      >
                        {
                          license.status
                        }
                      </span>
                    </td>

                    <td>
                      <span className="adminBadge">
                        {
                          license.deviceLimit
                        }{" "}
                        device
                      </span>
                    </td>

                    <td>
                      <strong>
                        {formatDate(
                          license.expiresAt,
                        )}
                      </strong>
                    </td>

                    <td>
                      <small>
                        {formatDate(
                          license.createdAt,
                        )}
                      </small>
                    </td>

                    <td>
                      <div className="adminRowActions">
                        <button
                          onClick={() =>
                            editLicense(
                              license,
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
              Mos license topilmadi.
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
                  LICENSE EDITOR
                </span>

                <h3>
                  {editing.id
                    ? "Licenseni tahrirlash"
                    : "Yangi license"}
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
                  Entitlement
                </span>

                <select
                  value={
                    editing.entitlementId
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
                      entitlementId:
                        event.target
                          .value,
                    })
                  }
                  required
                >
                  <option value="">
                    Tanlang
                  </option>

                  {(editing.id
                    ? entitlements
                    : activeEntitlements
                  ).map(
                    (entitlement) => (
                      <option
                        key={
                          entitlement.id
                        }
                        value={
                          entitlement.id
                        }
                      >
                        {
                          entitlement.userName
                        }{" "}
                        ·{" "}
                        {
                          entitlement.productName
                        }{" "}
                        ·{" "}
                        {
                          entitlement.status
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Device limit
                </span>

                <input
                  type="number"
                  min={1}
                  step={1}
                  value={
                    editing.deviceLimit
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,
                      deviceLimit:
                        Math.max(
                          1,
                          Number(
                            event
                              .target
                              .value,
                          ) ||
                            1,
                        ),
                    })
                  }
                  required
                />
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
                  {licenseStatuses.map(
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

              <label className="wide">
                <span>
                  Tugash sanasi
                </span>

                <input
                  type="datetime-local"
                  value={
                    editing.expiresAt
                  }
                  onChange={(
                    event,
                  ) =>
                    setEditing({
                      ...editing,
                      expiresAt:
                        event.target
                          .value,
                    })
                  }
                />
              </label>
            </div>

            <div className="releaseSecurity">
              <KeyRound size={17} />

              <div>
                <strong>
                  Secure license
                  lifecycle
                </strong>

                <span>
                  License user/product
                  bog‘lanishi
                  entitlement orqali
                  belgilanadi. Raw key
                  keyinchalik bazadan
                  qayta olinmaydi.
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
                  !editing.entitlementId ||
                  editing.deviceLimit < 1
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

      {createdLicenseKey ? (
        <div className="adminDrawerBackdrop">
          <div className="adminDrawer">
            <div className="adminDrawerHead">
              <div>
                <span className="eyebrow">
                  ONE-TIME LICENSE KEY
                </span>

                <h3>
                  License yaratildi
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeLicenseKey
                }
              >
                <X />
              </button>
            </div>

            <div className="releaseSecurity">
              <ShieldCheck
                size={18}
              />

              <div>
                <strong>
                  Ushbu key faqat bir
                  marta ko‘rsatiladi
                </strong>

                <span>
                  Keyni hozir nusxa
                  oling va xavfsiz
                  joyga saqlang.
                  Oynani yopgandan
                  keyin raw key
                  Control Center orqali
                  qayta tiklanmaydi.
                </span>
              </div>
            </div>

            <div
              style={{
                margin: "20px 0",
              }}
            >
              <small>
                LICENSE KEY
              </small>

              <code
                style={{
                  display: "block",
                  marginTop: "10px",
                  padding: "16px",
                  overflowWrap:
                    "anywhere",
                  fontSize: "14px",
                }}
              >
                {
                  createdLicenseKey.key
                }
              </code>
            </div>

            <div>
              <strong>
                {
                  createdLicenseKey
                    .license
                    .productName
                }
              </strong>

              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                }}
              >
                {
                  createdLicenseKey
                    .license.userName
                }{" "}
                ·{" "}
                {
                  createdLicenseKey
                    .license.deviceLimit
                }{" "}
                device
              </small>
            </div>

            <div className="adminDrawerFoot">
              <button
                type="button"
                className="button buttonGhost"
                onClick={
                  closeLicenseKey
                }
              >
                Yopish
              </button>

              <button
                type="button"
                className="button buttonPrimary"
                onClick={() =>
                  void copyLicenseKey()
                }
              >
                <Clipboard size={16} />

                {copied
                  ? "Nusxalandi"
                  : "Keyni nusxalash"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}