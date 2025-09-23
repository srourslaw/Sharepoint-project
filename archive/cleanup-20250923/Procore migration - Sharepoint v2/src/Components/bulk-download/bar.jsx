import { memo, useEffect, useMemo } from 'react';
import { useRowSelectionStore } from '../../store/file-selection-store';
import { Box, Grid, Tooltip } from '@mui/material';
import { MailOutline } from '@mui/icons-material';
import { BulkDownloadDialog } from './dialog';

export const BulkDownloadBar = memo(function BulkDownloadBar({
  response,
  filterGroup,
}) {
  const { rows, clearRows } = useRowSelectionStore();

  const selectedRows = useMemo(
    () =>
      response
        .map((data, index) => ({
          cells: data.Cells,
          rowIndex: index,
        }))
        .filter((_, index) => rows.has(index)),
    [response, rows],
  );

  useEffect(() => {
    clearRows();
  }, [filterGroup]);

  const fileExtensionsCount = useMemo(
    () =>
      Object.entries(
        selectedRows
          .map(
            (row) => row.cells.find((cell) => cell.Key === 'FileType')?.Value,
          )
          .reduce((acc, curr) => {
            if (!acc[curr]) {
              acc[curr] = 0;
            }

            acc[curr]++;
            return acc;
          }, {}),
      )
        .map(([ext, count]) => `${count} ${ext}`)
        .join(', '),
    [selectedRows],
  );

  if (!rows.size) return null;

  return (
    <Grid item xs={12}>
      <Box
        sx={{
          minWidth: '100%',
          backgroundColor: 'rgb(41, 152, 111)',
          boxShadow: '1px 1px 5px gray',
          margin: '10px 10px 0px 0px!important',
          color: 'white',
          justifyContent: 'space-between',
          display: 'flex',
          alignItems: 'center',
          paddingInline: '10px',
          minHeight: '50px',
        }}
      >
        <p
          style={{
            fontWeight: '800',
          }}
        >
          {rows.size} – Documents Selected – {fileExtensionsCount}
        </p>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Tooltip title="Coming soon">
            <MailOutline sx={{ color: '#fff' }} />
          </Tooltip>
          <BulkDownloadDialog selectedRows={selectedRows} />
        </Box>
      </Box>
    </Grid>
  );
});
