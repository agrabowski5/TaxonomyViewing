import React, { forwardRef } from "react";
import { Tree, TreeApi } from "react-arborist";
import { TreeNodeRenderer } from "./TreeNode";
import { useContainerSize } from "./useContainerSize";
import type { TreeNode, MappingInfo, LcaSummary } from "./types";

const DB_COLORS: Record<string, { color: string; bg: string }> = {
  ecoinvent: { color: "#92400e", bg: "#fef3c7" },
  epa:       { color: "#065f46", bg: "#d1fae5" },
  exiobase:  { color: "#5b21b6", bg: "#ede9fe" },
  uslci:     { color: "#1e40af", bg: "#dbeafe" },
  bafu:      { color: "#9d174d", bg: "#fce7f3" },
};

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
  uslciCoverage?: Set<string>;
  bafuCoverage?: Set<string>;
  lcaSummary?: LcaSummary | null;
}

function LcaDetailStrip({ summary }: { summary: LcaSummary }) {
  return (
    <div className="lca-detail-strip">
      {summary.items.map((item) => {
        const colors = DB_COLORS[item.db] || { color: "#374151", bg: "#f3f4f6" };
        return (
          <div key={item.db} className="lca-detail-row">
            <span className="lca-detail-badge" style={{ color: colors.color, backgroundColor: colors.bg }}>
              {item.label}
            </span>
            <span className="lca-detail-value">{item.value}</span>
            <span className="lca-detail-sep">&middot;</span>
            <span className="lca-detail-info">{item.detail}</span>
            {item.products && item.products.length > 0 && (
              <div className="lca-detail-products">
                {item.products.map((p, i) => (
                  <span key={i} className="lca-detail-product">{p}</span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
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
    lcaSummary,
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
      {lcaSummary && <LcaDetailStrip summary={lcaSummary} />}
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
