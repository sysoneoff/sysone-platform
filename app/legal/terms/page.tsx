import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="legalPage shell">
      <span className="eyebrow">LEGAL</span>
      <h1>Terms of Service</h1>
      <p className="legalLead">
        These Terms are an operational draft for the SysOne platform and its
        current account, project-request, support, entitlement, licensing and
        device-activation features. They require qualified legal review before
        being treated as final jurisdiction-specific terms.
      </p>

      <p>Effective date: September 2, 2026.</p>

      <h2>Using SysOne</h2>
      <p>
        SysOne provides access to information about digital products and
        services and may provide account features, project-request workflows,
        support, software entitlements, license management and device
        activation. Additional product-specific terms can apply when they are
        presented for a particular product or service.
      </p>

      <h2>Accounts</h2>
      <p>
        Some features require a SysOne account. You are responsible for using
        your account through authorized sign-in methods and for protecting
        access to your authenticated sessions. You must not attempt to access
        another user&apos;s account, session, support records or product access.
      </p>

      <h2>Project requests</h2>
      <p>
        You may submit project information and contact details for review by
        SysOne. A project-request submission records your request but does not,
        by itself, establish final project scope, price, delivery date or a
        separate services contract. Any binding commercial terms should be
        confirmed separately when applicable.
      </p>

      <h2>Support</h2>
      <p>
        Signed-in users can submit support tickets. Support conversations may be
        retained with the ticket so SysOne can investigate and respond to the
        request. Users must not use support channels for spam, abuse, unlawful
        content or attempts to compromise the platform.
      </p>

      <h2>Product entitlements</h2>
      <p>
        Product access may be represented by an entitlement associated with a
        SysOne user and product. Entitlements can have start and end dates and
        can be active, suspended, expired or revoked. An entitlement may be
        associated with an order where such an order exists, but the current
        system also permits an entitlement to be granted without an order.
      </p>

      <h2>Software licenses</h2>
      <p>
        A software license can be issued for a valid entitlement. A license may
        have a device limit, an expiry date and a status such as active,
        suspended, expired or revoked. The default technical device limit is one
        device unless a different limit is assigned.
      </p>
      <p>
        License keys are credentials for product activation. You must not
        publish, sell, transfer or share a license key in a way that defeats its
        assigned entitlement, device limit or other product-specific
        restrictions. Attempts to bypass license validation, activation limits
        or access controls are prohibited.
      </p>

      <h2>Device activation</h2>
      <p>
        Activation requires a valid active license and entitlement. A device
        identifier is used to recognize an activated device and is hashed before
        it is stored by the current activation system. Reusing the same
        recognized device can refresh its last-seen information. A new device
        can be refused when the assigned device limit has been reached.
      </p>

      <h2>Payments, checkout and refunds</h2>
      <p>
        These Terms do not state that SysOne currently provides an integrated
        production checkout or automated payment flow. When a paid transaction
        is offered, its price, payment method, refund conditions and any
        transaction-specific terms should be presented or agreed separately.
        No general refund promise is created by this draft.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You must not misuse SysOne, interfere with service operation, attempt
        unauthorized access, abuse APIs or rate limits, distribute malware,
        unlawfully redistribute protected software or content, or use the
        platform to violate applicable law or the rights of others.
      </p>

      <h2>Service and product changes</h2>
      <p>
        SysOne features, product availability and technical requirements can
        change as the platform develops. Material product-specific commitments
        should be documented in the applicable product, license or services
        terms rather than inferred from roadmap or placeholder content.
      </p>

      <h2>Legal terms requiring final review</h2>
      <p>
        Governing law, dispute resolution, mandatory consumer rights,
        jurisdiction-specific warranty language, liability limitations, refund
        rules and any product-specific EULA terms must be finalized with
        qualified legal review before these Terms are approved as final.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms can be submitted through the contact or
        support channels available on the SysOne website.
      </p>
    </div>
  );
}
