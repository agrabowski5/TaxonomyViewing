import React, { forwardRef } from "react";
import { Tree, TreeApi } from "react-arborist";
import { TreeNodeRenderer } from "./TreeNode";
import { useContainerSize } from "./useContainerSize";
import type { TreeNode, MappingInfo, CoverageInfo } from "./types";

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
  side?: "left" | "right";
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
    side,
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
        <div className="panel-legend">{legend}</div>
        {side !== "right" && (
          <div className="panel-badge-key">
            <span className="badge-key-label">LCA badges:</span>
            <span className="badge-key-item">1:1 = exclusive match</span>
            <span className="badge-key-item">1:N = one code → N entries</span>
            <span className="badge-key-item">N:1 = many codes → one entry</span>
          </div>
        )}
      </div>
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
            />
          )}
        </Tree>
      </div>
    </div>
  );
});
