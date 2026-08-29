"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const choices = [
  "Web platform",
  "Mobile app",
  "Desktop software",
  "AI system",
  "Game",
  "Business automation",
] as const;

const moduleMap = {
  "Web platform": [
    "User journeys",
    "Authentication",
    "Core workflows",
    "Admin control",
    "Deployment",
  ],
  "Mobile app": [
    "Mobile UX",
    "Authentication",
    "Offline behavior",
    "Notifications",
    "Store builds",
  ],
  "Desktop software": [
    "Desktop UX",
    "Local storage",
    "System integration",
    "Updates",
    "Installer builds",
  ],
  "AI system": [
    "Verified knowledge",
    "Model boundary",
    "Evaluation",
    "Permissions",
    "Usage controls",
  ],
  Game: [
    "Game UX",
    "Core gameplay",
    "Player state",
    "Build pipeline",
    "Analytics",
  ],
  "Business automation": [
    "Current process",
    "Data validation",
    "Automation rules",
    "Audit trail",
    "Operations dashboard",
  ],
} as const;

const DRAFT_STORAGE_KEY =
  "sysone.project-request-draft";

export function ProjectPlanner() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [choice, setChoice] =
    useState<(typeof choices)[number]>(
      "Web platform",
    );

  const analysis = useMemo(() => {
    const wordCount =
      idea.trim()
        ? idea.trim().split(/\s+/).length
        : 0;

    const complexity =
      wordCount >= 70
        ? "Advanced discovery"
        : wordCount >= 25
          ? "Structured discovery"
          : "Early concept";

    return {
      complexity,
      modules: moduleMap[choice],
      wordCount,
    };
  }, [idea, choice]);

  const cleanIdea = idea.trim();
  const canContinue =
    cleanIdea.length >= 20;

  function continueToRequest() {
    if (!canContinue) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          projectType: choice,
          description: cleanIdea,
          source: "brief-builder",
        }),
      );
    } catch {
      // The user can still continue and
      // enter the brief manually when
      // session storage is unavailable.
    }

    router.push("/contact?from=brief-builder");
  }

  return (
    <div className="planner surface">
      <div className="plannerForm">
        <div className="plannerTitle">
          <span className="iconChip">
            <ClipboardList size={18} />
          </span>

          <div>
            <strong>
              Project Brief Builder
            </strong>

            <small>
              Available now · local rules,
              no AI model call
            </small>
          </div>
        </div>

        <label>
          What are you building?

          <select
            value={choice}
            onChange={(event) =>
              setChoice(
                event.target
                  .value as (typeof choices)[number],
              )
            }
          >
            {choices.map((item) => (
              <option key={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Describe the problem and result

          <textarea
            rows={7}
            value={idea}
            minLength={20}
            maxLength={4000}
            onChange={(event) =>
              setIdea(event.target.value)
            }
            placeholder="Example: A mobile-first reporting system for 100 employees with location, media and an admin dashboard."
          />
        </label>

        <div className="plannerInputMeta">
          <span>
            {analysis.wordCount} words
          </span>

          <span>
            {canContinue
              ? "Ready to continue"
              : "Add at least 20 characters"}
          </span>
        </div>
      </div>

      <div className="plannerResult">
        <span className="eyebrow">
          LIVE BRIEF
        </span>

        <h3>{choice}</h3>

        <p>
          {cleanIdea ||
            "Describe the project and the builder will prepare a structured starting scope."}
        </p>

        <div className="plannerMetric">
          <span>Discovery level</span>
          <strong>
            {analysis.complexity}
          </strong>
        </div>

        <div className="plannerModules">
          {analysis.modules.map((module) => (
            <span key={module}>
              <CheckCircle2 size={15} />
              {module}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="button buttonPrimary"
          disabled={!canContinue}
          onClick={continueToRequest}
        >
          Continue to project request
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
