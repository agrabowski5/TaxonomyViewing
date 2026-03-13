import React, { useState, useMemo, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import type { TreeNode, MappingInfo, CoverageInfo } from "./types";
import type { GapHighlightData } from "./TaxonomyTree";
import { computeGraphLayout, NODE_WIDTH, NODE_HEIGHT } from "./graphLayout";
import { GraphNodeCard, countDescendants } from "./GraphNodeCard";

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

export interface GraphTreeHandle {
  expandToNode: (id: string) => void;
  selectNode: (id: string) => void;
}

/** Build a map of nodeId -> TreeNode for fast lookup */
function buildNodeMap(data: TreeNode[]): Map<string, TreeNode> {
  const map = new Map<string, TreeNode>();
  function walk(nodes: TreeNode[]) {
    for (const n of nodes) {
      map.set(n.id, n);
      if (n.children) walk(n.children);
    }
  }
  walk(data);
  return map;
}

/** Find path from root to a target node */
function findPath(data: TreeNode[], targetId: string): string[] {
  const path: string[] = [];
  function search(nodes: TreeNode[], trail: string[]): boolean {
    for (const n of nodes) {
      if (n.id === targetId) {
        path.push(...trail, n.id);
        return true;
      }
      if (n.children && search(n.children, [...trail, n.id])) return true;
    }
    return false;
  }
  search(data, []);
  return path;
}

/** Descendant count cache */
function buildDescendantCounts(data: TreeNode[]): Map<string, number> {
  const counts = new Map<string, number>();
  function walk(n: TreeNode): number {
    const c = countDescendants(n);
    counts.set(n.id, c);
    if (n.children) n.children.forEach(walk);
    return c;
  }
  data.forEach(walk);
  return counts;
}

export const GraphTree = forwardRef<GraphTreeHandle, Props>(function GraphTree(
  {
    data,
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
  ref,
) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset expanded state when data changes (taxonomy switch)
  useEffect(() => {
    setExpandedIds(new Set());
    setSelectedId(null);
  }, [data]);

  const descendantCounts = useMemo(() => buildDescendantCounts(data), [data]);

  const layout = useMemo(
    () => computeGraphLayout(data, expandedIds),
    [data, expandedIds],
  );

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (node: TreeNode) => {
      setSelectedId(node.id);
      onNodeSelect(node);
    },
    [onNodeSelect],
  );

  // Imperative handle for cross-pane sync
  useImperativeHandle(
    ref,
    () => ({
      expandToNode: (id: string) => {
        const path = findPath(data, id);
        if (path.length === 0) return;
        setExpandedIds((prev) => {
          const next = new Set(prev);
          // Expand all ancestors (not the target itself)
          for (let i = 0; i < path.length - 1; i++) {
            next.add(path[i]);
          }
          return next;
        });
        setSelectedId(id);
        // Scroll to node after layout settles
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const el = containerRef.current?.querySelector(
              `[data-node-id="${id}"]`,
            );
            el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
          });
        });
      },
      selectNode: (id: string) => {
        setSelectedId(id);
        const el = containerRef.current?.querySelector(
          `[data-node-id="${id}"]`,
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      },
    }),
    [data],
  );

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
          Showing {gapHighlight.leafIds.size.toLocaleString()} uncovered leaves
          for <strong>{gapHighlight.dbLabel}</strong>
          <button
            className="gap-highlight-banner-close"
            onClick={onClearGapHighlight}
          >
            ✕ Exit
          </button>
        </div>
      )}
      <div className="graph-container" ref={containerRef}>
        <div
          className="graph-canvas"
          style={{
            width: Math.max(layout.totalWidth, 400),
            height: Math.max(layout.totalHeight, 200),
            position: "relative",
          }}
        >
          {/* SVG edge layer */}
          <svg
            className="graph-edges"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            {layout.edges.map((e) => {
              const midY = (e.y1 + e.y2) / 2;
              return (
                <path
                  key={`${e.parentId}-${e.childId}`}
                  d={`M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`}
                  className="graph-edge"
                />
              );
            })}
          </svg>

          {/* Node layer */}
          {layout.nodes.map((ln) => (
            <div key={ln.id} data-node-id={ln.id}>
              <GraphNodeCard
                node={ln.data}
                x={ln.x}
                y={ln.y}
                isExpanded={ln.isExpanded}
                isLeaf={ln.isLeaf}
                isSelected={selectedId === ln.id}
                color={colorMap[ln.id] || "#6b7280"}
                mappingInfo={mappingInfo[ln.id]}
                ecoinventCoverage={ecoinventCoverage?.get(ln.id)}
                epaCoverage={epaCoverage?.get(ln.id)}
                exiobaseCoverage={exiobaseCoverage?.get(ln.id)}
                uslciCoverage={uslciCoverage?.get(ln.id)}
                bafuCoverage={bafuCoverage?.get(ln.id)}
                gabiCoverage={gabiCoverage?.get(ln.id)}
                gapHighlight={gapHighlight}
                descendantCount={descendantCounts.get(ln.id) ?? 0}
                onToggle={handleToggle}
                onSelect={handleSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
