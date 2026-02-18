import { useBuilder } from "./context";

export function BuilderBanner() {
  const { state, dispatch } = useBuilder();

  if (!state.active) return null;

  return (
    <div className="builder-banner">
      <span className="builder-banner-text">
        Sandbox Mode — changes here won't affect your saved taxonomies
      </span>
      <div className="builder-banner-actions">
        {state.lastSavedAt && (
          <span className="builder-last-saved">
            Last saved: {new Date(state.lastSavedAt).toLocaleTimeString()}
          </span>
        )}
        <button
          className="builder-export-btn"
          onClick={() => dispatch({ type: "TOGGLE_EXPORT_PANEL" })}
        >
          Export Custom Taxonomy
        </button>
        <button
          className="builder-reset-btn"
          onClick={() => dispatch({ type: "TOGGLE_RESET_DIALOG" })}
        >
          ↩ Reset to Original
        </button>
      </div>
    </div>
  );
}
