import { memo } from 'react';
import { Dropzone } from '../ui/dropzone';

export const UploadDropzone = memo(function UploadDropzone({ handleAppend }) {
  const handleFileUpload = (files) => {
    files.forEach((file) => {
      handleAppend(file);
    });
  };

  return <Dropzone multiple onBulkUploaded={handleFileUpload} />;
});
