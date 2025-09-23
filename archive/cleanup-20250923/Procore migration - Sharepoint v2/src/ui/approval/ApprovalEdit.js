import React from 'react';

import { Grid, Divider, Box, Button } from '@mui/material';

const ApprovalEdit = ({
  termsDataObject,
  renderFields,
  drawingMappedObject,
  isAutoApproveAvailable,
  onCancel,
  isLoading,
  onSave,
  isValid,
  error,
}) => {
  return (
    <Box sx={{ px: 3 }}>
      <Grid container spacing={2} sx={{ my: 2 }}>
        {termsDataObject.map((label, key) => (
          <Grid item xs={12} sm={6} md={4} lg={4} key={key}>
            {renderFields(label)}
          </Grid>
        ))}
      </Grid>
      <Divider />
      <Grid container spacing={2} sx={{ my: 2 }}>
        {drawingMappedObject.map((label, key) => {
          if (label === 'ShortDescription') {
            return (
              <Grid item xs={12} sm={12} md={12} lg={12} key={key}>
                {renderFields(label)}
              </Grid>
            );
          }
          return (
            <Grid item xs={12} sm={6} md={6} lg={4} key={key}>
              {renderFields(label)}
            </Grid>
          );
        })}
      </Grid>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Button onClick={onCancel} sx={{ color: 'rgb(41, 152, 111)' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          loading={isLoading}
          onClick={onSave}
          disabled={!isValid || error}
          sx={{ bgcolor: 'rgb(41, 152, 111)' }}
        >
          {isAutoApproveAvailable ? 'Submit & Approve' : 'Submit for Approval'}
        </Button>
      </Box>
    </Box>
  );
};

export default ApprovalEdit;
