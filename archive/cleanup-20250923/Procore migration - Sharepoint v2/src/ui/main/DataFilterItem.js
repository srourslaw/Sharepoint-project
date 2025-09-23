import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  IconButton,
} from '@mui/material';
import DmsViewPage from '../../Components/_DmsViewPage';
import getViewDataFromCells from '../../hooks/view/useViewData';
import { useRowSelectionStore } from '../../store/file-selection-store';
import { normalizeCells } from '../../utils/helpers';
import { useBulkUploadStore } from '../../Components/upload/bulk-upload-store';
import { Add } from '@mui/icons-material';
import { useShallow } from 'zustand/react/shallow';

// Title display component for the header
const TitleDisplay = ({ rowKey }) => {
  return rowKey === 'znull' || rowKey === 'undefined' ? 'Others' : rowKey;
};

const DocumentTitle = ({ documentId, cells, formatTitle }) => {
  const { rows, setSelectedRows } = useRowSelectionStore();

  const { titleMetadata, revisionNumber, documentType, drawingNumberMetadata } =
    getViewDataFromCells(cells);

  const isCheckboxSelected = useMemo(
    () => rows.has(documentId),
    [rows, documentId],
  );

  const formattedTitle = useMemo(() => {
    if (!isCheckboxSelected) {
      return formatTitle(cells);
    }

    if (!titleMetadata) return '';

    const parts = [];

    // Add drawing number prefix if applicable
    if (documentType === 'Drawing' && drawingNumberMetadata) {
      parts.push(drawingNumberMetadata);
    }

    // Add the base title
    parts.push(titleMetadata);

    // Add revision number suffix if available
    if (revisionNumber) {
      parts.push(revisionNumber);
    }

    return parts.join(' – ');
  }, [
    titleMetadata,
    revisionNumber,
    documentType,
    drawingNumberMetadata,
    isCheckboxSelected,
  ]);

  function toggleRowSelection(id) {
    setSelectedRows(id, !isCheckboxSelected);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        rowGap: '8px',
      }}
    >
      <Checkbox
        checked={isCheckboxSelected}
        sx={{
          padding: 0,
          marginRight: '4px',
        }}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          toggleRowSelection(documentId);
        }}
      />
      {formattedTitle}
    </Box>
  );
};
// Single document view component
const DocumentView = ({
  documentId,
  titleParentIndex,
  rowKey,
  response,
  userType,
  accessibleResortsSanitized,
  accessibleResorts,
  onOpenModal,
  onCloseModal,
  showModal,
  getNextKeyItem,
  getNextKeySection,
  getPreviousKeySection,
  formatTitle,
}) => {
  const fileProps = response[documentId];

  if (!fileProps) return null;

  // Handle navigation to next/prev section
  const navigateToSection = (direction) => {
    const sectionKey =
      direction === 'next'
        ? getNextKeySection(rowKey)
        : getPreviousKeySection(rowKey);

    if (!sectionKey) return null;

    const sectionValues = Object.values(response[sectionKey] || {});

    if (direction === 'next' && sectionValues[0] && sectionValues[0][0]) {
      return response[sectionValues[0][0]];
    } else if (direction === 'prev') {
      // Get the last item of the last group in the previous section
      const lastGroup = sectionValues[sectionValues.length - 1];
      return lastGroup && lastGroup.length
        ? response[lastGroup[lastGroup.length - 1]]
        : null;
    }

    return null;
  };

  return (
    <DmsViewPage
      userType={userType}
      accessibleResortsSanitized={accessibleResortsSanitized}
      accessibleResorts={accessibleResorts}
      fileProperties={fileProps}
      onOpenModal={() => onOpenModal(fileProps)}
      onCloseModal={onCloseModal}
      showModal={showModal(fileProps)}
      isExistRight={
        response[getNextKeyItem(rowKey, documentId, titleParentIndex, 'next')]
      }
      isExistLeft={
        response[getNextKeyItem(rowKey, documentId, titleParentIndex, 'prev')]
      }
      onNext={() => {
        const nextItem =
          response[
            getNextKeyItem(rowKey, documentId, titleParentIndex, 'next')
          ];
        if (nextItem) onOpenModal(nextItem);
      }}
      onPrev={() => {
        const prevItem =
          response[
            getNextKeyItem(rowKey, documentId, titleParentIndex, 'prev')
          ];
        if (prevItem) onOpenModal(prevItem);
      }}
      onNextSection={() => {
        const nextSection = navigateToSection('next');
        if (nextSection) onOpenModal(nextSection);
      }}
      onPrevSection={() => {
        const prevSection = navigateToSection('prev');
        if (prevSection) onOpenModal(prevSection);
      }}
      isExistLeftSection={getPreviousKeySection(rowKey)}
      isExistRightSection={getNextKeySection(rowKey)}
      customTitle={
        <DocumentTitle
          documentId={documentId}
          cells={fileProps.Cells}
          formatTitle={formatTitle}
        />
      }
    />
  );
};

const GroupTitle = ({ cells }) => {
  if (!cells) return;
  const {
    documentType,
    businessMetadata,
    resortMetadata,
    buildingMetadata,
    departmentMetadata,
    drawingAreaMetadata,
    drawingNumberMetadata,
    titleMetadata,
    parkStage,
  } = normalizeCells(cells);

  const title = () => {
    let arr = [
      businessMetadata,
      resortMetadata,
      departmentMetadata,
      buildingMetadata,
      documentType,
      titleMetadata,
    ];

    if (documentType?.toLowerCase() === 'drawing') {
      arr = [
        businessMetadata,
        resortMetadata,
        departmentMetadata,
        drawingAreaMetadata,
        drawingNumberMetadata,
        parkStage,
      ];
    }

    return arr.filter(Boolean).join(' – ');
  };

  return <p>{title()}</p>;
};

// Document group component (for single or multiple documents)
const DocumentGroup = ({
  titleParentVal,
  titleParentIndex,
  rowKey,
  filterGroup,
  response,
  ...restProps
}) => {
  const documents = filterGroup?.[rowKey]?.[titleParentVal];

  if (!documents || documents.length === 0) return null;

  // If only one document in the group, render it directly
  if (documents.length === 1) {
    return (
      <DocumentView
        documentId={documents[0]}
        titleParentIndex={titleParentIndex}
        rowKey={rowKey}
        response={response}
        {...restProps}
      />
    );
  }

  // Otherwise render as an accordion group
  const firstDoc = response[documents[0]];

  return (
    <Accordion
      key={`accordion-${titleParentVal}-${titleParentIndex}`}
      sx={{
        padding: 0,
        margin: '10px 10px 0px 10px',
        backgroundColor: '#f3f3f3',
      }}
      elevation={0}
    >
      <AccordionSummary
        aria-controls={`${titleParentVal}-content`}
        id={`${titleParentVal}-${titleParentIndex}`}
        sx={{
          padding: '0px 5px 0px 5px',
          minHeight: '25px',
          height: '25px',
          '&.Mui-expanded': {
            minHeight: '25px',
            height: '25px',
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            transform: 'none !important',
          },
        }}
      >
        <div
          style={{
            color: 'black',
            fontSize: '12px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <GroupTitle cells={firstDoc?.Cells} />
        </div>
        <Typography
          align="right"
          sx={{
            fontSize: '8px',
            fontWeight: '600',
            width: '10%',
            alignContent: 'center',
          }}
        >
          [ more ]
        </Typography>
      </AccordionSummary>

      {documents.map((docId) => (
        <AccordionDetails
          key={`details-${docId}`}
          sx={{
            padding: '0px 0px 0px 0px',
            margin: '-8px 0px -5px 0px',
            color: 'gray',
          }}
        >
          <DocumentView
            documentId={docId}
            titleParentIndex={titleParentIndex}
            rowKey={rowKey}
            response={response}
            {...restProps}
          />
        </AccordionDetails>
      ))}
    </Accordion>
  );
};

function BulkCheckbox({ rowKey, filterGroup }) {
  const { rows, setSelectedRows } = useRowSelectionStore();
  const groupKeys = filterGroup?.[rowKey];

  const documentIds = useMemo(() => {
    return Object.values(groupKeys).flat();
  }, [groupKeys]);

  const isOneOfGroupSelected = useMemo(
    () => Array.from(rows).some((id) => documentIds.includes(id)),
    [documentIds, rows],
  );

  const isChecked = useMemo(
    () => documentIds.every((id) => rows.has(id)),
    [documentIds, rows],
  );

  if (!isOneOfGroupSelected) {
    return null;
  }

  function toggleBulkSelection(_, checked) {
    // add all of the document ids into the store set.
    for (const id of documentIds) {
      setSelectedRows(id, checked);
    }

    // store must keep tracks of the "response" to figure out the file extensions and such...
    // dont forget to reset the store if filter changes.
    // we need to figure out the accordion behavior, does the accordion child has each different id or not. whats the logic behind the file grouping in accordion. whether to select all of the child if the accordion parent checkbox is clicked.
  }

  // TODO: add bulk add or remove on selection, if indeterminate, add all.
  return <Checkbox checked={isChecked} onChange={toggleBulkSelection} />;
}

// Main component
const DataFilterItem = ({
  accessibleResortsSanitized,
  accessibleResorts,
  getNextKeyItem,
  getNextKeySection,
  getPreviousKeySection,
  onOpenModal,
  onCloseModal,
  formatTitle,
  filterGroup,
  response,
  grouping,
  userType,
  showModal,
  filter,
  rowKey,
  isSingleOrDoubleGroup,
}) => {
  const { setOpen, setHidden, setGroup } = useBulkUploadStore(
    useShallow((state) => ({
      setOpen: state.setOpen,
      setHidden: state.setHidden,
      setGroup: state.setGroup,
    })),
  );

  const handleAddButton = () => {
    setOpen(true);
    setHidden(false);

    const groupingValue =
      rowKey === 'null' || rowKey === 'undefined'
        ? JSON.stringify({})
        : JSON.stringify({ [grouping]: rowKey });

    setGroup(groupingValue);
  };

  return (
    <Box
      key={rowKey}
      sx={{
        minWidth: '100%',
        maxWidth: '450px',
        backgroundColor: 'white',
        boxShadow: '1px 1px 5px gray',
        margin: '10px 10px 0px 0px!important',
        height: isSingleOrDoubleGroup ? '80vh' : 'auto',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          minHeight: '50px',
          backgroundColor: 'rgb(41, 152, 111)',
          color: 'white',
          display: 'flex',
          justifyContent: 'left',
          alignItems: 'center',
          fontWeight: 800,
        }}
      >
        <BulkCheckbox filterGroup={filterGroup} rowKey={rowKey} />
        <IconButton onClick={handleAddButton}>
          <Add sx={{ color: 'white' }} />
        </IconButton>
        <TitleDisplay rowKey={rowKey} />
      </div>

      <div
        style={{
          overflow: 'auto',
          width: '100%',
          height: '100%',
          // maxHeight: '300px',
          maxHeight: isSingleOrDoubleGroup ? '100%' : '300px',
        }}
      >
        {filterGroup?.[rowKey] &&
          Object.keys(filterGroup?.[rowKey]).map(
            (titleParentVal, titleParentIndex) => (
              <DocumentGroup
                key={`group-${titleParentVal}-${titleParentIndex}`}
                titleParentVal={titleParentVal}
                titleParentIndex={titleParentIndex}
                rowKey={rowKey}
                filterGroup={filterGroup}
                response={response}
                userType={userType}
                accessibleResortsSanitized={accessibleResortsSanitized}
                accessibleResorts={accessibleResorts}
                onOpenModal={onOpenModal}
                onCloseModal={onCloseModal}
                showModal={showModal}
                getNextKeyItem={getNextKeyItem}
                getNextKeySection={getNextKeySection}
                getPreviousKeySection={getPreviousKeySection}
                formatTitle={formatTitle}
              />
            ),
          )}
      </div>
    </Box>
  );
};

export default DataFilterItem;
