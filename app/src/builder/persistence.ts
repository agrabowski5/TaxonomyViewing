import type { BuilderState, PersistedBuilderData, CustomNode, ModificationStatus, OriginalSnapshot, TaxonomyLibrary, SavedTaxonomyEntry } from "./types";

const STORAGE_KEY = "customTaxonomy_v1";
const LIBRARY_KEY = "customTaxonomyLibrary_v1";

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

// --- Multi-taxonomy library ---

function countCustomNodes(nodes: CustomNode[]): number {
  let count = nodes.length;
  for (const n of nodes) {
    if (n.children.length > 0) count += countCustomNodes(n.children);
  }
  return count;
}

function loadLibraryRaw(): TaxonomyLibrary {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (!raw) return { version: 1, entries: [] };
    const lib: TaxonomyLibrary = JSON.parse(raw);
    if (lib.version !== 1) return { version: 1, entries: [] };
    return lib;
  } catch {
    return { version: 1, entries: [] };
  }
}

function saveLibraryRaw(lib: TaxonomyLibrary): void {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadLibrary(): SavedTaxonomyEntry[] {
  return loadLibraryRaw().entries;
}

export function saveToLibrary(name: string, state: BuilderState): string {
  const lib = loadLibraryRaw();
  const id = crypto.randomUUID();
  const compactTree = state.customTree.map(compactNode);
  const entry: SavedTaxonomyEntry = {
    id,
    name,
    savedAt: new Date().toISOString(),
    nodeCount: countCustomNodes(state.customTree),
    baseTaxonomy: state.baseTaxonomy,
    state: {
      ...state,
      customTree: compactTree as unknown as CustomNode[],
    },
  };
  lib.entries.push(entry);
  saveLibraryRaw(lib);
  return id;
}

export function loadFromLibrary(id: string): BuilderState | null {
  const lib = loadLibraryRaw();
  const entry = lib.entries.find((e) => e.id === id);
  if (!entry) return null;
  try {
    const expandedTree = (entry.state.customTree as unknown as Record<string, unknown>[]).map(expandNode);
    return {
      ...entry.state,
      customTree: expandedTree,
      baseTaxonomy: entry.state.baseTaxonomy ?? null,
      quickAddActive: entry.state.quickAddActive ?? false,
      previousRightTaxonomy: entry.state.previousRightTaxonomy ?? null,
    };
  } catch {
    return null;
  }
}

export function deleteFromLibrary(id: string): void {
  const lib = loadLibraryRaw();
  lib.entries = lib.entries.filter((e) => e.id !== id);
  saveLibraryRaw(lib);
}

export function renameInLibrary(id: string, name: string): void {
  const lib = loadLibraryRaw();
  const entry = lib.entries.find((e) => e.id === id);
  if (entry) {
    entry.name = name;
    saveLibraryRaw(lib);
  }
}
