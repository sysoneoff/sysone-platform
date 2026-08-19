"use client";

import { FormEvent, useState } from "react";
import { KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";

export function ControlCenterLogin() {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error === "admin_not_configured" ? "Admin siri serverda hali sozlanmagan." : "Kirish siri noto‘g‘ri.");
        return;
      }
      window.location.reload();
    } catch {
      setError("Server bilan bog‘lanib bo‘lmadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginCard">
        <div className="adminLoginMark"><img src="/brand/sysone-symbol.webp" alt="SysOne" /></div>
        <span className="eyebrow"><ShieldCheck size={14}/> PRIVATE CONTROL CENTER</span>
        <h1>Owner access</h1>
        <p>SysOne boshqaruv markazi server-side session va HttpOnly cookie bilan himoyalangan.</p>
        <form onSubmit={submit} className="adminLoginForm">
          <label>
            <span>Admin secret</span>
            <div className="adminSecretInput"><KeyRound size={17}/><input type="password" value={secret} onChange={(event)=>setSecret(event.target.value)} autoComplete="current-password" placeholder="••••••••••••••••••••" required /></div>
          </label>
          {error ? <div className="adminLoginError"><LockKeyhole size={15}/>{error}</div> : null}
          <button className="button buttonPrimary adminLoginButton" disabled={loading || !secret}>
            {loading ? <LoaderCircle className="spin" size={17}/> : <LockKeyhole size={17}/>} Kirish
          </button>
        </form>
        <small>Secret brauzer xotirasiga saqlanmaydi.</small>
      </section>
    </main>
  );
}
