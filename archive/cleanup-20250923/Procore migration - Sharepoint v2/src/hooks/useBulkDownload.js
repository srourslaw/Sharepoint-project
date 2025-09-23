import { useState } from 'react';
import { dmsAxiosInstance } from '../lib/dms-axios';

export const useBulkDownload = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    main: '',
    failed: [],
    success: [],
  });
  const [modalActions, setModalActions] = useState(null);
  const [downloadableStatus, setDownloadableStatus] = useState('');

  const bulkDownloadByKey = async (downloadKey, isAuth) => {
    try {
      const { data: downloadStatusResponse } = await dmsAxiosInstance.get(
        `/v1/status/${downloadKey}`,
        {
          headers: {
            Authorization: `Bearer ${isAuth.idToken}`,
          },
        },
      );

      const fileStatus = downloadStatusResponse.details.files_status;
      const files = downloadStatusResponse.details.files;
      setDownloadableStatus(fileStatus);

      if (downloadStatusResponse.status === 'PROCESSED') {
        if (fileStatus === 'ok') {
          showModal('Your download is starting...');
          await initiateFileDownload(
            downloadKey,
            downloadStatusResponse,
            isAuth,
          );
        } else if (fileStatus === 'partial') {
          const content = generateFileStatusMessage(files);
          showModal(
            `Some files failed to download:\n\n${content}`,
            async () => {
              await initiateFileDownload(
                downloadKey,
                downloadStatusResponse,
                isAuth,
              );
              closeModal();
            },
          );
        } else {
          const content = generateFileStatusMessage(files);
          showModal(`Failed to generate download:\n\n${content}`);
        }
      } else {
        showModal(
          `Your request is still being processed. Current status: ${downloadStatusResponse.status}`,
        );
      }
    } catch (error) {
      const errorResponse = error?.response?.data;
      let errorMessage = errorResponse?.detail;

      if (
        errorResponse instanceof Blob &&
        errorResponse?.type === 'application/json'
      ) {
        const text = await error.response.data.text();
        const parsedErrorResponse = JSON.parse(text);
        errorMessage = parsedErrorResponse.detail;
      }

      const fallback = 'Something went wrong.';
      showModal(errorMessage || fallback);
    }
  };

  const generateFileStatusMessage = (files) => {
    const messages = [];

    Object.values(files).forEach((file) => {
      const shortFilename = file.filename?.split('/').pop();

      if (file.status === 'ok') {
        messages.push(`✅ ${shortFilename}.`);
      } else if (file.status === 'error') {
        const cleanError = extractReadableError(file.error);
        messages.push(`❌ ${shortFilename} — ${cleanError}`);
      }
    });

    return messages.join('\n');
  };

  const extractReadableError = (errorMsg = '') => {
    try {
      const match = errorMsg.match(/<m:message[^>]*>(.*?)<\/m:message>/);
      if (match && match[1]) {
        return match[1];
      }

      const fallback = errorMsg.split(':').pop()?.trim();
      return fallback || 'Unknown error';
    } catch {
      return 'Unknown error';
    }
  };

  const initiateFileDownload = async (
    downloadKey,
    downloadStatusResponse,
    isAuth,
  ) => {
    const { data: fileBlob, headers } = await dmsAxiosInstance.get(
      `/v1/downloads/${downloadKey}`,
      {
        headers: {
          Authorization: `Bearer ${isAuth.idToken}`,
        },
        responseType: 'blob',
      },
    );

    const contentType = headers['content-type'];
    const fileExtension = contentType.split('/')[1];

    const url = window.URL.createObjectURL(new Blob([fileBlob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${downloadStatusResponse.details.output_filename}.${fileExtension}`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const splitFileMessages = (text = '') => {
    const lines = text.split('\n');
    const failed = lines.filter((line) => line.startsWith('❌'));
    const success = lines.filter((line) => line.startsWith('✅'));
    return { failed, success };
  };

  const splitErrorMessages = (lines = []) => {
    return lines.map((item) => {
      const [title, message] = item.split(' — ');
      return `${title}\n      ${message.trim()}`;
    });
  };

  const showModal = (message, onConfirm = null) => {
    const { failed, success } = splitFileMessages(message);
    const formattedFailed = splitErrorMessages(failed);
    setModalContent({
      main: message.split('\n\n')[0],
      failed: formattedFailed,
      success,
    });
    setModalActions(() => onConfirm);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalActions(null);
  };

  return {
    bulkDownloadByKey,
    modalOpen,
    setModalOpen,
    modalContent,
    modalActions,
    downloadableStatus,
  };
};
