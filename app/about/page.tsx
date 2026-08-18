import { Compass, Layers3, ShieldCheck, Sparkles } from "lucide-react";
const values=[
 {icon:Compass,title:"Clarity before code",text:"Define the problem, user and outcome before choosing technology."},
 {icon:Layers3,title:"Systems over isolated screens",text:"Design products around the complete workflow, lifecycle and operating model."},
 {icon:ShieldCheck,title:"Trust is a feature",text:"Security, privacy, reliable states and support are part of the product experience."},
 {icon:Sparkles,title:"Premium without noise",text:"Use visual sophistication deliberately — not as decoration for weak UX."}
];
export default function AboutPage(){return <div className="pageWrap"><section className="pageHero shell"><span className="eyebrow">ABOUT SYSONE</span><h1>A digital studio becoming a product company.</h1><p>SysOne is being built as one connected brand for software, AI, games, business systems and experimental technology. The goal is simple: useful digital products with a recognizably premium standard.</p></section><section className="section compactTop"><div className="shell aboutStatement surface"><span className="eyebrow">MISSION</span><h2>Turn complex work and ambitious ideas into clear digital products.</h2></div></section><section className="section"><div className="shell valueGrid">{values.map(({icon:Icon,title,text})=><article key={title}><span className="iconChip"><Icon/></span><h2>{title}</h2><p>{text}</p></article>)}</div></section></div>}
