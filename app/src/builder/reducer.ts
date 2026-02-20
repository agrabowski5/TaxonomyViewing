import type { BuilderState, BuilderAction, CustomNode, WizardState } from "./types";

const INITIAL_WIZARD: WizardState = {
  active: false,
  currentStep: "step1",
  history: [],
  parentNodeId: null,
  targetNodeId: null,
};

export const INITIAL_STATE: BuilderState = {
  active: false,
  customTree: [],
  rootName: "My Custom Taxonomy",
  wizard: INITIAL_WIZARD,
  selectedCustomNodeId: null,
  guideSidebarOpen: true,
  lastSavedAt: null,
  savedAppState: null,
  showResetDialog: false,
  showExportPanel: false,
};

function addNodeToTree(tree: CustomNode[], parentId: string | null, node: CustomNode): CustomNode[] {
  if (parentId === null) {
    return [...tree, node];
  }
  return tree.map((n) => {
    if (n.id === parentId) {
      return { ...n, children: [...n.children, node], type: "internal" as const };
    }
    if (n.children.length > 0) {
      return { ...n, children: addNodeToTree(n.children, parentId, node) };
    }
    return n;
  });
}

function updateNodeInTree(tree: CustomNode[], id: string, updates: Partial<CustomNode>): CustomNode[] {
  return tree.map((n) => {
    if (n.id === id) {
      return { ...n, ...updates };
    }
    if (n.children.length > 0) {
      return { ...n, children: updateNodeInTree(n.children, id, updates) };
    }
    return n;
  });
}

function deleteNodeFromTree(tree: CustomNode[], id: string): CustomNode[] {
  return tree
    .filter((n) => n.id !== id)
    .map((n) => {
      if (n.children.length > 0) {
        return { ...n, children: deleteNodeFromTree(n.children, id) };
      }
      return n;
    });
}

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

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "ENTER_BUILDER":
      return {
        ...state,
        active: true,
        savedAppState: action.savedAppState,
        guideSidebarOpen: true,
      };

    case "EXIT_BUILDER":
      return {
        ...state,
        active: false,
        wizard: INITIAL_WIZARD,
        showResetDialog: false,
        showExportPanel: false,
      };

    case "SET_ROOT_NAME":
      return { ...state, rootName: action.name };

    case "ADD_NODE":
      return {
        ...state,
        customTree: addNodeToTree(state.customTree, action.node.parentId, action.node),
        wizard: INITIAL_WIZARD,
      };

    case "UPDATE_NODE":
      return {
        ...state,
        customTree: updateNodeInTree(state.customTree, action.id, action.updates),
      };

    case "DELETE_NODE":
      return {
        ...state,
        customTree: deleteNodeFromTree(state.customTree, action.id),
        selectedCustomNodeId: state.selectedCustomNodeId === action.id ? null : state.selectedCustomNodeId,
      };

    case "ADD_MAPPING_LINK": {
      const node = findNodeInTree(state.customTree, action.nodeId);
      if (!node) return state;
      return {
        ...state,
        customTree: updateNodeInTree(state.customTree, action.nodeId, {
          mappingLinks: [...node.mappingLinks, action.link],
        }),
      };
    }

    case "REMOVE_MAPPING_LINK": {
      const node = findNodeInTree(state.customTree, action.nodeId);
      if (!node) return state;
      return {
        ...state,
        customTree: updateNodeInTree(state.customTree, action.nodeId, {
          mappingLinks: node.mappingLinks.filter((l) => l.id !== action.linkId),
        }),
      };
    }

    case "ADD_META_PARAM": {
      const node = findNodeInTree(state.customTree, action.nodeId);
      if (!node) return state;
      return {
        ...state,
        customTree: updateNodeInTree(state.customTree, action.nodeId, {
          metaParameters: [...node.metaParameters, action.param],
        }),
      };
    }

    case "REMOVE_META_PARAM": {
      const node = findNodeInTree(state.customTree, action.nodeId);
      if (!node) return state;
      return {
        ...state,
        customTree: updateNodeInTree(state.customTree, action.nodeId, {
          metaParameters: node.metaParameters.filter((p) => p.id !== action.paramId),
        }),
      };
    }

    case "WIZARD_START":
      return {
        ...state,
        wizard: {
          active: true,
          currentStep: "step1",
          history: [],
          parentNodeId: action.parentNodeId,
          targetNodeId: null,
        },
      };

    case "WIZARD_ANSWER":
      return {
        ...state,
        wizard: {
          ...state.wizard,
          currentStep: action.nextStep,
          history: [
            ...state.wizard.history,
            { stepId: action.stepId, answer: action.answer },
          ],
        },
      };

    case "WIZARD_BACK": {
      if (state.wizard.history.length === 0) {
        return { ...state, wizard: INITIAL_WIZARD };
      }
      const newHistory = state.wizard.history.slice(0, -1);
      const previousStep = newHistory.length > 0
        ? state.wizard.history[state.wizard.history.length - 1].stepId
        : "step1";
      return {
        ...state,
        wizard: {
          ...state.wizard,
          currentStep: previousStep,
          history: newHistory,
        },
      };
    }

    case "WIZARD_RESET":
      return { ...state, wizard: INITIAL_WIZARD };

    case "SELECT_CUSTOM_NODE":
      return { ...state, selectedCustomNodeId: action.id };

    case "TOGGLE_GUIDE_SIDEBAR":
      return { ...state, guideSidebarOpen: !state.guideSidebarOpen };

    case "TOGGLE_RESET_DIALOG":
      return { ...state, showResetDialog: !state.showResetDialog };

    case "TOGGLE_EXPORT_PANEL":
      return { ...state, showExportPanel: !state.showExportPanel };

    case "LOAD_STATE":
      return {
        ...action.state,
        showResetDialog: false,
        showExportPanel: false,
      };

    case "MARK_SAVED":
      return { ...state, lastSavedAt: new Date().toISOString() };

    default:
      return state;
  }
}
