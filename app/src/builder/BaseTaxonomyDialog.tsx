import { useState, useCallback } from "react";
import { useBuilder } from "./context";
import { convertTreeToCustom, countTreeNodes } from "./convertTreeToCustom";
import type { TreeNode, LookupEntry, TaxonomyType } from "../types";

type BaseTaxonomyType = Exclude<TaxonomyType, "custom">;

const TAXONOMY_OPTIONS: { value: BaseTaxonomyType; label: string }[] = [
  { value: "hs", label: "HS — Harmonized System (International)" },
  { value: "cpc", label: "CPC — Central Product Classification" },
  { value: "cn", label: "CN — Combined Nomenclature (EU)" },
  { value: "hts", label: "HTS — Harmonized Tariff Schedule (US)" },
  { value: "ca", label: "Canadian Customs Tariff" },
  { value: "unspsc", label: "UNSPSC — Products & Services Code" },
  { value: "t1", label: "T1 — HTS Goods + CPC Services" },
  { value: "t2", label: "T2 — CPC Backbone + HTS Detail" },
];

const BLOCKED_TAXONOMIES = new Set<BaseTaxonomyType>(["unspsc"]);
const WARN_THRESHOLD = 8000;

interface Props {
  onClose: () => void;
  getTreeData: (taxonomy: TaxonomyType) => TreeNode[];
  getLookup: (taxonomy: TaxonomyType) => Record<string, LookupEntry>;
}

export function BaseTaxonomyDialog({ onClose, getTreeData, getLookup }: Props) {
  const { dispatch } = useBuilder();
  const [selected, setSelected] = useState<BaseTaxonomyType | "">("");
  const [importing, setImporting] = useState(false);

  const nodeCount = selected ? countTreeNodes(getTreeData(selected)) : 0;
  const isBlocked = selected ? BLOCKED_TAXONOMIES.has(selected) : false;
  const isLarge = nodeCount > WARN_THRESHOLD;

  const handleClone = useCallback(() => {
    if (!selected || isBlocked) return;
    setImporting(true);

    // Use requestAnimationFrame to keep UI responsive during large imports
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
          <p className="base-dialog-description">
            Clone an existing taxonomy as the basis for your custom taxonomy, or start from scratch.
          </p>

          <div className="base-dialog-select-group">
            <label>Base Taxonomy</label>
            <select
              className="builder-form-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value as BaseTaxonomyType | "")}
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
          <button className="builder-form-cancel" onClick={handleStartFromScratch}>
            Start from Scratch
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
