import { useBuilder } from "./context";

export function BuilderBanner() {
  const { state, dispatch } = useBuilder();

  if (!state.active) return null;

  return (
    <div className="builder-banner">
      <span className="builder-banner-text">
        Custom Taxonomy Builder — editing in right pane
      </span>
      <div className="builder-banner-actions">
        {state.lastSavedAt && (
          <span className="builder-last-saved">
            Last saved: {new Date(state.lastSavedAt).toLocaleTimeString()}
          </span>
        )}
        <button
          className="builder-reset-btn"
          onClick={() => dispatch({ type: "TOGGLE_RESET_DIALOG" })}
        >
          Exit Builder
        </button>
      </div>
    </div>
  );
}
