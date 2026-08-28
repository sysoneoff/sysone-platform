"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowUpRight,
  Bot,
  Box,
  Gamepad2,
  Headphones,
  LayoutGrid,
  Search,
  UserRound,
} from "lucide-react";

import { useRouter } from "next/navigation";

type NavigationItem = {
  label: string;
  description: string;
  href: string;
  keywords: string[];
  icon:
    | "store"
    | "software"
    | "games"
    | "ai"
    | "support"
    | "account";
};

const items: NavigationItem[] = [
  {
    label: "Store",
    description:
      "Browse all published SysOne products",
    href: "/marketplace",
    keywords: [
      "store",
      "marketplace",
      "products",
      "digital",
    ],
    icon: "store",
  },
  {
    label: "Software",
    description:
      "Browse software published by SysOne",
    href: "/products",
    keywords: [
      "software",
      "apps",
      "applications",
      "products",
    ],
    icon: "software",
  },
  {
    label: "Games",
    description:
      "Browse games from SysOne Games",
    href: "/games",
    keywords: [
      "games",
      "gaming",
      "sysone games",
    ],
    icon: "games",
  },
  {
    label: "AI",
    description:
      "Explore the SysOne AI section",
    href: "/ai",
    keywords: [
      "ai",
      "artificial intelligence",
      "tools",
    ],
    icon: "ai",
  },
  {
    label: "Support",
    description:
      "Open SysOne support",
    href: "/support",
    keywords: [
      "support",
      "help",
      "assistance",
    ],
    icon: "support",
  },
  {
    label: "Account",
    description:
      "Open your SysOne account",
    href: "/account",
    keywords: [
      "account",
      "profile",
      "library",
      "downloads",
    ],
    icon: "account",
  },
];

function ItemIcon({
  type,
}: {
  type: NavigationItem["icon"];
}) {
  if (type === "store") {
    return <LayoutGrid size={17} />;
  }

  if (type === "software") {
    return <Box size={17} />;
  }

  if (type === "games") {
    return <Gamepad2 size={17} />;
  }

  if (type === "ai") {
    return <Bot size={17} />;
  }

  if (type === "support") {
    return <Headphones size={17} />;
  }

  return <UserRound size={17} />;
}

export function CommandPalette() {
  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const router = useRouter();

  useEffect(() => {
    function onKey(
      event: KeyboardEvent,
    ) {
      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();

        setOpen(
          (current) => !current,
        );
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      onKey,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKey,
      );
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return items;
    }

    return items.filter(
      (item) => {
        const searchable = [
          item.label,
          item.description,
          ...item.keywords,
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          normalized,
        );
      },
    );
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function go(href: string) {
    close();
    router.push(href);
  }

  return (
    <>
      <button
        className="searchButton"
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="Open SysOne quick navigation"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Search size={16} />

        <span>Navigate</span>

        <kbd>⌘ K</kbd>
      </button>

      {open && (
        <div
          className="commandBackdrop"
          onMouseDown={close}
        >
          <div
            className="commandPanel"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-label="SysOne quick navigation"
          >
            <div className="commandInput">
              <Search size={18} />

              <input
                autoFocus
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
                placeholder="Find a SysOne section..."
                aria-label="Filter navigation"
              />
            </div>

            <div className="commandResults">
              {filtered.map(
                (item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() =>
                      go(item.href)
                    }
                  >
                    <span className="commandIcon">
                      <ItemIcon
                        type={
                          item.icon
                        }
                      />
                    </span>

                    <span>
                      <strong>
                        {item.label}
                      </strong>

                      <small>
                        {
                          item.description
                        }
                      </small>
                    </span>

                    <ArrowUpRight
                      size={15}
                    />
                  </button>
                ),
              )}

              {filtered.length ===
                0 && (
                <div className="commandEmpty">
                  No matching navigation
                  item.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}