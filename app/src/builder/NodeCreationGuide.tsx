import { useState } from "react";
import { useBuilder } from "./context";
import { NodeCreationForm } from "./NodeCreationForm";
import { MetaParameterValueInput } from "./MetaParameterValueInput";
import type { WizardStepId, MetaDimension, CustomNode } from "./types";

interface StepConfig {
  label: string;
  question: string;
  yesNext: WizardStepId;
  noNext: WizardStepId;
  yesLabel?: string;
  noLabel?: string;
  helperText?: string;
}

const STEPS: Record<string, StepConfig> = {
  step1: {
    label: "Step 1 \u2014 Direct Match",
    question:
      "Does an existing node's definitional name cover this item at the level of specificity required for it to be economically useful?",
    yesNext: "action_select_existing",
    noNext: "step2",
  },
  step2: {
    label: "Step 2 \u2014 Compositional Match",
    question:
      "Can the item be fully represented as a composition of existing nodes?",
    yesNext: "action_create_composition",
    noNext: "step3",
  },
  step3: {
    label: "Step 3 \u2014 Partial Coverage",
    question:
      "Does any existing node partially cover this item's function (resembles it but differs)?",
    yesNext: "step4",
    noNext: "step6",
    noLabel: "No (functionally novel)",
  },
  step4: {
    label: "Step 4 \u2014 Continuous or Ordinal Difference",
    question:
      "Is the difference from the closest node continuous (e.g., purity, grade, intensity)?",
    yesNext: "step5",
    noNext: "step6",
    noLabel: "No (categorically discrete)",
  },
  step5: {
    label: "Step 5 \u2014 Meta-Parameter Capture",
    question:
      "Is this distinction fully expressible using the meta-parameter dimensions?",
    yesNext: "action_attach_meta",
    noNext: "step6",
    helperText: "Geography \u00b7 Time \u00b7 Jurisdiction \u00b7 Production standard \u00b7 Grade",
  },
  step6: {
    label: "Step 6 \u2014 Rule Articulation",
    question:
      "Can you write a one-sentence definitional name a different analyst could apply consistently to any new item?",
    yesNext: "step7",
    noNext: "action_flag_governance",
  },
  step7: {
    label: "Step 7 \u2014 Node vs. Sub-Node",
    question:
      "Does an existing node partially but not fully cover this item (item is a functional subset)?",
    yesNext: "action_create_subnode",
    noNext: "action_create_peer",
  },
};

interface ActionConfig {
  title: string;
  description: string;
  actionType: "form" | "meta" | "governance" | "select";
}

const ACTIONS: Record<string, ActionConfig> = {
  action_select_existing: {
    title: "Select Existing Node",
    description:
      "Use the node picker on the other taxonomy panel to select the existing node that applies. Link it to the custom taxonomy.",
    actionType: "select",
  },
  action_create_composition: {
    title: "Create Composition Node",
    description:
      "Select multiple existing nodes to compose. Create a composition node linking them.",
    actionType: "form",
  },
  action_attach_meta: {
    title: "Attach Meta-Parameter",
    description:
      "Record which meta-parameter dimensions apply and their values. Attach to the existing node.",
    actionType: "meta",
  },
  action_flag_governance: {
    title: "Pending Governance Review",
    description:
      "This item cannot be definitionally distinguished without risk of inconsistency. Save a note documenting the ambiguity.",
    actionType: "governance",
  },
  action_create_subnode: {
    title: "Create Sub-Node",
    description:
      "Select the parent node. Create a new sub-node under it to capture this more specific classification.",
    actionType: "form",
  },
  action_create_peer: {
    title: "Create Peer / Top-Level Node",
    description:
      "Create a new node at the same level or as a top-level entry in your custom taxonomy.",
    actionType: "form",
  },
};

const META_DIMENSIONS: { key: MetaDimension; label: string }[] = [
  { key: "geography", label: "Geography" },
  { key: "time", label: "Time" },
  { key: "jurisdiction", label: "Jurisdiction" },
  { key: "production_standard", label: "Production standard" },
  { key: "grade", label: "Grade" },
];

function findNodeInTree(tree: CustomNode[], id: string): CustomNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children.length > 0) {
      const found = findNodeInTree(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Editor panel for a selected custom node (shown when wizard is inactive) */
function SelectedNodeEditor() {
  const { state, dispatch } = useBuilder();
  const [newMetaDimension, setNewMetaDimension] = useState<MetaDimension>("geography");
  const [newMetaValue, setNewMetaValue] = useState("");

  if (!state.selectedCustomNodeId) return null;
  const node = findNodeInTree(state.customTree, state.selectedCustomNodeId);
  if (!node) return null;

  const handleFieldChange = (field: "name" | "code" | "definition", value: string) => {
    dispatch({ type: "INLINE_EDIT_NODE", id: node.id, field, value });
  };

  const handleNotesChange = (value: string) => {
    dispatch({ type: "UPDATE_NODE", id: node.id, updates: { notes: value } });
  };

  const handleAddMeta = () => {
    if (!newMetaValue.trim()) return;
    dispatch({
      type: "ADD_META_PARAM",
      nodeId: node.id,
      param: {
        id: crypto.randomUUID(),
        dimension: newMetaDimension,
        value: newMetaValue.trim(),
      },
    });
    setNewMetaValue("");
  };

  const handleDeleteNode = () => {
    dispatch({ type: "DELETE_NODE", id: node.id });
  };

  return (
    <div className="selected-node-editor">
      <h4>Edit Node</h4>

      <div className="builder-form-group">
        <label>Name</label>
        <input
          className="builder-form-input"
          type="text"
          value={node.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
        />
      </div>

      <div className="builder-form-group">
        <label>Code</label>
        <input
          className="builder-form-input"
          type="text"
          value={node.code}
          onChange={(e) => handleFieldChange("code", e.target.value)}
        />
      </div>

      <div className="builder-form-group">
        <label>Definition</label>
        <textarea
          className="builder-form-textarea"
          value={node.definition}
          onChange={(e) => handleFieldChange("definition", e.target.value)}
        />
      </div>

      <div className="builder-form-group">
        <label>Notes</label>
        <textarea
          className="builder-form-textarea"
          value={node.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Additional context or reasoning..."
        />
      </div>

      {/* Meta-parameters */}
      <div className="builder-form-group">
        <label>Meta-Parameters</label>
        {node.metaParameters.length > 0 && (
          <div className="builder-meta-tags" style={{ marginBottom: 6 }}>
            {node.metaParameters.map((mp) => (
              <span key={mp.id} className="builder-meta-tag">
                {mp.dimension}: {mp.value}
                <button
                  className="builder-meta-tag-remove"
                  onClick={() => dispatch({ type: "REMOVE_META_PARAM", nodeId: node.id, paramId: mp.id })}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            className="builder-form-select"
            style={{ flex: 1 }}
            value={newMetaDimension}
            onChange={(e) => setNewMetaDimension(e.target.value as MetaDimension)}
          >
            {META_DIMENSIONS.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
          <MetaParameterValueInput
            dimension={newMetaDimension}
            value={newMetaValue}
            onChange={setNewMetaValue}
            className="builder-form-input"
            style={{ flex: 1 }}
          />
          <button
            className="builder-add-node-btn"
            onClick={handleAddMeta}
            disabled={!newMetaValue.trim()}
            style={{ fontSize: "0.75rem", whiteSpace: "nowrap" }}
          >
            Add
          </button>
        </div>
      </div>

      <button
        className="builder-delete-node-btn"
        onClick={handleDeleteNode}
      >
        Delete Node
      </button>
    </div>
  );
}

export function NodeCreationGuide() {
  const { state, dispatch } = useBuilder();
  const [showForm, setShowForm] = useState(false);
  const [governanceNote, setGovernanceNote] = useState("");
  const [metaEntries, setMetaEntries] = useState<Array<{ dimension: MetaDimension; value: string }>>([]);
  const [definitionDraft, setDefinitionDraft] = useState("");

  if (!state.guideSidebarOpen && !state.quickAddActive) return null;

  // Quick Add mode: show form directly, no wizard
  if (state.quickAddActive) {
    return (
      <div className="builder-guide-sidebar">
        <div className="builder-guide-header">
          <h3>Quick Add Node</h3>
          <button
            className="builder-guide-close"
            onClick={() => dispatch({ type: "QUICK_ADD_CANCEL" })}
          >
            ×
          </button>
        </div>
        <div className="builder-guide-content">
          <NodeCreationForm
            parentNodeId={state.wizard.parentNodeId}
            decisionTrail={[]}
            onComplete={() => dispatch({ type: "QUICK_ADD_CANCEL" })}
            onCancel={() => dispatch({ type: "QUICK_ADD_CANCEL" })}
          />
        </div>
      </div>
    );
  }

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
    if (actionConfig?.actionType === "form") {
      setShowForm(true);
    }
  };

  const handleFormComplete = () => {
    setShowForm(false);
    setDefinitionDraft("");
    dispatch({ type: "WIZARD_RESET" });
  };

  const handleMetaAdd = () => {
    setMetaEntries([...metaEntries, { dimension: "geography", value: "" }]);
  };

  const handleMetaSave = () => {
    if (!state.selectedCustomNodeId) return;
    for (const entry of metaEntries) {
      if (entry.value.trim()) {
        dispatch({
          type: "ADD_META_PARAM",
          nodeId: state.selectedCustomNodeId,
          param: {
            id: crypto.randomUUID(),
            dimension: entry.dimension,
            value: entry.value.trim(),
          },
        });
      }
    }
    setMetaEntries([]);
    dispatch({ type: "WIZARD_RESET" });
  };

  const handleGovernanceSave = () => {
    if (!governanceNote.trim()) return;
    const id = `custom-${crypto.randomUUID()}`;
    dispatch({
      type: "ADD_NODE",
      node: {
        id,
        code: `GOV-${Date.now().toString(36).toUpperCase()}`,
        name: "Pending Governance Review",
        definition: "",
        type: "leaf",
        parentId: wizard.parentNodeId,
        notes: governanceNote.trim(),
        governanceFlagged: true,
        metaParameters: [],
        mappingLinks: [],
        siblingDisambiguation: "",
        decisionTrail: wizard.history.map((h, i) => ({
          stepNumber: i + 1,
          question: STEPS[h.stepId]?.question ?? h.stepId,
          answer: h.answer ?? "yes",
        })),
        children: [],
        createdAt: new Date().toISOString(),
        modificationStatus: "added" as const,
      },
    });
    setGovernanceNote("");
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
          <>
            {/* When wizard is inactive, show selected node editor or start prompt */}
            {state.selectedCustomNodeId ? (
              <SelectedNodeEditor />
            ) : (
              <div className="wizard-inactive">
                <p>Select a node in the tree to edit it, or start the wizard to create a new node.</p>
                <button
                  className="wizard-start-btn"
                  onClick={() => dispatch({ type: "WIZARD_START", parentNodeId: state.selectedCustomNodeId })}
                >
                  Start Wizard
                </button>
              </div>
            )}
          </>
        ) : showForm ? (
          <NodeCreationForm
            parentNodeId={wizard.parentNodeId}
            prefilledDefinition={definitionDraft}
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
                        const stepsToGoBack = wizard.history.length - i;
                        for (let j = 0; j < stepsToGoBack; j++) {
                          dispatch({ type: "WIZARD_BACK" });
                        }
                        setShowForm(false);
                      }}
                    >
                      {STEPS[entry.stepId]?.label ?? entry.stepId}
                      {entry.answer ? ` \u2192 ${entry.answer === "yes" ? "Yes" : "No"}` : ""}
                    </button>
                    <span className="wizard-breadcrumb-arrow"> \u2192 </span>
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

                {/* Governance flag action */}
                {currentStep === "action_flag_governance" && (
                  <div className="wizard-governance-note">
                    <textarea
                      placeholder="Document the ambiguity — why can't this item be definitionally distinguished?"
                      value={governanceNote}
                      onChange={(e) => setGovernanceNote(e.target.value)}
                    />
                    <button
                      className="wizard-action-btn"
                      onClick={handleGovernanceSave}
                      disabled={!governanceNote.trim()}
                      style={{ marginTop: 8 }}
                    >
                      Save &amp; Flag for Review
                    </button>
                  </div>
                )}

                {/* Meta-parameter attach action */}
                {currentStep === "action_attach_meta" && (
                  <div className="wizard-meta-form">
                    <div className="wizard-meta-dimensions-label">
                      Select dimensions and enter values:
                    </div>
                    {metaEntries.map((entry, i) => (
                      <div key={i} className="wizard-meta-entry">
                        <select
                          value={entry.dimension}
                          onChange={(e) => {
                            const updated = [...metaEntries];
                            updated[i] = { ...entry, dimension: e.target.value as MetaDimension };
                            setMetaEntries(updated);
                          }}
                        >
                          {META_DIMENSIONS.map((d) => (
                            <option key={d.key} value={d.key}>{d.label}</option>
                          ))}
                        </select>
                        <MetaParameterValueInput
                          dimension={entry.dimension}
                          value={entry.value}
                          onChange={(val) => {
                            const updated = [...metaEntries];
                            updated[i] = { ...entry, value: val };
                            setMetaEntries(updated);
                          }}
                        />
                        <button
                          className="builder-meta-tag-remove"
                          onClick={() => setMetaEntries(metaEntries.filter((_, j) => j !== i))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button className="wizard-meta-add-btn" onClick={handleMetaAdd}>
                      + Add Dimension
                    </button>
                    <button
                      className="wizard-action-btn"
                      onClick={handleMetaSave}
                      disabled={metaEntries.length === 0 || !metaEntries.some((e) => e.value.trim())}
                      style={{ marginTop: 8 }}
                    >
                      Attach Parameters
                    </button>
                  </div>
                )}

                {/* Node creation actions */}
                {actionConfig.actionType === "form" && (
                  <button className="wizard-action-btn" onClick={handleActionClick}>
                    Create Node
                  </button>
                )}

                <div className="wizard-action-nav">
                  <button className="wizard-btn-back" onClick={handleBack}>
                    \u2190 Back
                  </button>
                  <button
                    className="wizard-btn-back"
                    onClick={() => {
                      dispatch({ type: "WIZARD_RESET" });
                      setGovernanceNote("");
                      setMetaEntries([]);
                      setShowForm(false);
                      setDefinitionDraft("");
                    }}
                  >
                    Start Over
                  </button>
                </div>
              </div>
            ) : stepConfig ? (
              <div className="wizard-step">
                <div className="wizard-step-number">{stepConfig.label}</div>
                <div className="wizard-question">{stepConfig.question}</div>
                {stepConfig.helperText && (
                  <div className="wizard-helper-text">{stepConfig.helperText}</div>
                )}

                {/* For Step 6, show a definition input before Yes/No */}
                {currentStep === "step6" && (
                  <div className="wizard-definition-input">
                    <input
                      type="text"
                      placeholder="Write your one-sentence definitional name here..."
                      value={definitionDraft}
                      onChange={(e) => setDefinitionDraft(e.target.value)}
                      className="builder-form-input"
                    />
                  </div>
                )}

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
                    \u2190 Back
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
