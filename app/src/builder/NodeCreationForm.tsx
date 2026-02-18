import { useState } from "react";
import { useBuilder } from "./context";
import type { CustomNode, DecisionStep } from "./types";

interface Props {
  parentNodeId: string | null;
  decisionTrail: DecisionStep[];
  onComplete: () => void;
  onCancel: () => void;
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

function getSiblings(tree: CustomNode[], parentId: string | null): CustomNode[] {
  if (parentId === null) return tree;
  const parent = findNodeInTree(tree, parentId);
  return parent?.children ?? [];
}

export function NodeCreationForm({ parentNodeId, decisionTrail, onComplete, onCancel }: Props) {
  const { state, dispatch } = useBuilder();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [definition, setDefinition] = useState("");
  const [nodeType, setNodeType] = useState<"leaf" | "internal">("leaf");
  const [notes, setNotes] = useState("");
  const [siblingDisambiguation, setSiblingDisambiguation] = useState("");
  const [selectedMetaParams, setSelectedMetaParams] = useState<Array<{ registryId: string; value: string }>>([]);

  const siblings = getSiblings(state.customTree, parentNodeId);
  const hasSiblings = siblings.length > 0;
  const activeRegistry = state.metaParameterRegistry.filter((p) => p.active);

  const canSave = name.trim() && definition.trim() && (!hasSiblings || siblingDisambiguation.trim());

  const handleAddMetaParam = () => {
    if (selectedMetaParams.length >= 3) return;
    setSelectedMetaParams([...selectedMetaParams, { registryId: "", value: "" }]);
  };

  const handleRemoveMetaParam = (index: number) => {
    setSelectedMetaParams(selectedMetaParams.filter((_, i) => i !== index));
  };

  const handleUpdateMetaParam = (index: number, field: "registryId" | "value", val: string) => {
    setSelectedMetaParams(
      selectedMetaParams.map((p, i) => (i === index ? { ...p, [field]: val } : p))
    );
  };

  const handleSave = () => {
    const id = `custom-${crypto.randomUUID()}`;
    const node: CustomNode = {
      id,
      code: code.trim() || `C${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(),
      definition: definition.trim(),
      type: nodeType,
      parentId: parentNodeId,
      notes: notes.trim(),
      metaParameters: selectedMetaParams
        .filter((p) => p.registryId)
        .map((p) => ({
          id: crypto.randomUUID(),
          registryId: p.registryId,
          value: p.value,
        })),
      mappingLinks: [],
      siblingDisambiguation: siblingDisambiguation.trim(),
      decisionTrail,
      children: [],
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_NODE", node });
    onComplete();
  };

  return (
    <div className="builder-node-form">
      <h3>Create New Node</h3>

      {parentNodeId && (
        <div className="builder-form-group">
          <label>Parent Node</label>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", padding: "4px 0" }}>
            {findNodeInTree(state.customTree, parentNodeId)?.name ?? "Root"}
          </div>
        </div>
      )}

      <div className="builder-form-group">
        <label>
          Node Name <span className="required">*</span>
        </label>
        <input
          className="builder-form-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Organic Fair-Trade Coffee"
        />
      </div>

      <div className="builder-form-group">
        <label>Code (optional — auto-generated if empty)</label>
        <input
          className="builder-form-input"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g., OFT-COFFEE"
        />
      </div>

      <div className="builder-form-group">
        <label>
          Definitional Rule <span className="required">*</span>
        </label>
        <textarea
          className="builder-form-textarea"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="A clear, reusable rule that defines what belongs in this category..."
        />
      </div>

      <div className="builder-form-group">
        <label>Node Type</label>
        <select
          className="builder-form-select"
          value={nodeType}
          onChange={(e) => setNodeType(e.target.value as "leaf" | "internal")}
        >
          <option value="leaf">Leaf (no children)</option>
          <option value="internal">Internal (can have children)</option>
        </select>
      </div>

      <div className="builder-form-group">
        <label>Notes / Rationale (optional)</label>
        <textarea
          className="builder-form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional context or reasoning..."
        />
      </div>

      {hasSiblings && (
        <div className="builder-form-group">
          <label>
            Sibling Disambiguation <span className="required">*</span>
          </label>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0 0 4px" }}>
            Existing siblings: {siblings.map((s) => s.name).join(", ")}
          </p>
          <textarea
            className="builder-form-textarea"
            value={siblingDisambiguation}
            onChange={(e) => setSiblingDisambiguation(e.target.value)}
            placeholder="Explain how this node differs from each sibling..."
          />
        </div>
      )}

      {/* Meta-parameters */}
      <div className="builder-form-group">
        <label>Meta-Parameters (max 3)</label>
        {selectedMetaParams.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
            <select
              className="builder-form-select"
              style={{ flex: 1 }}
              value={p.registryId}
              onChange={(e) => handleUpdateMetaParam(i, "registryId", e.target.value)}
            >
              <option value="">Select parameter...</option>
              {activeRegistry.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <input
              className="builder-form-input"
              style={{ flex: 1 }}
              type="text"
              value={p.value}
              onChange={(e) => handleUpdateMetaParam(i, "value", e.target.value)}
              placeholder="Value"
            />
            <button className="builder-meta-tag-remove" onClick={() => handleRemoveMetaParam(i)}>
              ×
            </button>
          </div>
        ))}
        {selectedMetaParams.length < 3 && (
          <button
            className="builder-add-node-btn"
            onClick={handleAddMetaParam}
            style={{ marginTop: 4, fontSize: "0.75rem" }}
          >
            + Add Parameter
          </button>
        )}
      </div>

      <div className="builder-form-actions">
        <button
          className="builder-form-save"
          onClick={handleSave}
          disabled={!canSave}
        >
          Save Node
        </button>
        <button className="builder-form-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
