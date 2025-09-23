import { create } from 'zustand';

export const useApprovalStore = create((set) => ({
  approvalDetails: null,
  setApprovalDetails: (approvalDetails) => set({ approvalDetails }),

  rowDetails: null,
  setRowDetails: (rowDetails) => set({ rowDetails }),

  selectedStatus: null,
  setSelectedStatus: (selectedStatus) => set({ selectedStatus }),

  filter: null,
  setFilter: (filter) => set({ filter }),

  isEdit: false,
  setIsEdit: (isEdit) => set({ isEdit }),

  approvalList: [],
  setApprovalList: (approvalList) => set({ approvalList }),

  snackbar: {
    open: false,
    severity: 'success',
    message: '',
  },
  setSnackbar: (snackbar) => set({ snackbar }),

  reset: () =>
    set({
      approvalDetails: null,
      rowDetails: null,
      selectedStatus: null,
      filter: null,
      isEdit: false,
      approvalList: [],
      snackbar: { open: false, severity: 'success', message: '' },
    }),
}));
