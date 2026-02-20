/** Universal Meta-Parameter Layer info panel shown at bottom of custom taxonomy panel */
export function MetaParameterLayer() {
  return (
    <div className="builder-meta-layer">
      <div className="builder-meta-layer-label">Universal Meta-Parameter Layer</div>
      <div className="builder-meta-layer-subtitle">
        Applies automatically to all nodes. No classification decision needed.
      </div>
      <div className="builder-meta-layer-dimensions">
        <span className="builder-meta-layer-dim">Geography</span>
        <span className="builder-meta-layer-sep">·</span>
        <span className="builder-meta-layer-dim">Time</span>
        <span className="builder-meta-layer-sep">·</span>
        <span className="builder-meta-layer-dim">Jurisdiction</span>
        <span className="builder-meta-layer-sep">·</span>
        <span className="builder-meta-layer-dim">Production standard</span>
        <span className="builder-meta-layer-sep">·</span>
        <span className="builder-meta-layer-dim">Grade</span>
      </div>
    </div>
  );
}
