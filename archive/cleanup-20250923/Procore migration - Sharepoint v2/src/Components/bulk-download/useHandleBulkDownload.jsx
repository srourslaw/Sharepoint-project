import { useMutation } from '@tanstack/react-query';
import { dmsAxiosInstance } from '../../lib/dms-axios';
import { ALERT_SEVERITY, DOWNLOAD_TYPE } from '../../const/common';
import { useSnackbar } from '../../context/snackbar-provider';
import { ContentCopy } from '@mui/icons-material';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { Check } from '@mui/icons-material';
import { getKeyValue, normalizeCells } from '../../utils/helpers';

const SP_ROOT_PARENT_PATHNAME = '/Forms/AllItems.aspx';

function getSourceUrlPathname(parentLink, filename) {
  const isInRoot = parentLink.includes(SP_ROOT_PARENT_PATHNAME);
  const base = isInRoot
    ? parentLink.split(SP_ROOT_PARENT_PATHNAME)[0]
    : parentLink;

  return new URL(`${base}/${encodeURIComponent(filename)}`).pathname;
}

/**
 * Handles individual file downloads by creating temporary anchor elements
 */
function handleIndividualDownloads(cells) {
  cells.forEach((cell, index) => {
    setTimeout(() => {
      const { filename, parentLink, siteNameUrl } = normalizeCells(cell);

      const spDownloadUrl = new URL(`${siteNameUrl}/_layouts/15/download.aspx`);

      spDownloadUrl.searchParams.set(
        'SourceUrl',
        // prevent double encoding as searchParams.set apply encoding
        decodeURIComponent(getSourceUrlPathname(parentLink, filename)),
      );

      const a = document.createElement('a');
      a.href = spDownloadUrl.toString();
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, index * 200);
  });
}

/**
 * Handles asynchronous downloads (ZIP or merged PDF) via API
 */
async function handleAsyncDownload(fileSources, fileName, downloadType) {
  const fileUrls = fileSources.map((cell) => getKeyValue(cell, 'Path'));
  // Convert array of file sources to object with 1-based indexing
  const fileMapping = fileUrls.reduce((acc, url, index) => {
    acc[index + 1] = url;
    return acc;
  }, {});

  const requestData = {
    output_filename: fileName,
    style: downloadType,
    files: fileMapping,
  };

  return await dmsAxiosInstance.post('/v1/async-bulk-download', requestData);
}

const downloadStrategies = {
  [DOWNLOAD_TYPE.INDIVIDUAL]: handleIndividualDownloads,
  [DOWNLOAD_TYPE.ZIP]: handleAsyncDownload,
  [DOWNLOAD_TYPE.MERGED_PDF]: handleAsyncDownload,
};

const SnackbarDownloadMessage = ({ downloadUrl }) => {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const hasCopiedText = Boolean(copiedText);

  return (
    <div>
      Your download is being prepared and will arrive in your email soon.
      <br />
      {downloadUrl && (
        <div style={{}}>
          <span>
            You can check periodically without the email with this&nbsp;
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
                cursor: 'pointer',
                color: 'inherit',
              }}
            >
              Bulk download url
            </a>
            {hasCopiedText ? (
              <Check fontSize="small" />
            ) : (
              <ContentCopy
                sx={{
                  ml: '4px',
                  cursor: 'pointer',
                }}
                fontSize="small"
                onClick={() => copyToClipboard(downloadUrl)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Custom hook to handle bulk file downloads with different strategies
 */
export function useHandleBulkDownload() {
  const { showSnackbar } = useSnackbar();

  const { mutate, ...mutationResults } = useMutation({
    mutationFn: async ({
      fileSources = [],
      downloadType,
      fileName = 'download',
    }) => {
      const downloadStrategy = downloadStrategies[downloadType];

      if (!downloadStrategy) {
        throw new Error(`Unsupported download type: ${downloadType}`);
      }

      return await downloadStrategy(fileSources, fileName, downloadType);
    },
    onSuccess: (response, variables) => {
      // Don't show notification for individual downloads as they're instant
      if (variables.downloadType !== DOWNLOAD_TYPE.INDIVIDUAL) {
        const downloadUrl = response.data.download_url;
        showSnackbar({
          message: <SnackbarDownloadMessage downloadUrl={downloadUrl} />,
        });
      }
    },
    onError: (error) => {
      showSnackbar({
        severity: ALERT_SEVERITY.ERROR,
        message:
          error.response.data.detail || error.message || 'Download failed',
      });
    },
  });

  return {
    handleDownload: mutate,
    ...mutationResults,
  };
}
