import type { BuilderState, PersistedBuilderData, CustomNode, ModificationStatus, OriginalSnapshot } from "./types";

const STORAGE_KEY = "customTaxonomy_v1";

/** Strip default-valued fields from CustomNode to reduce JSON size */
function compactNode(node: CustomNode): Record<string, unknown> {
  const compact: Record<string, unknown> = {
    id: node.id,
    code: node.code,
    name: node.name,
    type: node.type,
    parentId: node.parentId,
  };

  if (node.definition && node.definition !== node.name) compact.definition = node.definition;
  if (node.notes) compact.notes = node.notes;
  if (node.governanceFlagged) compact.governanceFlagged = true;
  if (node.metaParameters.length > 0) compact.metaParameters = node.metaParameters;
  if (node.mappingLinks.length > 0) compact.mappingLinks = node.mappingLinks;
  if (node.siblingDisambiguation) compact.siblingDisambiguation = node.siblingDisambiguation;
  if (node.decisionTrail.length > 0) compact.decisionTrail = node.decisionTrail;
  if (node.sourceOrigin) compact.sourceOrigin = node.sourceOrigin;
  if (node.modificationStatus !== "original") compact.modificationStatus = node.modificationStatus;
  if (node.originalSnapshot) compact.originalSnapshot = node.originalSnapshot;
  compact.createdAt = node.createdAt;

  if (node.children.length > 0) {
    compact.children = node.children.map(compactNode);
  }

  return compact;
}

/** Restore a compacted node back to full CustomNode shape */
function expandNode(compact: Record<string, unknown>): CustomNode {
  return {
    id: compact.id as string,
    code: compact.code as string,
    name: compact.name as string,
    definition: (compact.definition as string) ?? (compact.name as string),
    type: compact.type as "leaf" | "internal",
    parentId: compact.parentId as string | null,
    notes: (compact.notes as string) ?? "",
    governanceFlagged: (compact.governanceFlagged as boolean) ?? false,
    metaParameters: (compact.metaParameters as CustomNode["metaParameters"]) ?? [],
    mappingLinks: (compact.mappingLinks as CustomNode["mappingLinks"]) ?? [],
    siblingDisambiguation: (compact.siblingDisambiguation as string) ?? "",
    decisionTrail: (compact.decisionTrail as CustomNode["decisionTrail"]) ?? [],
    children: compact.children
      ? (compact.children as Record<string, unknown>[]).map(expandNode)
      : [],
    createdAt: (compact.createdAt as string) ?? new Date().toISOString(),
    sourceOrigin: compact.sourceOrigin as CustomNode["sourceOrigin"],
    modificationStatus: (compact.modificationStatus as ModificationStatus) ?? "original",
    originalSnapshot: compact.originalSnapshot as OriginalSnapshot | undefined,
  };
}

export function saveBuilderState(state: BuilderState): void {
  const compactTree = state.customTree.map(compactNode);
  const data: PersistedBuilderData = {
    version: 1,
    state: {
      ...state,
      customTree: compactTree as unknown as CustomNode[],
    },
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadBuilderState(): BuilderState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: PersistedBuilderData = JSON.parse(raw);
    if (data.version !== 1) return null;

    const expandedTree = (data.state.customTree as unknown as Record<string, unknown>[]).map(expandNode);

    return {
      ...data.state,
      customTree: expandedTree,
      baseTaxonomy: data.state.baseTaxonomy ?? null,
      quickAddActive: data.state.quickAddActive ?? false,
      previousRightTaxonomy: data.state.previousRightTaxonomy ?? null,
    };
  } catch {
    return null;
  }
}

export function clearBuilderState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}
