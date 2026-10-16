import { create } from "zustand";

interface LoadingState {
	loading: number
	startLoading: () => void
	stopLoading: () => void
}

const useLoading = create<LoadingState>((set) => ({
  loading: 0,
  startLoading: () => set((state) => ({ loading: state.loading + 1 })),
  stopLoading: () =>
    set((state) => ({ loading: state.loading > 0 ? state.loading - 1 : 0 })),
}));

export { useLoading };