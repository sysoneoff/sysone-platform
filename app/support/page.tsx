"use client";

import Link from "next/link";
import { CheckCircle2, Headphones, LifeBuoy, LoaderCircle, LogIn, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import type { TranslationKey } from "@/lib/i18n";

const categories = [
  { value: "Technical issue", labelKey: "support.category.technical" },
  { value: "Account", labelKey: "support.category.account" },
  { value: "Download / license", labelKey: "support.category.download" },
  { value: "Feedback", labelKey: "support.category.feedback" },
  { value: "Other", labelKey: "support.category.other" },
] as const satisfies readonly { value: string; labelKey: TranslationKey }[];

type SupportCategory = (typeof categories)[number]["value"];
type CreatedTicket = { id: string; status: "OPEN"; createdAt: string };
type SupportResponse = { ok: boolean; error?: string; field?: string | null; ticket?: CreatedTicket };

function errorKey(error: string): TranslationKey {
  switch (error) {
    case "authentication_required": return "support.error.authentication";
    case "invalid_support_category": return "support.error.category";
    case "invalid_support_subject": return "support.error.subject";
    case "invalid_support_message": return "support.error.message";
    case "too_many_support_tickets": return "support.error.tooMany";
    case "invalid_request_origin": return "support.error.origin";
    case "support_ticket_creation_failed": return "support.error.save";
    default: return "support.error.default";
  }
}

export default function SupportPage() {
  const { t } = useI18n();
  const [category, setCategory] = useState<SupportCategory>("Technical issue");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<CreatedTicket | null>(null);

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true); setError(""); setTicket(null);
    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = (await response.json().catch(() => ({ ok: false, error: "invalid_server_response" }))) as SupportResponse;
      if (!response.ok || !data.ticket) throw new Error(data.error ?? `request_failed_${response.status}`);
      setTicket(data.ticket); setSubject(""); setMessage("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "support_ticket_creation_failed");
    } finally { setSubmitting(false); }
  }

  return <div className="pageWrap">
    <section className="pageHero shell">
      <span className="eyebrow">{t("support.kicker")}</span>
      <h1>{t("support.hero")}</h1>
      <p>{t("support.description")}</p>
    </section>

    <section className="section compactTop"><div className="shell supportGrid">
      <div className="supportOptions">
        <article className="surface"><LogIn/><h2>{t("support.idRequired")}</h2><p>{t("support.idRequiredText")}</p><Link className="button buttonGhost" href="/login">{t("support.signIn")}</Link></article>
        <article className="surface"><LifeBuoy/><h2>{t("support.trackEvery")}</h2><p>{t("support.trackEveryText")}</p><Link className="button buttonGhost" href="/account#support">{t("support.openAccount")}</Link></article>
      </div>

      <form className="surface ticketForm" onSubmit={submitTicket}>
        <Headphones/><span className="eyebrow">{t("support.newTicket")}</span><h2>{t("support.tellUs")}</h2>
        <label>{t("support.category")}
          <select value={category} disabled={submitting} onChange={(event)=>{setCategory(event.target.value as SupportCategory);setError("")}}>
            {categories.map((item)=><option key={item.value} value={item.value}>{t(item.labelKey)}</option>)}
          </select>
        </label>
        <label>{t("support.subject")}
          <input value={subject} disabled={submitting} minLength={6} maxLength={200} required placeholder={t("support.subjectPlaceholder")} onChange={(event)=>{setSubject(event.target.value);setError("")}}/>
        </label>
        <label>{t("support.message")}
          <textarea rows={8} value={message} disabled={submitting} minLength={20} maxLength={10000} required placeholder={t("support.messagePlaceholder")} onChange={(event)=>{setMessage(event.target.value);setError("")}}/>
        </label>
        {error?<div className="formError" role="alert">{t(errorKey(error))}{error==="authentication_required"?<Link href="/login">{t("support.openSignIn")}</Link>:null}</div>:null}
        <button className="button buttonPrimary" type="submit" disabled={submitting}>
          {submitting?<LoaderCircle className="spin" size={16}/>:<Send size={16}/>}
          {submitting?t("support.submitting"):t("support.submit")}
        </button>
        {ticket?<div className="successNote" role="status"><CheckCircle2/><span><strong>{t("support.ticketSubmitted")}</strong><small>ID: {ticket.id}</small><Link href="/account#support">{t("support.trackAccount")}</Link></span></div>:null}
      </form>
    </div></section>
  </div>;
}
