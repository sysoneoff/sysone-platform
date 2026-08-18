export type Platform = "Web" | "Windows" | "Android" | "iOS" | "Cloud";

export type Product = {
  slug: string;
  name: string;
  kicker: string;
  description: string;
  category: string;
  price: string;
  featured?: boolean;
  platforms: Platform[];
  version: string;
  status: "Available" | "Beta" | "Coming soon";
  accent: "blue" | "violet" | "cyan" | "silver";
  features: string[];
};

export type Game = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  genre: string;
  platforms: Platform[];
  status: "Playable" | "In development" | "Coming soon";
  featured?: boolean;
  accent: "blue" | "violet" | "cyan";
  features: string[];
};

export const products: Product[] = [
  {
    slug: "zeta-security",
    name: "Zeta Security",
    kicker: "Windows performance & care",
    description: "A focused Windows utility for cleanup, startup control, performance tuning and system health.",
    category: "Desktop Software",
    price: "Free / Pro",
    featured: true,
    platforms: ["Windows"],
    version: "3.2",
    status: "Beta",
    accent: "cyan",
    features: ["Smart cleanup", "Startup control", "Game booster", "Health dashboard", "Offline-first"]
  },
  {
    slug: "onecast",
    name: "OneCast Studio",
    kicker: "Lightweight screen recording",
    description: "A streamlined recording experience designed for smooth capture even on modest hardware.",
    category: "Creator Tools",
    price: "Free / Pro",
    featured: true,
    platforms: ["Windows"],
    version: "0.9",
    status: "Beta",
    accent: "blue",
    features: ["Adaptive capture", "Live preview", "Audio recording", "Library", "Minimal mode"]
  },
  {
    slug: "hujjat-plus",
    name: "Hujjat+",
    kicker: "Document automation",
    description: "Structured document generation for repeatable Word and PDF workflows with reusable templates.",
    category: "Business Tools",
    price: "Custom",
    featured: true,
    platforms: ["Web", "Windows"],
    version: "1.0",
    status: "Coming soon",
    accent: "violet",
    features: ["Templates", "Word/PDF output", "Data validation", "Transliteration", "Print-ready layouts"]
  },
  {
    slug: "sysone-work",
    name: "SysOne Work",
    kicker: "Field reporting system",
    description: "Mobile-first employee reporting, media evidence, location capture and management dashboards.",
    category: "Business Systems",
    price: "Custom",
    platforms: ["Web", "Android"],
    version: "1.0",
    status: "Coming soon",
    accent: "silver",
    features: ["Reports", "Geolocation", "Admin dashboard", "Exports", "Role-based access"]
  }
];

export const games: Game[] = [
  {
    slug: "project-nova",
    name: "Project NOVA",
    tagline: "A fast sci-fi arena experiment.",
    description: "A SysOne Games concept focused on accessible controls, premium sci-fi presentation and scalable multiplayer architecture.",
    genre: "Action / Arena",
    platforms: ["Web", "Windows", "Android"],
    status: "In development",
    featured: true,
    accent: "blue",
    features: ["Cross-platform concept", "Fast sessions", "Hero abilities", "Matchmaking-ready architecture"]
  },
  {
    slug: "orbit-runner",
    name: "Orbit Runner",
    tagline: "One-button flow, deep mastery.",
    description: "A lightweight web and mobile arcade concept designed for instant play and competitive score chasing.",
    genre: "Arcade",
    platforms: ["Web", "Android", "iOS"],
    status: "Coming soon",
    featured: true,
    accent: "cyan",
    features: ["Instant web play", "Leaderboards", "Daily challenges", "Cloud profile"]
  },
  {
    slug: "dark-signal",
    name: "Dark Signal",
    tagline: "Survive what the radar cannot see.",
    description: "A PC-first atmospheric survival prototype from SysOne Labs and SysOne Games.",
    genre: "Survival / Atmospheric",
    platforms: ["Windows"],
    status: "Coming soon",
    accent: "violet",
    features: ["Cinematic atmosphere", "Adaptive AI concept", "Exploration", "PC-first controls"]
  }
];

export const solutions = [
  { slug: "software", title: "Custom Software", text: "Desktop, SaaS and internal systems built around real operational workflows.", icon: "Code2" },
  { slug: "web", title: "Web Platforms", text: "Premium websites, dashboards, PWAs, portals and commerce experiences.", icon: "Globe2" },
  { slug: "mobile", title: "Mobile Apps", text: "Android, iOS and cross-platform products with mobile-first UX.", icon: "Smartphone" },
  { slug: "ai", title: "AI Solutions", text: "Assistants, intelligent search, document AI, analytics and workflow automation.", icon: "Sparkles" },
  { slug: "games", title: "Game Development", text: "Mobile, PC and web games, game UI/UX, backend and live systems.", icon: "Gamepad2" },
  { slug: "business", title: "Business Automation", text: "CRM, reporting, document generation, analytics and Telegram-connected tools.", icon: "Workflow" },
  { slug: "cloud", title: "Cloud & Deployment", text: "Deployment, storage, CDN, observability and resilient delivery architecture.", icon: "Cloud" },
  { slug: "care", title: "SysOne Care", text: "Maintenance, monitoring, security, backups and continuous improvements.", icon: "ShieldCheck" }
];

export const caseStudies = [
  {
    title: "Field reporting, without chat chaos",
    metric: "One structured workflow",
    description: "A concept for turning daily employee reports, media and location into a searchable management system.",
    tags: ["Mobile", "Dashboard", "Automation"]
  },
  {
    title: "Documents in seconds, not minutes",
    metric: "Template-driven output",
    description: "A structured approach to generating consistent Word/PDF documents from validated form data.",
    tags: ["Documents", "Workflow", "Business"]
  }
];

export const resources = [
  { type: "Guide", title: "How SysOne designs digital products", summary: "From discovery and prototype to production and long-term care." },
  { type: "Games", title: "Building a cross-platform game roadmap", summary: "How mobile, PC and web editions can share identity without sharing every constraint." },
  { type: "AI", title: "Where AI helps — and where it should not decide", summary: "A practical framework for reliable assistants and intelligent product UX." },
  { type: "Infrastructure", title: "Cloudflare-first architecture for a growing studio", summary: "A free-to-start deployment model using Workers, D1, R2 and edge delivery." }
];
