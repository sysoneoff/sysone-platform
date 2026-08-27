import Image from "next/image";
import Link from "next/link";
import {
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react";

export default function LoginPage() {
  return (
    <div className="authWrap">
      <section className="authCard surface">
        <Image
          src="/brand/sysone-symbol.webp"
          width={82}
          height={82}
          alt="SysOne"
        />

        <span className="eyebrow">
          SYSONE ID
        </span>

        <h1>
          One account for products, games and projects.
        </h1>

        <p>
          Sign in securely with your Google account.
          Telegram authentication will be available next.
        </p>

        <div className="authMethods">
          <a
            className="button buttonPrimary"
            href="/api/auth/google"
          >
            <span className="googleMark">G</span>
            Continue with Google
          </a>

          <button
            className="button buttonGhost"
            disabled
            title="Telegram sign-in will be enabled in the next authentication stage"
          >
            <span className="telegramMark">↗</span>
            Telegram — coming next
          </button>

          <div className="authDivider">
            <span>future options</span>
          </div>

          <button
            className="button buttonGhost"
            disabled
          >
            <Mail />
            Email OTP
          </button>

          <button
            className="button buttonGhost"
            disabled
          >
            <KeyRound />
            Passkey
          </button>
        </div>

        <div className="secureRow">
          <LockKeyhole />
          Google authentication uses secure OAuth,
          PKCE and SysOne sessions.
        </div>

        <small>
          By continuing, you agree to the{" "}
          <Link href="/legal/terms">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy">
            Privacy Policy
          </Link>
          .
        </small>
      </section>
    </div>
  );
}