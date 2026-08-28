"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Headphones,
  LifeBuoy,
  LoaderCircle,
  LogIn,
  Send,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";

const categories = [
  "Technical issue",
  "Account",
  "Download / license",
  "Feedback",
  "Other",
] as const;

type CreatedTicket = {
  id: string;
  status: "OPEN";
  createdAt: string;
};

type SupportResponse = {
  ok: boolean;
  error?: string;
  field?: string | null;
  ticket?: CreatedTicket;
};

function humanizeError(
  error: string,
) {
  switch (error) {
    case "authentication_required":
      return "Sign in with SysOne ID before submitting a support ticket.";
    case "invalid_support_category":
      return "Choose a valid support category.";
    case "invalid_support_subject":
      return "Subject must contain between 6 and 200 characters.";
    case "invalid_support_message":
      return "Message must contain between 20 and 10,000 characters.";
    case "too_many_support_tickets":
      return "Too many tickets were submitted. Wait one hour before trying again.";
    case "invalid_request_origin":
      return "The request origin could not be verified. Reload the page and try again.";
    case "support_ticket_creation_failed":
      return "The ticket could not be saved. Try again shortly.";
    default:
      return "The support request could not be completed.";
  }
}

export default function SupportPage() {
  const [category, setCategory] =
    useState<(typeof categories)[number]>(
      "Technical issue",
    );
  const [subject, setSubject] =
    useState("");
  const [message, setMessage] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState("");
  const [ticket, setTicket] =
    useState<CreatedTicket | null>(
      null,
    );

  async function submitTicket(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");
    setTicket(null);

    try {
      const response =
        await fetch(
          "/api/support-tickets",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              category,
              subject,
              message,
            }),
          },
        );

      const data =
        (await response
          .json()
          .catch(() => ({
            ok: false,
            error:
              "invalid_server_response",
          }))) as SupportResponse;

      if (
        !response.ok ||
        !data.ticket
      ) {
        throw new Error(
          data.error ??
            `request_failed_${response.status}`,
        );
      }

      setTicket(data.ticket);
      setSubject("");
      setMessage("");
    } catch (submitError) {
      setError(
        humanizeError(
          submitError instanceof Error
            ? submitError.message
            : "support_ticket_creation_failed",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pageWrap">
      <section className="pageHero shell">
        <span className="eyebrow">
          SUPPORT CENTER
        </span>

        <h1>
          Real support, connected to
          your SysOne ID.
        </h1>

        <p>
          Submit a structured ticket.
          Its status is stored in D1 and
          remains visible from your
          account.
        </p>
      </section>

      <section className="section compactTop">
        <div className="shell supportGrid">
          <div className="supportOptions">
            <article className="surface">
              <LogIn />

              <h2>SysOne ID required</h2>

              <p>
                Authentication links the
                request to the correct
                account and prevents
                anonymous ticket abuse.
              </p>

              <Link
                className="button buttonGhost"
                href="/login"
              >
                Sign in
              </Link>
            </article>

            <article className="surface">
              <LifeBuoy />

              <h2>Track every ticket</h2>

              <p>
                Open requests and current
                status are available in
                the Support section of
                your account.
              </p>

              <Link
                className="button buttonGhost"
                href="/account#support"
              >
                Open account
              </Link>
            </article>
          </div>

          <form
            className="surface ticketForm"
            onSubmit={submitTicket}
          >
            <Headphones />

            <span className="eyebrow">
              NEW TICKET
            </span>

            <h2>
              Tell us what happened.
            </h2>

            <label>
              Category

              <select
                value={category}
                disabled={submitting}
                onChange={(event) => {
                  setCategory(
                    event.target.value as
                      (typeof categories)[number],
                  );
                  setError("");
                }}
              >
                {categories.map(
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
            </label>

            <label>
              Subject

              <input
                value={subject}
                disabled={submitting}
                minLength={6}
                maxLength={200}
                required
                placeholder="Short summary of the issue"
                onChange={(event) => {
                  setSubject(
                    event.target.value,
                  );
                  setError("");
                }}
              />
            </label>

            <label>
              Message

              <textarea
                rows={8}
                value={message}
                disabled={submitting}
                minLength={20}
                maxLength={10000}
                required
                placeholder="Include what you expected, what happened and any useful details."
                onChange={(event) => {
                  setMessage(
                    event.target.value,
                  );
                  setError("");
                }}
              />
            </label>

            {error ? (
              <div
                className="formError"
                role="alert"
              >
                {error}

                {error.startsWith(
                  "Sign in",
                ) ? (
                  <Link href="/login">
                    Open sign in
                  </Link>
                ) : null}
              </div>
            ) : null}

            <button
              className="button buttonPrimary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle
                  className="spin"
                  size={16}
                />
              ) : (
                <Send size={16} />
              )}

              {submitting
                ? "Submitting..."
                : "Submit ticket"}
            </button>

            {ticket ? (
              <div
                className="successNote"
                role="status"
              >
                <CheckCircle2 />

                <span>
                  <strong>
                    Ticket submitted
                  </strong>

                  <small>
                    ID: {ticket.id}
                  </small>

                  <Link href="/account#support">
                    Track in account
                  </Link>
                </span>
              </div>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  );
}
