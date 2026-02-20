import type { TreeNode, LookupEntry, TaxonomyType } from "../types";
import type { CustomNode } from "./types";

/**
 * Recursively converts a standard TreeNode[] into CustomNode[] for use in the builder.
 * Uses incrementing integer IDs for performance with large taxonomies (30K+ nodes).
 */
export function convertTreeToCustom(
  nodes: TreeNode[],
  taxonomy: TaxonomyType,
  lookup: Record<string, LookupEntry>,
  counter: { value: number } = { value: 0 },
  parentId: string | null = null,
): CustomNode[] {
  return nodes.map((node) => {
    const id = `custom-import-${counter.value++}`;
    const cleanCode = node.code.replace(/[\.\s\-]/g, "");
    const lookupEntry = lookup[cleanCode] ?? lookup[node.code];
    const definition = lookupEntry?.description ?? node.name;

    const children = node.children
      ? convertTreeToCustom(node.children, taxonomy, lookup, counter, id)
      : [];

    return {
      id,
      code: node.code,
      name: node.name,
      definition,
      type: (children.length > 0 ? "internal" : "leaf") as "leaf" | "internal",
      parentId,
      notes: "",
      governanceFlagged: false,
      metaParameters: [],
      mappingLinks: [{
        id: `link-import-${counter.value++}`,
        sourceTaxonomy: taxonomy,
        sourceNodeId: node.id,
        sourceCode: node.code,
        sourceDescription: node.name,
      }],
      siblingDisambiguation: "",
      decisionTrail: [],
      children,
      createdAt: new Date().toISOString(),
      sourceOrigin: {
        taxonomy,
        originalNodeId: node.id,
        originalCode: node.code,
      },
      modificationStatus: "original" as const,
      originalSnapshot: {
        code: node.code,
        name: node.name,
        definition,
      },
    };
  });
}

/** Count total nodes in a TreeNode tree */
export function countTreeNodes(nodes: TreeNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countTreeNodes(node.children);
    }
  }
  return count;
}
