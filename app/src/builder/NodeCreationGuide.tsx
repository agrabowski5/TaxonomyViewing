import { useState } from "react";
import { useBuilder } from "./context";
import { NodeCreationForm } from "./NodeCreationForm";
import type { WizardStepId } from "./types";

interface StepConfig {
  label: string;
  question: string;
  yesNext: WizardStepId;
  noNext: WizardStepId;
  yesLabel?: string;
  noLabel?: string;
}

const STEPS: Record<string, StepConfig> = {
  step1: {
    label: "Step 1",
    question: "Does an existing node's definitional rule unambiguously apply to this item?",
    yesNext: "action_select_existing",
    noNext: "step2",
  },
  step2: {
    label: "Step 2",
    question: "Can the item be fully represented as a fixed composition of existing nodes?",
    yesNext: "action_create_composition",
    noNext: "step3",
  },
  step3: {
    label: "Step 3",
    question: "Does any existing node partially cover this item's function (resembles it but differs in some respect)?",
    yesNext: "step4",
    noNext: "step6",
  },
  step4: {
    label: "Step 4",
    question: "Is the difference from the closest node continuous or ordinal (e.g., purity, grade, intensity, age)?",
    yesNext: "step5",
    noNext: "step6",
    yesLabel: "Yes (continuous/ordinal)",
    noLabel: "No (categorically discrete)",
  },
  step5: {
    label: "Step 5",
    question: "Is the primary distinguishing characteristic contextual — defined by geography, time, regulatory regime, production standard, or certification — rather than by what the item is or does?",
    yesNext: "step7",
    noNext: "step6",
    yesLabel: "Yes (contextual)",
    noLabel: "No (functional difference)",
  },
  step6: {
    label: "Step 6",
    question: "Can you state a clear, reusable definitional rule for this item that remains valid if applied uniformly, without forcing redefinition of sibling nodes?",
    yesNext: "step9",
    noNext: "action_flag_governance",
  },
  step7: {
    label: "Step 7",
    question: "Does the distinguishing characteristic map to a pre-declared parameter in the meta-parameter registry? (Registry: grade, origin, certification, vintage, regulatory_status, production_standard, geographic_origin, time_period)",
    yesNext: "step8",
    noNext: "step6",
  },
  step8: {
    label: "Step 8",
    question: "Is this parameter meaningful and applicable to ALL instances of the target node, not just this specific item?",
    yesNext: "step8a",
    noNext: "step6",
    noLabel: "No (node needs splitting)",
  },
  step8a: {
    label: "Step 8a",
    question: "Does the target node already carry the maximum permitted number of meta-parameters? (Default max: 3)",
    yesNext: "action_flag_overparameterized",
    noNext: "action_attach_meta",
  },
  step9: {
    label: "Step 9",
    question: "Does an existing node partially but not fully cover this item (i.e., the item is a proper functional subset of an existing node)?",
    yesNext: "action_create_subnode",
    noNext: "action_create_peer",
  },
};

interface ActionConfig {
  title: string;
  description: string;
  showForm: boolean;
}

const ACTIONS: Record<string, ActionConfig> = {
  action_select_existing: {
    title: "Select Existing Node",
    description: "Use the node-picker on the other panel to select and use the existing node that applies.",
    showForm: false,
  },
  action_create_composition: {
    title: "Create Composition Node",
    description: "Create a new Composition node that links to the selected component nodes from existing taxonomies.",
    showForm: true,
  },
  action_flag_governance: {
    title: "Flag for Governance Review",
    description: "This item cannot be definitionally distinguished without risk of inconsistency. Save a note and flag for governance review.",
    showForm: false,
  },
  action_flag_overparameterized: {
    title: "Over-Parameterized Node",
    description: "The target node already carries the maximum number of meta-parameters (3). This requires governance review before proceeding.",
    showForm: false,
  },
  action_attach_meta: {
    title: "Attach Meta-Parameter",
    description: "Attach the identified meta-parameter to the existing node to distinguish this variant.",
    showForm: false,
  },
  action_create_subnode: {
    title: "Create Sub-Node",
    description: "Create a new node under the selected parent node to capture this more specific classification.",
    showForm: true,
  },
  action_create_peer: {
    title: "Create Peer / Top-Level Node",
    description: "Create a new node at the same level or as a top-level entry in your custom taxonomy.",
    showForm: true,
  },
};

export function NodeCreationGuide() {
  const { state, dispatch } = useBuilder();
  const [showForm, setShowForm] = useState(false);
  const [governanceNote, setGovernanceNote] = useState("");

  if (!state.guideSidebarOpen) return null;

  const { wizard } = state;
  const currentStep = wizard.currentStep;
  const stepConfig = STEPS[currentStep];
  const actionConfig = ACTIONS[currentStep];
  const isAction = currentStep.startsWith("action_");

  const handleAnswer = (answer: "yes" | "no") => {
    if (!stepConfig) return;
    const nextStep = answer === "yes" ? stepConfig.yesNext : stepConfig.noNext;
    dispatch({
      type: "WIZARD_ANSWER",
      stepId: currentStep,
      answer,
      nextStep,
    });
  };

  const handleBack = () => {
    dispatch({ type: "WIZARD_BACK" });
    setShowForm(false);
  };

  const handleActionClick = () => {
    if (actionConfig?.showForm) {
      setShowForm(true);
    }
  };

  const handleFormComplete = () => {
    setShowForm(false);
    dispatch({ type: "WIZARD_RESET" });
  };

  return (
    <div className={`builder-guide-sidebar ${state.guideSidebarOpen ? "" : "collapsed"}`}>
      <div className="builder-guide-header">
        <h3>Node Creation Guide</h3>
        <button
          className="builder-guide-close"
          onClick={() => dispatch({ type: "TOGGLE_GUIDE_SIDEBAR" })}
        >
          ×
        </button>
      </div>

      <div className="builder-guide-content">
        {!wizard.active ? (
          <div className="wizard-inactive">
            <p>Use this guided wizard to determine the best way to classify a new item in your custom taxonomy.</p>
            <p>Click "Add Node" in the taxonomy panel or start the wizard below.</p>
            <button
              className="wizard-start-btn"
              onClick={() => dispatch({ type: "WIZARD_START", parentNodeId: state.selectedCustomNodeId })}
            >
              Start Wizard
            </button>
          </div>
        ) : showForm ? (
          <NodeCreationForm
            parentNodeId={wizard.parentNodeId}
            decisionTrail={wizard.history.map((h, i) => ({
              stepNumber: i + 1,
              question: STEPS[h.stepId]?.question ?? h.stepId,
              answer: h.answer ?? "yes",
            }))}
            onComplete={handleFormComplete}
            onCancel={() => setShowForm(false)}
          />
        ) : (
          <>
            {/* Breadcrumbs */}
            {wizard.history.length > 0 && (
              <div className="wizard-breadcrumbs">
                {wizard.history.map((entry, i) => (
                  <span key={i}>
                    <button
                      className="wizard-breadcrumb"
                      onClick={() => {
                        // Go back to this step by repeatedly dispatching WIZARD_BACK
                        const stepsToGoBack = wizard.history.length - i;
                        for (let j = 0; j < stepsToGoBack; j++) {
                          dispatch({ type: "WIZARD_BACK" });
                        }
                        setShowForm(false);
                      }}
                    >
                      {STEPS[entry.stepId]?.label ?? entry.stepId}
                      {entry.answer ? ` → ${entry.answer === "yes" ? "Yes" : "No"}` : ""}
                    </button>
                    <span className="wizard-breadcrumb-arrow"> → </span>
                  </span>
                ))}
                <span className="wizard-breadcrumb-current">
                  {stepConfig?.label ?? actionConfig?.title ?? currentStep}
                </span>
              </div>
            )}

            {/* Current Step or Action */}
            {isAction && actionConfig ? (
              <div className="wizard-action">
                <div className="wizard-action-title">{actionConfig.title}</div>
                <div className="wizard-action-description">{actionConfig.description}</div>

                {currentStep === "action_flag_governance" && (
                  <div className="wizard-governance-note">
                    <textarea
                      placeholder="Add a note explaining why this item is difficult to classify..."
                      value={governanceNote}
                      onChange={(e) => setGovernanceNote(e.target.value)}
                    />
                  </div>
                )}

                {actionConfig.showForm && (
                  <button className="wizard-action-btn" onClick={handleActionClick}>
                    Create Node
                  </button>
                )}

                <button
                  className="wizard-btn-back"
                  onClick={handleBack}
                  style={{ marginTop: 12 }}
                >
                  ← Back
                </button>
                <button
                  className="wizard-btn-back"
                  onClick={() => {
                    dispatch({ type: "WIZARD_RESET" });
                    setGovernanceNote("");
                    setShowForm(false);
                  }}
                  style={{ marginTop: 8 }}
                >
                  Start Over
                </button>
              </div>
            ) : stepConfig ? (
              <div className="wizard-step">
                <div className="wizard-step-number">{stepConfig.label}</div>
                <div className="wizard-question">{stepConfig.question}</div>
                <div className="wizard-buttons">
                  <button className="wizard-btn-yes" onClick={() => handleAnswer("yes")}>
                    {stepConfig.yesLabel ?? "Yes"}
                  </button>
                  <button className="wizard-btn-no" onClick={() => handleAnswer("no")}>
                    {stepConfig.noLabel ?? "No"}
                  </button>
                </div>
                {wizard.history.length > 0 && (
                  <button className="wizard-btn-back" onClick={handleBack}>
                    ← Back
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
