import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getUserSupportTicketById,
} from "@/lib/server/support-tickets";
import {
  getCurrentUser,
} from "@/lib/server/user-auth";

export const dynamic =
  "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "uz-UZ",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

export default async function SupportTicketPage(
  { params }: PageProps,
) {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const ticket =
    await getUserSupportTicketById(
      id,
      user.id,
    );

  if (!ticket) {
    notFound();
  }

  return (
    <div className="pageWrap">
      <section className="shell supportTicketDetail">
        <Link
          className="textLink"
          href="/account#support"
        >
          <ArrowLeft size={15} />
          Back to account
        </Link>

        <div className="supportTicketHead">
          <div>
            <span className="eyebrow">
              SUPPORT TICKET
            </span>
            <h1>{ticket.subject}</h1>
            <p>{ticket.id}</p>
          </div>

          <span
            className={`statusPill ${
              ticket.status ===
              "RESOLVED"
                ? "resolved"
                : ""
            }`}
          >
            {ticket.status}
          </span>
        </div>

        <div className="supportTicketMeta">
          <article className="surface">
            <MessageSquare />
            <span>
              <small>Category</small>
              <strong>
                {ticket.category ??
                  "General support"}
              </strong>
            </span>
          </article>

          <article className="surface">
            <ShieldCheck />
            <span>
              <small>Priority</small>
              <strong>
                {ticket.priority}
              </strong>
            </span>
          </article>

          <article className="surface">
            <Clock3 />
            <span>
              <small>Updated</small>
              <strong>
                {formatDate(
                  ticket.updatedAt,
                )}
              </strong>
            </span>
          </article>
        </div>

        <section className="surface supportConversation">
          <div className="panelHead">
            <div>
              <span className="eyebrow">
                CONVERSATION
              </span>
              <h2>Ticket history</h2>
            </div>
            <span>
              {ticket.messages?.length ?? 0}
              {" messages"}
            </span>
          </div>

          <div className="supportConversationList">
            {(ticket.messages ?? []).map(
              (message) => (
                <article
                  className={
                    message.authorType ===
                    "ADMIN"
                      ? "fromSupport"
                      : "fromUser"
                  }
                  key={message.id}
                >
                  <span>
                    <strong>
                      {message.authorType ===
                      "ADMIN"
                        ? "SysOne Support"
                        : user.name}
                    </strong>
                    <small>
                      {formatDate(
                        message.createdAt,
                      )}
                    </small>
                  </span>
                  <p>{message.body}</p>
                </article>
              ),
            )}
          </div>

          {ticket.status ===
          "RESOLVED" ? (
            <div className="successNote">
              <CheckCircle2 />
              This ticket is resolved.
            </div>
          ) : null}
        </section>
      </section>
    </div>
  );
}
