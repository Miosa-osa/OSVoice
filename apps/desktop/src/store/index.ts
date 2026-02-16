import { produce } from "immer";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { INITIAL_APP_STATE, type AppState } from "../state/app.state";

export const useAppStore = createWithEqualityFn<AppState>(
  () => INITIAL_APP_STATE,
  shallow,
);

export const setAppState = useAppStore.setState;

export const getAppState = useAppStore.getState;

export const produceAppState = (fn: (draft: AppState) => void) => {
  setAppState((state) => produce(state, fn));
};
