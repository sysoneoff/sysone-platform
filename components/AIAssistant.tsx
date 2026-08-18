"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";

const responses = [
  { match: ["game", "o'yin", "игр"], text: "SysOne Games mobile, PC and web projects are part of the same ecosystem. I can guide you to the Games studio or help structure a game project brief." },
  { match: ["website", "sayt", "web"], text: "For a premium web product, SysOne can combine UX, PWA, dashboard, analytics, automation and AI. Start with the Project Planner to define scope." },
  { match: ["ai", "suniy", "assistant"], text: "SysOne AI is planned as an intelligent layer across search, support, documentation, product discovery and project planning — not just a chatbot." },
  { match: ["price", "narx", "стоим"], text: "Custom project pricing depends on scope, platform and integrations. The project request flow is designed to collect this context before an estimate." }
];

export function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi — I’m the SysOne product guide. Ask about software, games, AI or starting a project." }]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    const found = responses.find((r) => r.match.some((m) => q.toLowerCase().includes(m)));
    setMessages((prev) => [...prev, { role: "user", text: q }, { role: "assistant", text: found?.text || "I can help you navigate SysOne products, games, services and project planning. In the production version this assistant will answer from verified SysOne knowledge sources." }]);
    setInput("");
  }

  return (
    <div className="aiDock">
      {open && <div className="aiPanel surface"><div className="aiPanelHead"><div><span className="aiAvatar"><Sparkles size={16}/></span><span><strong>SysOne AI</strong><small>Product intelligence preview</small></span></div><button onClick={() => setOpen(false)} aria-label="Close AI"><X size={17}/></button></div><div className="aiMessages">{messages.map((m, i) => <div key={i} className={`aiMessage ${m.role}`}>{m.text}</div>)}</div><form onSubmit={submit} className="aiComposer"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask SysOne..."/><button aria-label="Send"><Send size={16}/></button></form></div>}
      <button className="aiLauncher" onClick={() => setOpen(!open)} aria-label="Open SysOne AI"><Bot size={20}/><span>Ask SysOne</span></button>
    </div>
  );
}
