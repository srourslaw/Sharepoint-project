import React from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';

export default function CustomTooltip(props) {
  const {
    building,
    business,
    department,
    discipline,
    documentType,
    resort,
    path,
  } = props;

  return (
    <Tooltip
      placement="left"
      title={
        <>
          <div
            style={{ whiteSpace: 'pre-line' }}
          >{`Business: ${business}`}</div>
          <div style={{ whiteSpace: 'pre-line' }}>{`Resort: ${resort}`}</div>
          <div
            style={{ whiteSpace: 'pre-line' }}
          >{`Department: ${department}`}</div>
          <div
            style={{ whiteSpace: 'pre-line' }}
          >{`Building: ${building}`}</div>
          <div
            style={{ whiteSpace: 'pre-line' }}
          >{`Document Type: ${documentType}`}</div>
          <div style={{ whiteSpace: 'pre-line' }}>{`Path: ${path}`}</div>
        </>
      }
    >
      <InfoOutlinedIcon
        style={{
          margin: '2px 0px 0px 0px',
          display: 'flex',
          float: 'right',
          fontSize: '12px',
        }}
      />
    </Tooltip>
  );
}
