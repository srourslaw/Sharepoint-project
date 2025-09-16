import { create } from 'zustand';

export const useBulkUploadStore = create((set, get) => ({
  open: false,
  setOpen: (open) => set(() => ({ open })),

  selectedFile: null,
  setSelectedFile: (file) => set(() => ({ selectedFile: file })),

  confirmationDialogText: null,
  setConfirmationDialogText: (confirmationDialogText) =>
    set(() => ({ confirmationDialogText })),

  fileVersions: null,
  setFileVersions: (fileVersions) => set(() => ({ fileVersions })),

  isAllFileSuccessfullyUploaded: false,
  setIsAllFileSuccessfullyUploaded: (isSuccess) =>
    set(() => ({ isAllFileSuccessfullyUploaded: isSuccess })),

  filter: {},
  setFilter: (filter) =>
    set((prev) => ({ filter: { ...prev.filter, ...filter } })),

  resetStore: () =>
    set(() => ({
      open: false,
      selectedFile: null,
      confirmationDialogText: null,
      fileVersions: null,
      isAllFileSuccessfullyUploaded: false,
      formValues: {},
      group: null,
      selectedFiles: [],
    })),

  formValues: {},
  setFormValues: (values) => set({ formValues: values }),

  uploadError: '',
  setUploadError: (error) => set(() => ({ uploadError: error })),

  submitMode: null,
  setSubmitMode: (submitMode) => set(() => ({ submitMode })),

  hidden: false,
  setHidden: (hidden) => set(() => ({ hidden })),

  group: null,
  setGroup: (group) => set(() => ({ group })),

  selectedFiles: [],
  setSelectedFiles: (files) => set(() => ({ selectedFiles: files })),
}));
