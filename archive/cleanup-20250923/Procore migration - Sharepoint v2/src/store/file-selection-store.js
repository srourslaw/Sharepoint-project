import { create } from 'zustand';

export const useRowSelectionStore = create((set) => ({
  rows: new Set(),
  setSelectedRows: (id, checked) =>
    set((state) => {
      const newSet = new Set(state.rows);

      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }

      return {
        rows: newSet,
      };
    }),
  clearRows: () =>
    set(() => ({
      rows: new Set(),
    })),
}));
