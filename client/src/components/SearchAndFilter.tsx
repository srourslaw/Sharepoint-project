import React, { useState } from 'react';
import {
  Box,
  Paper,
  Collapse,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Typography,
  Divider,
  Slider,
  Grid,
  Autocomplete,
} from '@mui/material';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { SearchFilters, FilterOption } from '../types';
import { formatFileSize } from '../utils/formatters';

interface SearchAndFilterProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClose: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const fileTypeOptions: FilterOption[] = [
    { label: 'Documents', value: 'documents', count: 156 },
    { label: 'Images', value: 'images', count: 89 },
    { label: 'Videos', value: 'videos', count: 23 },
    { label: 'Audio', value: 'audio', count: 12 },
    { label: 'Spreadsheets', value: 'spreadsheets', count: 45 },
    { label: 'Presentations', value: 'presentations', count: 34 },
    { label: 'PDFs', value: 'pdfs', count: 67 },
    { label: 'Archives', value: 'archives', count: 18 },
  ];

  const authorOptions: FilterOption[] = [
    // Author options will be populated dynamically from real SharePoint users
  ];

  const sizeMarks = [
    { value: 0, label: '0 KB' },
    { value: 25, label: '1 MB' },
    { value: 50, label: '10 MB' },
    { value: 75, label: '100 MB' },
    { value: 100, label: '1 GB+' },
  ];

  const sizeValueToBytes = (value: number): number => {
    if (value <= 25) return (value / 25) * 1024 * 1024; // 0-1MB
    if (value <= 50) return 1024 * 1024 + ((value - 25) / 25) * 9 * 1024 * 1024; // 1-10MB
    if (value <= 75) return 10 * 1024 * 1024 + ((value - 50) / 25) * 90 * 1024 * 1024; // 10-100MB
    return 100 * 1024 * 1024 + ((value - 75) / 25) * 924 * 1024 * 1024; // 100MB-1GB+
  };

  const bytesToSizeValue = (bytes: number): number => {
    if (bytes <= 1024 * 1024) return (bytes / (1024 * 1024)) * 25;
    if (bytes <= 10 * 1024 * 1024) return 25 + ((bytes - 1024 * 1024) / (9 * 1024 * 1024)) * 25;
    if (bytes <= 100 * 1024 * 1024) return 50 + ((bytes - 10 * 1024 * 1024) / (90 * 1024 * 1024)) * 25;
    return 75 + Math.min(25, ((bytes - 100 * 1024 * 1024) / (924 * 1024 * 1024)) * 25);
  };

  const handleFileTypeChange = (newFileTypes: string[]) => {
    onFiltersChange({
      ...filters,
      fileType: newFileTypes,
    });
  };

  const handleAuthorChange = (newAuthors: string[]) => {
    onFiltersChange({
      ...filters,
      author: newAuthors,
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', date: Date | null) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: date,
      },
    });
  };

  const handleSizeRangeChange = (newValue: number | number[]) => {
    const [min, max] = Array.isArray(newValue) ? newValue : [0, newValue];
    
    onFiltersChange({
      ...filters,
      sizeRange: {
        min: min > 0 ? sizeValueToBytes(min) : undefined,
        max: max < 100 ? sizeValueToBytes(max) : undefined,
      },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      fileType: [],
      dateRange: {},
      sizeRange: {},
      author: [],
    });
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return (
      filters.fileType.length > 0 ||
      filters.author.length > 0 ||
      filters.dateRange.start ||
      filters.dateRange.end ||
      filters.sizeRange.min !== undefined ||
      filters.sizeRange.max !== undefined ||
      searchQuery.length > 0
    );
  };

  const getSizeRangeValue = (): number[] => {
    const min = filters.sizeRange.min ? bytesToSizeValue(filters.sizeRange.min) : 0;
    const max = filters.sizeRange.max ? bytesToSizeValue(filters.sizeRange.max) : 100;
    return [min, max];
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={1} sx={{ mx: 1, mb: 1 }}>
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Search & Filter
            </Typography>
            
            <Box>
              {hasActiveFilters() && (
                <Button
                  size="small"
                  onClick={clearAllFilters}
                  startIcon={<ClearIcon />}
                  sx={{ mr: 1 }}
                >
                  Clear All
                </Button>
              )}
              
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 3 }}
          />

          {/* Filters */}
          <Grid container spacing={3}>
            {/* File Types */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                File Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {fileTypeOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={`${option.label} ${option.count ? `(${option.count})` : ''}`}
                    size="small"
                    clickable
                    color={filters.fileType.includes(option.value) ? 'primary' : 'default'}
                    onClick={() => {
                      const newTypes = filters.fileType.includes(option.value)
                        ? filters.fileType.filter(type => type !== option.value)
                        : [...filters.fileType, option.value];
                      handleFileTypeChange(newTypes);
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Authors */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Authors
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={authorOptions}
                getOptionLabel={(option) => option.label}
                value={authorOptions.filter(option => filters.author.includes(option.value))}
                onChange={(_, newValue) => {
                  handleAuthorChange(newValue.map(option => option.value));
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.value}
                      label={option.label}
                      size="small"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select authors..."
                  />
                )}
              />
            </Grid>

            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Date Range
              </Typography>
              <Box display="flex" gap={1}>
                <DatePicker
                  label="From"
                  value={filters.dateRange.start}
                  onChange={(date) => handleDateRangeChange('start', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label="To"
                  value={filters.dateRange.end}
                  onChange={(date) => handleDateRangeChange('end', date)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </Grid>

            {/* File Size */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                File Size
              </Typography>
              <Box sx={{ px: 1, pt: 1 }}>
                <Slider
                  value={getSizeRangeValue()}
                  onChange={(_, newValue) => handleSizeRangeChange(newValue)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => {
                    const bytes = sizeValueToBytes(value);
                    return formatFileSize(bytes);
                  }}
                  marks={sizeMarks}
                  min={0}
                  max={100}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Active Filters
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {filters.fileType.map((type) => {
                    const option = fileTypeOptions.find(opt => opt.value === type);
                    return (
                      <Chip
                        key={type}
                        label={option?.label || type}
                        size="small"
                        onDelete={() => handleFileTypeChange(filters.fileType.filter(t => t !== type))}
                      />
                    );
                  })}
                  
                  {filters.author.map((authorId) => {
                    const option = authorOptions.find(opt => opt.value === authorId);
                    return (
                      <Chip
                        key={authorId}
                        label={option?.label || authorId}
                        size="small"
                        onDelete={() => handleAuthorChange(filters.author.filter(a => a !== authorId))}
                      />
                    );
                  })}
                  
                  {filters.dateRange.start && (
                    <Chip
                      label={`From: ${filters.dateRange.start.toLocaleDateString()}`}
                      size="small"
                      onDelete={() => handleDateRangeChange('start', null)}
                    />
                  )}
                  
                  {filters.dateRange.end && (
                    <Chip
                      label={`To: ${filters.dateRange.end.toLocaleDateString()}`}
                      size="small"
                      onDelete={() => handleDateRangeChange('end', null)}
                    />
                  )}
                  
                  {(filters.sizeRange.min !== undefined || filters.sizeRange.max !== undefined) && (
                    <Chip
                      label={`Size: ${
                        filters.sizeRange.min ? formatFileSize(filters.sizeRange.min) : '0'
                      } - ${
                        filters.sizeRange.max ? formatFileSize(filters.sizeRange.max) : '∞'
                      }`}
                      size="small"
                      onDelete={() => onFiltersChange({ ...filters, sizeRange: {} })}
                    />
                  )}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};