import React, { useState, useRef, useCallback, useMemo } from "react";
import { TreeApi } from "react-arborist";
import { useData } from "./useData";
import { TaxonomyTree } from "./TaxonomyTree";
import type { TreeNode, LookupEntry } from "./types";
import "./App.css";

// Color palette for section-based coloring
const SECTION_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#a855f7",
  "#d946ef", "#f59e0b", "#10b981", "#0891b2", "#7c3aed",
  "#db2777", "#dc2626",
];

function getSectionColor(index: number): string {
  return SECTION_COLORS[index % SECTION_COLORS.length];
}

function buildColorMap(tree: TreeNode[]): Record<string, string> {
  const colorMap: Record<string, string> = {};
  tree.forEach((section, index) => {
    const color = getSectionColor(index);
    const assignColor = (node: TreeNode) => {
      colorMap[node.id] = color;
      if (node.children) node.children.forEach(assignColor);
    };
    assignColor(section);
  });
  return colorMap;
}

type TaxonomyType = "hs" | "cn" | "hts" | "ca" | "cpc";

const ALL_TAXONOMIES: TaxonomyType[] = ["hs", "cpc", "cn", "hts", "ca"];

const TAXONOMY_INFO: Record<TaxonomyType, { fullName: string; legend: string; taxonomyClass: string; label: string }> = {
  hs: {
    fullName: "Harmonized System (International)",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings",
    taxonomyClass: "hs",
    label: "HS",
  },
  cpc: {
    fullName: "Central Product Classification Ver. 2.1",
    legend: "Sections \u2192 Divisions \u2192 Groups \u2192 Classes \u2192 Subclasses",
    taxonomyClass: "cpc",
    label: "CPC",
  },
  cn: {
    fullName: "Combined Nomenclature (EU)",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings \u2192 CN8",
    taxonomyClass: "cn",
    label: "CN",
  },
  hts: {
    fullName: "Harmonized Tariff Schedule (US)",
    legend: "Sections \u2192 Headings \u2192 Subheadings \u2192 Tariff Lines",
    taxonomyClass: "hts",
    label: "HTS",
  },
  ca: {
    fullName: "Canadian Customs Tariff",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings \u2192 Items",
    taxonomyClass: "ca",
    label: "CA",
  },
};

// Strip dots, spaces from a code to get pure digits
function stripCode(code: string): string {
  return code.replace(/[\.\s\-]/g, "");
}

// HS-family taxonomies share the same base HS codes (first 6 digits)
const HS_FAMILY: TaxonomyType[] = ["hs", "cn", "hts", "ca"];

// Extract the HS 6-digit base from any HS-family code
function getHsBase(code: string, taxonomy: TaxonomyType): string | null {
  if (!HS_FAMILY.includes(taxonomy)) return null;
  const clean = stripCode(code);
  // Section-level (Roman numerals) or non-numeric: no mapping
  if (!/^\d+$/.test(clean)) return null;
  // Return up to 6 digits
  return clean.substring(0, Math.min(6, clean.length));
}

interface MappedEntry {
  taxonomy: TaxonomyType;
  code: string;
  description: string;
  nodeId: string | null;
}

// Find the best matching entry in a target taxonomy for a given HS base code
function findMappedEntry(
  hsBase: string,
  targetTaxonomy: TaxonomyType,
  lookup: Record<string, LookupEntry>,
): MappedEntry | null {
  if (targetTaxonomy === "cpc") return null; // CPC uses different coding

  // Try progressively shorter prefixes: 6-digit, 4-digit, 2-digit
  for (let len = Math.min(6, hsBase.length); len >= 2; len -= 2) {
    const prefix = hsBase.substring(0, len);
    // For HS: lookup keys are pure digits
    if (targetTaxonomy === "hs") {
      if (lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `hs-${prefix}`,
        };
      }
    }
    // For CN: lookup keys are pure digits (no spaces)
    if (targetTaxonomy === "cn") {
      if (lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `cn-${prefix}`,
        };
      }
    }
    // For HTS: lookup keys have dots (e.g., "0101.21.00")
    if (targetTaxonomy === "hts") {
      // Try exact match first (pure digits as lookup key, e.g., "0101")
      if (lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `hts-${prefix}`,
        };
      }
      // Try dotted format for 6+ digit codes
      if (prefix.length >= 6) {
        const dotted = `${prefix.substring(0, 4)}.${prefix.substring(4, 6)}.00`;
        if (lookup[dotted]) {
          return {
            taxonomy: targetTaxonomy,
            code: dotted,
            description: lookup[dotted].description,
            nodeId: `hts-${stripCode(dotted)}`,
          };
        }
      }
      // Try 4-digit dotted
      if (prefix.length >= 4) {
        const four = prefix.substring(0, 4);
        if (lookup[four]) {
          return {
            taxonomy: targetTaxonomy,
            code: four,
            description: lookup[four].description,
            nodeId: `hts-${four}`,
          };
        }
      }
    }
    // For CA: lookup keys have dots (e.g., "01.01", "0101.21.00")
    if (targetTaxonomy === "ca") {
      // Try chapter format "01"
      if (prefix.length === 2 && lookup[prefix]) {
        return {
          taxonomy: targetTaxonomy,
          code: prefix,
          description: lookup[prefix].description,
          nodeId: `ca-${prefix}`,
        };
      }
      // Try heading format "01.01"
      if (prefix.length >= 4) {
        const heading = `${prefix.substring(0, 2)}.${prefix.substring(2, 4)}`;
        if (lookup[heading]) {
          return {
            taxonomy: targetTaxonomy,
            code: heading,
            description: lookup[heading].description,
            nodeId: `ca-${stripCode(heading)}`,
          };
        }
      }
      // Try 8-digit format "0101.21.00"
      if (prefix.length >= 6) {
        const eight = `${prefix.substring(0, 4)}.${prefix.substring(4, 6)}.00`;
        if (lookup[eight]) {
          return {
            taxonomy: targetTaxonomy,
            code: eight,
            description: lookup[eight].description,
            nodeId: `ca-${stripCode(eight)}`,
          };
        }
      }
    }
  }
  return null;
}

function App() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState("");
  const [leftTaxonomy, setLeftTaxonomy] = useState<TaxonomyType>("hs");
  const [rightTaxonomy, setRightTaxonomy] = useState<TaxonomyType>("cpc");
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [selectedFrom, setSelectedFrom] = useState<TaxonomyType | null>(null);

  const treeRefs: Record<TaxonomyType, React.RefObject<TreeApi<TreeNode> | null>> = {
    hs: useRef<TreeApi<TreeNode>>(null),
    cn: useRef<TreeApi<TreeNode>>(null),
    hts: useRef<TreeApi<TreeNode>>(null),
    ca: useRef<TreeApi<TreeNode>>(null),
    cpc: useRef<TreeApi<TreeNode>>(null),
  };

  const getTreeData = useCallback((taxonomy: TaxonomyType) => {
    if (!data) return [];
    const map: Record<TaxonomyType, TreeNode[]> = {
      hs: data.hsTree, cn: data.cnTree, hts: data.htsTree, ca: data.caTree, cpc: data.cpcTree,
    };
    return map[taxonomy];
  }, [data]);

  const getLookup = useCallback((taxonomy: TaxonomyType) => {
    if (!data) return {};
    const map: Record<TaxonomyType, Record<string, LookupEntry>> = {
      hs: data.hsLookup, cn: data.cnLookup, hts: data.htsLookup, ca: data.caLookup, cpc: data.cpcLookup,
    };
    return map[taxonomy];
  }, [data]);

  const searchMatch = useCallback(
    (node: { data: TreeNode }, term: string) => {
      const lower = term.toLowerCase();
      return (
        node.data.code.toLowerCase().includes(lower) ||
        node.data.name.toLowerCase().includes(lower)
      );
    },
    []
  );

  // Compute mappings from selected node to all other taxonomies
  const mappings = useMemo(() => {
    if (!selectedNode || !selectedFrom || !data) return [];
    const hsBase = getHsBase(selectedNode.code, selectedFrom);
    if (!hsBase) return [];

    const results: MappedEntry[] = [];
    for (const tax of ALL_TAXONOMIES) {
      if (tax === selectedFrom) continue;
      const entry = findMappedEntry(hsBase, tax, getLookup(tax));
      if (entry) results.push(entry);
    }
    return results;
  }, [selectedNode, selectedFrom, data, getLookup]);

  // Handle node selection: update state + sync other pane
  const handleNodeSelect = useCallback(
    (pane: "left" | "right", node: TreeNode) => {
      const sourceTax = pane === "left" ? leftTaxonomy : rightTaxonomy;
      const otherTax = pane === "left" ? rightTaxonomy : leftTaxonomy;

      setSelectedNode(node);
      setSelectedFrom(sourceTax);

      // Cross-pane sync: find equivalent in other pane's taxonomy
      const hsBase = getHsBase(node.code, sourceTax);
      if (hsBase && data) {
        const mapped = findMappedEntry(hsBase, otherTax, getLookup(otherTax));
        if (mapped?.nodeId) {
          const otherRef = treeRefs[otherTax];
          // Small delay to let React finish rendering
          setTimeout(() => {
            const tree = otherRef.current;
            if (tree) {
              const targetNode = tree.get(mapped.nodeId!);
              if (targetNode) {
                // Open ancestors so the node is visible
                targetNode.openParents();
                // Scroll to and focus the node
                tree.scrollTo(targetNode.id);
                targetNode.select();
              }
            }
          }, 50);
        }
      }
    },
    [leftTaxonomy, rightTaxonomy, data, getLookup, treeRefs]
  );

  const leftColorMap = useMemo(
    () => buildColorMap(getTreeData(leftTaxonomy)),
    [data, leftTaxonomy, getTreeData]
  );
  const rightColorMap = useMemo(
    () => buildColorMap(getTreeData(rightTaxonomy)),
    [data, rightTaxonomy, getTreeData]
  );

  const mappingInfo = useMemo(
    () => data?.concordance.mappingInfo ?? {},
    [data]
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        Loading taxonomy data...
      </div>
    );
  }

  if (error || !data) {
    return <div className="error">Error: {error || "Unknown error"}</div>;
  }

  const taxonomyOptions = (
    <>
      <option value="hs">HS - Harmonized System (International)</option>
      <option value="cpc">CPC - Central Product Classification</option>
      <option value="cn">CN - Combined Nomenclature (EU)</option>
      <option value="hts">HTS - Harmonized Tariff Schedule (US)</option>
      <option value="ca">Canadian Customs Tariff</option>
    </>
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-text">
          <h1>Taxonomy Explorer</h1>
          <p className="subtitle">
            Compare HS, CPC, CN, HTS &amp; Canadian tariff classifications
          </p>
        </div>
        <div className="search-bar">
          <svg
            className="search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="16"
            height="16"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search across both taxonomies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}>
              ×
            </button>
          )}
        </div>
      </header>

      <div className="main-content two-pane">
        {/* Left Pane */}
        <div className="pane-wrapper left-pane">
          <div className="pane-header">
            <h2>Left Taxonomy</h2>
            <select
              className="taxonomy-selector"
              value={leftTaxonomy}
              onChange={(e) => setLeftTaxonomy(e.target.value as TaxonomyType)}
            >
              {taxonomyOptions}
            </select>
          </div>
          <div className="pane-info">
            <p className="full-name">{TAXONOMY_INFO[leftTaxonomy].fullName}</p>
            <p className="legend">{TAXONOMY_INFO[leftTaxonomy].legend}</p>
          </div>
          <TaxonomyTree
            key={leftTaxonomy}
            ref={treeRefs[leftTaxonomy]}
            data={getTreeData(leftTaxonomy)}
            searchTerm={search}
            searchMatch={searchMatch}
            mappingInfo={mappingInfo}
            onNodeSelect={(node) => handleNodeSelect("left", node)}
            label={TAXONOMY_INFO[leftTaxonomy].label}
            taxonomyClass={TAXONOMY_INFO[leftTaxonomy].taxonomyClass}
            fullName={TAXONOMY_INFO[leftTaxonomy].fullName}
            legend={TAXONOMY_INFO[leftTaxonomy].legend}
            colorMap={leftColorMap}
          />
        </div>

        {/* Right Pane */}
        <div className="pane-wrapper right-pane">
          <div className="pane-header">
            <h2>Right Taxonomy</h2>
            <select
              className="taxonomy-selector"
              value={rightTaxonomy}
              onChange={(e) => setRightTaxonomy(e.target.value as TaxonomyType)}
            >
              {taxonomyOptions}
            </select>
          </div>
          <div className="pane-info">
            <p className="full-name">{TAXONOMY_INFO[rightTaxonomy].fullName}</p>
            <p className="legend">{TAXONOMY_INFO[rightTaxonomy].legend}</p>
          </div>
          <TaxonomyTree
            key={rightTaxonomy}
            ref={treeRefs[rightTaxonomy]}
            data={getTreeData(rightTaxonomy)}
            searchTerm={search}
            searchMatch={searchMatch}
            mappingInfo={mappingInfo}
            onNodeSelect={(node) => handleNodeSelect("right", node)}
            label={TAXONOMY_INFO[rightTaxonomy].label}
            taxonomyClass={TAXONOMY_INFO[rightTaxonomy].taxonomyClass}
            fullName={TAXONOMY_INFO[rightTaxonomy].fullName}
            legend={TAXONOMY_INFO[rightTaxonomy].legend}
            colorMap={rightColorMap}
          />
        </div>
      </div>

      {/* Mapping Panel */}
      {selectedNode && selectedFrom && (
        <div className="comparison-panel">
          <h3>
            Cross-Taxonomy Mappings for{" "}
            <span className="mapping-source-label">
              {TAXONOMY_INFO[selectedFrom].label}
            </span>{" "}
            {selectedNode.code}
          </h3>
          <div className="comparison-content">
            <div className="comparison-item source-item">
              <h4>{TAXONOMY_INFO[selectedFrom].label}</h4>
              <p className="code">{selectedNode.code}</p>
              <p className="name">{selectedNode.name}</p>
            </div>
            {mappings.map((m) => (
              <div className="comparison-item mapped-item" key={m.taxonomy}>
                <h4>{TAXONOMY_INFO[m.taxonomy].label}</h4>
                <p className="code">{m.code}</p>
                <p className="name">{m.description}</p>
              </div>
            ))}
            {mappings.length === 0 && (
              <div className="comparison-item no-mapping">
                <p className="name">
                  {HS_FAMILY.includes(selectedFrom)
                    ? "No HS-family mappings found at this level"
                    : "CPC uses a different coding system \u2014 no direct HS mapping"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
