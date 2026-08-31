import type { Metadata } from "next";
import { BrainCircuit, CheckCircle2, FileSearch, Headphones, Search, ShieldCheck, Sparkles } from "lucide-react";
import { ProjectPlanner } from "@/components/ProjectPlanner";
import { T } from "@/components/T";
import type { TranslationKey } from "@/lib/i18n";
export const metadata:Metadata={title:"AI Roadmap",description:"The current SysOne planning tool and clearly labelled roadmap for model-backed features."};
const modules=[
{icon:BrainCircuit,title:"ai.projectBrief",text:"ai.projectBriefText",status:"ai.statusAvailable",available:true},
{icon:Search,title:"ai.search",text:"ai.searchText",status:"ai.statusPlanned",available:false},
{icon:Sparkles,title:"ai.productFinder",text:"ai.productFinderText",status:"ai.statusPlanned",available:false},
{icon:FileSearch,title:"ai.docsAnswers",text:"ai.docsAnswersText",status:"ai.statusPlanned",available:false},
{icon:Headphones,title:"ai.supportAssistant",text:"ai.supportAssistantText",status:"ai.statusPlanned",available:false},
{icon:ShieldCheck,title:"ai.permissionActions",text:"ai.permissionActionsText",status:"ai.statusDesign",available:false},
] as const satisfies readonly {icon:typeof BrainCircuit;title:TranslationKey;text:TranslationKey;status:TranslationKey;available:boolean}[];
export default function AIPage(){return <div className="pageWrap"><section className="v3PageHero v3AiHero"><div className="shell v3PageHeroLayout"><div><span className="v3HeroIcon"><BrainCircuit size={25}/></span><span className="v3Kicker"><T id="ai.kicker"/></span><h1><T id="ai.hero"/></h1><p><T id="ai.description"/></p></div><div className="v3AiSignal" aria-hidden="true"><BrainCircuit size={42}/><span><T id="ai.verifiedInput"/></span><i/><span><T id="ai.controlledAction"/></span></div></div></section>
<section className="section compactTop"><div className="shell"><div className="v3SectionHead"><div><span className="v3Kicker"><T id="ai.capabilityMap"/></span><h2><T id="ai.whatExists"/></h2><p><T id="ai.whatExistsText"/></p></div></div><div className="v3AiModuleGrid">{modules.map(({icon:Icon,title,text,status,available})=><article className={`v3AiModule ${available?"available":""}`} key={title}><span className="v3AiModuleIcon"><Icon size={22}/></span><span className="v3AiModuleStatus"><i/><T id={status}/></span><h2><T id={title}/></h2><p><T id={text}/></p></article>)}</div></div></section>
<section className="section sectionTint"><div className="shell"><div className="v3SectionHead"><div><span className="v3Kicker"><T id="ai.availableNow"/></span><h2><T id="ai.projectBrief"/></h2><p><T id="ai.builderText"/></p></div></div><ProjectPlanner/></div></section>
<section className="section"><div className="shell policyPanel surface"><div><span className="v3Kicker"><T id="ai.deliveryRules"/></span><h2><T id="ai.truth"/></h2></div><div className="checkList vertical">{(["ai.rule1","ai.rule2","ai.rule3","ai.rule4","ai.rule5"] as TranslationKey[]).map((key)=><span key={key}><CheckCircle2/><T id={key}/></span>)}</div></div></section></div>}
