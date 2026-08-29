import type { Metadata } from "next";

import {
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  Headphones,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ProjectPlanner } from "@/components/ProjectPlanner";

export const metadata: Metadata = {
  title: "AI Roadmap",
  description:
    "The current SysOne planning tool and the clearly labelled roadmap for model-backed product features.",
};

const modules = [
  {
    icon: BrainCircuit,
    title: "Project Brief Builder",
    text: "Turn an early idea into a structured local brief and carry it into the real project-request workflow.",
    status: "Available now",
    available: true,
  },
  {
    icon: Search,
    title: "AI Search",
    text: "Natural-language discovery across the verified product, game and documentation catalog.",
    status: "Planned",
    available: false,
  },
  {
    icon: Sparkles,
    title: "Product Finder",
    text: "Recommend a product only from current catalog data, availability and user intent.",
    status: "Planned",
    available: false,
  },
  {
    icon: FileSearch,
    title: "Documentation Answers",
    text: "Answer from published SysOne guides and release information with visible source scope.",
    status: "Planned",
    available: false,
  },
  {
    icon: Headphones,
    title: "Support Assistant",
    text: "Help with documented issues and hand off to a real support ticket when needed.",
    status: "Planned",
    available: false,
  },
  {
    icon: ShieldCheck,
    title: "Permission-aware Actions",
    text: "Require the same server-side identity and authorization checks as every non-AI workflow.",
    status: "Design requirement",
    available: false,
  },
];

export default function AIPage() {
  return (
    <div className="pageWrap">
      <section className="pageHero shell">
        <span className="eyebrow">
          SYSONE AI — HONEST ROADMAP
        </span>

        <h1>
          Ship useful intelligence,
          label everything else.
        </h1>

        <p>
          The Project Brief Builder is
          available today and runs
          locally without an AI model.
          Model-backed search and
          assistants remain planned
          until their data, permissions
          and reliability controls are
          implemented.
        </p>
      </section>

      <section className="section compactTop">
        <div className="shell">
          <div className="aiModuleGrid">
            {modules.map(
              ({
                icon: Icon,
                title,
                text,
                status,
                available,
              }) => (
                <article
                  className="surface"
                  key={title}
                >
                  <span className="iconChip">
                    <Icon />
                  </span>

                  <h2>{title}</h2>
                  <p>{text}</p>

                  <span
                    className={
                      available
                        ? "statusPill"
                        : "futureBadge"
                    }
                  >
                    {status}
                  </span>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="section sectionTint">
        <div className="shell">
          <ProjectPlanner />
        </div>
      </section>

      <section className="section">
        <div className="shell policyPanel surface">
          <div>
            <span className="eyebrow">
              AI DELIVERY RULES
            </span>

            <h2>
              A model never becomes the
              source of truth.
            </h2>
          </div>

          <div className="checkList vertical">
            <span>
              <CheckCircle2 />
              Prices and availability must
              come from current system data.
            </span>

            <span>
              <CheckCircle2 />
              Documentation answers must
              identify their verified source
              scope.
            </span>

            <span>
              <CheckCircle2 />
              Protected actions must pass
              normal server-side authorization.
            </span>

            <span>
              <CheckCircle2 />
              Users must know when a model is
              involved and control saved context.
            </span>

            <span>
              <CheckCircle2 />
              Human support remains available
              through real tickets.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
