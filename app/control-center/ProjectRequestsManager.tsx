"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  LoaderCircle,
  RefreshCw,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";

type ProjectRequestStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "ACCEPTED"
  | "REJECTED"
  | "CONVERTED"
  | "CLOSED";

type EditableStatus =
  | "SUBMITTED"
  | "REVIEWING"
  | "ACCEPTED"
  | "REJECTED"
  | "CLOSED";

type ProjectRequest = {
  id: string;

  userId: string | null;
  projectId: string | null;

  projectType: string;
  platforms: string[];

  description: string;

  targetTiming: string | null;
  budgetStage: string | null;

  contactName: string;
  contactEmail: string | null;
  contactTelegram: string | null;
  organizationName: string | null;

  status: ProjectRequestStatus;

  internalNote: string | null;

  source: string;

  reviewedAt: string | null;
  convertedAt: string | null;

  createdAt: string;
  updatedAt: string;
};

type ProjectRequestStats = {
  total: number;
  submitted: number;
  reviewing: number;
  accepted: number;
  rejected: number;
  converted: number;
  closed: number;
};

type ListResponse = {
  ok: boolean;
  error?: string;

  requests?: ProjectRequest[];

  stats?: ProjectRequestStats;
};

type MutationResponse = {
  ok: boolean;
  error?: string;

  request?: ProjectRequest;

  project?: {
    id: string;
  };
};

const statusOptions: Array<
  {
    value:
      | "ALL"
      | ProjectRequestStatus;
    label: string;
  }
> = [
  {
    value: "ALL",
    label: "All requests",
  },
  {
    value: "SUBMITTED",
    label: "Submitted",
  },
  {
    value: "REVIEWING",
    label: "Reviewing",
  },
  {
    value: "ACCEPTED",
    label: "Accepted",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
  {
    value: "CONVERTED",
    label: "Converted",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

const editableStatuses: Array<{
  value: EditableStatus;
  label: string;
}> = [
  {
    value: "SUBMITTED",
    label: "Submitted",
  },
  {
    value: "REVIEWING",
    label: "Reviewing",
  },
  {
    value: "ACCEPTED",
    label: "Accepted",
  },
  {
    value: "REJECTED",
    label: "Rejected",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

const emptyStats: ProjectRequestStats = {
  total: 0,
  submitted: 0,
  reviewing: 0,
  accepted: 0,
  rejected: 0,
  converted: 0,
  closed: 0,
};

async function readJson<T>(
  response: Response,
): Promise<T> {
  const data =
    (await response
      .json()
      .catch(() => ({
        ok: false,
        error:
          "invalid_server_response",
      }))) as T;

  if (!response.ok) {
    const error =
      (
        data as {
          error?: string;
        }
      ).error ??
      `request_failed_${response.status}`;

    throw new Error(error);
  }

  return data;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

function shortId(
  value: string,
) {
  if (
    value.length <= 16
  ) {
    return value;
  }

  return `${value.slice(
    0,
    8,
  )}…${value.slice(-6)}`;
}

function statusIsPositive(
  status: ProjectRequestStatus,
) {
  return (
    status === "ACCEPTED" ||
    status === "CONVERTED"
  );
}

function humanizeError(
  error: string,
) {
  switch (error) {
    case "unauthorized":
      return "Admin session expired. Reload Control Center and sign in again.";

    case "project_request_not_found":
      return "Project request was not found.";

    case "converted_project_request_is_locked":
      return "Converted requests are locked.";

    case "use_project_request_conversion":
      return "CONVERTED status can only be created through project conversion.";

    case "project_request_must_be_accepted":
      return "Accept the request before converting it into a project.";

    case "project_request_already_converted":
      return "This request has already been converted.";

    case "project_request_conversion_conflict":
      return "The conversion state changed. Reload the request and try again.";

    case "invalid_internal_note":
      return "Internal note is invalid or too long.";

    case "project_requests_unavailable":
      return "Project requests could not be loaded from D1.";

    case "project_request_update_failed":
      return "The request could not be updated.";

    case "project_request_conversion_failed":
      return "The request could not be converted into a project.";

    default:
      return error;
  }
}

export function ProjectRequestsManager() {
  const [
    requests,
    setRequests,
  ] =
    useState<ProjectRequest[]>(
      [],
    );

  const [
    stats,
    setStats,
  ] =
    useState<ProjectRequestStats>(
      emptyStats,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState<
      | "ALL"
      | ProjectRequestStatus
    >("ALL");

  const [
    selected,
    setSelected,
  ] =
    useState<ProjectRequest | null>(
      null,
    );

  const [
    editStatus,
    setEditStatus,
  ] =
    useState<EditableStatus>(
      "SUBMITTED",
    );

  const [
    internalNote,
    setInternalNote,
  ] =
    useState("");

  const [
    projectTitle,
    setProjectTitle,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    converting,
    setConverting,
  ] =
    useState(false);

  async function load(
    searchQuery = query,
    statusFilter = status,
  ) {
    setLoading(true);
    setError("");

    try {
      const params =
        new URLSearchParams();

      params.set(
        "status",
        statusFilter,
      );

      params.set(
        "limit",
        "250",
      );

      const cleanQuery =
        searchQuery.trim();

      if (cleanQuery) {
        params.set(
          "q",
          cleanQuery,
        );
      }

      const data =
        await readJson<ListResponse>(
          await fetch(
            `/api/admin/project-requests?${params.toString()}`,
            {
              cache:
                "no-store",
            },
          ),
        );

      setRequests(
        data.requests ?? [],
      );

      setStats(
        data.stats ??
          emptyStats,
      );
    } catch (loadError) {
      setError(
        humanizeError(
          loadError instanceof Error
            ? loadError.message
            : "project_requests_unavailable",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("", status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function openRequest(
    request: ProjectRequest,
  ) {
    setSelected(
      request,
    );

    setInternalNote(
      request.internalNote ??
        "",
    );

    if (
      request.status ===
      "CONVERTED"
    ) {
      setEditStatus(
        "ACCEPTED",
      );
    } else {
      setEditStatus(
        request.status,
      );
    }

    setProjectTitle(
      "",
    );

    setError("");
  }

  function closeDrawer() {
    if (
      saving ||
      converting
    ) {
      return;
    }

    setSelected(
      null,
    );

    setInternalNote(
      "",
    );

    setProjectTitle(
      "",
    );
  }

  async function search(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await load(
      query,
      status,
    );
  }

  async function updateRequest(
    overrideStatus?: EditableStatus,
  ) {
    if (
      !selected ||
      saving ||
      selected.status ===
        "CONVERTED"
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const nextStatus =
      overrideStatus ??
      editStatus;

    try {
      const data =
        await readJson<MutationResponse>(
          await fetch(
            `/api/admin/project-requests/${encodeURIComponent(
              selected.id,
            )}`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  status:
                    nextStatus,

                  internalNote:
                    internalNote.trim() ||
                    null,
                },
              ),
            },
          ),
        );

      if (
        !data.request
      ) {
        throw new Error(
          "invalid_server_response",
        );
      }

      setSelected(
        data.request,
      );

      setEditStatus(
        data.request.status ===
          "CONVERTED"
          ? "ACCEPTED"
          : data.request
              .status,
      );

      setInternalNote(
        data.request
          .internalNote ??
          "",
      );

      await load(
        query,
        status,
      );
    } catch (saveError) {
      setError(
        humanizeError(
          saveError instanceof Error
            ? saveError.message
            : "project_request_update_failed",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function convertRequest() {
    if (
      !selected ||
      selected.status !==
        "ACCEPTED" ||
      converting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "This accepted request will be converted into a real project. Continue?",
      );

    if (!confirmed) {
      return;
    }

    setConverting(true);
    setError("");

    try {
      const data =
        await readJson<MutationResponse>(
          await fetch(
            `/api/admin/project-requests/${encodeURIComponent(
              selected.id,
            )}/convert`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  title:
                    projectTitle.trim() ||
                    null,
                },
              ),
            },
          ),
        );

      if (
        !data.request ||
        !data.project?.id
      ) {
        throw new Error(
          "invalid_server_response",
        );
      }

      setSelected(
        data.request,
      );

      setProjectTitle(
        "",
      );

      await load(
        query,
        status,
      );
    } catch (convertError) {
      setError(
        humanizeError(
          convertError instanceof Error
            ? convertError.message
            : "project_request_conversion_failed",
        ),
      );
    } finally {
      setConverting(false);
    }
  }

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            D1 PROJECT INTAKE
          </span>

          <h2>
            Project Requests
          </h2>

          <p>
            Review custom development
            requests and convert
            accepted work into real
            projects.
          </p>
        </div>

        <button
          type="button"
          className="button buttonGhost"
          onClick={() =>
            void load(
              query,
              status,
            )
          }
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle
              className="spin"
              size={16}
            />
          ) : (
            <RefreshCw
              size={16}
            />
          )}

          Refresh
        </button>
      </div>

      <div className="adminStatGrid">
        <article className="adminStat">
          <small>
            Total requests
          </small>

          <strong>
            {stats.total}
          </strong>

          <span>
            D1 intake
          </span>
        </article>

        <article className="adminStat">
          <small>
            Waiting review
          </small>

          <strong>
            {stats.submitted}
          </strong>

          <span>
            Submitted
          </span>
        </article>

        <article className="adminStat">
          <small>
            In review
          </small>

          <strong>
            {stats.reviewing}
          </strong>

          <span>
            Reviewing
          </span>
        </article>

        <article className="adminStat">
          <small>
            Converted
          </small>

          <strong>
            {stats.converted}
          </strong>

          <span>
            Real projects
          </span>
        </article>
      </div>

      <form
        className="adminToolbar"
        onSubmit={search}
      >
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
            maxLength={200}
            placeholder="Name, email, Telegram, organization, request ID..."
          />
        </label>

        <select
          value={status}
          onChange={(
            event,
          ) =>
            setStatus(
              event.target
                .value as
                | "ALL"
                | ProjectRequestStatus,
            )
          }
        >
          {statusOptions.map(
            (option) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>

        <button
          type="submit"
          className="adminIconBtn"
          title="Search"
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle
              className="spin"
              size={16}
            />
          ) : (
            <Search
              size={16}
            />
          )}
        </button>
      </form>

      {error ? (
        <div className="adminInlineError">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="adminLoading">
          <LoaderCircle className="spin" />

          Project requests are loading
          from D1...
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>
                  Request
                </th>

                <th>
                  Contact
                </th>

                <th>
                  Platform
                </th>

                <th>
                  Status
                </th>

                <th>
                  Created
                </th>

                <th />
              </tr>
            </thead>

            <tbody>
              {requests.map(
                (request) => (
                  <tr
                    key={
                      request.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          request.projectType
                        }
                      </strong>

                      <small>
                        {shortId(
                          request.id,
                        )}
                        <br />

                        {request.organizationName ??
                          "Individual request"}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {
                          request.contactName
                        }
                      </strong>

                      <small>
                        {request.contactEmail ??
                          request.contactTelegram ??
                          "—"}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {request
                          .platforms
                          .length
                          ? request.platforms.join(
                              ", ",
                            )
                          : "—"}
                      </strong>

                      <small>
                        {request.targetTiming ??
                          "No timing"}
                      </small>
                    </td>

                    <td>
                      <span
                        className={`adminStatus ${
                          statusIsPositive(
                            request.status,
                          )
                            ? "good"
                            : ""
                        }`}
                      >
                        {
                          request.status
                        }
                      </span>
                    </td>

                    <td>
                      <strong>
                        {formatDate(
                          request.createdAt,
                        )}
                      </strong>

                      <small>
                        {
                          request.source
                        }
                      </small>
                    </td>

                    <td>
                      <div className="adminRowActions">
                        <button
                          type="button"
                          title="Open request"
                          onClick={() =>
                            openRequest(
                              request,
                            )
                          }
                        >
                          <Eye
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

          {!requests.length ? (
            <div className="adminEmpty">
              No project requests match
              the current filter.
            </div>
          ) : null}
        </div>
      )}

      {selected ? (
        <div
          className="adminDrawerBackdrop"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeDrawer();
            }
          }}
        >
          <div className="adminDrawer">
            <div className="adminDrawerHead">
              <div>
                <span className="eyebrow">
                  PROJECT REQUEST
                </span>

                <h3>
                  {
                    selected.projectType
                  }
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  closeDrawer
                }
                disabled={
                  saving ||
                  converting
                }
              >
                <X />
              </button>
            </div>

            <div className="adminFormGrid">
              <label>
                <span>
                  Request ID
                </span>

                <input
                  value={
                    selected.id
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Source
                </span>

                <input
                  value={
                    selected.source
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Contact name
                </span>

                <input
                  value={
                    selected.contactName
                  }
                  readOnly
                />
              </label>

              <label>
                <span>
                  Organization
                </span>

                <input
                  value={
                    selected.organizationName ??
                    ""
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label>
                <span>
                  Email
                </span>

                <input
                  value={
                    selected.contactEmail ??
                    ""
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label>
                <span>
                  Telegram
                </span>

                <input
                  value={
                    selected.contactTelegram ??
                    ""
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label>
                <span>
                  Timing
                </span>

                <input
                  value={
                    selected.targetTiming ??
                    ""
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label>
                <span>
                  Budget stage
                </span>

                <input
                  value={
                    selected.budgetStage ??
                    ""
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label className="wide">
                <span>
                  Platforms
                </span>

                <input
                  value={
                    selected.platforms.join(
                      ", ",
                    )
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label className="wide">
                <span>
                  Project description
                </span>

                <textarea
                  rows={8}
                  value={
                    selected.description
                  }
                  readOnly
                />
              </label>

              {selected.status !==
              "CONVERTED" ? (
                <>
                  <label>
                    <span>
                      Status
                    </span>

                    <select
                      value={
                        editStatus
                      }
                      disabled={
                        saving ||
                        converting
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditStatus(
                          event.target
                            .value as EditableStatus,
                        )
                      }
                    >
                      {editableStatuses.map(
                        (
                          option,
                        ) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    <span>
                      Reviewed
                    </span>

                    <input
                      value={formatDate(
                        selected.reviewedAt,
                      )}
                      readOnly
                    />
                  </label>

                  <label className="wide">
                    <span>
                      Internal note
                    </span>

                    <textarea
                      rows={6}
                      maxLength={
                        10000
                      }
                      value={
                        internalNote
                      }
                      disabled={
                        saving ||
                        converting
                      }
                      onChange={(
                        event,
                      ) =>
                        setInternalNote(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Private review note for SysOne..."
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    <span>
                      Status
                    </span>

                    <input
                      value="CONVERTED"
                      readOnly
                    />
                  </label>

                  <label>
                    <span>
                      Converted
                    </span>

                    <input
                      value={formatDate(
                        selected.convertedAt,
                      )}
                      readOnly
                    />
                  </label>

                  <label className="wide">
                    <span>
                      Project ID
                    </span>

                    <input
                      value={
                        selected.projectId ??
                        ""
                      }
                      readOnly
                    />
                  </label>

                  <label className="wide">
                    <span>
                      Internal note
                    </span>

                    <textarea
                      rows={6}
                      value={
                        selected.internalNote ??
                        ""
                      }
                      readOnly
                    />
                  </label>
                </>
              )}

              {selected.status ===
              "ACCEPTED" ? (
                <label className="wide">
                  <span>
                    Project title for
                    conversion
                  </span>

                  <input
                    maxLength={
                      200
                    }
                    value={
                      projectTitle
                    }
                    disabled={
                      converting ||
                      saving
                    }
                    onChange={(
                      event,
                    ) =>
                      setProjectTitle(
                        event.target
                          .value,
                      )
                    }
                    placeholder={`${selected.projectType} — ${selected.contactName}`}
                  />
                </label>
              ) : null}
            </div>

            {error ? (
              <div className="adminInlineError">
                {error}
              </div>
            ) : null}

            <div className="adminDrawerFoot">
              {selected.status !==
              "CONVERTED" ? (
                <>
                  {selected.status !==
                  "REJECTED" ? (
                    <button
                      type="button"
                      className="button buttonGhost"
                      disabled={
                        saving ||
                        converting
                      }
                      onClick={() =>
                        void updateRequest(
                          "REJECTED",
                        )
                      }
                    >
                      <XCircle
                        size={16}
                      />

                      Reject
                    </button>
                  ) : null}

                  {selected.status !==
                  "ACCEPTED" ? (
                    <button
                      type="button"
                      className="button buttonGhost"
                      disabled={
                        saving ||
                        converting
                      }
                      onClick={() =>
                        void updateRequest(
                          "ACCEPTED",
                        )
                      }
                    >
                      <CheckCircle2
                        size={16}
                      />

                      Accept
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="button buttonPrimary"
                    disabled={
                      saving ||
                      converting
                    }
                    onClick={() =>
                      void updateRequest()
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

                    Save review
                  </button>
                </>
              ) : null}

              {selected.status ===
              "ACCEPTED" ? (
                <button
                  type="button"
                  className="button buttonPrimary"
                  disabled={
                    saving ||
                    converting
                  }
                  onClick={() =>
                    void convertRequest()
                  }
                >
                  {converting ? (
                    <LoaderCircle
                      className="spin"
                      size={16}
                    />
                  ) : (
                    <ArrowRight
                      size={16}
                    />
                  )}

                  Convert to project
                </button>
              ) : null}

              {selected.status ===
              "CONVERTED" ? (
                <button
                  type="button"
                  className="button buttonGhost"
                  onClick={
                    closeDrawer
                  }
                >
                  Close
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}