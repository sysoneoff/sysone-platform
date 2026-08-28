"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Eye,
  LoaderCircle,
  MessageSquare,
  RefreshCw,
  Save,
  Search,
  Send,
  X,
} from "lucide-react";

type SupportStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

type SupportPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

type SupportMessage = {
  id: string;
  ticketId: string;
  authorUserId: string | null;
  authorType: "USER" | "ADMIN";
  authorName: string | null;
  body: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  productId: string | null;
  productName: string | null;
  category: string | null;
  priority: SupportPriority;
  status: SupportStatus;
  subject: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
};

type SupportStats = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
};

type ListResponse = {
  ok: boolean;
  error?: string;
  tickets?: SupportTicket[];
  stats?: SupportStats;
};

type TicketResponse = {
  ok: boolean;
  error?: string;
  ticket?: SupportTicket;
};

const statusOptions: Array<{
  value: "ALL" | SupportStatus;
  label: string;
}> = [
  {
    value: "ALL",
    label: "All tickets",
  },
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "IN_PROGRESS",
    label: "In progress",
  },
  {
    value: "RESOLVED",
    label: "Resolved",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
];

const priorities: SupportPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "URGENT",
];

const emptyStats: SupportStats = {
  total: 0,
  open: 0,
  inProgress: 0,
  resolved: 0,
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

function humanizeError(
  error: string,
) {
  switch (error) {
    case "unauthorized":
      return "Admin session expired. Reload Control Center and sign in again.";
    case "support_ticket_not_found":
      return "The support ticket was not found.";
    case "support_tickets_unavailable":
      return "Support tickets could not be loaded from D1.";
    case "support_ticket_update_failed":
      return "The ticket could not be updated.";
    case "support_reply_failed":
      return "The reply could not be saved.";
    case "invalid_support_message":
      return "Reply is empty or longer than 10,000 characters.";
    default:
      return error;
  }
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return date.toLocaleString();
}

function shortId(
  value: string,
) {
  return value.length <= 16
    ? value
    : `${value.slice(0, 8)}…${value.slice(-6)}`;
}

export function SupportTicketsManager() {
  const [tickets, setTickets] =
    useState<SupportTicket[]>([]);
  const [stats, setStats] =
    useState<SupportStats>(emptyStats);
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [replying, setReplying] =
    useState(false);
  const [error, setError] =
    useState("");
  const [query, setQuery] =
    useState("");
  const [status, setStatus] =
    useState<"ALL" | SupportStatus>(
      "ALL",
    );
  const [selected, setSelected] =
    useState<SupportTicket | null>(
      null,
    );
  const [editStatus, setEditStatus] =
    useState<SupportStatus>("OPEN");
  const [editPriority, setEditPriority] =
    useState<SupportPriority>(
      "NORMAL",
    );
  const [reply, setReply] =
    useState("");

  async function load(
    searchQuery = query,
    statusFilter = status,
  ) {
    setLoading(true);
    setError("");

    try {
      const params =
        new URLSearchParams({
          status: statusFilter,
          limit: "250",
        });
      const cleanQuery =
        searchQuery.trim();

      if (cleanQuery) {
        params.set("q", cleanQuery);
      }

      const data =
        await readJson<ListResponse>(
          await fetch(
            `/api/admin/support-tickets?${params.toString()}`,
            {
              cache: "no-store",
            },
          ),
        );

      setTickets(data.tickets ?? []);
      setStats(
        data.stats ?? emptyStats,
      );
    } catch (loadError) {
      setError(
        humanizeError(
          loadError instanceof Error
            ? loadError.message
            : "support_tickets_unavailable",
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

  async function openTicket(
    ticket: SupportTicket,
  ) {
    setError("");

    try {
      const data =
        await readJson<TicketResponse>(
          await fetch(
            `/api/admin/support-tickets/${encodeURIComponent(
              ticket.id,
            )}`,
            {
              cache: "no-store",
            },
          ),
        );

      if (!data.ticket) {
        throw new Error(
          "invalid_server_response",
        );
      }

      setSelected(data.ticket);
      setEditStatus(
        data.ticket.status,
      );
      setEditPriority(
        data.ticket.priority,
      );
      setReply("");
    } catch (openError) {
      setError(
        humanizeError(
          openError instanceof Error
            ? openError.message
            : "support_ticket_unavailable",
        ),
      );
    }
  }

  function closeDrawer() {
    if (saving || replying) {
      return;
    }

    setSelected(null);
    setReply("");
  }

  async function searchTickets(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await load(query, status);
  }

  async function saveTicket() {
    if (!selected || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const data =
        await readJson<TicketResponse>(
          await fetch(
            `/api/admin/support-tickets/${encodeURIComponent(
              selected.id,
            )}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                status: editStatus,
                priority: editPriority,
              }),
            },
          ),
        );

      if (!data.ticket) {
        throw new Error(
          "invalid_server_response",
        );
      }

      setSelected(data.ticket);
      setEditStatus(
        data.ticket.status,
      );
      setEditPriority(
        data.ticket.priority,
      );
      await load(query, status);
    } catch (saveError) {
      setError(
        humanizeError(
          saveError instanceof Error
            ? saveError.message
            : "support_ticket_update_failed",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function sendReply(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selected ||
      replying ||
      !reply.trim()
    ) {
      return;
    }

    setReplying(true);
    setError("");

    try {
      const data =
        await readJson<TicketResponse>(
          await fetch(
            `/api/admin/support-tickets/${encodeURIComponent(
              selected.id,
            )}/messages`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                body: reply,
              }),
            },
          ),
        );

      if (!data.ticket) {
        throw new Error(
          "invalid_server_response",
        );
      }

      setSelected(data.ticket);
      setEditStatus(
        data.ticket.status,
      );
      setReply("");
      await load(query, status);
    } catch (replyError) {
      setError(
        humanizeError(
          replyError instanceof Error
            ? replyError.message
            : "support_reply_failed",
        ),
      );
    } finally {
      setReplying(false);
    }
  }

  return (
    <section className="adminWorkspace">
      <div className="adminWorkspaceHead">
        <div>
          <span className="eyebrow">
            D1 SUPPORT OPERATIONS
          </span>

          <h2>Support Tickets</h2>

          <p>
            Review authenticated support
            requests, update operational
            state and keep a real message
            history.
          </p>
        </div>

        <button
          type="button"
          className="button buttonGhost"
          disabled={loading}
          onClick={() =>
            void load(query, status)
          }
        >
          {loading ? (
            <LoaderCircle
              className="spin"
              size={16}
            />
          ) : (
            <RefreshCw size={16} />
          )}

          Refresh
        </button>
      </div>

      <div className="adminStatGrid">
        <article className="adminStat">
          <small>Total tickets</small>
          <strong>{stats.total}</strong>
          <span>D1 records</span>
        </article>

        <article className="adminStat">
          <small>Waiting</small>
          <strong>{stats.open}</strong>
          <span>Open</span>
        </article>

        <article className="adminStat">
          <small>Active</small>
          <strong>
            {stats.inProgress}
          </strong>
          <span>In progress</span>
        </article>

        <article className="adminStat">
          <small>Resolved</small>
          <strong>{stats.resolved}</strong>
          <span>Completed</span>
        </article>
      </div>

      <form
        className="adminToolbar"
        onSubmit={searchTickets}
      >
        <label className="adminSearch">
          <Search size={15} />

          <input
            value={query}
            maxLength={200}
            placeholder="Ticket ID, subject, user or email..."
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
          />
        </label>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value as
                | "ALL"
                | SupportStatus,
            )
          }
        >
          {statusOptions.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
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
          <Search size={16} />
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
          Support tickets are loading
          from D1...
        </div>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>User</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td>
                    <strong>
                      {ticket.subject}
                    </strong>
                    <small>
                      {shortId(ticket.id)}
                      <br />
                      {ticket.category ??
                        "General support"}
                    </small>
                  </td>

                  <td>
                    <strong>
                      {ticket.userName}
                    </strong>
                    <small>
                      {ticket.userEmail ??
                        shortId(
                          ticket.userId,
                        )}
                    </small>
                  </td>

                  <td>
                    <span
                      className={`adminStatus ${
                        ticket.status ===
                        "RESOLVED"
                          ? "good"
                          : ""
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>

                  <td>
                    <strong>
                      {ticket.priority}
                    </strong>
                    <small>
                      {ticket.messageCount}
                      {" messages"}
                    </small>
                  </td>

                  <td>
                    <strong>
                      {formatDate(
                        ticket.updatedAt,
                      )}
                    </strong>
                    <small>
                      Created {formatDate(
                        ticket.createdAt,
                      )}
                    </small>
                  </td>

                  <td>
                    <div className="adminRowActions">
                      <button
                        type="button"
                        title="Open ticket"
                        onClick={() =>
                          void openTicket(
                            ticket,
                          )
                        }
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!tickets.length ? (
            <div className="adminEmpty">
              No support tickets match
              the current filter.
            </div>
          ) : null}
        </div>
      )}

      {selected ? (
        <div
          className="adminDrawerBackdrop"
          onMouseDown={(event) => {
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
                  SUPPORT TICKET
                </span>
                <h3>{selected.subject}</h3>
              </div>

              <button
                type="button"
                disabled={
                  saving || replying
                }
                onClick={closeDrawer}
              >
                <X />
              </button>
            </div>

            <div className="adminFormGrid">
              <label>
                <span>Ticket ID</span>
                <input
                  value={selected.id}
                  readOnly
                />
              </label>

              <label>
                <span>Category</span>
                <input
                  value={
                    selected.category ??
                    "General support"
                  }
                  readOnly
                />
              </label>

              <label>
                <span>User</span>
                <input
                  value={selected.userName}
                  readOnly
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  value={
                    selected.userEmail ?? ""
                  }
                  placeholder="—"
                  readOnly
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={editStatus}
                  disabled={saving}
                  onChange={(event) =>
                    setEditStatus(
                      event.target
                        .value as SupportStatus,
                    )
                  }
                >
                  {statusOptions
                    .filter(
                      (option) =>
                        option.value !==
                        "ALL",
                    )
                    .map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                <span>Priority</span>
                <select
                  value={editPriority}
                  disabled={saving}
                  onChange={(event) =>
                    setEditPriority(
                      event.target
                        .value as SupportPriority,
                    )
                  }
                >
                  {priorities.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <div className="supportMessageThread">
              <div className="supportMessageHead">
                <MessageSquare size={16} />
                <strong>Conversation</strong>
              </div>

              {(selected.messages ?? []).map(
                (messageItem) => (
                  <article
                    className={
                      messageItem.authorType ===
                      "ADMIN"
                        ? "adminMessage"
                        : "userMessage"
                    }
                    key={messageItem.id}
                  >
                    <span>
                      <strong>
                        {messageItem.authorType ===
                        "ADMIN"
                          ? "SysOne Support"
                          : messageItem.authorName ??
                            selected.userName}
                      </strong>
                      <small>
                        {formatDate(
                          messageItem.createdAt,
                        )}
                      </small>
                    </span>
                    <p>{messageItem.body}</p>
                  </article>
                ),
              )}
            </div>

            <form
              className="supportReplyForm"
              onSubmit={sendReply}
            >
              <label>
                <span>Admin reply</span>
                <textarea
                  rows={5}
                  value={reply}
                  maxLength={10000}
                  disabled={replying}
                  placeholder="Write a response that will be stored in the ticket history..."
                  onChange={(event) =>
                    setReply(
                      event.target.value,
                    )
                  }
                />
              </label>

              <button
                type="submit"
                className="button buttonGhost"
                disabled={
                  replying ||
                  !reply.trim()
                }
              >
                {replying ? (
                  <LoaderCircle
                    className="spin"
                    size={16}
                  />
                ) : (
                  <Send size={16} />
                )}
                Save reply
              </button>
            </form>

            {error ? (
              <div className="adminInlineError">
                {error}
              </div>
            ) : null}

            <div className="adminDrawerFoot">
              <button
                type="button"
                className="button buttonGhost"
                disabled={
                  saving || replying
                }
                onClick={closeDrawer}
              >
                Close
              </button>

              <button
                type="button"
                className="button buttonPrimary"
                disabled={
                  saving || replying
                }
                onClick={() =>
                  void saveTicket()
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
                Save ticket
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
