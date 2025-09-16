import { Fragment, memo, useEffect, useMemo, useState } from 'react';
import {
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  Modal,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { DraggableFileList } from './file-list';
import { useHandleBulkDownload } from './useHandleBulkDownload';
import { DOWNLOAD_TYPE } from '../../const/common';
import { getKeyValue } from '../../utils/helpers';
import { useRowSelectionStore } from '../../store/file-selection-store';

const DEFAULT_DOWNLOAD_TYPE = DOWNLOAD_TYPE.INDIVIDUAL;

const DOWNLOAD_TYPE_DISCLAIMERS = {
  [DOWNLOAD_TYPE.INDIVIDUAL]:
    '<p style="margin: 0">You will receive each file below individually downloaded instantly to your device. PDFs will not be merged.</p>',
  [DOWNLOAD_TYPE.MERGED_PDF]:
    '<p style="margin: 0">You will receive an email when the bulk download is ready.</p><p style="margin: 0">If any of the files below are not PDFs you will receive a zip file with a single merged pdf of the pdfs along with all the other files.</p>',
  [DOWNLOAD_TYPE.ZIP]:
    '<p style="margin: 0">You will receive an email when the bulk download is ready.</p><p style="margin: 0">This will contain a link for a single zip file with all the files below. PDFs will not be merged.</p>',
};

export const BulkDownloadDialog = memo(function BulkDownloadDialog({
  selectedRows,
}) {
  const [open, setOpen] = useState(false);
  const [downloadType, setDownloadType] = useState(DEFAULT_DOWNLOAD_TYPE);
  const [sortedItems, setSortedItems] = useState([]);
  const [downloadFileName, setDownloadFileName] = useState('');
  const { clearRows } = useRowSelectionStore();

  const { handleDownload, isPending } = useHandleBulkDownload();

  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setDownloadType(DEFAULT_DOWNLOAD_TYPE);
    setDownloadFileName('');
  };

  useEffect(() => {
    setSortedItems(
      selectedRows.map(({ cells, rowIndex }) => ({
        id: `row-${rowIndex}`,
        cells,
        rowIndex,
      })),
    );
  }, [selectedRows]);

  const pdfCount = useMemo(
    () =>
      selectedRows
        .map((row) => row.cells.find((cell) => cell.Key === 'FileType')?.Value)
        .filter((type) => type?.toLowerCase() === 'pdf'),
    [selectedRows],
  );

  const canDownload = useMemo(() => {
    if (downloadType === DOWNLOAD_TYPE.INDIVIDUAL) {
      return true;
    }

    if (downloadType === DOWNLOAD_TYPE.MERGED_PDF && pdfCount < 1) {
      return false;
    }

    return Boolean(downloadFileName?.trim());
  }, [downloadType, downloadFileName, pdfCount]);

  const downloadTypeDisclaimerText = useMemo(() => {
    return (
      <Typography
        component="div"
        sx={{ fontStyle: 'italic' }}
        dangerouslySetInnerHTML={{
          __html: DOWNLOAD_TYPE_DISCLAIMERS[downloadType] || '',
        }}
      />
    );
  }, [downloadType]);

  const handleDownloadTypeChange = (event) => {
    setDownloadType(event.target.value);
  };

  const handleDownloadClick = () => {
    const fileSources = sortedItems.map(({ cells }) => cells);

    handleDownload(
      { downloadType, fileSources, fileName: downloadFileName },
      {
        onSuccess: () => {
          clearRows();
          handleClose();
        },
      },
    );
  };

  const needsFileName = [DOWNLOAD_TYPE.MERGED_PDF, DOWNLOAD_TYPE.ZIP].includes(
    downloadType,
  );

  return (
    <Fragment>
      <IconButton onClick={handleOpen}>
        <Download sx={{ color: 'white' }} />
      </IconButton>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 'max-content',
            maxWidth: '1024px',
            minWidth: '400px',
            backgroundColor: 'white',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              minHeight: '50px',
              backgroundColor: 'rgb(41, 152, 111)',
              paddingInline: '16px',
              position: 'sticky',
              zIndex: 50,
              top: 0,
            }}
          >
            <Typography
              sx={{ fontSize: 16, color: 'white', fontWeight: '800' }}
            >
              Bulk Download
            </Typography>
            {downloadType === DOWNLOAD_TYPE.MERGED_PDF && (
              <Typography
                sx={{
                  fontSize: 16,
                  color: 'white',
                  fontWeight: '800',
                  marginLeft: 'auto',
                }}
              >
                Drag and Drop the files below to arrange the pages
              </Typography>
            )}
            <IconButton
              onClick={handleClose}
              sx={{
                marginLeft: 'auto',
                color: 'white',
              }}
            >
              <CloseIcon sx={{ color: 'white' }} />
            </IconButton>
          </div>

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                position: 'sticky',
                backgroundColor: 'white',
                zIndex: '50',
                top: '50px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px',
                }}
              >
                <FormControl sx={{ marginLeft: 'auto' }}>
                  <RadioGroup
                    row
                    aria-labelledby="download-type-radio-buttons-group"
                    value={downloadType}
                    onChange={handleDownloadTypeChange}
                    name="download-type-radio-group"
                  >
                    <FormControlLabel
                      value={DOWNLOAD_TYPE.INDIVIDUAL}
                      control={<Radio />}
                      label="Individual"
                    />
                    <FormControlLabel
                      value={DOWNLOAD_TYPE.MERGED_PDF}
                      control={<Radio />}
                      label="Merged PDF"
                      disabled={pdfCount < 1}
                    />
                    <FormControlLabel
                      value={DOWNLOAD_TYPE.ZIP}
                      control={<Radio />}
                      label="ZIP"
                    />
                  </RadioGroup>
                </FormControl>

                {needsFileName && (
                  <TextField
                    variant="standard"
                    size="small"
                    required
                    label="File Name"
                    helperText="Without extensions"
                    value={downloadFileName}
                    onChange={(e) => setDownloadFileName(e.target.value)}
                  />
                )}

                <Button
                  disabled={!canDownload}
                  loading={isPending}
                  onClick={handleDownloadClick}
                  variant="contained"
                  sx={{
                    width: 'fit-content',
                    backgroundColor: 'rgb(41, 152, 111)',
                  }}
                >
                  <Download />
                  Download
                </Button>
              </div>

              {/* Disclaimer Text */}
              {downloadType && <div>{downloadTypeDisclaimerText}</div>}
            </div>

            {sortedItems?.length > 0 && (
              <DraggableFileList
                sortedItems={sortedItems}
                setSortedItems={setSortedItems}
                downloadType={downloadType}
              />
            )}
          </div>
        </div>
      </Modal>
    </Fragment>
  );
});
