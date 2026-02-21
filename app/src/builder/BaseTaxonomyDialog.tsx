import { useState, useCallback, useMemo } from "react";
import { useBuilder } from "./context";
import { convertTreeToCustom, countTreeNodes } from "./convertTreeToCustom";
import { loadLibrary } from "./persistence";
import type { TreeNode, LookupEntry, TaxonomyType } from "../types";

const TAXONOMY_OPTIONS: { value: TaxonomyType; label: string }[] = [
  { value: "hs", label: "HS — Harmonized System (International)" },
  { value: "cpc", label: "CPC — Central Product Classification" },
  { value: "cn", label: "CN — Combined Nomenclature (EU)" },
  { value: "hts", label: "HTS — Harmonized Tariff Schedule (US)" },
  { value: "ca", label: "Canadian Customs Tariff" },
  { value: "unspsc", label: "UNSPSC — Products & Services Code" },
  { value: "t1", label: "T1 — HTS Goods + CPC Services" },
  { value: "t2", label: "T2 — CPC Backbone + HTS Detail" },
];

const BLOCKED_TAXONOMIES = new Set<TaxonomyType>(["unspsc"]);
const WARN_THRESHOLD = 8000;

interface Props {
  onClose: () => void;
  getTreeData: (taxonomy: TaxonomyType) => TreeNode[];
  getLookup: (taxonomy: TaxonomyType) => Record<string, LookupEntry>;
  onOpenLibrary?: () => void;
}

export function BaseTaxonomyDialog({ onClose, getTreeData, getLookup, onOpenLibrary }: Props) {
  const { dispatch } = useBuilder();
  const [selected, setSelected] = useState<TaxonomyType | "">("");
  const [importing, setImporting] = useState(false);
  const savedCount = useMemo(() => loadLibrary().length, []);

  const nodeCount = selected ? countTreeNodes(getTreeData(selected)) : 0;
  const isBlocked = selected ? BLOCKED_TAXONOMIES.has(selected) : false;
  const isLarge = nodeCount > WARN_THRESHOLD;

  const handleClone = useCallback(() => {
    if (!selected || isBlocked) return;
    setImporting(true);

    requestAnimationFrame(() => {
      const tree = getTreeData(selected);
      const lookup = getLookup(selected);
      const customTree = convertTreeToCustom(tree, selected, lookup);
      const label = TAXONOMY_OPTIONS.find((o) => o.value === selected)?.label ?? selected.toUpperCase();

      dispatch({
        type: "IMPORT_BASE_TAXONOMY",
        tree: customTree,
        taxonomy: selected,
        rootName: `Custom (based on ${label.split(" — ")[0]})`,
      });

      setImporting(false);
      onClose();
    });
  }, [selected, isBlocked, getTreeData, getLookup, dispatch, onClose]);

  const handleStartFromScratch = () => {
    dispatch({
      type: "SET_ROOT_NAME",
      name: "Custom Taxonomy",
    });
    onClose();
  };

  return (
    <div className="builder-modal-overlay" onClick={onClose}>
      <div className="builder-modal base-taxonomy-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="builder-modal-header">
          <h2>Choose a Starting Point</h2>
          <button className="builder-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="builder-modal-body">
          <div className="base-dialog-options">
            <button
              className="base-dialog-option-card"
              onClick={handleStartFromScratch}
            >
              <div className="base-dialog-option-icon">+</div>
              <div className="base-dialog-option-text">
                <div className="base-dialog-option-title">Start from Scratch</div>
                <div className="base-dialog-option-desc">
                  Build your custom taxonomy from an empty tree.
                </div>
              </div>
            </button>
            {savedCount > 0 && onOpenLibrary && (
              <button
                className="base-dialog-option-card"
                onClick={() => {
                  onClose();
                  onOpenLibrary();
                }}
              >
                <div className="base-dialog-option-icon">&darr;</div>
                <div className="base-dialog-option-text">
                  <div className="base-dialog-option-title">Load Saved Taxonomy</div>
                  <div className="base-dialog-option-desc">
                    Load one of your {savedCount} saved {savedCount === 1 ? "taxonomy" : "taxonomies"}.
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="base-dialog-divider">
            <span>or clone an existing taxonomy</span>
          </div>

          <div className="base-dialog-select-group">
            <label>Base Taxonomy</label>
            <select
              className="builder-form-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value as TaxonomyType | "")}
            >
              <option value="">Select a taxonomy to clone...</option>
              {TAXONOMY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="base-dialog-info">
              <span className="base-dialog-node-count">
                {nodeCount.toLocaleString()} nodes
              </span>
              {isBlocked && (
                <div className="base-dialog-warning base-dialog-blocked">
                  This taxonomy is too large to clone ({nodeCount.toLocaleString()} nodes). localStorage cannot store it. Please choose a smaller taxonomy.
                </div>
              )}
              {isLarge && !isBlocked && (
                <div className="base-dialog-warning">
                  Large taxonomy — cloning may take a moment and localStorage persistence may be limited.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="builder-modal-footer">
          <button className="builder-form-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="builder-form-save"
            onClick={handleClone}
            disabled={!selected || isBlocked || importing}
          >
            {importing ? "Importing..." : "Clone Taxonomy"}
          </button>
        </div>
      </div>
    </div>
  );
}
