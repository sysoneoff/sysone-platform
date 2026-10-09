import { Activity, BadgeCheck, BellRing, Boxes, Database, Flag, Gamepad2, Gauge,
  Image as ImageIcon, LayoutDashboard, LifeBuoy, Megaphone, MonitorDown, Package,
  Settings, ShieldCheck, ShoppingCart, UserRound, Users, Workflow } from "lucide-react";

export const NAV=[
  ["Asosiy",[
    ["Overview","overview",LayoutDashboard],
    ["E'lonlar","announcements",Megaphone],
    ["Bosh sahifa & Dock","experience",LayoutDashboard],
  ]],
  ["Mahsulotlar",[
    ["Katalog","catalog",Boxes],
    ["Web Apps & Games","runtime",Gamepad2],
    ["Releases","releases",Package],
    ["Media","media",ImageIcon],
  ]],
  ["Commerce",[
    ["Buyurtmalar","orders",ShoppingCart],
    ["Entitlements","entitlements",BadgeCheck],
    ["Litsenziyalar","licenses",ShieldCheck],
    ["License devices","devices",MonitorDown],
    ["Reviews","reviews",Gauge],
  ]],
  ["Foydalanuvchi",[
    ["Users","users",Users],
    ["Sessions","sessions",UserRound],
    ["Notifications","notifications",BellRing],
    ["Organizations","organizations",Database],
    ["Projects","projects",Workflow],
    ["Support","support",LifeBuoy],
  ]],
  ["Platforma",[
    ["Content","content",Database],
    ["Feature Flags","flags",Flag],
    ["AI Usage","ai",Activity],
    ["Audit","audit",Activity],
    ["Settings","settings",Settings],
  ]],
] as const;

