import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Tooltip,
  TableContainer,
  Paper,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
  LinearProgress,
  Typography,
  IconButton,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import dayjs from 'dayjs';
import {
  // fetchApprovalDetails,
  fetchApprovalTable,
} from '../../apis/services/approvalServices';
import { useQuery } from '@tanstack/react-query';
// import useRenewToken from '../../hooks/useRenewToken';
import { useSplitDrawing } from '../../hooks/useSplitDrawing';
import { useApprovalStore } from '../../store/approval-store';
import { useShallow } from 'zustand/react/shallow';

const ApprovalTable = ({
  approvalPageTableOrderBy,
  approvalPageTableOrder,
  // handleSortApprovalPageTable,
  // handleViewFileContentActionClick,
  getFileName,
  versionFileStatusMapping,
  // minorVersionIframePropRaw,
  // termsGuidToLabel,
  // termsMapCTData,
  selectedResort,
  accessibleResortsSanitized,
}) => {
  const navigate = useNavigate();
  const {
    filter,
    selectedStatus,
    setRowDetails,
    rowDetails,
    setIsEdit,
    approvalList,
    setApprovalList,
  } = useApprovalStore(
    useShallow((state) => ({
      filter: state.filter,
      selectedStatus: state.selectedStatus,
      setRowDetails: state.setRowDetails,
      rowDetails: state.rowDetails,
      setIsEdit: state.setIsEdit,
      approvalList: state.approvalList,
      setApprovalList: state.setApprovalList,
    })),
  );

  // const [url, setUrl] = useState(null);
  // const [accessToken, setAccessToken] = useState(null);
  const [sortKey, setSortKey] = useState('Modified');
  const [isSortAsc, setIsSortAsc] = useState(true);

  // const { getAccessToken } = useRenewToken();
  const parsedSiteValue = (selectedResort) => {
    const filteredResort = accessibleResortsSanitized.filter(
      (resort) => resort.Sitename === selectedResort,
    );
    const site = String(filteredResort[0]?.SiteURL).split('/sites/')[1];
    return site;
  };

  const formattedDate = (value) => dayjs(value).format('DD MMM, YYYY');

  const { getUploadedFileNames } = useSplitDrawing();

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['fetchApprovalTable'],
    enabled: false,
    queryFn: () => {
      if (selectedStatus !== 'split') {
        return fetchApprovalTable(
          selectedStatus,
          parsedSiteValue(selectedResort),
        );
      }
      return getUploadedFileNames();
    },
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  useEffect(() => {
    if (selectedStatus) {
      refetch();
      setIsEdit(false);
      setRowDetails(null);
      setSortKey('Modified');
      setIsSortAsc(true);
    }
  }, [selectedStatus, selectedResort]);

  useEffect(() => {
    if (data) {
      setApprovalList(data?.filter((item) => !item.hasOwnProperty('status')));
    }
  }, [data]);

  // const { data: approvalDetails, refetch: refetchApprovalDetails } = useQuery({
  //   queryKey: ['fetchApprovalDetails', { url, accessToken }],
  //   enabled: false,
  //   queryFn: ({ queryKey }) => {
  //     const [_, params] = queryKey;
  //     return fetchApprovalDetails(params.url, params.accessToken);
  //   },
  // });

  const tableSortFnc = (key) => (a, b) =>
    (a[key] > b[key] ? 1 : -1) * (isSortAsc ? 1 : -1);
  const tableFilterFnc = (item) =>
    filter ? item?.Title?.toLowerCase().includes(filter.toLowerCase()) : true;

  const handleSelectRow = async (row) => {
    setIsEdit(false);
    // const accessToken = await getAccessToken();
    // const url = row?.__metadata?.uri;
    // setUrl(url);
    // setAccessToken(accessToken);
    setRowDetails(row);
  };

  const handleSortByColumn = (columnKey) => {
    setSortKey(columnKey);
    setIsSortAsc(!isSortAsc);
    setIsEdit(false);
  };

  // useEffect(() => {
  //   if (url && accessToken) {
  //     refetchApprovalDetails();
  //     setSortKey('Modified');
  //     setIsSortAsc(true);
  //   }
  // }, [url, accessToken]);

  // useEffect(() => {
  //   if (approvalDetails) {
  //     setApprovalDetails(approvalDetails);
  //   }
  // }, [approvalDetails]);

  useEffect(() => {
    if (selectedStatus !== null && selectedStatus !== 'split') {
      const firstData = approvalList
        ?.filter(tableFilterFnc)
        ?.sort(tableSortFnc(sortKey))?.[0];
      setRowDetails(firstData);
    }
  }, [approvalList, selectedStatus, filter, sortKey, isSortAsc]);

  const splitColumns = () => {
    const mappedColumns = [
      {
        label: 'Document Name',
        key: 'Document Name',
        width: '100%',
      },
    ];
    return mappedColumns.map((column) => {
      return (
        <TableCell
          sx={{
            fontWeight: '800',
            color: 'rgb(41, 152, 111)',
            width: column.width,
            fontSize: '12px',
          }}
        >
          {column.label}
        </TableCell>
      );
    });
  };

  const tableColumns = () => {
    const mappedColumns = [
      {
        label: 'Title',
        key: 'Title',
        width: '20%',
      },
      {
        label: 'Business',
        key: 'Business',
        width: '8%',
      },
      {
        label: 'Resort',
        key: 'Resort',
        width: '8%',
      },
      {
        label: 'Department',
        key: 'Department',
        width: '8%',
      },
      {
        label: 'Building',
        key: 'Building',
        width: '8%',
      },
      {
        label: 'Document Type',
        key: 'Document Type',
        width: '8%',
      },
      {
        label: 'Drawing Number',
        key: 'DrawingNumber',
        width: '10%',
      },
      {
        label: 'Rev Number',
        key: 'RevisionNumber',
        width: '8%',
      },
      {
        label: 'Submission Date',
        key: 'Modified',
        width: '10%',
      },
    ];
    return mappedColumns.map((column) => {
      if (
        ['DrawingNumber', 'RevisionNumber', 'Modified'].includes(column.key)
      ) {
        return (
          <TableCell
            sx={{
              fontWeight: '800',
              color: 'rgb(41, 152, 111)',
              width: column.width,
              fontSize: '12px',
            }}
          >
            <TableSortLabel
              active={approvalPageTableOrderBy === column.key}
              direction={
                approvalPageTableOrderBy === column.key
                  ? approvalPageTableOrder
                  : 'asc'
              }
              onClick={() => handleSortByColumn(column.key)}
            >
              {column.label}
            </TableSortLabel>
          </TableCell>
        );
      }
      return (
        <TableCell
          sx={{
            fontWeight: '800',
            color: 'rgb(41, 152, 111)',
            width: column.width,
            fontSize: '12px',
          }}
        >
          {column.label}
        </TableCell>
      );
    });
  };

  if (!selectedStatus) {
    return <></>;
  }

  return (
    <TableContainer
      component={Paper}
      sx={{ maxHeight: '20vh', minHeight: '150px', overflow: 'auto' }}
    >
      <Table
        stickyHeader
        sx={{ minWidth: '30vw', maxHeight: '90%' }}
        size="small"
        aria-label="a dense table"
      >
        <TableHead sx={{ margin: '0px 0px 0px 0px' }}>
          <TableRow>
            {selectedStatus === 'split' ? splitColumns() : tableColumns()}
          </TableRow>
        </TableHead>
        <TableBody sx={{ maxHeight: '100px', color: 'gray' }}>
          {isFetching ? (
            <Box
              sx={{
                position: 'absolute',
                zIndex: '9999',
                backgroundColor: 'rgb(0 0 0 / 58%)',
                inset: 0,
                justifyContent: 'center',
                alignItems: 'center',
                alignContent: 'center',
                textAlign: 'center',
                color: 'white',
              }}
            >
              <LinearProgress sx={{ width: '5%', margin: '0 auto' }} />
            </Box>
          ) : (
            approvalList
              ?.filter(tableFilterFnc)
              ?.sort(tableSortFnc(sortKey))
              .map((row) => {
                if (typeof row !== 'object') {
                  return (
                    <TableRow key={row}>
                      <TableCell
                        sx={{ color: 'inherit', fontSize: '12px' }}
                        component="th"
                        scope="row"
                      >
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Link
                            to={`/main/split-drawing/${row}?from=approval`}
                            style={{ color: 'rgb(41, 152, 111)' }}
                          >
                            <Typography>{row}</Typography>
                          </Link>
                          <IconButton
                            onClick={() =>
                              navigate(`/main/split-drawing/${row}`)
                            }
                          >
                            <ChevronRightIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow
                    key={row?.Id}
                    sx={{
                      '&:last-child td, &:last-child th': {
                        border: 0,
                      },
                    }}
                  >
                    <TableCell
                      // onClick={(e) =>
                      //   handleViewFileContentActionClick(
                      //     row?.UniqueId,
                      //     row?.Id,
                      //     row?.Title,
                      //     row?.OData__UIVersionString,
                      //     row?.Versions?.__deferred?.uri,
                      //   )
                      // }
                      onClick={() => handleSelectRow(row)}
                      sx={{
                        color: 'inherit',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      component="th"
                      scope="row"
                    >
                      <span
                        style={{
                          color: 'orange',
                          fontWeight: '800',
                        }}
                      >
                        {/* NOT SPECIFIED */}
                        {row?.Title ?? getFileName(row?.FileRef)}
                        {/* {row?.Title} */}
                      </span>
                      <span
                        style={{
                          color: 'rgb(41, 152, 111)',
                          fontWeight: '800',
                        }}
                      >
                        {' '}
                        v{row?.OData__UIVersionString}
                      </span>
                      <Tooltip
                        placement="right"
                        title={
                          <>
                            <div>
                              <strong>
                                Author: {row?.Author?.Title || 'N/A'}
                              </strong>
                            </div>
                            <div>
                              <strong>
                                Editor: {row?.Editor?.Title || 'N/A'}
                              </strong>
                            </div>
                            <div>
                              <strong>
                                Revision: {row?.RevisionNumber || 'N/A'}
                              </strong>
                            </div>
                            <div>
                              <strong>
                                Created: {formattedDate(row?.Created) || 'N/A'}
                              </strong>
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
                            {versionFileStatusMapping[
                              row?.OData__ModerationStatus
                            ] || 'unknown'}{' '}
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
                      {rowDetails?.Id === row?.Id && (
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#8c8cef',
                            fontStyle: 'italic',
                          }}
                        >
                          &nbsp;[previewing]
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.Building}
                      {/* {termsGuidToLabel(
                    'Business',
                    row?.[termsMapCTData['Business']]?.TermGuid,
                  )} */}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.Resort}
                      {/* {termsGuidToLabel(
                    'Resort',
                    row?.[termsMapCTData['Resort']]?.TermGuid,
                  )} */}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.Department}
                      {/* {termsGuidToLabel(
                    'Department',
                    row?.[termsMapCTData['Department']]?.TermGuid,
                  )} */}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.Building}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.['Document Type']}
                      {/* {termsGuidToLabel(
                    'Document Type',
                    row?.[termsMapCTData['Document Type']]?.TermGuid,
                  )} */}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.DrawingNumber}
                      {/* {row?.[termsMapCTData['Drawing Number']]} */}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.RevisionNumber}
                      {/* {row?.[termsMapCTData['Revision Number']]} */}
                    </TableCell>
                    <TableCell
                      sx={{ color: 'inherit', fontSize: '12px' }}
                      component="th"
                      scope="row"
                    >
                      {row?.Modified ? formattedDate(row?.Modified) : null}
                    </TableCell>
                  </TableRow>
                );
              })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ApprovalTable;
