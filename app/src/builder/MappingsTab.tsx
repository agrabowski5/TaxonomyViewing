import { useState } from "react";
import { useBuilder } from "./context";
import type { TreeNode, TaxonomyType } from "../types";
import type { CustomNode } from "./types";

function findCustomNode(tree: CustomNode[], id: string): CustomNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children.length > 0) {
      const found = findCustomNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function flattenCustomNodes(tree: CustomNode[]): CustomNode[] {
  const result: CustomNode[] = [];
  for (const n of tree) {
    result.push(n);
    if (n.children.length > 0) {
      result.push(...flattenCustomNodes(n.children));
    }
  }
  return result;
}

type Props =
  | {
      mode: "display";
      selectedCustomNodeId: string;
      sourceNode?: undefined;
      sourceTaxonomy?: undefined;
    }
  | {
      mode: "map-action";
      sourceNode: TreeNode;
      sourceTaxonomy: TaxonomyType;
      selectedCustomNodeId?: undefined;
    };

export function MappingsTab({ mode, selectedCustomNodeId, sourceNode, sourceTaxonomy }: Props) {
  const { state, dispatch } = useBuilder();
  const [selectedTarget, setSelectedTarget] = useState("");

  if (mode === "display") {
    const node = findCustomNode(state.customTree, selectedCustomNodeId);
    if (!node) return null;
    if (node.mappingLinks.length === 0) {
      return (
        <div className="builder-mappings-section">
          <div className="builder-mappings-title">Cross-Taxonomy Mappings</div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            No mappings yet. Select a node in a standard taxonomy and use "Map to Custom Node" to create links.
          </p>
        </div>
      );
    }

    return (
      <div className="builder-mappings-section">
        <div className="builder-mappings-title">
          Cross-Taxonomy Mappings ({node.mappingLinks.length})
        </div>
        {node.mappingLinks.map((link) => (
          <div key={link.id} className="builder-mapping-item">
            <span className="builder-mapping-taxonomy">{link.sourceTaxonomy.toUpperCase()}</span>
            <span className="builder-mapping-code">{link.sourceCode}</span>
            <span className="builder-mapping-desc">{link.sourceDescription}</span>
            <button
              className="builder-mapping-remove"
              onClick={() =>
                dispatch({
                  type: "REMOVE_MAPPING_LINK",
                  nodeId: selectedCustomNodeId,
                  linkId: link.id,
                })
              }
              title="Remove mapping"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  }

  // mode === "map-action"
  if (!sourceNode || !sourceTaxonomy || state.customTree.length === 0) return null;

  const allCustomNodes = flattenCustomNodes(state.customTree);

  const handleMap = () => {
    if (!selectedTarget) return;
    dispatch({
      type: "ADD_MAPPING_LINK",
      nodeId: selectedTarget,
      link: {
        id: crypto.randomUUID(),
        sourceTaxonomy,
        sourceNodeId: sourceNode.id,
        sourceCode: sourceNode.code,
        sourceDescription: sourceNode.name,
      },
    });
    setSelectedTarget("");
  };

  return (
    <div className="builder-map-action">
      <label>Map to Custom Node:</label>
      <select value={selectedTarget} onChange={(e) => setSelectedTarget(e.target.value)}>
        <option value="">Select target...</option>
        {allCustomNodes.map((n) => (
          <option key={n.id} value={n.id}>
            {n.code} — {n.name}
          </option>
        ))}
      </select>
      <button onClick={handleMap} disabled={!selectedTarget}>
        Map
      </button>
    </div>
  );
}
