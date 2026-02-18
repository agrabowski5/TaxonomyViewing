import { useBuilder } from "./context";
import { clearBuilderState } from "./persistence";

interface Props {
  onKeep: () => void;
  onClear: () => void;
}

export function ResetDialog({ onKeep, onClear }: Props) {
  const { dispatch } = useBuilder();

  const handleKeep = () => {
    onKeep();
  };

  const handleClear = () => {
    clearBuilderState();
    onClear();
  };

  const handleCancel = () => {
    dispatch({ type: "TOGGLE_RESET_DIALOG" });
  };

  return (
    <div className="builder-modal-overlay" onClick={handleCancel}>
      <div className="builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="builder-modal-header">
          <h2>Reset to Original</h2>
          <button className="builder-modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="builder-modal-body builder-reset-body">
          <p>
            Do you want to keep your custom taxonomy saved for later, or clear it entirely?
          </p>

          <div className="builder-reset-options">
            <button className="builder-reset-option" onClick={handleKeep}>
              <div className="builder-reset-option-text">
                <div className="builder-reset-option-title">Keep Saved</div>
                <div className="builder-reset-option-desc">
                  Exit sandbox mode but keep your custom taxonomy in storage for later.
                </div>
              </div>
            </button>

            <button className="builder-reset-option" onClick={handleClear}>
              <div className="builder-reset-option-text">
                <div className="builder-reset-option-title">Clear Everything</div>
                <div className="builder-reset-option-desc">
                  Exit sandbox mode and permanently delete your custom taxonomy.
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="builder-modal-footer">
          <button className="builder-form-cancel" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
