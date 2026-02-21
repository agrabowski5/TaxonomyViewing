import React, { createContext, useContext, useReducer, useEffect, useRef } from "react";
import type { BuilderState, BuilderAction } from "./types";
import { builderReducer, INITIAL_STATE } from "./reducer";
import { saveBuilderState, loadBuilderState } from "./persistence";

interface BuilderContextValue {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, INITIAL_STATE, (initial) => {
    const saved = loadBuilderState();
    if (saved) {
      return {
        ...saved,
        active: false,
        showResetDialog: false,
        showExportPanel: false,
      };
    }
    return initial;
  });

  // Auto-save to localStorage when custom tree changes (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTreeRef = useRef(state.customTree);

  useEffect(() => {
    // Always clear pending timer first to prevent race conditions on discard
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (state.customTree === prevTreeRef.current) return;
    prevTreeRef.current = state.customTree;

    // Don't auto-save empty trees
    if (state.customTree.length === 0) return;

    saveTimerRef.current = setTimeout(() => {
      saveBuilderState(state);
      dispatch({ type: "MARK_SAVED" });
    }, 500);
  }, [state.customTree, state]);

  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
}
