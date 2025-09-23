import { create } from 'zustand';
import { splitDrawingStatusSchema } from '../schemas/split-drawing.schema';

export const useSplitDrawingStore = create((set) => ({
  openModal: false,
  handleOpen: () => {
    set({ isLoading: true, openModal: true });
  },
  handleClose: () => {
    set({
      openModal: false,
      status: null,
      error: null,
      docName: null,
      isLoading: false,
      docDetails: {},
      docDetailsLoading: false,
      uploadedFileNames: [],
      savedMetadataFields: {},
    });
  },

  docName: null,
  setDocName: (docName) => set({ docName }),

  status: null,
  error: null,

  setStatus: (data) => {
    const result = splitDrawingStatusSchema.safeParse(data);

    if (result.success) {
      set({ status: result.data, error: null });
    } else {
      set({ status: null, error: result.error.format() });
      console.warn('Validation failed', result.error);
    }
  },

  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  docDetails: {},
  setDocDetails: (page, details) =>
    set((state) => ({
      docDetails: {
        ...state.docDetails,
        [page]: details,
      },
    })),

  docDetailsLoading: false,
  setDocDetailsLoading: (isLoading) => set({ docDetailsLoading: isLoading }),

  uploadedFileNames: [],
  setUploadedFileNames: (fileNames) => set({ uploadedFileNames: fileNames }),

  savedMetadataFields: {},
  setSavedMetadataFields: (fields) => set({ savedMetadataFields: fields }),
}));
