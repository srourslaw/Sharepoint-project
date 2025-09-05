import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  TextField,
  Card,
  CardContent,
  Chip,
  Alert,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  GetApp as ExportIcon,
  Description as TextIcon,
  PictureAsPdf as PdfIcon,
  Code as JsonIcon,
  Language as HtmlIcon,
  Article as MarkdownIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Schedule as DateIcon,
  Attachment as AttachmentIcon,
  Link as ReferenceIcon,
  Psychology as MetadataIcon,
} from '@mui/icons-material';

import { ChatSession, ChatExportOptions } from '../types';
import { formatDate } from '../utils/formatters';

interface ChatExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ChatExportOptions) => void;
  session: ChatSession | null;
}

export const ChatExportDialog: React.FC<ChatExportDialogProps> = ({
  open,
  onClose,
  onExport,
  session,
}) => {
  const [exportOptions, setExportOptions] = useState<ChatExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeAttachments: false,
    includeSourceReferences: true,
    messageTypes: ['user', 'assistant'],
  });

  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
  }>({
    start: null,
    end: null,
  });

  const [customFilename, setCustomFilename] = useState('');

  const formatOptions = [
    {
      value: 'json',
      label: 'JSON',
      description: 'Machine-readable format with full data structure',
      icon: <JsonIcon />,
      extension: '.json',
    },
    {
      value: 'txt',
      label: 'Plain Text',
      description: 'Simple text format for easy reading',
      icon: <TextIcon />,
      extension: '.txt',
    },
    {
      value: 'markdown',
      label: 'Markdown',
      description: 'Formatted text that preserves structure',
      icon: <MarkdownIcon />,
      extension: '.md',
    },
    {
      value: 'html',
      label: 'HTML',
      description: 'Web page format with styling',
      icon: <HtmlIcon />,
      extension: '.html',
    },
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Professional document format',
      icon: <PdfIcon />,
      extension: '.pdf',
    },
  ];

  const messageTypeOptions = [
    { value: 'user', label: 'User Messages', count: session?.messages.filter(m => m.role === 'user').length || 0 },
    { value: 'assistant', label: 'AI Responses', count: session?.messages.filter(m => m.role === 'assistant').length || 0 },
    { value: 'system', label: 'System Messages', count: session?.messages.filter(m => m.role === 'system').length || 0 },
  ];

  const handleFormatChange = (format: string) => {
    setExportOptions(prev => ({ ...prev, format: format as ChatExportOptions['format'] }));
  };

  const handleOptionsChange = (field: keyof ChatExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleMessageTypeChange = (messageType: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      messageTypes: checked
        ? [...(prev.messageTypes || []), messageType]
        : (prev.messageTypes || []).filter(type => type !== messageType),
    }));
  };

  const handleExport = () => {
    const options: ChatExportOptions = {
      ...exportOptions,
      dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
    };

    onExport(options);
    onClose();
  };

  const getEstimatedFileSize = () => {
    if (!session) return 'Unknown';
    
    const messageCount = session.messages.filter(m => 
      exportOptions.messageTypes?.includes(m.role) ?? true
    ).length;
    
    const baseSize = messageCount * 200; // Rough estimate per message
    const multiplier = exportOptions.format === 'pdf' ? 2 : exportOptions.format === 'html' ? 1.5 : 1;
    const sizeInKB = Math.ceil((baseSize * multiplier) / 1024);
    
    return sizeInKB > 1024 ? `~${Math.ceil(sizeInKB / 1024)}MB` : `~${sizeInKB}KB`;
  };

  const generateFilename = () => {
    if (customFilename) return customFilename;
    
    const sessionTitle = session?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'chat_session';
    const timestamp = new Date().toISOString().split('T')[0];
    const format = formatOptions.find(f => f.value === exportOptions.format);
    
    return `${sessionTitle}_${timestamp}${format?.extension || '.txt'}`;
  };

  const getPreviewContent = () => {
    if (!session) return '';
    
    const filteredMessages = session.messages.filter(m =>
      exportOptions.messageTypes?.includes(m.role) ?? true
    );

    switch (exportOptions.format) {
      case 'json':
        return JSON.stringify({
          session: {
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            messageCount: filteredMessages.length,
          },
          messages: filteredMessages.slice(0, 2).map(m => ({
            role: m.role,
            content: m.content.substring(0, 100) + '...',
            timestamp: m.timestamp,
          })),
        }, null, 2);
        
      case 'markdown':
        return `# ${session.title}\n\n**Created:** ${formatDate(session.createdAt)}\n**Messages:** ${filteredMessages.length}\n\n## Sample Messages\n\n${filteredMessages.slice(0, 2).map(m => 
          `**${m.role.charAt(0).toUpperCase() + m.role.slice(1)}:** ${m.content.substring(0, 100)}...`
        ).join('\n\n')}`;
        
      case 'txt':
        return `${session.title}\nCreated: ${formatDate(session.createdAt)}\nMessages: ${filteredMessages.length}\n\n${filteredMessages.slice(0, 2).map(m => 
          `[${m.role.toUpperCase()}]: ${m.content.substring(0, 100)}...`
        ).join('\n\n')}`;
        
      default:
        return 'Preview not available for this format';
    }
  };

  if (!session) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Alert severity="error">
            No chat session available for export.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <ExportIcon color="primary" />
              <Typography variant="h6">Export Chat History</Typography>
            </Box>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            {/* Session Info */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {session.title}
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <Chip
                      icon={<DateIcon fontSize="small" />}
                      label={`Created ${formatDate(session.createdAt)}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${session.messages.length} messages`}
                      size="small"
                      variant="outlined"
                    />
                    {session.documentIds && session.documentIds.length > 0 && (
                      <Chip
                        icon={<AttachmentIcon fontSize="small" />}
                        label={`${session.documentIds.length} documents`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Format Selection */}
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">Export Format</FormLabel>
                <RadioGroup
                  value={exportOptions.format}
                  onChange={(e) => handleFormatChange(e.target.value)}
                >
                  {formatOptions.map((format) => (
                    <Card
                      key={format.value}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: exportOptions.format === format.value ? 2 : 1,
                        borderColor: exportOptions.format === format.value ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => handleFormatChange(format.value)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <FormControlLabel
                          value={format.value}
                          control={<Radio />}
                          label={
                            <Box display="flex" alignItems="center" gap={1} width="100%">
                              {format.icon}
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {format.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format.description}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          sx={{ width: '100%', m: 0 }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Options */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Export Options
              </Typography>

              {/* Message Types */}
              <FormGroup sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
                  Message Types
                </FormLabel>
                {messageTypeOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={exportOptions.messageTypes?.includes(option.value) ?? false}
                        onChange={(e) => handleMessageTypeChange(option.value, e.target.checked)}
                      />
                    }
                    label={
                      <Box display="flex" justifyContent="space-between" width="100%">
                        <span>{option.label}</span>
                        <Chip label={option.count} size="small" variant="outlined" />
                      </Box>
                    }
                  />
                ))}
              </FormGroup>

              {/* Additional Options */}
              <FormGroup sx={{ mb: 2 }}>
                <FormLabel component="legend" sx={{ fontSize: '0.875rem', mb: 1 }}>
                  Include Additional Data
                </FormLabel>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => handleOptionsChange('includeMetadata', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <MetadataIcon fontSize="small" />
                      Message metadata (timestamps, confidence, etc.)
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeSourceReferences}
                      onChange={(e) => handleOptionsChange('includeSourceReferences', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <ReferenceIcon fontSize="small" />
                      Source references and citations
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exportOptions.includeAttachments}
                      onChange={(e) => handleOptionsChange('includeAttachments', e.target.checked)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachmentIcon fontSize="small" />
                      File attachments (as references)
                    </Box>
                  }
                />
              </FormGroup>

              {/* Date Range */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Date Range (Optional)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" gap={2}>
                    <DatePicker
                      label="Start Date"
                      value={dateRange.start}
                      onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker
                      label="End Date"
                      value={dateRange.end}
                      onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Custom Filename */}
              <TextField
                label="Custom Filename (Optional)"
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                size="small"
                fullWidth
                placeholder={generateFilename()}
                helperText="Leave empty to use auto-generated name"
              />
            </Grid>

            {/* Preview */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Export Preview
              </Typography>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" fontWeight={600}>
                      {generateFilename()}
                    </Typography>
                    <Chip
                      label={`Est. size: ${getEstimatedFileSize()}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      bgcolor: 'grey.50',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      maxHeight: 200,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {getPreviewContent()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Privacy Note:</strong> Exported files contain your conversation history. 
              Please handle them securely and be mindful of any sensitive information.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<ExportIcon />}
            disabled={!exportOptions.messageTypes || exportOptions.messageTypes.length === 0}
          >
            Export Chat
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};