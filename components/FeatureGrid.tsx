import { BrainCircuit, Boxes, Cloud, Gamepad2, LockKeyhole, Sparkles, Workflow, Zap } from "lucide-react";
const features = [
  { icon: Boxes, title: "One ecosystem", text: "Software, games, services and accounts share one coherent SysOne identity." },
  { icon: BrainCircuit, title: "Intelligent UX", text: "AI supports discovery, support, docs, search and project planning without taking unsafe control." },
  { icon: LockKeyhole, title: "Security by design", text: "Role-based control, server-side authorization, audit trails and secure downloads are part of the architecture." },
  { icon: Cloud, title: "Cloudflare-first", text: "Workers, D1, R2, KV and edge delivery create a free-to-start path that can grow." },
  { icon: Gamepad2, title: "Games included", text: "Mobile, PC and web games are first-class products — not an afterthought." },
  { icon: Workflow, title: "Business workflows", text: "SysOne focuses on operational systems, automation, reporting and repeatable digital processes." },
  { icon: Zap, title: "Performance first", text: "Progressive loading, reduced-motion support and lightweight interactions protect speed." },
  { icon: Sparkles, title: "Premium, not noisy", text: "Liquid surfaces, restrained gradients, soft reflections and deliberate motion create a human-designed feel." }
];
export function FeatureGrid(){return <div className="featureGrid">{features.map(({icon:Icon,title,text})=><article className="featureItem" key={title}><span className="iconChip"><Icon size={18}/></span><h3>{title}</h3><p>{text}</p></article>)}</div>}
