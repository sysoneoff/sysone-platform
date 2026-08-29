"use client";

import {
  BookOpen,
  ChevronRight,
  CircleUserRound,
  Download,
  FileCheck2,
  LifeBuoy,
  Search,
  ShieldCheck,
  Store,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const guideGroups = [
  {
    id: "start",
    title: "Getting started",
    icon: BookOpen,
  },
  {
    id: "store",
    title: "Store and downloads",
    icon: Store,
  },
  {
    id: "account",
    title: "Account and support",
    icon: CircleUserRound,
  },
  {
    id: "platform",
    title: "Platform boundaries",
    icon: ShieldCheck,
  },
] as const;

const guides = [
  {
    id: "browse-catalog",
    group: "start",
    title: "Browse the verified catalog",
    summary:
      "Find products and games published from the live SysOne catalog.",
    keywords: [
      "marketplace",
      "products",
      "games",
      "catalog",
    ],
    steps: [
      "Open Marketplace for the combined catalog, or Products and Games for a focused view.",
      "Open an item to see its current status, platforms and available releases.",
      "Only actions backed by a published release or real request flow are displayed.",
    ],
    action: {
      href: "/marketplace",
      label: "Open Marketplace",
    },
  },
  {
    id: "sysone-id",
    group: "start",
    title: "Create or access a SysOne ID",
    summary:
      "Use a supported identity provider to access account-only resources.",
    keywords: [
      "login",
      "google",
      "telegram",
      "account",
      "identity",
    ],
    steps: [
      "Open Sign in and choose an identity provider that is enabled for the current environment.",
      "Complete the provider authorization flow; SysOne never asks for the provider password directly.",
      "After sign-in, Account shows the identity, entitlements, licenses, downloads and support tickets available to that user.",
    ],
    action: {
      href: "/login",
      label: "Open Sign in",
    },
  },
  {
    id: "project-request",
    group: "start",
    title: "Submit a custom project request",
    summary:
      "Send a structured development brief to the real project-request workflow.",
    keywords: [
      "custom",
      "development",
      "brief",
      "contact",
      "request",
    ],
    steps: [
      "Choose the project type and target platforms.",
      "Describe the current problem, desired result, timing and budget stage.",
      "Provide at least one contact method and submit. The request is stored in D1 for Control Center review.",
    ],
    action: {
      href: "/contact",
      label: "Start project request",
    },
  },
  {
    id: "public-download",
    group: "store",
    title: "Download a public release",
    summary:
      "Download only files attached to a published, publicly available release.",
    keywords: [
      "release",
      "file",
      "download",
      "version",
    ],
    steps: [
      "Open a product and review its current release information.",
      "A public download action appears only when a release file is published for public access.",
      "The download endpoint resolves the stored release record instead of using a placeholder file.",
    ],
    action: {
      href: "/products",
      label: "Browse products",
    },
  },
  {
    id: "private-download",
    group: "store",
    title: "Access a private download",
    summary:
      "Use Account to access files granted through an entitlement or license.",
    keywords: [
      "private",
      "entitlement",
      "license",
      "account",
      "download",
    ],
    steps: [
      "Sign in with the SysOne ID that owns the entitlement or license.",
      "Open Account and review the Downloads section.",
      "Private file requests are authorized server-side for the current user before R2 content is returned.",
    ],
    action: {
      href: "/account",
      label: "Open Account",
    },
  },
  {
    id: "release-integrity",
    group: "store",
    title: "Verify release information",
    summary:
      "Confirm version, channel and checksum data supplied with a release file.",
    keywords: [
      "checksum",
      "sha256",
      "integrity",
      "release notes",
    ],
    steps: [
      "Check that the release belongs to the expected product and channel.",
      "Compare the displayed file size and SHA-256 value when those fields are published.",
      "Do not install a file whose checksum differs from the value published by SysOne.",
    ],
    action: {
      href: "/products",
      label: "View releases",
    },
  },
  {
    id: "account-overview",
    group: "account",
    title: "Understand the Account page",
    summary:
      "Review only the resources associated with the current authenticated user.",
    keywords: [
      "profile",
      "orders",
      "licenses",
      "tickets",
      "security",
    ],
    steps: [
      "Identity shows the account and linked sign-in provider information available to SysOne.",
      "Entitlements, licenses and downloads are loaded from D1 for the authenticated user.",
      "Support tickets link to their private message history and current status.",
    ],
    action: {
      href: "/account",
      label: "Open Account",
    },
  },
  {
    id: "support-ticket",
    group: "account",
    title: "Create and track a support ticket",
    summary:
      "Send a real ticket, then follow its status and administrator replies.",
    keywords: [
      "help",
      "issue",
      "ticket",
      "reply",
      "technical",
    ],
    steps: [
      "Sign in, then open Support and select the closest issue category.",
      "Enter a specific subject and enough detail to reproduce or understand the issue.",
      "After submission, open Account to track status and read the full conversation.",
    ],
    action: {
      href: "/support",
      label: "Open Support",
    },
  },
  {
    id: "public-api-status",
    group: "platform",
    title: "Public API status",
    summary:
      "SysOne does not currently advertise public API keys or webhook access.",
    keywords: [
      "api",
      "developer",
      "keys",
      "webhooks",
      "integration",
    ],
    steps: [
      "The website uses internal application routes for its own authenticated workflows.",
      "Those routes are not a public compatibility contract and must not be treated as a third-party API.",
      "Public API documentation will be published only after authentication, versioning, rate limits and support policy are finalized.",
    ],
  },
  {
    id: "ai-status",
    group: "platform",
    title: "SysOne AI availability",
    summary:
      "The brief builder is available now; model-backed assistants remain planned.",
    keywords: [
      "ai",
      "assistant",
      "planner",
      "roadmap",
      "availability",
    ],
    steps: [
      "The current brief builder runs deterministic logic in the browser and makes no AI model call.",
      "Catalog search, documentation answers and support-assistant modules remain roadmap items.",
      "Future AI features must show their source scope and require normal authorization for every protected action.",
    ],
    action: {
      href: "/ai",
      label: "View AI roadmap",
    },
  },
] as const;

export function DocsExplorer() {
  const [query, setQuery] =
    useState("");

  const normalizedQuery =
    query.trim().toLowerCase();

  const filteredGuides = useMemo(
    () =>
      guides.filter((guide) => {
        if (!normalizedQuery) {
          return true;
        }

        const searchable = [
          guide.title,
          guide.summary,
          ...guide.keywords,
          ...guide.steps,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          normalizedQuery,
        );
      }),
    [normalizedQuery],
  );

  return (
    <div className="pageWrap">
      <section className="pageHero shell docsHero">
        <span className="eyebrow">
          VERIFIED DOCUMENTATION
        </span>

        <h1>
          Answers tied to real
          SysOne workflows.
        </h1>

        <p>
          Search practical guides for
          accounts, products,
          downloads, licenses and
          support. Roadmap features
          are labelled clearly.
        </p>

        <label className="docsSearch surface">
          <Search aria-hidden="true" />

          <span className="srOnly">
            Search documentation
          </span>

          <input
            type="search"
            value={query}
            placeholder="Search accounts, downloads, support..."
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
          />

          <small>
            {filteredGuides.length} guide
            {filteredGuides.length === 1
              ? ""
              : "s"}
          </small>
        </label>
      </section>

      <section className="section compactTop">
        <div className="shell docsExplorer">
          {guideGroups.map(
            ({ id, title, icon: Icon }) => {
              const groupGuides =
                filteredGuides.filter(
                  (guide) =>
                    guide.group === id,
                );

              if (!groupGuides.length) {
                return null;
              }

              return (
                <section
                  className="docsGroup"
                  key={id}
                >
                  <header>
                    <span className="iconChip">
                      <Icon />
                    </span>

                    <div>
                      <h2>{title}</h2>
                      <small>
                        {groupGuides.length} verified
                        {groupGuides.length === 1
                          ? " guide"
                          : " guides"}
                      </small>
                    </div>
                  </header>

                  <div className="docsArticleList">
                    {groupGuides.map((guide) => (
                      <details
                        className="docsArticle surface"
                        key={guide.id}
                      >
                        <summary>
                          <span>
                            <strong>
                              {guide.title}
                            </strong>

                            <small>
                              {guide.summary}
                            </small>
                          </span>

                          <ChevronRight />
                        </summary>

                        <div className="docsArticleBody">
                          <ol>
                            {guide.steps.map(
                              (step) => (
                                <li key={step}>
                                  {step}
                                </li>
                              ),
                            )}
                          </ol>

                          {"action" in guide ? (
                            <Link
                              className="textLink"
                              href={guide.action.href}
                            >
                              {guide.action.label}
                              <ChevronRight />
                            </Link>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              );
            },
          )}

          {!filteredGuides.length ? (
            <div className="docsEmpty surface">
              <FileCheck2 />

              <h2>No matching guide</h2>

              <p>
                Try a broader term or send
                the issue through the real
                support workflow.
              </p>

              <div>
                <button
                  type="button"
                  className="button buttonGhost"
                  onClick={() => setQuery("")}
                >
                  Clear search
                </button>

                <Link
                  href="/support"
                  className="button buttonPrimary"
                >
                  <LifeBuoy />
                  Open Support
                </Link>
              </div>
            </div>
          ) : null}

          <div className="docsTrustNote surface">
            <Workflow />

            <div>
              <strong>
                Documentation policy
              </strong>

              <p>
                A guide is published here
                only when its linked route
                and server workflow exist.
                Planned capabilities are
                identified as planned.
              </p>
            </div>

            <Download aria-hidden="true" />
          </div>
        </div>
      </section>
    </div>
  );
}
