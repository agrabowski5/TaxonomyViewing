import type { NodeRendererProps } from "react-arborist";
import type { TreeNode as TNode, MappingInfo, CoverageInfo } from "./types";

interface Props extends NodeRendererProps<TNode> {
  mappingInfo?: Record<string, MappingInfo>;
  onNodeSelect?: (node: TNode) => void;
  colorMap?: Record<string, string>;
  ecoinventCoverage?: Map<string, CoverageInfo>;
  epaCoverage?: Map<string, CoverageInfo>;
  exiobaseCoverage?: Map<string, CoverageInfo>;
  bafuCoverage?: Map<string, CoverageInfo>;
  uslciCoverage?: Map<string, CoverageInfo>;
}

function fmtBadge(letter: string, info: CoverageInfo): string {
  if (info.dir === "1:1") return `${letter} 1:1`;
  if (info.dir === "1:N") return `${letter} 1:${info.count}`;
  return `${letter} N:1`; // N:1 — many taxonomy entries share this DB entry
}

function countDescendants(n: TNode): number {
  if (!n.children) return 0;
  let count = n.children.length;
  for (const child of n.children) count += countDescendants(child);
  return count;
}

export function TreeNodeRenderer({ node, style, mappingInfo, onNodeSelect, colorMap, ecoinventCoverage, epaCoverage, exiobaseCoverage, uslciCoverage, bafuCoverage }: Props) {
  const data = node.data;
  const info = mappingInfo?.[data.id];
  const color = colorMap?.[data.id] || "#6b7280";
  const descendantCount = !node.isLeaf ? countDescendants(data) : 0;
  const ei = ecoinventCoverage?.get(data.id);
  const ep = epaCoverage?.get(data.id);
  const ex = exiobaseCoverage?.get(data.id);
  const us = uslciCoverage?.get(data.id);
  const ba = bafuCoverage?.get(data.id);

  return (
    <div
      className={`tree-node ${node.isSelected ? "selected" : ""}`}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        node.handleClick(event);
        if (onNodeSelect) onNodeSelect(data);
      }}
    >
      <span
        className="toggle"
        onClick={(event) => {
          event.stopPropagation();
          node.toggle();
        }}
      >
        {node.isLeaf ? (
          <span className="toggle-spacer" />
        ) : node.isOpen ? (
          <span className="toggle-icon">v</span>
        ) : (
          <span className="toggle-icon">{">"}</span>
        )}
      </span>
      <span className="node-type-badge" style={{ backgroundColor: color }}>
        {data.code}
      </span>
      <span className="node-name" title={data.name}>
        {data.name}
      </span>
      {descendantCount > 0 && (
        <span className="descendant-count" title={`${descendantCount} items underneath`}>
          {descendantCount.toLocaleString()}
        </span>
      )}
      {(ei || ep || ex || us || ba) && (
        <span className="ef-badges">
          {ei && <span className="ef-badge ef-ecoinvent" title={`ecoinvent v3.12: ${ei.dir} (${ei.count} product${ei.count > 1 ? "s" : ""})`}>{fmtBadge("e", ei)}</span>}
          {ep && <span className="ef-badge ef-epa" title={`EPA/USEEIO: ${ep.dir} (${ep.count} factor${ep.count > 1 ? "s" : ""})`}>{fmtBadge("U", ep)}</span>}
          {ex && <span className="ef-badge ef-exiobase" title={`EXIOBASE 3.8.2: ${ex.dir} (${ex.count} categor${ex.count > 1 ? "ies" : "y"})`}>{fmtBadge("X", ex)}</span>}
          {us && <span className="ef-badge ef-uslci" title={`US LCI (NREL): ${us.dir} (${us.count} process${us.count > 1 ? "es" : ""})`}>{fmtBadge("L", us)}</span>}
          {ba && <span className="ef-badge ef-bafu" title={`BAFU:2025: ${ba.dir} (${ba.count} process${ba.count > 1 ? "es" : ""})`}>{fmtBadge("B", ba)}</span>}
        </span>
      )}
      {info && (
        <span
          className={`mapping-badge ${info.type === "1:1" ? "mapping-one" : "mapping-many"}`}
          title={`${info.type} mapping (${info.count} ${info.count === 1 ? "link" : "links"})`}
        >
          {info.type === "1:1" ? "1:1" : `1:${info.count}`}
        </span>
      )}
    </div>
  );
}
