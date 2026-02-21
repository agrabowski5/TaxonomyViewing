import { useState, useEffect } from "react";
import { useBuilder } from "./context";
import {
  loadLibrary,
  saveToLibrary,
  loadFromLibrary,
  deleteFromLibrary,
  renameInLibrary,
} from "./persistence";
import type { SavedTaxonomyEntry } from "./types";

interface Props {
  onClose: () => void;
  /** When true, show "Save Current" at top (only when builder has a tree) */
  showSave: boolean;
}

export function TaxonomyLibraryDialog({ onClose, showSave }: Props) {
  const { state, dispatch } = useBuilder();
  const [entries, setEntries] = useState<SavedTaxonomyEntry[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadLibrary());
  }, []);

  const handleSave = () => {
    const name = saveName.trim() || `Taxonomy ${entries.length + 1}`;
    setSaving(true);
    saveToLibrary(name, state);
    setEntries(loadLibrary());
    setSaveName("");
    setSaving(false);
  };

  const handleLoad = (id: string) => {
    const loaded = loadFromLibrary(id);
    if (loaded) {
      dispatch({
        type: "LOAD_STATE",
        state: { ...loaded, active: true, showResetDialog: false, showExportPanel: false },
      });
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    deleteFromLibrary(id);
    setEntries(loadLibrary());
    setConfirmDeleteId(null);
  };

  const handleRenameStart = (entry: SavedTaxonomyEntry) => {
    setRenamingId(entry.id);
    setRenameValue(entry.name);
  };

  const handleRenameCommit = () => {
    if (renamingId && renameValue.trim()) {
      renameInLibrary(renamingId, renameValue.trim());
      setEntries(loadLibrary());
    }
    setRenamingId(null);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="builder-modal-overlay" onClick={onClose}>
      <div
        className="builder-modal library-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="builder-modal-header">
          <h2>Taxonomy Library</h2>
          <button className="builder-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="builder-modal-body">
          {showSave && state.customTree.length > 0 && (
            <div className="library-save-section">
              <label>Save current taxonomy</label>
              <div className="library-save-row">
                <input
                  type="text"
                  className="builder-form-input"
                  placeholder={`Taxonomy ${entries.length + 1}`}
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                  }}
                />
                <button
                  className="builder-form-save"
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {entries.length === 0 ? (
            <div className="library-empty">
              <p>No saved taxonomies yet.</p>
              {showSave && state.customTree.length > 0 && (
                <p>Use the form above to save your current taxonomy.</p>
              )}
            </div>
          ) : (
            <div className="library-list">
              {entries.map((entry) => (
                <div key={entry.id} className="library-entry">
                  <div className="library-entry-info">
                    {renamingId === entry.id ? (
                      <input
                        className="builder-form-input library-rename-input"
                        type="text"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameCommit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameCommit();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                    ) : (
                      <div
                        className="library-entry-name"
                        title="Double-click to rename"
                        onDoubleClick={() => handleRenameStart(entry)}
                      >
                        {entry.name}
                      </div>
                    )}
                    <div className="library-entry-meta">
                      <span>{entry.nodeCount.toLocaleString()} nodes</span>
                      {entry.baseTaxonomy && (
                        <span>based on {entry.baseTaxonomy.toUpperCase()}</span>
                      )}
                      <span>{formatDate(entry.savedAt)}</span>
                    </div>
                  </div>
                  <div className="library-entry-actions">
                    <button
                      className="library-load-btn"
                      onClick={() => handleLoad(entry.id)}
                    >
                      Load
                    </button>
                    <button
                      className="library-rename-btn"
                      onClick={() => handleRenameStart(entry)}
                    >
                      Rename
                    </button>
                    {confirmDeleteId === entry.id ? (
                      <>
                        <button
                          className="library-delete-confirm-btn"
                          onClick={() => handleDelete(entry.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="library-delete-cancel-btn"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="library-delete-btn"
                        onClick={() => setConfirmDeleteId(entry.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="builder-modal-footer">
          <button className="builder-form-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
