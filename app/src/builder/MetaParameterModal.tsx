import { useState } from "react";
import { useBuilder } from "./context";

export function MetaParameterModal() {
  const { state, dispatch } = useBuilder();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) return;
    dispatch({
      type: "ADD_REGISTRY_PARAM",
      def: {
        id: `reg-${crypto.randomUUID().slice(0, 8)}`,
        name: newName.trim(),
        description: newDesc.trim(),
        active: true,
      },
    });
    setNewName("");
    setNewDesc("");
  };

  const handleToggle = (id: string, active: boolean) => {
    dispatch({
      type: "UPDATE_REGISTRY_PARAM",
      id,
      updates: { active: !active },
    });
  };

  return (
    <div className="builder-modal-overlay" onClick={() => dispatch({ type: "TOGGLE_META_MODAL" })}>
      <div className="builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="builder-modal-header">
          <h2>Meta-Parameter Registry</h2>
          <button
            className="builder-modal-close"
            onClick={() => dispatch({ type: "TOGGLE_META_MODAL" })}
          >
            ×
          </button>
        </div>

        <div className="builder-modal-body">
          <table className="builder-registry-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {state.metaParameterRegistry.map((param) => (
                <tr key={param.id} className={param.active ? "" : "inactive"}>
                  <td style={{ fontWeight: 600 }}>{param.name}</td>
                  <td>{param.description}</td>
                  <td>{param.active ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      className="builder-registry-toggle"
                      onClick={() => handleToggle(param.id, param.active)}
                    >
                      {param.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="builder-registry-add">
            <input
              type="text"
              placeholder="Parameter name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <button
              className="builder-registry-add-btn"
              onClick={handleAdd}
              disabled={!newName.trim()}
            >
              Add
            </button>
          </div>
        </div>

        <div className="builder-modal-footer">
          <button
            className="builder-form-cancel"
            onClick={() => dispatch({ type: "TOGGLE_META_MODAL" })}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
