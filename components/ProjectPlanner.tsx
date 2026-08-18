"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

const choices = ["Web platform", "Mobile app", "Desktop software", "AI system", "Game", "Business automation"];

export function ProjectPlanner() {
  const [idea, setIdea] = useState("");
  const [choice, setChoice] = useState("Web platform");
  const analysis = useMemo(() => {
    const game = choice === "Game" || /game|o'yin/i.test(idea);
    const ai = choice === "AI system" || /ai|sun'iy|assistant/i.test(idea);
    const modules = game
      ? ["Game UX", "Core gameplay", "Player profile", "Build pipeline", "Analytics"]
      : ai
        ? ["Verified knowledge", "Assistant UX", "Search", "Permissions", "Usage analytics"]
        : ["Authentication", "User dashboard", "Admin control", "Analytics", "Notifications"];
    return { complexity: idea.length > 90 ? "Advanced" : idea.length > 25 ? "Medium" : "Starter", modules };
  }, [idea, choice]);

  return (
    <div className="planner surface">
      <div className="plannerForm">
        <div className="plannerTitle"><span className="iconChip"><Sparkles size={18}/></span><div><strong>AI Project Planner</strong><small>Structure the idea before development.</small></div></div>
        <label>What are you building?<select value={choice} onChange={(e) => setChoice(e.target.value)}>{choices.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Describe the idea<textarea rows={5} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Example: A mobile-first reporting system for 100 employees with location, media and an admin dashboard."/></label>
      </div>
      <div className="plannerResult">
        <span className="eyebrow">LIVE CONCEPT</span><h3>{choice}</h3><p>{idea || "Describe your project and the planner will turn it into a structured starting point."}</p>
        <div className="plannerMetric"><span>Estimated complexity</span><strong>{analysis.complexity}</strong></div>
        <div className="plannerModules">{analysis.modules.map((m) => <span key={m}><CheckCircle2 size={15}/>{m}</span>)}</div>
        <Link href="/contact" className="button buttonPrimary">Continue to project request <ArrowRight size={16}/></Link>
      </div>
    </div>
  );
}
