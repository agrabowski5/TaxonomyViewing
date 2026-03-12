import type { NodeRendererProps } from "react-arborist";
import type { TreeNode as TNode, MappingInfo } from "./types";

interface Props extends NodeRendererProps<TNode> {
  mappingInfo?: Record<string, MappingInfo>;
  onNodeSelect?: (node: TNode) => void;
  colorMap?: Record<string, string>;
  ecoinventCoverage?: Map<string, number>;
  epaCoverage?: Map<string, number>;
  exiobaseCoverage?: Map<string, number>;
  uslciCoverage?: Map<string, number>;
  bafuCoverage?: Map<string, number>;
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
  const ecoinventCount = ecoinventCoverage?.get(data.id);
  const epaCount = epaCoverage?.get(data.id);
  const exiobaseCount = exiobaseCoverage?.get(data.id);
  const uslciCount = uslciCoverage?.get(data.id);
  const bafuCount = bafuCoverage?.get(data.id);

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
      {(ecoinventCount || epaCount || exiobaseCount || uslciCount || bafuCount) && (
        <span className="ef-badges">
          {ecoinventCount && <span className="ef-badge ef-ecoinvent" title={`ecoinvent v3.12: ${ecoinventCount} product${ecoinventCount > 1 ? "s" : ""}`}>e {ecoinventCount === 1 ? "1:1" : `1:${ecoinventCount}`}</span>}
          {epaCount && <span className="ef-badge ef-epa" title={`EPA/USEEIO: ${epaCount} emission factor${epaCount > 1 ? "s" : ""}`}>U {epaCount === 1 ? "1:1" : `1:${epaCount}`}</span>}
          {exiobaseCount && <span className="ef-badge ef-exiobase" title={`EXIOBASE 3.8.2: ${exiobaseCount} product categor${exiobaseCount > 1 ? "ies" : "y"}`}>X {exiobaseCount === 1 ? "1:1" : `1:${exiobaseCount}`}</span>}
          {uslciCount && <span className="ef-badge ef-uslci" title={`US LCI (NREL): ${uslciCount} process${uslciCount > 1 ? "es" : ""}`}>L {uslciCount === 1 ? "1:1" : `1:${uslciCount}`}</span>}
          {bafuCount && <span className="ef-badge ef-bafu" title={`BAFU:2025: ${bafuCount} process${bafuCount > 1 ? "es" : ""} with GHG data`}>B {bafuCount === 1 ? "1:1" : `1:${bafuCount}`}</span>}
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
