import React, { useState, useRef, useCallback, useMemo } from "react";
import { TreeApi } from "react-arborist";
import { useData } from "./useData";
import { TaxonomyTree } from "./TaxonomyTree";
import type { TreeNode } from "./types";
import "./App.css";

// Color palette for section-based coloring
const SECTION_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo again
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#f59e0b", // amber
  "#10b981", // emerald
  "#0891b2", // cyan-600
  "#7c3aed", // violet-600
  "#db2777", // pink-600
  "#dc2626", // red-600
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
      if (node.children) {
        node.children.forEach(assignColor);
      }
    };
    assignColor(section);
  });

  return colorMap;
}

type TaxonomyType = "hs" | "cn" | "hts" | "ca" | "cpc";

interface PaneState {
  taxonomy: TaxonomyType;
  treeRef: React.RefObject<TreeApi<TreeNode> | null>;
  selectedNode: TreeNode | null;
}

const TAXONOMY_INFO: Record<TaxonomyType, { fullName: string; legend: string; taxonomyClass: string }> = {
  hs: {
    fullName: "Harmonized System (International)",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings",
    taxonomyClass: "hs",
  },
  cpc: {
    fullName: "Central Product Classification Ver. 2.1",
    legend: "Sections \u2192 Divisions \u2192 Groups \u2192 Classes \u2192 Subclasses",
    taxonomyClass: "cpc",
  },
  cn: {
    fullName: "Combined Nomenclature (EU)",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings \u2192 CN8",
    taxonomyClass: "cn",
  },
  hts: {
    fullName: "Harmonized Tariff Schedule (US)",
    legend: "Sections \u2192 Headings \u2192 Subheadings \u2192 Tariff Lines",
    taxonomyClass: "hts",
  },
  ca: {
    fullName: "Canadian Customs Tariff",
    legend: "Sections \u2192 Chapters \u2192 Headings \u2192 Subheadings \u2192 Items",
    taxonomyClass: "ca",
  },
};

function App() {
  const { data, loading, error } = useData();
  const [search, setSearch] = useState("");
  const [leftPane, setLeftPane] = useState<PaneState>({
    taxonomy: "hs",
    treeRef: React.createRef(),
    selectedNode: null,
  });
  const [rightPane, setRightPane] = useState<PaneState>({
    taxonomy: "cpc",
    treeRef: React.createRef(),
    selectedNode: null,
  });

  const hsTreeRef = useRef<TreeApi<TreeNode>>(null);
  const cnTreeRef = useRef<TreeApi<TreeNode>>(null);
  const htsTreeRef = useRef<TreeApi<TreeNode>>(null);
  const caTreeRef = useRef<TreeApi<TreeNode>>(null);
  const cpcTreeRef = useRef<TreeApi<TreeNode>>(null);

  const getTreeRef = (taxonomy: TaxonomyType) => {
    switch (taxonomy) {
      case "hs":
        return hsTreeRef;
      case "cn":
        return cnTreeRef;
      case "hts":
        return htsTreeRef;
      case "ca":
        return caTreeRef;
      case "cpc":
        return cpcTreeRef;
    }
  };

  const getTreeData = (taxonomy: TaxonomyType) => {
    if (!data) return [];
    switch (taxonomy) {
      case "hs":
        return data.hsTree;
      case "cn":
        return data.cnTree;
      case "hts":
        return data.htsTree;
      case "ca":
        return data.caTree;
      case "cpc":
        return data.cpcTree;
    }
  };

  const getColorMap = (taxonomy: TaxonomyType) => {
    const treeData = getTreeData(taxonomy);
    return buildColorMap(treeData);
  };

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

  const handlePaneSelect = (pane: "left" | "right", taxonomy: TaxonomyType) => {
    if (pane === "left") {
      setLeftPane({ ...leftPane, taxonomy, treeRef: getTreeRef(taxonomy) });
    } else {
      setRightPane({ ...rightPane, taxonomy, treeRef: getTreeRef(taxonomy) });
    }
  };

  const handleNodeSelect = (pane: "left" | "right", node: TreeNode) => {
    if (pane === "left") {
      setLeftPane({ ...leftPane, selectedNode: node });
    } else {
      setRightPane({ ...rightPane, selectedNode: node });
    }
  };

  const mappingInfo = useMemo(
    () => data?.concordance.mappingInfo ?? {},
    [data]
  );

  const leftColorMap = useMemo(() => getColorMap(leftPane.taxonomy), [data, leftPane.taxonomy]);
  const rightColorMap = useMemo(() => getColorMap(rightPane.taxonomy), [data, rightPane.taxonomy]);

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
              value={leftPane.taxonomy}
              onChange={(e) => handlePaneSelect("left", e.target.value as TaxonomyType)}
            >
              {taxonomyOptions}
            </select>
          </div>
          <div className="pane-info">
            <p className="full-name">{TAXONOMY_INFO[leftPane.taxonomy].fullName}</p>
            <p className="legend">{TAXONOMY_INFO[leftPane.taxonomy].legend}</p>
          </div>
          <TaxonomyTree
            ref={getTreeRef(leftPane.taxonomy)}
            data={getTreeData(leftPane.taxonomy)}
            searchTerm={search}
            searchMatch={searchMatch}
            mappingInfo={mappingInfo}
            onNodeSelect={(node) => handleNodeSelect("left", node)}
            label={leftPane.taxonomy.toUpperCase()}
            taxonomyClass={TAXONOMY_INFO[leftPane.taxonomy].taxonomyClass}
            fullName={TAXONOMY_INFO[leftPane.taxonomy].fullName}
            legend={TAXONOMY_INFO[leftPane.taxonomy].legend}
            colorMap={leftColorMap}
            treeRef={getTreeRef(leftPane.taxonomy)}
          />
        </div>

        {/* Right Pane */}
        <div className="pane-wrapper right-pane">
          <div className="pane-header">
            <h2>Right Taxonomy</h2>
            <select
              className="taxonomy-selector"
              value={rightPane.taxonomy}
              onChange={(e) => handlePaneSelect("right", e.target.value as TaxonomyType)}
            >
              {taxonomyOptions}
            </select>
          </div>
          <div className="pane-info">
            <p className="full-name">{TAXONOMY_INFO[rightPane.taxonomy].fullName}</p>
            <p className="legend">{TAXONOMY_INFO[rightPane.taxonomy].legend}</p>
          </div>
          <TaxonomyTree
            ref={getTreeRef(rightPane.taxonomy)}
            data={getTreeData(rightPane.taxonomy)}
            searchTerm={search}
            searchMatch={searchMatch}
            mappingInfo={mappingInfo}
            onNodeSelect={(node) => handleNodeSelect("right", node)}
            label={rightPane.taxonomy.toUpperCase()}
            taxonomyClass={TAXONOMY_INFO[rightPane.taxonomy].taxonomyClass}
            fullName={TAXONOMY_INFO[rightPane.taxonomy].fullName}
            legend={TAXONOMY_INFO[rightPane.taxonomy].legend}
            colorMap={rightColorMap}
            treeRef={getTreeRef(rightPane.taxonomy)}
          />
        </div>
      </div>

      {/* Detail Panel - shows concordance between selected nodes */}
      {(leftPane.selectedNode || rightPane.selectedNode) && (
        <div className="comparison-panel">
          <h3>Cross-Taxonomy Mappings</h3>
          <div className="comparison-content">
            {leftPane.selectedNode && (
              <div className="comparison-item left-item">
                <h4>{leftPane.taxonomy.toUpperCase()}</h4>
                <p className="code">{leftPane.selectedNode.code}</p>
                <p className="name">{leftPane.selectedNode.name}</p>
              </div>
            )}
            {rightPane.selectedNode && (
              <div className="comparison-item right-item">
                <h4>{rightPane.taxonomy.toUpperCase()}</h4>
                <p className="code">{rightPane.selectedNode.code}</p>
                <p className="name">{rightPane.selectedNode.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
