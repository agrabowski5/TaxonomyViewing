import type { NodeRendererProps } from "react-arborist";
import type { TreeNode as TNode, MappingInfo } from "./types";

interface Props extends NodeRendererProps<TNode> {
  mappingInfo?: Record<string, MappingInfo>;
  onNodeSelect?: (node: TNode) => void;
  colorMap?: Record<string, string>;
  ecoinventCoverage?: Set<string>;
  epaCoverage?: Set<string>;
  exiobaseCoverage?: Set<string>;
  uslciCoverage?: Set<string>;
}

function countDescendants(n: TNode): number {
  if (!n.children) return 0;
  let count = n.children.length;
  for (const child of n.children) count += countDescendants(child);
  return count;
}

export function TreeNodeRenderer({ node, style, mappingInfo, onNodeSelect, colorMap, ecoinventCoverage, epaCoverage, exiobaseCoverage, uslciCoverage }: Props) {
  const data = node.data;
  const info = mappingInfo?.[data.id];
  const color = colorMap?.[data.id] || "#6b7280";
  const descendantCount = !node.isLeaf ? countDescendants(data) : 0;
  const hasEcoinvent = ecoinventCoverage?.has(data.id);
  const hasEpa = epaCoverage?.has(data.id);
  const hasExiobase = exiobaseCoverage?.has(data.id);
  const hasUslci = uslciCoverage?.has(data.id);

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
      {(hasEcoinvent || hasEpa || hasExiobase || hasUslci) && (
        <span className="ef-badges">
          {hasEcoinvent && <span className="ef-badge ef-ecoinvent" title="ecoinvent v3.10">e</span>}
          {hasEpa && <span className="ef-badge ef-epa" title="EPA/USEEIO">U</span>}
          {hasExiobase && <span className="ef-badge ef-exiobase" title="EXIOBASE 3.8.2">X</span>}
          {hasUslci && <span className="ef-badge ef-uslci" title="US LCI (NREL)">L</span>}
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
