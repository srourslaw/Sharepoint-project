import { z } from 'zod';
import { dmsAxiosInstance } from '../lib/dms-axios';
import {
  getSplitDocumentDetailsSchema,
  splitDrawingStatusSchema,
} from '../schemas/split-drawing.schema';
import { useSplitDrawingStore } from '../store/split-drawing-store';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useBulkUploadStore } from '../Components/upload/bulk-upload-store';
import { useQuery } from '@tanstack/react-query';

const pollingCancelToken = new Map();

export const useSplitDrawing = () => {
  const openModal = useSplitDrawingStore((state) => state.openModal);
  const handleOpen = useSplitDrawingStore((state) => state.handleOpen);
  const handleClose = useSplitDrawingStore((state) => state.handleClose);
  const docName = useSplitDrawingStore((state) => state.docName);
  const setDocName = useSplitDrawingStore((state) => state.setDocName);
  const status = useSplitDrawingStore((state) => state.status);
  const setStatus = useSplitDrawingStore((state) => state.setStatus);
  const isLoading = useSplitDrawingStore((state) => state.isLoading);
  const setIsLoading = useSplitDrawingStore((state) => state.setIsLoading);
  const docDetails = useSplitDrawingStore((state) => state.docDetails);
  const setDocDetails = useSplitDrawingStore((state) => state.setDocDetails);
  const docDetailsLoading = useSplitDrawingStore(
    (state) => state.docDetailsLoading,
  );
  const setDocDetailsLoading = useSplitDrawingStore(
    (state) => state.setDocDetailsLoading,
  );
  const uploadedFileNames = useSplitDrawingStore(
    (state) => state.uploadedFileNames,
  );
  const setUploadedFileNames = useSplitDrawingStore(
    (state) => state.setUploadedFileNames,
  );
  const savedMetadataFields = useSplitDrawingStore(
    (state) => state.savedMetadataFields,
  );
  const setSavedMetadataFields = useSplitDrawingStore(
    (state) => state.setSavedMetadataFields,
  );

  const setHidden = useBulkUploadStore((state) => state.setHidden);
  const setOpen = useBulkUploadStore((state) => state.setOpen);
  const resetStore = useBulkUploadStore((state) => state.resetStore);

  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const getUploadedFileNames = async () => {
    try {
      const response = await dmsAxiosInstance.get('/v1/pdf-split-and-ocr');
      setUploadedFileNames(response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting uploaded file names:', error);
      throw error;
    }
  };

  const uploadPDFFile = async (pdfFile) => {
    try {
      setIsLoading(true);
      const response = await dmsAxiosInstance.post(
        '/v1/pdf-split-and-ocr',
        pdfFile,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
        },
      );

      const docName = pdfFile.file.name.split('.pdf')[0];
      setDocName(docName);
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const startPdfSplit = async (docName) => {
    try {
      const response = await dmsAxiosInstance.post(
        `/v1/pdf-split-and-ocr/${docName}/start`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error starting PDF split:', error);
    }
  };

  const getPdfSplitStatus = async (docName) => {
    try {
      const response = await dmsAxiosInstance.get(
        `/v1/pdf-split-and-ocr/${docName}/status`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error getting PDF split status:', error);
      throw error;
    }
  };

  const fetchedPageTracker = new Map();

  const pollingGetPdfSplitStatus = async (docName) => {
    const interval = 2000;

    if (!fetchedPageTracker.has(docName)) {
      fetchedPageTracker.set(docName, new Set());
    }
    const fetchedPages = fetchedPageTracker.get(docName);

    pollingCancelToken.set(docName, false);

    return new Promise((resolve) => {
      let intervalId;
      let isFirstSuccess = true;

      const poll = async () => {
        if (pollingCancelToken.get(docName)) {
          clearInterval(intervalId);
          return resolve();
        }
        try {
          const status = await getPdfSplitStatus(docName);
          const parsedStatus = splitDrawingStatusSchema.parse(status);
          setStatus(parsedStatus);

          if (isFirstSuccess) {
            setIsLoading(false);
            isFirstSuccess = false;
          }

          for (const [key, pageData] of Object.entries(parsedStatus.pages)) {
            const pageNum = pageData.page;

            if (
              (pageData.status === 'READY' || pageData.status === 'IGNORE') &&
              !fetchedPages.has(pageNum)
            ) {
              const imageName = pageData.img || pageData.pdf || '';
              if (!imageName) continue;

              if (pollingCancelToken.get(docName)) {
                clearInterval(intervalId);
                return resolve();
              }

              fetchedPages.add(pageNum);

              try {
                await getSplitDocumentDetails(docName, pageNum, imageName);

                if (pollingCancelToken.get(docName)) {
                  clearInterval(intervalId);
                  return resolve();
                }
              } catch (err) {
                console.error(
                  `Failed to fetch details for page ${pageNum}:`,
                  err,
                );
              }
            }
          }

          const allReady = Object.values(parsedStatus.pages).every(
            (page) => page.status === 'READY' || page.status === 'PROCESSED',
          );

          if (allReady) {
            clearInterval(intervalId);
            pollingCancelToken.delete(docName);
            resolve(parsedStatus);
          }
        } catch (error) {
          console.warn('Polling error:', error);
          if (
            error?.response?.data?.detail ===
            'File not found - have you started the process? Was it deleted already?'
          ) {
            startPdfSplit(docName);
          }
        }
      };

      intervalId = setInterval(poll, interval);
      poll();
    });
  };

  const getSplitDocumentDetails = async (docName, page, imageName) => {
    try {
      setDocDetailsLoading(true);
      const response = await dmsAxiosInstance.get(
        `/v1/pdf-split-and-ocr/${docName}/pages/${page}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const documentDetails = getSplitDocumentDetailsSchema.safeParse(
        response.data,
      );

      if (!documentDetails.success) {
        console.error('Validation failed:', documentDetails.error.flatten());
        throw new Error('Invalid split document details response');
      }

      const imageBlob = await getSplitDocumentFile(
        docName,
        page,
        imageName,
        'blob',
      );
      const objectUrl = URL.createObjectURL(imageBlob);

      documentDetails.data.image = objectUrl;

      const pdfFileBlob = await getSplitDocumentFile(
        docName,
        page,
        `page_${page}.pdf`,
        'blob',
      );
      const pdfFile = new File([pdfFileBlob], `${docName}-page_${page}.pdf`, {
        type: 'application/pdf',
      });

      documentDetails.data.file = pdfFile;

      setDocDetails(`page_${page}`, documentDetails.data);

      setDocDetailsLoading(false);
      return documentDetails.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.errors);
      } else {
        console.error('Error getting split document file:', error);
      }
      throw error;
    }
  };

  const getSplitDocumentFile = async (
    docName,
    page,
    fileName,
    responseType = 'json',
  ) => {
    try {
      const response = await dmsAxiosInstance.get(
        `/v1/pdf-split-and-ocr/${docName}/pages/${page}/${fileName}`,
        {
          headers: {
            Accept: 'application/json',
          },
          responseType,
        },
      );
      return response.data;
    } catch (error) {
      console.error('Error getting split document file:', error);
      throw error;
    }
  };

  const updatePageStatus = async (docName, page, newStatus, uniqueId) => {
    const documentLink = uniqueId ? `?document_uri=/view/${uniqueId}` : '';

    try {
      await dmsAxiosInstance.patch(
        `/v1/pdf-split-and-ocr/${docName}/pages/${page}/${newStatus}${documentLink}`,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      const status = await getPdfSplitStatus(docName);
      const parsedStatus = splitDrawingStatusSchema.parse(status);
      setStatus(parsedStatus);

      return parsedStatus;
    } catch (error) {
      console.error('Error updating page status:', error);
      throw error;
    }
  };

  const deleteUploadedFile = async (docName) => {
    try {
      await dmsAxiosInstance.delete(`/v1/pdf-split-and-ocr/${docName}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      setDocName(null);
      setStatus(null);
      setDocDetails({});
      setUploadedFileNames((prev) => prev.filter((file) => file !== docName));
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
      throw error;
    }
  };

  const savePageMetadata = async (docName, payload) => {
    try {
      const response = await dmsAxiosInstance.patch(
        `/v1/pdf-split-and-ocr/${docName}/pages`,
        payload,
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error saving page status:', error);
      throw error;
    }
  };

  const getSavedMetadataFields = async (docName) => {
    try {
      const response = await getPdfSplitStatus(docName);
      setSavedMetadataFields(response);
    } catch (error) {
      console.error('Error getting saved metadata fields:', error);
    }
  };

  const handleOpenSplit = async () => {
    handleOpen();
    setHidden(true);
  };

  const { refetch: refetchApprovalTable } = useQuery({
    queryKey: ['fetchApprovalTable'],
    enabled: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const handleCloseSplit = () => {
    const searchParams = new URLSearchParams(location.search);
    const navigateFrom = searchParams.get('from');
    if (navigateFrom === 'approval') {
      refetchApprovalTable();
      console.log('refetching approval table');
    }
    if (docName) {
      pollingCancelToken.set(docName, true);
    }
    if (
      params?.docName &&
      window.location.pathname.includes('/split-drawing')
    ) {
      handleClose();
      setOpen(false);
      resetStore();
      navigate('/main');
    } else {
      handleClose();
    }
    setHidden(false);
  };

  return {
    uploadPDFFile,
    startPdfSplit,
    openModal,
    handleOpenSplit,
    handleCloseSplit,
    docName,
    setDocName,
    getPdfSplitStatus,
    pollingGetPdfSplitStatus,
    status,
    setStatus,
    isLoading,
    setIsLoading,
    getSplitDocumentDetails,
    getSplitDocumentFile,
    docDetails,
    setDocDetails,
    docDetailsLoading,
    setDocDetailsLoading,
    getUploadedFileNames,
    uploadedFileNames,
    setUploadedFileNames,
    updatePageStatus,
    savePageMetadata,
    savedMetadataFields,
    getSavedMetadataFields,
    deleteUploadedFile,
  };
};
