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
        showMetaModal: false,
      };
    }
    return initial;
  });

  // Auto-save to localStorage when custom tree or registry changes (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTreeRef = useRef(state.customTree);
  const prevRegistryRef = useRef(state.metaParameterRegistry);

  useEffect(() => {
    if (
      state.customTree === prevTreeRef.current &&
      state.metaParameterRegistry === prevRegistryRef.current
    ) {
      return;
    }
    prevTreeRef.current = state.customTree;
    prevRegistryRef.current = state.metaParameterRegistry;

    if (state.customTree.length === 0 && state.metaParameterRegistry === INITIAL_STATE.metaParameterRegistry) {
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveBuilderState(state);
      dispatch({ type: "MARK_SAVED" });
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.customTree, state.metaParameterRegistry, state]);

  return (
    <BuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </BuilderContext.Provider>
  );
}
