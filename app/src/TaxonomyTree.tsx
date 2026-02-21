import React, { forwardRef } from "react";
import { Tree, TreeApi } from "react-arborist";
import { TreeNodeRenderer } from "./TreeNode";
import { useContainerSize } from "./useContainerSize";
import type { TreeNode, MappingInfo } from "./types";

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
  ecoinventCoverage?: Set<string>;
  epaCoverage?: Set<string>;
  exiobaseCoverage?: Set<string>;
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
            />
          )}
        </Tree>
      </div>
    </div>
  );
});
