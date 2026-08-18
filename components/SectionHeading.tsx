import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ eyebrow, title, description, href, linkLabel }: { eyebrow: string; title: string; description?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="sectionHeading">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {href && <Link className="textLink" href={href}>{linkLabel || "View all"} <ArrowRight size={15}/></Link>}
    </div>
  );
}
