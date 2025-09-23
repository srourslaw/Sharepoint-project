import { IconButton, Typography } from '@mui/material';
import { DragIndicator } from '@mui/icons-material';
import { memo, useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRowSelectionStore } from '../../store/file-selection-store';
import CustomTooltip from '../../ui/CustomTooltip';
import getViewDataFromCells from '../../hooks/view/useViewData';
import CloseIcon from '@mui/icons-material/Close';
import { formatTitle } from '../../utils/helpers';
import { DOWNLOAD_TYPE } from '../../const/common';

const SortableFileList = memo(function SortableFileList({
  cells,
  rowIndex,
  id,
  index,
  downloadType,
}) {
  const { setSelectedRows } = useRowSelectionStore();
  const {
    documentType,
    departmentMetadata,
    resortMetadata,
    path,
    disciplineMetadata,
    businessMetadata,
    buildingMetadata,
  } = getViewDataFromCells(cells);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function removeRow() {
    setSelectedRows(rowIndex, false);
  }

  const showDragIndicator = downloadType === DOWNLOAD_TYPE.MERGED_PDF;

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        listStyle: 'none',
        backgroundColor: '#f3f3f3',
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        gap: '8px',
        flexGrow: '1',
      }}
    >
      {showDragIndicator && (
        <DragIndicator
          style={{
            cursor: 'grab',
            outline: 'none',
          }}
          {...attributes}
          {...listeners}
        />
      )}
      <p
        style={{
          color: 'black',
          margin: 0,
        }}
      >
        {formatTitle(cells)}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginLeft: 'auto',
        }}
      >
        <CustomTooltip
          building={buildingMetadata}
          business={businessMetadata}
          department={departmentMetadata}
          discipline={disciplineMetadata}
          documentType={documentType}
          resort={resortMetadata}
          path={path}
        />

        <IconButton size="small" onClick={removeRow}>
          <CloseIcon />
        </IconButton>
      </div>
    </li>
  );
});

export const DraggableFileList = memo(function DraggableFileList({
  downloadType,
  setSortedItems,
  sortedItems,
}) {
  function handleDragEnd(event) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedItems.findIndex((item) => item.id === active.id);
      const newIndex = sortedItems.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setSortedItems((prevItems) => arrayMove(prevItems, oldIndex, newIndex));
      }
    }
  }

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortedItems.map((item) => item.id)}
        strategy={undefined}
      >
        <ul
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minHeight: '250px',
            padding: '0px',
            margin: 0,
            paddingInline: '16px',
            paddingBottom: '16px',
          }}
        >
          {sortedItems.map(({ cells, rowIndex, id }, index) => (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Typography
                sx={{
                  width: '24px',
                }}
              >
                {index + 1}
              </Typography>
              <SortableFileList
                key={id}
                id={id}
                cells={cells}
                index={index}
                rowIndex={rowIndex}
                downloadType={downloadType}
              />
            </div>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
});
