import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";
import { T } from "@/components/T";
import { normalizeAuthReturnTo } from "@/lib/auth-return";

type LoginPageProps = {
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const requestedReturnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;
  const returnTo = normalizeAuthReturnTo(requestedReturnTo);
  const encodedReturnTo = encodeURIComponent(returnTo);
  const googleHref = `/api/auth/google?returnTo=${encodedReturnTo}`;
  const telegramHref = `/api/auth/telegram?returnTo=${encodedReturnTo}`;

  return (
    <div className="v3AuthPage">
      <div className="shell v3AuthLayout">
        <section className="v3AuthStory">
          <div className="v3AuthBrand">
            <Image
              src="/brand/sysone-symbol.webp"
              width={78}
              height={78}
              alt="SysOne"
              priority
            />
            <span>SYSONE ID</span>
          </div>
          <h1>
            <T id="login.oneIdentity" />
            <br />
            <T id="login.everyProduct" />
          </h1>
          <p>
            <T id="login.description" />
          </p>
          <div className="v3AuthBenefits">
            <span>
              <Box size={18} />
              <T id="login.library" />
            </span>
            <span>
              <KeyRound size={18} />
              <T id="login.license" />
            </span>
            <span>
              <LifeBuoy size={18} />
              <T id="login.supportHistory" />
            </span>
          </div>
        </section>

        <section className="v3AuthPanel">
          <span className="v3AuthSecurity">
            <ShieldCheck size={16} />
            <T id="login.secure" />
          </span>
          <h2>
            <T id="login.continue" />
          </h2>
          <p>
            <T id="login.chooseProvider" />
          </p>

          <div className="v3AuthMethods">
            <a className="button buttonPrimary" href={googleHref}>
              <span className="googleMark">G</span>
              <T id="login.google" />
              <ArrowRight size={16} />
            </a>
            <a className="button buttonGhost" href={telegramHref}>
              <Send size={17} />
              <T id="login.telegram" />
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="v3SecureNote">
            <LockKeyhole size={17} />
            <span>
              <T id="login.securityNote" />
            </span>
          </div>

          <small className="v3AuthLegal">
            <T id="login.agree" />{" "}
            <Link href="/legal/terms">
              <T id="common.terms" />
            </Link>{" "}
            <T id="login.and" />{" "}
            <Link href="/legal/privacy">
              <T id="login.privacyPolicy" />
            </Link>
            .
          </small>
        </section>
      </div>
    </div>
  );
}
