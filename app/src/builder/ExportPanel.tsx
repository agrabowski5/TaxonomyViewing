import { useBuilder } from "./context";
import type { CustomNode, MetaDimension } from "./types";

const DIMENSION_LABELS: Record<MetaDimension, string> = {
  geography: "Geography",
  time: "Time",
  jurisdiction: "Jurisdiction",
  production_standard: "Production standard",
  grade: "Grade",
};

function countNodes(tree: CustomNode[]): number {
  let count = tree.length;
  for (const n of tree) {
    count += countNodes(n.children);
  }
  return count;
}

function countMappings(tree: CustomNode[]): number {
  let count = 0;
  for (const n of tree) {
    count += n.mappingLinks.length;
    count += countMappings(n.children);
  }
  return count;
}

function flattenToCSV(tree: CustomNode[], parentCode: string): string[][] {
  const rows: string[][] = [];
  for (const node of tree) {
    const metaParams = node.metaParameters
      .map((p) => `${DIMENSION_LABELS[p.dimension]}=${p.value}`)
      .join("; ");
    const mappedCodes = node.mappingLinks
      .map((l) => `${l.sourceTaxonomy}:${l.sourceCode}`)
      .join("; ");
    const trail = node.decisionTrail
      .map((s) => `Step ${s.stepNumber}: ${s.answer}`)
      .join(" → ");

    rows.push([
      node.id,
      node.code,
      node.name,
      parentCode,
      node.definition,
      node.type,
      metaParams,
      mappedCodes,
      node.notes,
      node.siblingDisambiguation,
      trail,
      node.governanceFlagged ? "yes" : "",
    ]);

    if (node.children.length > 0) {
      rows.push(...flattenToCSV(node.children, node.code));
    }
  }
  return rows;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportPanel() {
  const { state, dispatch } = useBuilder();

  const handleExportJSON = () => {
    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      rootName: state.rootName,
      tree: state.customTree,
      metaDimensions: ["geography", "time", "jurisdiction", "production_standard", "grade"],
      totalNodes: countNodes(state.customTree),
      totalMappings: countMappings(state.customTree),
    };
    downloadFile(JSON.stringify(exportData, null, 2), "custom-taxonomy.json", "application/json");
    dispatch({ type: "TOGGLE_EXPORT_PANEL" });
  };

  const handleExportCSV = () => {
    const headers = [
      "id", "code", "name", "parent_code", "definitional_rule", "type",
      "meta_parameters", "mapped_standard_nodes", "notes", "sibling_disambiguation",
      "wizard_path", "governance_flagged",
    ];
    const rows = flattenToCSV(state.customTree, "");

    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    downloadFile(csv, "custom-taxonomy.csv", "text/csv");
    dispatch({ type: "TOGGLE_EXPORT_PANEL" });
  };

  return (
    <div className="builder-modal-overlay" onClick={() => dispatch({ type: "TOGGLE_EXPORT_PANEL" })}>
      <div className="builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="builder-modal-header">
          <h2>Export Custom Taxonomy</h2>
          <button
            className="builder-modal-close"
            onClick={() => dispatch({ type: "TOGGLE_EXPORT_PANEL" })}
          >
            ×
          </button>
        </div>

        <div className="builder-modal-body builder-export-body">
          <p>
            Export your custom taxonomy with all nodes ({countNodes(state.customTree)}),
            meta-parameter annotations, mappings ({countMappings(state.customTree)}), and decision trails.
          </p>

          <div className="builder-export-buttons">
            <button className="builder-export-option" onClick={handleExportJSON}>
              <div className="builder-export-option-icon">{"{}"}</div>
              <div className="builder-export-option-label">JSON</div>
              <div className="builder-export-option-desc">
                Full tree structure with all metadata
              </div>
            </button>

            <button className="builder-export-option" onClick={handleExportCSV}>
              <div className="builder-export-option-icon">CSV</div>
              <div className="builder-export-option-label">CSV</div>
              <div className="builder-export-option-desc">
                Flat list for spreadsheet analysis
              </div>
            </button>
          </div>
        </div>

        <div className="builder-modal-footer">
          <button
            className="builder-form-cancel"
            onClick={() => dispatch({ type: "TOGGLE_EXPORT_PANEL" })}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
