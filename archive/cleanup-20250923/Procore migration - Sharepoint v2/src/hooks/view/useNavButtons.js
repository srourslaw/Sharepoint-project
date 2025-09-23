import React from 'react';

import PrintIcon from '@mui/icons-material/Print';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const useNavButtons = ({ setIsSendEmail, thumbnailURL, pdfDownloadURL }) => {
  const handlePrint = () => {
    // window.print();
    const newURL = new URL(pdfDownloadURL);
    let printWindow = window.open(newURL.href, '_blank');

    if (printWindow) {
      printWindow.focus(); // Bring the new tab to focus

      printWindow.onload = function () {
        printWindow.print();
      };
    } else {
      alert('Pop-up blocked! Please allow pop-ups for this site.');
    }
  };

  const handleDownload = async () => {
    const newURL = new URL(pdfDownloadURL);
    window.open(newURL.href, '_blank');
  };

  const handleSendEmail = () => {
    setIsSendEmail(true);
  };

  const openSharePointFile = () => {
    window.open(thumbnailURL, '_blank');
  };

  const operationButtons = [
    {
      label: 'Print',
      icon: <PrintIcon sx={{ color: '#fff' }} />,
      fnc: handlePrint,
      isActive: true,
    },
    {
      label: 'Send',
      icon: <MailOutlineIcon sx={{ color: '#fff' }} />,
      fnc: handleSendEmail,
      isActive: true,
    },
    {
      label: 'open file in a new tab',
      icon: <OpenInNewIcon sx={{ color: '#fff' }} />,
      fnc: openSharePointFile,
      isActive: true,
    },
    {
      label: 'Download',
      icon: <DownloadIcon sx={{ color: '#fff' }} />,
      fnc: handleDownload,
      isActive: true,
    },
  ];

  return {
    operationButtons,
  };
};

export default useNavButtons;
