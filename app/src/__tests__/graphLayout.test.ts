import { describe, it, expect } from "vitest";
import { computeGraphLayout, NODE_WIDTH, NODE_HEIGHT } from "../graphLayout";
import type { TreeNode } from "../types";

const H_GAP = 8;
const V_GAP = 36;

function leaf(id: string, code = id, name = id): TreeNode {
  return { id, code, name, type: "leaf" };
}

function branch(id: string, children: TreeNode[], code = id, name = id): TreeNode {
  return { id, code, name, type: "branch", children };
}

describe("computeGraphLayout", () => {
  describe("empty input", () => {
    it("returns empty layout for no data", () => {
      const result = computeGraphLayout([], new Set());
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
      expect(result.totalWidth).toBe(H_GAP * 2);
      expect(result.totalHeight).toBe(V_GAP);
    });
  });

  describe("single root node", () => {
    it("places a single leaf at correct position", () => {
      const data = [leaf("a")];
      const result = computeGraphLayout(data, new Set());
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe("a");
      // x = xStart + slotWidth/2 - NODE_WIDTH/2 = 0 + (188)/2 - 90 = 4
      expect(result.nodes[0].x).toBe(H_GAP / 2);
      expect(result.nodes[0].y).toBe(0);
      expect(result.nodes[0].depth).toBe(0);
      expect(result.nodes[0].isLeaf).toBe(true);
      expect(result.nodes[0].isExpanded).toBe(false);
      expect(result.nodes[0].parentId).toBeNull();
      expect(result.edges).toHaveLength(0);
    });

    it("totalWidth accounts for node width + gaps", () => {
      const data = [leaf("a")];
      const result = computeGraphLayout(data, new Set());
      // maxX = x + NODE_WIDTH = 4 + 180 = 184, totalWidth = 184 + H_GAP*2 = 200
      expect(result.totalWidth).toBe(NODE_WIDTH + H_GAP / 2 + H_GAP * 2);
    });

    it("totalHeight accounts for node height + bottom gap", () => {
      const data = [leaf("a")];
      const result = computeGraphLayout(data, new Set());
      expect(result.totalHeight).toBe(NODE_HEIGHT + V_GAP);
    });
  });

  describe("multiple top-level nodes", () => {
    it("lays out siblings side by side", () => {
      const data = [leaf("a"), leaf("b"), leaf("c")];
      const result = computeGraphLayout(data, new Set());
      expect(result.nodes).toHaveLength(3);

      // Each leaf slot = NODE_WIDTH + H_GAP, node centered with offset H_GAP/2
      const slotWidth = NODE_WIDTH + H_GAP;
      const offset = H_GAP / 2; // centering offset within slot
      expect(result.nodes[0].x).toBe(offset);
      expect(result.nodes[1].x).toBe(slotWidth + offset);
      expect(result.nodes[2].x).toBe(slotWidth * 2 + offset);

      // All at depth 0
      for (const n of result.nodes) {
        expect(n.y).toBe(0);
        expect(n.depth).toBe(0);
      }

      expect(result.edges).toHaveLength(0);
    });

    it("total width spans all siblings", () => {
      const data = [leaf("a"), leaf("b")];
      const result = computeGraphLayout(data, new Set());
      // rightmost x = slotWidth + H_GAP/2, maxX = that + NODE_WIDTH, + H_GAP*2
      const expectedWidth = (NODE_WIDTH + H_GAP) + H_GAP / 2 + NODE_WIDTH + H_GAP * 2;
      expect(result.totalWidth).toBe(expectedWidth);
    });
  });

  describe("collapsed parent with children", () => {
    it("shows only the parent when collapsed", () => {
      const data = [branch("p", [leaf("c1"), leaf("c2")])];
      const result = computeGraphLayout(data, new Set());
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe("p");
      expect(result.nodes[0].isLeaf).toBe(false);
      expect(result.nodes[0].isExpanded).toBe(false);
      expect(result.edges).toHaveLength(0);
    });
  });

  describe("expanded parent with children", () => {
    it("shows parent and children when expanded", () => {
      const data = [branch("p", [leaf("c1"), leaf("c2")])];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      expect(result.nodes).toHaveLength(3);
      const parent = result.nodes.find((n) => n.id === "p")!;
      const child1 = result.nodes.find((n) => n.id === "c1")!;
      const child2 = result.nodes.find((n) => n.id === "c2")!;

      expect(parent.depth).toBe(0);
      expect(parent.isExpanded).toBe(true);
      expect(child1.depth).toBe(1);
      expect(child2.depth).toBe(1);
      expect(child1.parentId).toBe("p");
      expect(child2.parentId).toBe("p");
    });

    it("children are at correct vertical position", () => {
      const data = [branch("p", [leaf("c1")])];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      const parent = result.nodes.find((n) => n.id === "p")!;
      const child = result.nodes.find((n) => n.id === "c1")!;

      expect(parent.y).toBe(0);
      expect(child.y).toBe(NODE_HEIGHT + V_GAP);
    });

    it("creates edges from parent to children", () => {
      const data = [branch("p", [leaf("c1"), leaf("c2")])];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      expect(result.edges).toHaveLength(2);

      const edge1 = result.edges.find((e) => e.childId === "c1")!;
      const edge2 = result.edges.find((e) => e.childId === "c2")!;

      expect(edge1.parentId).toBe("p");
      expect(edge2.parentId).toBe("p");

      // Edge starts at parent center-bottom
      const parent = result.nodes.find((n) => n.id === "p")!;
      expect(edge1.x1).toBe(parent.x + NODE_WIDTH / 2);
      expect(edge1.y1).toBe(parent.y + NODE_HEIGHT);

      // Edge ends at child center-top
      const child1 = result.nodes.find((n) => n.id === "c1")!;
      expect(edge1.x2).toBe(child1.x + NODE_WIDTH / 2);
      expect(edge1.y2).toBe(child1.y);
    });

    it("children are placed side by side under parent", () => {
      const data = [branch("p", [leaf("c1"), leaf("c2"), leaf("c3")])];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      const children = result.nodes.filter((n) => n.parentId === "p");
      expect(children).toHaveLength(3);

      // Children should be in left-to-right order
      const xs = children.map((c) => c.x);
      expect(xs[0]).toBeLessThan(xs[1]);
      expect(xs[1]).toBeLessThan(xs[2]);
    });
  });

  describe("deeply nested tree", () => {
    it("handles 3-level deep tree correctly", () => {
      const data = [
        branch("root", [
          branch("mid", [leaf("deep1"), leaf("deep2")]),
        ]),
      ];
      const expanded = new Set(["root", "mid"]);
      const result = computeGraphLayout(data, expanded);

      expect(result.nodes).toHaveLength(4);
      const root = result.nodes.find((n) => n.id === "root")!;
      const mid = result.nodes.find((n) => n.id === "mid")!;
      const deep1 = result.nodes.find((n) => n.id === "deep1")!;
      const deep2 = result.nodes.find((n) => n.id === "deep2")!;

      expect(root.depth).toBe(0);
      expect(mid.depth).toBe(1);
      expect(deep1.depth).toBe(2);
      expect(deep2.depth).toBe(2);

      // Y positions increase with depth
      expect(root.y).toBe(0);
      expect(mid.y).toBe(NODE_HEIGHT + V_GAP);
      expect(deep1.y).toBe(2 * (NODE_HEIGHT + V_GAP));
    });

    it("creates edges for all parent-child relationships", () => {
      const data = [
        branch("root", [
          branch("mid", [leaf("deep")]),
        ]),
      ];
      const expanded = new Set(["root", "mid"]);
      const result = computeGraphLayout(data, expanded);

      expect(result.edges).toHaveLength(2);
      expect(result.edges.some((e) => e.parentId === "root" && e.childId === "mid")).toBe(true);
      expect(result.edges.some((e) => e.parentId === "mid" && e.childId === "deep")).toBe(true);
    });
  });

  describe("partial expansion", () => {
    it("only shows children of expanded nodes", () => {
      const data = [
        branch("root", [
          branch("a", [leaf("a1"), leaf("a2")]),
          branch("b", [leaf("b1"), leaf("b2")]),
        ]),
      ];
      // Only expand root and branch "a", not "b"
      const expanded = new Set(["root", "a"]);
      const result = computeGraphLayout(data, expanded);

      // root + a + a1 + a2 + b (collapsed, children hidden)
      expect(result.nodes).toHaveLength(5);
      expect(result.nodes.map((n) => n.id).sort()).toEqual(["a", "a1", "a2", "b", "root"]);

      const nodeB = result.nodes.find((n) => n.id === "b")!;
      expect(nodeB.isExpanded).toBe(false);
      expect(nodeB.isLeaf).toBe(false);
    });
  });

  describe("width calculation", () => {
    it("expanded subtree takes more width than collapsed", () => {
      const data = [
        branch("p", [leaf("c1"), leaf("c2"), leaf("c3")]),
      ];

      const collapsed = computeGraphLayout(data, new Set());
      const expanded = computeGraphLayout(data, new Set(["p"]));

      expect(expanded.totalWidth).toBeGreaterThan(collapsed.totalWidth);
    });

    it("parent is centered above its children", () => {
      const data = [
        branch("p", [leaf("c1"), leaf("c2")]),
      ];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      const parent = result.nodes.find((n) => n.id === "p")!;
      const child1 = result.nodes.find((n) => n.id === "c1")!;
      const child2 = result.nodes.find((n) => n.id === "c2")!;

      const childrenCenter = (child1.x + child2.x + NODE_WIDTH) / 2;
      const parentCenter = parent.x + NODE_WIDTH / 2;

      // Parent center should be at or near children center
      expect(Math.abs(parentCenter - childrenCenter)).toBeLessThan(NODE_WIDTH);
    });
  });

  describe("node data integrity", () => {
    it("preserves original TreeNode data in layout nodes", () => {
      const original: TreeNode = { id: "test", code: "T01", name: "Test Node", type: "chapter" };
      const data = [original];
      const result = computeGraphLayout(data, new Set());

      expect(result.nodes[0].data).toBe(original);
      expect(result.nodes[0].data.code).toBe("T01");
      expect(result.nodes[0].data.name).toBe("Test Node");
    });

    it("marks leaf vs branch correctly", () => {
      const data = [
        branch("p", [leaf("c")]),
      ];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      expect(result.nodes.find((n) => n.id === "p")!.isLeaf).toBe(false);
      expect(result.nodes.find((n) => n.id === "c")!.isLeaf).toBe(true);
    });

    it("treats node with empty children array as leaf", () => {
      const node: TreeNode = { id: "empty", code: "E", name: "Empty", type: "t", children: [] };
      const result = computeGraphLayout([node], new Set());
      expect(result.nodes[0].isLeaf).toBe(true);
    });
  });

  describe("edge coordinates", () => {
    it("edge y1 is at parent bottom, y2 is at child top", () => {
      const data = [branch("p", [leaf("c")])];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      const edge = result.edges[0];
      const parent = result.nodes.find((n) => n.id === "p")!;
      const child = result.nodes.find((n) => n.id === "c")!;

      expect(edge.y1).toBe(parent.y + NODE_HEIGHT);
      expect(edge.y2).toBe(child.y);
      expect(edge.y2).toBeGreaterThan(edge.y1);
    });

    it("edge x coordinates are at node center", () => {
      const data = [branch("p", [leaf("c")])];
      const expanded = new Set(["p"]);
      const result = computeGraphLayout(data, expanded);

      const edge = result.edges[0];
      const parent = result.nodes.find((n) => n.id === "p")!;
      const child = result.nodes.find((n) => n.id === "c")!;

      expect(edge.x1).toBe(parent.x + NODE_WIDTH / 2);
      expect(edge.x2).toBe(child.x + NODE_WIDTH / 2);
    });
  });

  describe("large tree performance", () => {
    it("handles a wide tree with many siblings", () => {
      const children = Array.from({ length: 50 }, (_, i) => leaf(`c${i}`));
      const data = [branch("root", children)];
      const expanded = new Set(["root"]);
      const result = computeGraphLayout(data, expanded);

      expect(result.nodes).toHaveLength(51); // root + 50 children
      expect(result.edges).toHaveLength(50);
      expect(result.totalWidth).toBeGreaterThan(50 * NODE_WIDTH);
    });

    it("handles a deep tree", () => {
      // Build a 10-level deep chain
      let current: TreeNode = leaf("d10");
      for (let i = 9; i >= 0; i--) {
        current = branch(`d${i}`, [current]);
      }
      const expandAll = new Set(Array.from({ length: 10 }, (_, i) => `d${i}`));
      const result = computeGraphLayout([current], expandAll);

      expect(result.nodes).toHaveLength(11);
      expect(result.edges).toHaveLength(10);
      expect(result.totalHeight).toBe(10 * (NODE_HEIGHT + V_GAP) + NODE_HEIGHT + V_GAP);
    });
  });
});
