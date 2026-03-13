import React, { forwardRef } from "react";
import { Tree, TreeApi } from "react-arborist";
import { TreeNodeRenderer } from "./TreeNode";
import { useContainerSize } from "./useContainerSize";
import type { TreeNode, MappingInfo, CoverageInfo } from "./types";

export interface GapHighlightData {
  taxonomy: string;
  db: string;
  dbLabel: string;
  leafIds: Set<string>;
  ancestorIds: Set<string>;
}

interface Props {
  data: TreeNode[];
  openByDefault?: boolean;
  mappingInfo: Record<string, MappingInfo>;
  onNodeSelect: (node: TreeNode) => void;
  label: string;
  taxonomyClass: string;
  fullName: string;
  legend: string;
  colorMap: Record<string, string>;
  treeRef?: React.RefObject<TreeApi<TreeNode> | null>;
  ecoinventCoverage?: Map<string, CoverageInfo>;
  epaCoverage?: Map<string, CoverageInfo>;
  exiobaseCoverage?: Map<string, CoverageInfo>;
  uslciCoverage?: Map<string, CoverageInfo>;
  bafuCoverage?: Map<string, CoverageInfo>;
  gabiCoverage?: Map<string, CoverageInfo>;
  side?: "left" | "right";
  gapHighlight?: GapHighlightData;
  onClearGapHighlight?: () => void;
}

export const TaxonomyTree = forwardRef<TreeApi<TreeNode>, Props>(function TaxonomyTree(
  {
    data,
    openByDefault = false,
    mappingInfo,
    onNodeSelect,
    label,
    taxonomyClass,
    fullName,
    legend,
    colorMap,
    ecoinventCoverage,
    epaCoverage,
    exiobaseCoverage,
    uslciCoverage,
    bafuCoverage,
    gabiCoverage,
    side,
    gapHighlight,
    onClearGapHighlight,
  },
  ref
) {
  const container = useContainerSize();

  return (
    <div className="tree-panel">
      <div className="panel-header">
        <h2>
          <span className={`taxonomy-label ${taxonomyClass}`}>{label}</span>
          {fullName}
        </h2>
        <div className="panel-legend">
          {legend}
          {side !== "right" && (
            <span className="panel-badge-key">
              <span className="badge-key-sep">|</span>
              <span className="badge-key-label">LCA:</span>
              <span className="badge-key-item">1:1 exclusive</span>
              <span className="badge-key-item">1:N one→many</span>
              <span className="badge-key-item">N:1 many→one</span>
            </span>
          )}
        </div>
      </div>
      {gapHighlight && (
        <div className="gap-highlight-banner">
          <span className="gap-highlight-banner-dot" />
          Showing {gapHighlight.leafIds.size.toLocaleString()} uncovered leaves for <strong>{gapHighlight.dbLabel}</strong>
          <button className="gap-highlight-banner-close" onClick={onClearGapHighlight}>✕ Exit</button>
        </div>
      )}
      <div className="tree-container" ref={container.ref}>
        <Tree<TreeNode>
          ref={ref as React.Ref<TreeApi<TreeNode> | undefined>}
          initialData={data}
          openByDefault={openByDefault}
          width={container.width}
          height={container.height}
          rowHeight={32}
          indent={20}
          disableDrag
          disableDrop
          disableEdit
        >
          {(props) => (
            <TreeNodeRenderer
              {...props}
              mappingInfo={mappingInfo}
              onNodeSelect={onNodeSelect}
              colorMap={colorMap}
              ecoinventCoverage={ecoinventCoverage}
              epaCoverage={epaCoverage}
              exiobaseCoverage={exiobaseCoverage}
              uslciCoverage={uslciCoverage}
              bafuCoverage={bafuCoverage}
              gabiCoverage={gabiCoverage}
              gapHighlight={gapHighlight}
            />
          )}
        </Tree>
      </div>
    </div>
  );
});
