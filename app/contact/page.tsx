"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const steps = [
  "What",
  "Platform",
  "Scope",
  "Timing",
  "Contact",
] as const;

const projectTypes = [
  "Web platform",
  "Mobile app",
  "Desktop software",
  "AI system",
  "Game",
  "Business automation",
] as const;

const platformOptions = [
  "Web",
  "Android",
  "iOS",
  "Windows",
  "Cloud",
  "Not sure yet",
] as const;

const timingOptions = [
  "Flexible",
  "1–2 months",
  "3–6 months",
  "Long-term product",
] as const;

const budgetOptions = [
  "Need estimate",
  "Defined budget",
  "Exploring options",
] as const;

type ProjectType =
  (typeof projectTypes)[number];

type Platform =
  (typeof platformOptions)[number];

type TargetTiming =
  (typeof timingOptions)[number];

type BudgetStage =
  (typeof budgetOptions)[number];

type SubmittedRequest = {
  id: string;
  status: string;
  createdAt: string;
};

type ProjectRequestApiResponse = {
  ok: boolean;
  error?: string;
  field?: string | null;
  request?: SubmittedRequest;
};

function humanizeError(
  error?: string,
) {
  switch (error) {
    case "invalid_project_type":
      return "Please select a valid project type.";

    case "invalid_platforms":
      return "Select at least one platform.";

    case "invalid_description":
      return "Describe the problem and desired result.";

    case "invalid_target_timing":
      return "Select a valid target timing.";

    case "invalid_budget_stage":
      return "Select a valid budget stage.";

    case "invalid_contact_name":
      return "Enter your name.";

    case "invalid_contact_email":
      return "Enter a valid email address.";

    case "invalid_contact_telegram":
      return "Enter a valid Telegram username.";

    case "contact_method_required":
      return "Enter at least an email address or Telegram username.";

    case "invalid_request_origin":
      return "This request could not be verified. Refresh the page and try again.";

    case "request_body_too_large":
      return "The project request is too large.";

    case "project_request_creation_failed":
      return "The request could not be stored. Please try again.";

    default:
      return "Something went wrong. Please try again.";
  }
}

export default function ContactPage() {
  const [step, setStep] =
    useState(0);

  const [projectType, setProjectType] =
    useState<ProjectType>(
      "Web platform",
    );

  const [platforms, setPlatforms] =
    useState<Platform[]>([]);

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    targetTiming,
    setTargetTiming,
  ] =
    useState<TargetTiming>(
      "Flexible",
    );

  const [
    budgetStage,
    setBudgetStage,
  ] =
    useState<BudgetStage>(
      "Need estimate",
    );

  const [
    contactName,
    setContactName,
  ] = useState("");

  const [
    contactEmail,
    setContactEmail,
  ] = useState("");

  const [
    contactTelegram,
    setContactTelegram,
  ] = useState("");

  const [
    organizationName,
    setOrganizationName,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    submitted,
    setSubmitted,
  ] =
    useState<SubmittedRequest | null>(
      null,
    );

  const summary = useMemo(() => {
    const clean =
      description.trim();

    if (!clean) {
      return "Your project description will appear here.";
    }

    return clean;
  }, [description]);

  function togglePlatform(
    platform: Platform,
  ) {
    setError(null);

    setPlatforms((current) => {
      if (
        platform ===
        "Not sure yet"
      ) {
        if (
          current.includes(
            "Not sure yet",
          )
        ) {
          return [];
        }

        return [
          "Not sure yet",
        ];
      }

      const withoutUnsure =
        current.filter(
          (item) =>
            item !==
            "Not sure yet",
        );

      if (
        withoutUnsure.includes(
          platform,
        )
      ) {
        return withoutUnsure.filter(
          (item) =>
            item !== platform,
        );
      }

      return [
        ...withoutUnsure,
        platform,
      ];
    });
  }

  function validateCurrentStep() {
    setError(null);

    if (step === 1) {
      if (
        platforms.length === 0
      ) {
        setError(
          "Select at least one platform.",
        );

        return false;
      }
    }

    if (step === 2) {
      if (
        !description.trim()
      ) {
        setError(
          "Describe the problem and desired result.",
        );

        return false;
      }
    }

    if (step === 4) {
      if (
        !contactName.trim()
      ) {
        setError(
          "Enter your name.",
        );

        return false;
      }

      if (
        !contactEmail.trim() &&
        !contactTelegram.trim()
      ) {
        setError(
          "Enter at least an email address or Telegram username.",
        );

        return false;
      }
    }

    return true;
  }

  function continueFlow() {
    if (
      !validateCurrentStep()
    ) {
      return;
    }

    setStep((current) =>
      Math.min(
        current + 1,
        steps.length - 1,
      ),
    );
  }

  function goBack() {
    setError(null);

    setStep((current) =>
      Math.max(
        current - 1,
        0,
      ),
    );
  }

  async function submitRequest() {
    if (
      !validateCurrentStep() ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response =
        await fetch(
          "/api/project-requests",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "same-origin",

            body: JSON.stringify(
              {
                projectType,

                platforms,

                description:
                  description.trim(),

                targetTiming,

                budgetStage,

                contactName:
                  contactName.trim(),

                contactEmail:
                  contactEmail.trim() ||
                  null,

                contactTelegram:
                  contactTelegram.trim() ||
                  null,

                organizationName:
                  organizationName.trim() ||
                  null,
              },
            ),
          },
        );

      const result =
        (await response.json()) as ProjectRequestApiResponse;

      if (
        !response.ok ||
        !result.ok ||
        !result.request
      ) {
        setError(
          humanizeError(
            result.error,
          ),
        );

        return;
      }

      setSubmitted(
        result.request,
      );
    } catch {
      setError(
        "Unable to reach SysOne right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetRequest() {
    setStep(0);

    setProjectType(
      "Web platform",
    );

    setPlatforms([]);

    setDescription("");

    setTargetTiming(
      "Flexible",
    );

    setBudgetStage(
      "Need estimate",
    );

    setContactName("");
    setContactEmail("");
    setContactTelegram("");
    setOrganizationName("");

    setError(null);
    setSubmitted(null);
  }

  return (
    <div className="pageWrap">
      <section className="pageHero shell">
        <span className="eyebrow">
          CUSTOM DEVELOPMENT
        </span>

        <h1>
          Start with the problem.
          We&apos;ll structure the
          project.
        </h1>

        <p>
          Send SysOne a structured
          project brief for custom
          software, AI, game or
          automation development.
        </p>
      </section>

      <section className="section compactTop">
        <div className="shell requestFlow">
          {!submitted && (
            <div className="requestSteps">
              {steps.map(
                (
                  item,
                  index,
                ) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      index ===
                      step
                        ? "active"
                        : index <
                            step
                          ? "done"
                          : ""
                    }
                    onClick={() => {
                      if (
                        index <=
                        step
                      ) {
                        setError(
                          null,
                        );

                        setStep(
                          index,
                        );
                      }
                    }}
                    disabled={
                      index >
                      step
                    }
                  >
                    <span>
                      {index <
                      step
                        ? "✓"
                        : index +
                          1}
                    </span>

                    {item}
                  </button>
                ),
              )}
            </div>
          )}

          <div className="surface requestPanel">
            {!submitted ? (
              <>
                <div className="requestMain">
                  <span className="eyebrow">
                    STEP{" "}
                    {step + 1} /{" "}
                    {
                      steps.length
                    }
                  </span>

                  {step === 0 && (
                    <>
                      <h2>
                        What are you
                        building?
                      </h2>

                      <div className="choiceGrid">
                        {projectTypes.map(
                          (
                            item,
                          ) => (
                            <button
                              key={
                                item
                              }
                              type="button"
                              className={
                                projectType ===
                                item
                                  ? "selected"
                                  : ""
                              }
                              aria-pressed={
                                projectType ===
                                item
                              }
                              onClick={() => {
                                setProjectType(
                                  item,
                                );

                                setError(
                                  null,
                                );
                              }}
                            >
                              {
                                item
                              }
                            </button>
                          ),
                        )}
                      </div>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <h2>
                        Which platforms
                        matter?
                      </h2>

                      <div className="choiceGrid">
                        {platformOptions.map(
                          (
                            platform,
                          ) => {
                            const selected =
                              platforms.includes(
                                platform,
                              );

                            return (
                              <button
                                key={
                                  platform
                                }
                                type="button"
                                className={
                                  selected
                                    ? "selected"
                                    : ""
                                }
                                aria-pressed={
                                  selected
                                }
                                onClick={() =>
                                  togglePlatform(
                                    platform,
                                  )
                                }
                              >
                                {
                                  platform
                                }
                              </button>
                            );
                          },
                        )}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <h2>
                        Describe the
                        problem and
                        desired result.
                      </h2>

                      <textarea
                        rows={9}
                        maxLength={
                          10000
                        }
                        value={
                          description
                        }
                        onChange={(
                          event,
                        ) => {
                          setDescription(
                            event
                              .target
                              .value,
                          );

                          setError(
                            null,
                          );
                        }}
                        placeholder="What happens today? What should become easier, faster or possible?"
                      />
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <h2>
                        Timing and
                        budget context.
                      </h2>

                      <div className="formGrid">
                        <label>
                          Target timing

                          <select
                            value={
                              targetTiming
                            }
                            onChange={(
                              event,
                            ) =>
                              setTargetTiming(
                                event
                                  .target
                                  .value as TargetTiming,
                              )
                            }
                          >
                            {timingOptions.map(
                              (
                                item,
                              ) => (
                                <option
                                  key={
                                    item
                                  }
                                  value={
                                    item
                                  }
                                >
                                  {
                                    item
                                  }
                                </option>
                              ),
                            )}
                          </select>
                        </label>

                        <label>
                          Budget stage

                          <select
                            value={
                              budgetStage
                            }
                            onChange={(
                              event,
                            ) =>
                              setBudgetStage(
                                event
                                  .target
                                  .value as BudgetStage,
                              )
                            }
                          >
                            {budgetOptions.map(
                              (
                                item,
                              ) => (
                                <option
                                  key={
                                    item
                                  }
                                  value={
                                    item
                                  }
                                >
                                  {
                                    item
                                  }
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <h2>
                        How should
                        SysOne contact
                        you?
                      </h2>

                      <div className="formGrid">
                        <label>
                          Name

                          <input
                            value={
                              contactName
                            }
                            maxLength={
                              120
                            }
                            autoComplete="name"
                            placeholder="Your name"
                            onChange={(
                              event,
                            ) => {
                              setContactName(
                                event
                                  .target
                                  .value,
                              );

                              setError(
                                null,
                              );
                            }}
                          />
                        </label>

                        <label>
                          Email

                          <input
                            type="email"
                            value={
                              contactEmail
                            }
                            maxLength={
                              254
                            }
                            autoComplete="email"
                            placeholder="name@example.com"
                            onChange={(
                              event,
                            ) => {
                              setContactEmail(
                                event
                                  .target
                                  .value,
                              );

                              setError(
                                null,
                              );
                            }}
                          />
                        </label>

                        <label>
                          Telegram

                          <input
                            value={
                              contactTelegram
                            }
                            maxLength={
                              100
                            }
                            placeholder="@username"
                            onChange={(
                              event,
                            ) => {
                              setContactTelegram(
                                event
                                  .target
                                  .value,
                              );

                              setError(
                                null,
                              );
                            }}
                          />
                        </label>

                        <label>
                          Organization

                          <input
                            value={
                              organizationName
                            }
                            maxLength={
                              200
                            }
                            autoComplete="organization"
                            placeholder="Optional"
                            onChange={(
                              event,
                            ) =>
                              setOrganizationName(
                                event
                                  .target
                                  .value,
                              )
                            }
                          />
                        </label>
                      </div>

                      <p>
                        At least one
                        contact method
                        — email or
                        Telegram — is
                        required.
                      </p>
                    </>
                  )}

                  {error && (
                    <p
                      className="formError"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}

                  <div className="requestNav">
                    <button
                      type="button"
                      className="button buttonGhost"
                      disabled={
                        step === 0 ||
                        submitting
                      }
                      onClick={
                        goBack
                      }
                    >
                      Back
                    </button>

                    {step <
                    steps.length -
                      1 ? (
                      <button
                        type="button"
                        className="button buttonPrimary"
                        onClick={
                          continueFlow
                        }
                      >
                        Continue
                        <ArrowRight />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button buttonPrimary"
                        disabled={
                          submitting
                        }
                        onClick={
                          submitRequest
                        }
                      >
                        {submitting
                          ? "Submitting..."
                          : "Submit request"}

                        {!submitting && (
                          <ArrowRight />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <aside className="requestSummary">
                  <span className="eyebrow">
                    PROJECT BRIEF
                  </span>

                  <h3>
                    {projectType}
                  </h3>

                  <p>
                    {summary}
                  </p>

                  <div>
                    <span>
                      Platforms
                    </span>

                    <strong>
                      {platforms.length
                        ? platforms.join(
                            ", ",
                          )
                        : "Not selected"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Timing
                    </span>

                    <strong>
                      {
                        targetTiming
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Budget
                    </span>

                    <strong>
                      {
                        budgetStage
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      Draft
                    </strong>
                  </div>
                </aside>
              </>
            ) : (
              <div className="submittedState">
                <CheckCircle2 />

                <h2>
                  Project request
                  submitted.
                </h2>

                <p>
                  Your project brief
                  was stored
                  successfully and is
                  ready for SysOne
                  review.
                </p>

                <div>
                  <span>
                    Request ID
                  </span>

                  <strong>
                    {
                      submitted.id
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      submitted.status
                    }
                  </strong>
                </div>

                <button
                  type="button"
                  className="button buttonGhost"
                  onClick={
                    resetRequest
                  }
                >
                  Create another
                  request
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}