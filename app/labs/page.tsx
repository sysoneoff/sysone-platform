import type { Metadata } from "next";
import { Beaker, BrainCircuit, Gamepad2, Map, Mic2, ScanEye } from "lucide-react";
export const metadata: Metadata = {
  title: { absolute: "SysOne Labs — Experimental Technology and Prototypes" },
  description: "Explore SysOne Labs, the experimental space for AI, games, computer vision, voice, maps and early-stage digital product prototypes.",
};

const labs=[
  {icon:BrainCircuit,title:"AI Experiments",text:"Search, assistants, agents and intelligent product workflows."},
  {icon:Gamepad2,title:"Game Prototypes",text:"Gameplay mechanics, multiplayer concepts and cross-platform experiments."},
  {icon:ScanEye,title:"Computer Vision",text:"Image understanding and visual automation concepts."},
  {icon:Mic2,title:"Voice",text:"Speech interfaces and voice-assisted workflows."},
  {icon:Map,title:"Maps",text:"Location intelligence, tourism and public-information experiences."},
  {icon:Beaker,title:"Experimental Apps",text:"Small products used to validate ideas before a full product investment."}
];
export default function LabsPage(){return <div className="pageWrap"><section className="pageHero shell"><span className="eyebrow">SYSONE LABS</span><h1>Where unfinished ideas are allowed to be useful.</h1><p>Labs is the experimental layer for prototypes, beta programs and technologies that are not yet part of a commercial SysOne product.</p></section><section className="section compactTop"><div className="shell labGrid">{labs.map(({icon:Icon,title,text})=><article className="surface" key={title}><Icon/><span className="futureBadge">Experimental</span><h2>{title}</h2><p>{text}</p></article>)}</div></section></div>}
