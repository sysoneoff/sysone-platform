import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="legalPage shell">
      <span className="eyebrow">LEGAL</span>
      <h1>Privacy Policy</h1>
      <p className="legalLead">
        This operational draft describes how SysOne currently handles information
        across accounts, Google and Telegram authentication, sessions, project
        requests, support, product entitlements,
        software licenses and device activation. It requires qualified legal
        review before being treated as final legal advice or a jurisdiction-
        specific compliance statement.
      </p>

      <p>Operational draft updated: September 3, 2026.</p>

      <h2>Information used for accounts</h2>
      <p>
        When you sign in through a supported identity provider, SysOne may
        receive and store account identifiers and profile information needed to
        create and operate your account. Depending on the provider, this can
        include your name, email address, profile image, locale, username and
        provider-specific account identifier.
      </p>

      <h2>Google and Telegram sign-in</h2>
      <p>
        Google sign-in requests OpenID, email and profile access and may provide
        a provider account identifier, verified email address, name, profile
        picture and locale. Telegram sign-in requests OpenID and profile access
        and may provide a Telegram account identifier, name, profile picture and
        username.
      </p>

      <h2>Sessions and account security</h2>
      <p>
        SysOne creates authenticated sessions so you can remain signed in.
        Server-side session records include a user reference, hashed session token,
        optional device label, IP-derived hash, creation time and expiration time.
        Raw session tokens are not stored in the session table. The SysOne session
        cookie is HTTP-only, uses SameSite protection and is marked Secure in
        production. Temporary OAuth transaction cookies are used while Google or
        Telegram sign-in is in progress.
      </p>

      <h2>Project requests</h2>
      <p>
        If you submit a project request, SysOne stores the project type,
        selected platforms, project description, target timing, budget stage,
        contact name, contact email when provided, Telegram username when
        provided, organization name when provided, request status, timestamps
        and, when you are signed in, your SysOne user identifier.
      </p>

      <h2>Support</h2>
      <p>
        Support tickets are linked to the signed-in user. SysOne stores the
        support category, subject, message content, ticket status and priority,
        timestamps and the conversation between the user and support
        administrators. Account name and email information may be shown to
        authorized administrators together with the ticket so the request can
        be handled.
      </p>

      <h2>Product access, licenses and devices</h2>
      <p>
        SysOne can store product entitlement and license records that associate
        a user with a product, including entitlement and license status,
        activation periods, expiry information and device limits. Raw software
        license keys are not stored in the license database; a cryptographic
        hash of the license key is stored instead.
      </p>
      <p>
        During software activation, the client provides a device identifier and
        may provide a device label. SysOne hashes the device identifier before
        storing it. Device activation records can contain the license
        association, hashed device identifier, optional device label,
        activation time and last-seen time.
      </p>

      <h2>Network and abuse-prevention data</h2>
      <p>
        Network information such as an IP address may be processed for security,
        rate limiting and abuse prevention. Activation and project-request
        endpoints use network-derived rate-limit keys. Security systems may
        transform identifiers into hashes where the current implementation
        supports doing so.
      </p>

      <h2>Local preferences</h2>
      <p>
        SysOne may store interface preferences in your browser. For example, the
        selected language can be stored locally so the site can restore that
        preference on later visits.
      </p>

      <h2>Infrastructure and external sign-in providers</h2>
      <p>
        SysOne uses Cloudflare-hosted infrastructure for application delivery
        and data services. Google and Telegram are used as external sign-in
        providers when you choose those methods. Those providers process
        information under their own terms and privacy practices.
      </p>

      <h2>Retention</h2>
      <p>
        The current implementation does not define one automatic retention
        period that applies to every category of record. Account, support,
        project, entitlement, license and device records may therefore remain
        available to the service until removed or changed through the
        applicable operational process. A final retention schedule should be
        established during legal and operational review.
      </p>

      <h2>Your requests and choices</h2>
      <p>
        You can contact SysOne through the site&apos;s contact or support
        channels with questions about information associated with your account.
        The availability and scope of access, correction, deletion, export or
        other privacy rights depend on applicable law and the controls available
        in the service at the time of the request. This policy does not claim
        that an automated export or deletion tool is currently available.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        This page may be updated as SysOne features, data flows and legal
        requirements change. Material operational changes should be reflected
        here before this draft is approved for indexing or treated as final.
      </p>

      <h2>Legal review</h2>
      <p>
        This policy is an operationally grounded draft, not a substitute for
        advice from a qualified lawyer. Applicable requirements can vary by
        country and by the location of SysOne users or customers.
      </p>
    </div>
  );
}
