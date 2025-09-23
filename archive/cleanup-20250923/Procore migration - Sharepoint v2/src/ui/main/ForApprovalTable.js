import React from 'react';

import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Tooltip,
  Paper,
  TableSortLabel,
} from '@mui/material';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const ForApprovalTable = ({
  approvalPageTableOrderBy,
  approvalPageTableOrder,
  handleSortApprovalPageTable,
  sortedData,
  handleViewFileContentActionClick,
  termsMapData,
  versionFileStatusMapping,
  termsGuidToLabel,
  termsMapCTData,
  minorVersionIframePropRaw,
  convertUTCToLocal,
}) => {
  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: '130px', overflow: 'auto' }}
    >
      <Table
        stickyHeader
        sx={{ minWidth: '30vw', maxHeight: '90%' }}
        size="small"
        aria-label="a dense table"
      >
        <TableHead sx={{ margin: '0px 0px 0px 0px' }}>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '20%',
                fontSize: '12px',
              }}
            >
              Title
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '5%',
                fontSize: '12px',
              }}
            >
              Business
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '8%',
                fontSize: '12px',
              }}
            >
              Resort
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '8%',
                fontSize: '12px',
              }}
            >
              Department
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '8%',
                fontSize: '12px',
              }}
            >
              Building
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '8%',
                fontSize: '12px',
              }}
            >
              Document Type
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '10%',
                fontSize: '12px',
              }}
            >
              <TableSortLabel
                active={approvalPageTableOrderBy === 'DrawingNumber'}
                direction={
                  approvalPageTableOrderBy === 'DrawingNumber'
                    ? approvalPageTableOrder
                    : 'asc'
                }
                onClick={() => handleSortApprovalPageTable('DrawingNumber')}
              >
                Drawing Number
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '8%',
                fontSize: '12px',
              }}
            >
              <TableSortLabel
                active={approvalPageTableOrderBy === 'RevisionNumber'}
                direction={
                  approvalPageTableOrderBy === 'RevisionNumber'
                    ? approvalPageTableOrder
                    : 'asc'
                }
                onClick={() => handleSortApprovalPageTable('RevisionNumber')}
              >
                Rev Number
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: '800',
                color: 'rgb(41, 152, 111)',
                width: '10%',
                fontSize: '12px',
              }}
            >
              <TableSortLabel
                active={approvalPageTableOrderBy === 'Modified'}
                direction={
                  approvalPageTableOrderBy === 'Modified'
                    ? approvalPageTableOrder
                    : 'asc'
                }
                onClick={() => handleSortApprovalPageTable('Modified')}
              >
                Submission Date
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ maxHeight: '100px', color: 'gray' }}>
          {sortedData.map((row) => (
            <TableRow
              key={row?.Id}
              sx={{
                '&:last-child td, &:last-child th': {
                  border: 0,
                },
              }}
            >
              <TableCell
                onClick={(e) =>
                  handleViewFileContentActionClick(
                    row?.UniqueId,
                    row?.Id,
                    row?.Title,
                    row?.OData__UIVersionString,
                    row?.Versions?.__deferred?.uri,
                  )
                }
                sx={{
                  color: 'inherit',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                component="th"
                scope="row"
              >
                {row?.Title === null ? (
                  <>
                    <span
                      style={{
                        color: 'orange',
                        fontWeight: '800',
                      }}
                    >
                      NOT SPECIFIED
                    </span>
                  </>
                ) : (
                  row?.Title
                )}
                <>
                  <span
                    style={{
                      color: 'rgb(41, 152, 111)',
                      fontWeight: '800',
                    }}
                  >
                    {' '}
                    v{row?.OData__UIVersionString}
                  </span>
                </>
                <Tooltip
                  placement="right"
                  title={
                    <>
                      <div>
                        <strong>Author: {row?.Author?.Title || 'N/A'}</strong>
                      </div>
                      <div>
                        <strong>Editor: {row?.Editor?.Title || 'N/A'}</strong>
                      </div>
                      <div>
                        <strong>
                          Revision:{' '}
                          {row?.[termsMapData['Revision Number']] || 'N/A'}
                        </strong>
                      </div>
                      <div>
                        <strong>
                          Comments:{' '}
                          {row?.OData__ModerationComments || // for change
                            'N/A'}
                        </strong>
                      </div>
                      <div>
                        <strong>Created: {row?.Created || 'N/A'}</strong>
                      </div>
                    </>
                  }
                >
                  <>
                    <span
                      style={{
                        fontStyle: 'italic',
                        fontWeight: '800',
                        color: `${row?.OData__ModerationStatus == 2 ? 'orange' : 'rgb(41, 152, 111)'}`,
                      }}
                    >
                      {' '}
                      {versionFileStatusMapping[row?.OData__ModerationStatus] ||
                        'unknown'}{' '}
                    </span>
                  </>
                  <InfoOutlinedIcon
                    sx={{
                      cursor: 'pointer',
                      margin: '0px 10px 0px 0px',
                      color: 'rgb(41, 152, 111)',
                      margin: '0px 0px -5px 5px',
                      fontSize: '18px',
                    }}
                  />
                </Tooltip>
                {minorVersionIframePropRaw?.Id === row?.Id ? (
                  <span
                    style={{
                      fontWeight: 700,
                      color: '#8c8cef',
                      fontStyle: 'italic',
                    }}
                  >
                    &nbsp;[previewing]
                  </span>
                ) : (
                  <></>
                )}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {termsGuidToLabel(
                  'Business',
                  row?.[termsMapCTData['Business']]?.TermGuid,
                )}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {termsGuidToLabel(
                  'Resort',
                  row?.[termsMapCTData['Resort']]?.TermGuid,
                )}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {termsGuidToLabel(
                  'Department',
                  row?.[termsMapCTData['Department']]?.TermGuid,
                )}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {termsGuidToLabel(
                  'Building',
                  row?.[termsMapCTData['Building']]?.TermGuid,
                )}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {termsGuidToLabel(
                  'Document Type',
                  row?.[termsMapCTData['Document Type']]?.TermGuid,
                )}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {row?.[termsMapCTData['Drawing Number']]}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {row?.[termsMapCTData['Revision Number']]}
              </TableCell>
              <TableCell
                sx={{ color: 'inherit', fontSize: '12px' }}
                component="th"
                scope="row"
              >
                {row?.Modified ? convertUTCToLocal(row?.Modified) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ForApprovalTable;
