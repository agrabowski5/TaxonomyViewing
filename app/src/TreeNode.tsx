import type { NodeRendererProps } from "react-arborist";
import type { TreeNode as TNode, MappingInfo } from "./types";

interface Props extends NodeRendererProps<TNode> {
  mappingInfo?: Record<string, MappingInfo>;
  onNodeSelect?: (node: TNode) => void;
  colorMap?: Record<string, string>;
}

export function TreeNodeRenderer({ node, style, mappingInfo, onNodeSelect, colorMap }: Props) {
  const data = node.data;
  const info = mappingInfo?.[data.id];
  const color = colorMap?.[data.id] || "#6b7280";

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
