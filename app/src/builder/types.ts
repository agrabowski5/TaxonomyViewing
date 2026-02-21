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

/** Tracks what changed relative to the base taxonomy */
export type ModificationStatus = "original" | "modified" | "added";

/** Snapshot of original values for diff highlighting */
export interface OriginalSnapshot {
  code: string;
  name: string;
  definition: string;
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
  modificationStatus: ModificationStatus;
  originalSnapshot?: OriginalSnapshot;
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

export interface BuilderState {
  active: boolean;
  customTree: CustomNode[];
  rootName: string;
  wizard: WizardState;
  selectedCustomNodeId: string | null;
  guideSidebarOpen: boolean;
  lastSavedAt: string | null;
  previousRightTaxonomy: TaxonomyType | null;
  showResetDialog: boolean;
  showExportPanel: boolean;
  baseTaxonomy: TaxonomyType | null;
  quickAddActive: boolean;
}

export type BuilderAction =
  | { type: "ENTER_BUILDER"; previousRightTaxonomy: TaxonomyType }
  | { type: "EXIT_BUILDER"; clearData?: boolean }
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
  | { type: "QUICK_ADD_CANCEL" }
  | { type: "INLINE_EDIT_NODE"; id: string; field: "name" | "code" | "definition"; value: string };

export interface PersistedBuilderData {
  version: 1;
  state: BuilderState;
  savedAt: string;
}

export interface SavedTaxonomyEntry {
  id: string;
  name: string;
  savedAt: string;
  nodeCount: number;
  baseTaxonomy: TaxonomyType | null;
  state: BuilderState;
}

export interface TaxonomyLibrary {
  version: 1;
  entries: SavedTaxonomyEntry[];
}
