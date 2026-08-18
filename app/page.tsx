import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Gamepad2, Play, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { SectionHeading } from "@/components/SectionHeading";
import { ProductCard } from "@/components/ProductCard";
import { GameCard } from "@/components/GameCard";
import { FeatureGrid } from "@/components/FeatureGrid";
import { ProjectPlanner } from "@/components/ProjectPlanner";
import { products, games, caseStudies, solutions } from "@/data/catalog";

export default function HomePage() {
  return (
    <>
      <section className="heroSection">
        <div className="shell heroGrid">
          <div className="heroCopy">
            <span className="eyebrow"><span className="liveDot"/> SYSONE / DIGITAL STUDIO</span>
            <h1>Build what feels <span>one step ahead.</span></h1>
            <p>SysOne creates software, AI systems, games and digital products with premium UX, practical intelligence and scalable engineering.</p>
            <div className="heroActions"><Link className="button buttonPrimary buttonLarge" href="/contact">Start a project <ArrowRight size={17}/></Link><Link className="button buttonGhost buttonLarge" href="/marketplace">Explore marketplace</Link></div>
            <div className="heroProof"><span><ShieldCheck size={15}/> Secure architecture</span><span><Zap size={15}/> Performance-first</span><span><Gamepad2 size={15}/> Software + Games</span></div>
          </div>
          <div className="heroStage surface">
            <div className="stageChrome"><span>SysOne Intelligence</span><span className="liveTag">LIVE CONCEPT</span></div>
            <div className="stageCore"><div className="liquidDisc"><Image src="/brand/sysone-symbol.webp" alt="SysOne symbol" width={245} height={245} priority /></div></div>
            <div className="stageCards"><div><small>Products</small><strong>Connected</strong></div><div><small>Games</small><strong>Studio ready</strong></div><div><small>AI</small><strong>Intelligent layer</strong></div></div>
            <div className="stagePrompt"><Sparkles size={16}/><span>Ask SysOne to structure your next product.</span><kbd>⌘ K</kbd></div>
          </div>
        </div>
      </section>

      <section className="brandStrip"><div className="shell brandStripInner"><span>SOFTWARE</span><i/> <span>AI</span><i/> <span>GAMES</span><i/> <span>DIGITAL PRODUCTS</span><i/> <span>AUTOMATION</span></div></section>

      <section className="section"><div className="shell"><SectionHeading eyebrow="SOLUTIONS" title="One studio. Multiple ways to build." description="From a focused product to a connected digital system, SysOne brings design, engineering and intelligent automation into one workflow." href="/solutions" linkLabel="All solutions"/><div className="solutionGrid">{solutions.slice(0,6).map((s,i)=><Link className="solutionCard" href={`/solutions#${s.slug}`} key={s.slug}><span className="solutionIndex">0{i+1}</span><h3>{s.title}</h3><p>{s.text}</p><ArrowRight size={17}/></Link>)}</div></div></section>

      <section className="section sectionTint"><div className="shell"><SectionHeading eyebrow="PRODUCTS" title="Software with a product mindset." description="SysOne products are designed as long-term tools with versions, support, documentation and a clear path from free access to professional use." href="/products"/><div className="cardGrid3">{products.filter(p=>p.featured).slice(0,3).map((p)=><ProductCard key={p.slug} product={p}/>)}</div></div></section>

      <section className="section"><div className="shell"><SectionHeading eyebrow="SYSONE GAMES" title="Games are part of the core identity." description="Mobile, PC and web games get the same attention to UX, visual language, performance and scalable platform architecture." href="/games" linkLabel="Enter Games"/><div className="cardGrid3">{games.map((g)=><GameCard key={g.slug} game={g}/>)}</div></div></section>

      <section className="section sectionTint"><div className="shell"><SectionHeading eyebrow="INTELLIGENT EXPERIENCE" title="AI should make the product easier — not noisier." description="SysOne AI is designed as a verified intelligence layer across search, support, documentation, product discovery and project planning." href="/ai"/><div className="aiFeature surface"><div className="aiFeatureCopy"><span className="iconChip iconChipLarge"><Sparkles/></span><h3>From “I have an idea” to a structured starting point.</h3><p>The planner turns an early idea into recommended modules, platform choices and a project brief. In production, AI answers will be grounded in SysOne’s verified knowledge and permission system.</p><div className="checkList"><span><Check size={15}/> Verified knowledge sources</span><span><Check size={15}/> Human handoff</span><span><Check size={15}/> Permission-aware actions</span><span><Check size={15}/> Personalization controls</span></div></div><ProjectPlanner/></div></div></section>

      <section className="section"><div className="shell"><SectionHeading eyebrow="WHY SYSONE" title="Premium is a system, not an effect." description="The visual layer matters, but trust comes from the complete experience: speed, clarity, security, thoughtful states and reliable operations."/><FeatureGrid/></div></section>

      <section className="section sectionTint"><div className="shell"><SectionHeading eyebrow="CASE STUDIES" title="Show the problem. Show the result." description="SysOne case studies focus on the workflow that changed, not just screenshots." href="/case-studies"/><div className="caseGrid">{caseStudies.map((item)=><article className="caseCard surface" key={item.title}><div className="caseMetric">{item.metric}</div><h3>{item.title}</h3><p>{item.description}</p><div className="platformRow">{item.tags.map(t=><span key={t}>{t}</span>)}</div></article>)}</div></div></section>

      <section className="section"><div className="shell"><div className="finalCta surface"><div><span className="eyebrow">BUILD WITH SYSONE</span><h2>Software, a game, an AI system — or something that does not fit a template.</h2><p>Start with the problem. SysOne will structure the product around it.</p></div><div className="finalCtaActions"><Link className="button buttonPrimary buttonLarge" href="/contact">Start a project <ArrowRight size={17}/></Link><Link className="button buttonGhost buttonLarge" href="/labs">Explore Labs</Link></div></div></div></section>
    </>
  );
}
