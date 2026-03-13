import type { TreeNode, MappingInfo, CoverageInfo } from "./types";
import type { GapHighlightData } from "./TaxonomyTree";
import { NODE_WIDTH, NODE_HEIGHT } from "./graphLayout";

interface Props {
  node: TreeNode;
  x: number;
  y: number;
  isExpanded: boolean;
  isLeaf: boolean;
  isSelected: boolean;
  color: string;
  mappingInfo?: MappingInfo;
  ecoinventCoverage?: CoverageInfo;
  epaCoverage?: CoverageInfo;
  exiobaseCoverage?: CoverageInfo;
  uslciCoverage?: CoverageInfo;
  bafuCoverage?: CoverageInfo;
  gabiCoverage?: CoverageInfo;
  gapHighlight?: GapHighlightData;
  descendantCount: number;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
}

function fmtBadge(letter: string, info: CoverageInfo): string {
  if (info.dir === "1:1") return `${letter}`;
  if (info.dir === "1:N") return `${letter}${info.count}`;
  return `${letter}${info.shared}`;
}

export function GraphNodeCard({
  node,
  x,
  y,
  isExpanded,
  isLeaf,
  isSelected,
  color,
  mappingInfo,
  ecoinventCoverage: ei,
  epaCoverage: ep,
  exiobaseCoverage: ex,
  uslciCoverage: us,
  bafuCoverage: ba,
  gabiCoverage: ga,
  gapHighlight,
  descendantCount,
  onToggle,
  onSelect,
}: Props) {
  const isGapLeaf = gapHighlight?.leafIds.has(node.id) ?? false;
  const isGapAncestor =
    !isGapLeaf && (gapHighlight?.ancestorIds.has(node.id) ?? false);

  const hasBadges = !!(ei || ep || ex || us || ba || ga);

  return (
    <div
      className={`graph-node-card ${isSelected ? "selected" : ""} ${isGapLeaf ? "gap-leaf" : ""} ${isGapAncestor ? "gap-ancestor" : ""}`}
      style={{
        position: "absolute",
        transform: `translate(${x}px, ${y}px)`,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node);
      }}
    >
      {!isLeaf && (
        <button
          className="graph-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
        >
          {isExpanded ? "v" : ">"}
        </button>
      )}
      <span
        className="graph-code-badge"
        style={{ backgroundColor: color }}
      >
        {node.code}
      </span>
      <span className="graph-node-name" title={node.name}>
        {node.name}
      </span>
      {!isExpanded && descendantCount > 0 && (
        <span className="graph-descendant-count">
          {descendantCount.toLocaleString()}
        </span>
      )}
      {hasBadges && (
        <span className="graph-badges">
          {ei && (
            <span
              className="graph-badge gb-ecoinvent"
              title={`ecoinvent: ${ei.dir} (${ei.count})`}
            >
              {fmtBadge("e", ei)}
            </span>
          )}
          {ep && (
            <span
              className="graph-badge gb-epa"
              title={`EPA: ${ep.dir} (${ep.count})`}
            >
              {fmtBadge("U", ep)}
            </span>
          )}
          {ex && (
            <span
              className="graph-badge gb-exiobase"
              title={`EXIOBASE: ${ex.dir} (${ex.count})`}
            >
              {fmtBadge("X", ex)}
            </span>
          )}
          {us && (
            <span
              className="graph-badge gb-uslci"
              title={`USLCI: ${us.dir} (${us.count})`}
            >
              {fmtBadge("L", us)}
            </span>
          )}
          {ba && (
            <span
              className="graph-badge gb-bafu"
              title={`BAFU: ${ba.dir} (${ba.count})`}
            >
              {fmtBadge("B", ba)}
            </span>
          )}
          {ga && (
            <span
              className="graph-badge gb-gabi"
              title={`GaBi: ${ga.dir} (${ga.count})`}
            >
              {fmtBadge("G", ga)}
            </span>
          )}
        </span>
      )}
      {mappingInfo && (
        <span
          className={`graph-mapping-badge ${mappingInfo.type === "1:1" ? "mapping-one" : "mapping-many"}`}
        >
          {mappingInfo.type === "1:1" ? "1:1" : `1:${mappingInfo.count}`}
        </span>
      )}
    </div>
  );
}

function countDescendants(n: TreeNode): number {
  if (!n.children) return 0;
  let count = n.children.length;
  for (const child of n.children) count += countDescendants(child);
  return count;
}

export { countDescendants };
