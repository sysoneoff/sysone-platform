import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
const plans=[
 {name:"Start",sub:"For focused websites and MVPs",price:"Scope-based",features:["Discovery","Premium UI/UX","Responsive build","Launch support"]},
 {name:"Business",sub:"For operational systems",price:"Custom",featured:true,features:["Everything in Start","Admin dashboard","Automation","Analytics","Integrations","SysOne Care"]},
 {name:"Studio",sub:"For advanced products and games",price:"Custom",features:["Product architecture","Multi-platform planning","AI/game systems","Release pipeline","Long-term roadmap"]}
];
export default function PricingPage(){return <div className="pageWrap"><section className="pageHero shell"><span className="eyebrow">PRICING MODEL</span><h1>Price the product around the work it needs to do.</h1><p>SysOne avoids misleading one-price-fits-all packages for custom systems. The project planner and discovery process define scope before a serious estimate.</p></section><section className="section compactTop"><div className="shell pricingGrid">{plans.map(p=><article className={`surface pricingCard ${p.featured?"featured":""}`} key={p.name}><span className="eyebrow">{p.name.toUpperCase()}</span><h2>{p.price}</h2><p>{p.sub}</p><div className="checkList vertical">{p.features.map(f=><span key={f}><Check/>{f}</span>)}</div><Link className={`button ${p.featured?"buttonPrimary":"buttonGhost"}`} href="/contact">Discuss project <ArrowRight size={16}/></Link></article>)}</div></section></div>}
