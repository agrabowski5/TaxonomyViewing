import type { TaxonomyType } from "../types";

/** A single step recorded in the wizard decision trail */
export interface DecisionStep {
  stepNumber: number;
  question: string;
  answer: "yes" | "no";
}

/** The five universal meta-parameter dimensions */
export type MetaDimension = "geography" | "time" | "jurisdiction" | "production_standard" | "grade";

/** A meta-parameter annotation attached to a custom node */
export interface MetaParameter {
  id: string;
  dimension: MetaDimension;
  value: string;
}

/** A cross-taxonomy mapping link on a custom node */
export interface TaxonomyMappingLink {
  id: string;
  sourceTaxonomy: TaxonomyType;
  sourceNodeId: string;
  sourceCode: string;
  sourceDescription: string;
}

/** Origin tracking for nodes cloned from an existing taxonomy */
export interface SourceOrigin {
  taxonomy: TaxonomyType;
  originalNodeId: string;
  originalCode: string;
}

/** A single custom taxonomy node */
export interface CustomNode {
  id: string;
  code: string;
  name: string;
  definition: string;
  type: "leaf" | "internal";
  parentId: string | null;
  notes: string;
  governanceFlagged: boolean;
  metaParameters: MetaParameter[];
  mappingLinks: TaxonomyMappingLink[];
  siblingDisambiguation: string;
  decisionTrail: DecisionStep[];
  children: CustomNode[];
  createdAt: string;
  sourceOrigin?: SourceOrigin;
}

/** Wizard step identifiers matching the 7-step decision tree */
export type WizardStepId =
  | "step1"
  | "step2"
  | "step3"
  | "step4"
  | "step5"
  | "step6"
  | "step7"
  | "action_select_existing"
  | "action_create_composition"
  | "action_attach_meta"
  | "action_flag_governance"
  | "action_create_subnode"
  | "action_create_peer";

export interface WizardHistoryEntry {
  stepId: WizardStepId;
  answer: "yes" | "no" | null;
}

export interface WizardState {
  active: boolean;
  currentStep: WizardStepId;
  history: WizardHistoryEntry[];
  parentNodeId: string | null;
  targetNodeId: string | null;
}

export interface SavedAppState {
  leftTaxonomy: TaxonomyType;
  rightTaxonomy: TaxonomyType;
}

export interface BuilderState {
  active: boolean;
  customTree: CustomNode[];
  rootName: string;
  wizard: WizardState;
  selectedCustomNodeId: string | null;
  guideSidebarOpen: boolean;
  lastSavedAt: string | null;
  savedAppState: SavedAppState | null;
  showResetDialog: boolean;
  showExportPanel: boolean;
  baseTaxonomy: TaxonomyType | null;
  quickAddActive: boolean;
}

export type BuilderAction =
  | { type: "ENTER_BUILDER"; savedAppState: SavedAppState }
  | { type: "EXIT_BUILDER" }
  | { type: "SET_ROOT_NAME"; name: string }
  | { type: "ADD_NODE"; node: CustomNode }
  | { type: "UPDATE_NODE"; id: string; updates: Partial<CustomNode> }
  | { type: "DELETE_NODE"; id: string }
  | { type: "ADD_MAPPING_LINK"; nodeId: string; link: TaxonomyMappingLink }
  | { type: "REMOVE_MAPPING_LINK"; nodeId: string; linkId: string }
  | { type: "ADD_META_PARAM"; nodeId: string; param: MetaParameter }
  | { type: "REMOVE_META_PARAM"; nodeId: string; paramId: string }
  | { type: "WIZARD_START"; parentNodeId: string | null }
  | { type: "WIZARD_ANSWER"; stepId: WizardStepId; answer: "yes" | "no"; nextStep: WizardStepId }
  | { type: "WIZARD_BACK" }
  | { type: "WIZARD_RESET" }
  | { type: "SELECT_CUSTOM_NODE"; id: string | null }
  | { type: "TOGGLE_GUIDE_SIDEBAR" }
  | { type: "TOGGLE_RESET_DIALOG" }
  | { type: "TOGGLE_EXPORT_PANEL" }
  | { type: "LOAD_STATE"; state: BuilderState }
  | { type: "MARK_SAVED" }
  | { type: "IMPORT_BASE_TAXONOMY"; tree: CustomNode[]; taxonomy: TaxonomyType; rootName: string }
  | { type: "QUICK_ADD_START"; parentNodeId: string | null }
  | { type: "QUICK_ADD_CANCEL" };

export interface PersistedBuilderData {
  version: 1;
  state: BuilderState;
  savedAt: string;
}
