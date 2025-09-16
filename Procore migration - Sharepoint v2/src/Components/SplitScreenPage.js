import React, { useState } from 'react';
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton,
  Button,
  Grid,
  Autocomplete,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

// Component for the dialog header
const DialogHeader = ({ onClose }) => (
  <DialogTitle
    textAlign="center"
    sx={{
      backgroundColor: 'rgb(41, 152, 111)',
      color: 'white',
      fontWeight: '800',
      fontSize: '16px',
      height: '18px',
      padding: '10px 0px 15px 0px',
    }}
  >
    File Upload Multiple Document
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 10,
      }}
    >
      <CloseIcon
        onClick={onClose}
        sx={{
          color: '#fff',
          cursor: 'pointer',
        }}
      />
    </Box>
  </DialogTitle>
);

// Component for the navigation section
const NavigationSection = ({ onBack }) => (
  <Box
    display="flex"
    alignItems="center"
    sx={{
      p: '12px',
    }}
  >
    <IconButton onClick={onBack}>
      <ArrowBackIcon />
    </IconButton>
    <Typography
      variant="h6"
      color="textSecondary"
      sx={{
        width: '100%',
        fontWeight: '800',
        color: 'rgb(41, 152, 111)',
      }}
    >
      Please fill out document tags:
    </Typography>
  </Box>
);

// Component for common terms section with autocomplete fields
const CommonTermsSection = () => {
  const commonFields = [
    { label: 'Business' },
    { label: 'Resort' },
    { label: 'Department' },
    { label: 'Building' },
    { label: 'Business' },
    { label: 'Resort' },
    { label: 'Department' },
    { label: 'Building' },
  ];

  return (
    <Box sx={{ p: '12px' }}>
      <Typography
        sx={{
          color: '#000',
          fontWeight: 700,
          mb: '16px',
        }}
      >
        Common terms:
      </Typography>
      <Grid container spacing={2}>
        {commonFields.map((field, index) => (
          <Grid item xs={12} sm={12} md={6} lg={3} key={index}>
            <Autocomplete
              size="small"
              options={[]}
              renderInput={(params) => (
                <TextField {...params} label={field.label} />
              )}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Component for a single document form
const DocumentForm = ({ index, onDelete, isRemovable }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center">
    <Grid
      container
      spacing={2}
      sx={{ border: '1px solid #e1e1e1', my: 2, p: 2 }}
    >
      <Grid item xs={12} sm={12} md={6} lg={3}>
        <TextField size="small" label="Title" fullWidth />
      </Grid>
      <Grid item xs={12} sm={12} md={6} lg={3}>
        <TextField size="small" label="Short Description" fullWidth />
      </Grid>
    </Grid>
    {isRemovable && (
      <IconButton onClick={onDelete}>
        <DeleteIcon />
      </IconButton>
    )}
  </Box>
);

// Component for managing multiple documents
const MultipleDocumentsSection = ({ documentCount, setDocumentCount }) => {
  const handleAddDoc = () => setDocumentCount((prev) => prev + 1);
  const handleRemoveDoc = (index) => {
    setDocumentCount((prev) => prev - 1);
  };

  return (
    <Box sx={{ p: '12px' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ my: 1 }}
      >
        <Typography
          sx={{
            color: '#000',
            fontWeight: 700,
            mb: '16px',
          }}
        >
          Multiple Documents:
        </Typography>
        <Button
          onClick={handleAddDoc}
          startIcon={<AddIcon />}
          color="primary"
          size="small"
        >
          Add File Document
        </Button>
      </Box>

      {[...Array(documentCount)].map((_, index) => (
        <DocumentForm
          key={index}
          index={index}
          onDelete={() => handleRemoveDoc(index)}
          isRemovable={index !== 0}
        />
      ))}
    </Box>
  );
};

// Main component
export default function SplitScreenPage({ open, onClose, onBack }) {
  const [documentCount, setDocumentCount] = useState(1);

  return (
    <Dialog
      onClose={onClose}
      open={open}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: { xs: '100%', sm: '80%', md: '65%', lg: '50%' },
        },
      }}
    >
      <DialogHeader onClose={onClose} />

      <DialogContent sx={{ padding: '0px', overflow: 'auto' }}>
        <NavigationSection onBack={onBack} />
        <CommonTermsSection />
        <MultipleDocumentsSection
          documentCount={documentCount}
          setDocumentCount={setDocumentCount}
        />
      </DialogContent>
    </Dialog>
  );
}
