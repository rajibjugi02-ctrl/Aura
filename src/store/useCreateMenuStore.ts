import { create } from "zustand";

interface CreateMenuState {
  isOpen: boolean;
  openCreateMenu: () => void;
  closeCreateMenu: () => void;
}

export const useCreateMenuStore = create<CreateMenuState>((set) => ({
  isOpen: false,
  openCreateMenu: () => set({ isOpen: true }),
  closeCreateMenu: () => set({ isOpen: false }),
}));

