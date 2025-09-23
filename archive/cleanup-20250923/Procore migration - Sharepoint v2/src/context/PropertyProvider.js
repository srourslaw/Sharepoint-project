import { createContext, useState } from 'react';

export const PropertyContext = createContext();

const PropertyProvider = ({ children }) => {
  const [capturedResponse, setCaptureResponse] = useState([]);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(null);
  const [openTags, setOpenTags] = useState(true);

  return (
    <PropertyContext.Provider
      value={{
        capturedResponse,
        setCaptureResponse,
        openUploadModal,
        setOpenUploadModal,
        openViewModal,
        setOpenViewModal,
        openTags,
        setOpenTags,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export default PropertyProvider;
