import { BookOpen, ChevronRight, Code2, FileText, Rocket, Search, Wrench } from "lucide-react";
const groups=[
 {icon:Rocket,title:"Getting Started",items:["Choose a product","Install or open","Create SysOne ID","First configuration"]},
 {icon:Wrench,title:"Product Guides",items:["Settings","Updates","Licenses","Troubleshooting"]},
 {icon:Code2,title:"Developer",items:["API overview","API keys","Webhooks","Examples"]},
 {icon:FileText,title:"Release Notes",items:["Zeta Security","OneCast","SysOne Platform","Games"]}
];
export default function DocsPage(){return <div className="pageWrap"><section className="pageHero shell docsHero"><span className="eyebrow">DOCUMENTATION</span><h1>Answers should be easier to find than support.</h1><p>Documentation is structured for products, games, APIs and release notes — and later becomes a verified knowledge source for SysOne AI.</p><div className="docsSearch surface"><Search/><input placeholder="Search documentation..."/></div></section><section className="section compactTop"><div className="shell docsGrid">{groups.map(({icon:Icon,title,items})=><article className="surface" key={title}><Icon/><h2>{title}</h2>{items.map(i=><button key={i}>{i}<ChevronRight size={15}/></button>)}</article>)}</div></section></div>}
