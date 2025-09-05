import React, { forwardRef, useRef, useEffect, useState, useImperativeHandle } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Popover,
  IconButton,
  ButtonGroup,
  Divider,
  Slider,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatColorText as TextColorIcon,
  FormatColorFill as BackgroundColorIcon,
  FormatSize as FontSizeIcon,
  FontDownload as FontFamilyIcon,
} from '@mui/icons-material';

import { TextFormatting, FileChange, User } from '../types';

interface RichTextEditorProps {
  content: string;
  mode: 'text' | 'markdown' | 'html' | 'javascript' | 'typescript' | 'css' | 'json' | 'xml' | 'python';
  readOnly?: boolean;
  collaborative?: boolean;
  collaborators?: Array<{
    user: User;
    cursor?: {
      position: number;
      selection?: { start: number; end: number };
    };
    isActive: boolean;
  }>;
  changes?: FileChange[];
  onContentChange?: (content: string) => void;
  onCursorChange?: (position: number) => void;
  onSelectionChange?: (selection: { start: number; end: number } | null) => void;
  height?: string | number;
}

interface RichTextEditorRef {
  insertText: (text: string, position?: number) => void;
  deleteText: (start: number, end: number) => void;
  replaceText: (start: number, end: number, newText: string) => void;
  applyFormatting: (formatting: TextFormatting, selection?: { start: number; end: number }) => void;
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  getCursorPosition: () => number;
  getSelection: () => { start: number; end: number } | null;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content,
  mode,
  readOnly = false,
  collaborative = false,
  collaborators = [],
  changes = [],
  onContentChange,
  onCursorChange,
  onSelectionChange,
  height = '100%',
}, ref) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [localContent, setLocalContent] = useState(content);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [formatPopoverAnchor, setFormatPopoverAnchor] = useState<HTMLElement | null>(null);
  const [currentFormatting, setCurrentFormatting] = useState<TextFormatting>({});

  // Sync content with props
  useEffect(() => {
    if (content !== localContent) {
      setLocalContent(content);
    }
  }, [content]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange?.(newContent);
  };

  // Handle cursor position changes
  const handleCursorChange = () => {
    const textarea = textAreaRef.current;
    if (textarea) {
      const position = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      
      setCursorPosition(position);
      onCursorChange?.(position);
      
      if (position !== selectionEnd) {
        const sel = { start: position, end: selectionEnd };
        setSelection(sel);
        onSelectionChange?.(sel);
      } else {
        setSelection(null);
        onSelectionChange?.(null);
      }
    }
  };

  // Insert text at cursor position
  const insertText = (text: string, position?: number) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const pos = position !== undefined ? position : textarea.selectionStart;
    const newContent = localContent.slice(0, pos) + text + localContent.slice(pos);
    
    handleContentChange(newContent);
    
    // Move cursor to end of inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = pos + text.length;
      handleCursorChange();
    }, 0);
  };

  // Delete text in range
  const deleteText = (start: number, end: number) => {
    const newContent = localContent.slice(0, start) + localContent.slice(end);
    handleContentChange(newContent);
    
    const textarea = textAreaRef.current;
    if (textarea) {
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start;
        handleCursorChange();
      }, 0);
    }
  };

  // Replace text in range
  const replaceText = (start: number, end: number, newText: string) => {
    const newContent = localContent.slice(0, start) + newText + localContent.slice(end);
    handleContentChange(newContent);
    
    const textarea = textAreaRef.current;
    if (textarea) {
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + newText.length;
        handleCursorChange();
      }, 0);
    }
  };

  // Apply formatting (for markdown/html modes)
  const applyFormatting = (formatting: TextFormatting, targetSelection?: { start: number; end: number }) => {
    const textarea = textAreaRef.current;
    if (!textarea || readOnly) return;

    const sel = targetSelection || selection || { start: cursorPosition, end: cursorPosition };
    const selectedText = localContent.slice(sel.start, sel.end);

    let formattedText = selectedText;
    let prefix = '';
    let suffix = '';

    if (mode === 'markdown') {
      if (formatting.bold) {
        prefix = '**';
        suffix = '**';
      } else if (formatting.italic) {
        prefix = '*';
        suffix = '*';
      } else if (formatting.underline) {
        prefix = '<u>';
        suffix = '</u>';
      }
      
      if (formatting.listType === 'bullet') {
        const lines = selectedText.split('\n');
        formattedText = lines.map(line => `- ${line}`).join('\n');
      } else if (formatting.listType === 'numbered') {
        const lines = selectedText.split('\n');
        formattedText = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
      }
    } else if (mode === 'html') {
      if (formatting.bold) {
        prefix = '<strong>';
        suffix = '</strong>';
      } else if (formatting.italic) {
        prefix = '<em>';
        suffix = '</em>';
      } else if (formatting.underline) {
        prefix = '<u>';
        suffix = '</u>';
      }
      
      if (formatting.color) {
        prefix = `<span style="color: ${formatting.color}">`;
        suffix = '</span>';
      }
    }

    const newText = prefix + formattedText + suffix;
    replaceText(sel.start, sel.end, newText);
  };

  // Get current content
  const getContent = () => localContent;

  // Set content
  const setContent = (newContent: string) => {
    setLocalContent(newContent);
    onContentChange?.(newContent);
  };

  // Focus editor
  const focus = () => {
    textAreaRef.current?.focus();
  };

  // Get cursor position
  const getCursorPosition = () => cursorPosition;

  // Get selection
  const getSelection = () => selection;

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    insertText,
    deleteText,
    replaceText,
    applyFormatting,
    getContent,
    setContent,
    focus,
    getCursorPosition,
    getSelection,
  }));

  // Render formatting toolbar for text-based files
  const renderFormattingToolbar = () => {
    if (readOnly || !['text', 'markdown', 'html'].includes(mode)) return null;

    return (
      <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
        <ButtonGroup size="small" variant="outlined">
          <IconButton
            onClick={() => applyFormatting({ bold: true })}
            color={currentFormatting.bold ? 'primary' : 'default'}
          >
            <BoldIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => applyFormatting({ italic: true })}
            color={currentFormatting.italic ? 'primary' : 'default'}
          >
            <ItalicIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => applyFormatting({ underline: true })}
            color={currentFormatting.underline ? 'primary' : 'default'}
          >
            <UnderlineIcon fontSize="small" />
          </IconButton>
        </ButtonGroup>

        <ButtonGroup size="small" variant="outlined">
          <IconButton onClick={(e) => setFormatPopoverAnchor(e.currentTarget)}>
            <TextColorIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={(e) => setFormatPopoverAnchor(e.currentTarget)}>
            <BackgroundColorIcon fontSize="small" />
          </IconButton>
        </ButtonGroup>

        {mode === 'markdown' && (
          <ButtonGroup size="small" variant="outlined">
            <IconButton onClick={() => applyFormatting({ listType: 'bullet' })}>
              •
            </IconButton>
            <IconButton onClick={() => applyFormatting({ listType: 'numbered' })}>
              1.
            </IconButton>
          </ButtonGroup>
        )}
      </Box>
    );
  };

  // Render collaborator cursors
  const renderCollaboratorCursors = () => {
    if (!collaborative || collaborators.length === 0) return null;

    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {collaborators
          .filter(c => c.isActive && c.cursor)
          .map((collaborator, index) => (
            <Box
              key={collaborator.user.id}
              sx={{
                position: 'absolute',
                // Calculate position based on cursor position
                // This would need proper text measurement
                left: `${(collaborator.cursor!.position % 80) * 8}px`,
                top: `${Math.floor(collaborator.cursor!.position / 80) * 20}px`,
                width: 2,
                height: 20,
                bgcolor: `hsl(${index * 45}, 70%, 50%)`,
                zIndex: 1000,
              }}
            >
              <Tooltip title={collaborator.user.displayName}>
                <Avatar
                  sx={{
                    width: 20,
                    height: 20,
                    fontSize: '0.6rem',
                    bgcolor: `hsl(${index * 45}, 70%, 50%)`,
                    position: 'absolute',
                    top: -25,
                    left: -9,
                  }}
                >
                  {collaborator.user.displayName.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            </Box>
          ))
        }
      </Box>
    );
  };

  // Render change indicators
  const renderChangeIndicators = () => {
    if (!changes || changes.length === 0) return null;

    return (
      <Box sx={{ position: 'absolute', right: 0, top: 0, width: 20, height: '100%' }}>
        {changes.map((change, index) => (
          <Box
            key={change.id}
            sx={{
              position: 'absolute',
              right: 0,
              // Calculate position based on change position
              top: `${(change.position.start / localContent.length) * 100}%`,
              width: 4,
              height: 8,
              bgcolor: change.accepted ? 'success.main' : 'warning.main',
              borderRadius: 1,
              cursor: 'pointer',
            }}
            title={`${change.changeType} by ${change.user.displayName}`}
          />
        ))}
      </Box>
    );
  };

  // Get language mode for syntax highlighting
  const getLanguageMode = () => {
    switch (mode) {
      case 'javascript': return 'javascript';
      case 'typescript': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'python': return 'python';
      case 'markdown': return 'markdown';
      default: return 'text';
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {renderFormattingToolbar()}
      
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <TextField
          ref={textAreaRef}
          multiline
          fullWidth
          value={localContent}
          onChange={(e) => handleContentChange(e.target.value)}
          onSelect={handleCursorChange}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          disabled={readOnly}
          placeholder={readOnly ? 'This file is read-only' : 'Start typing...'}
          InputProps={{
            sx: {
              height: '100%',
              '& textarea': {
                height: '100% !important',
                fontFamily: ['javascript', 'typescript', 'css', 'json', 'xml', 'python'].includes(mode) 
                  ? 'Monaco, Consolas, "Courier New", monospace' 
                  : 'inherit',
                fontSize: ['javascript', 'typescript', 'css', 'json', 'xml', 'python'].includes(mode) 
                  ? '14px' 
                  : 'inherit',
                lineHeight: 1.5,
                resize: 'none',
                overflow: 'auto !important',
              },
            },
          }}
          sx={{ height: '100%' }}
        />

        {renderCollaboratorCursors()}
        {renderChangeIndicators()}

        {/* Line numbers for code files */}
        {['javascript', 'typescript', 'css', 'json', 'xml', 'python'].includes(mode) && (
          <Box
            sx={{
              position: 'absolute',
              left: 8,
              top: 8,
              bottom: 8,
              width: 40,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'background.default',
              fontSize: '12px',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              color: 'text.secondary',
              userSelect: 'none',
              pointerEvents: 'none',
              padding: '8px 4px',
              lineHeight: 1.5,
            }}
          >
            {localContent.split('\n').map((_, index) => (
              <div key={index} style={{ height: '21px' }}>
                {index + 1}
              </div>
            ))}
          </Box>
        )}
      </Box>

      {/* Status bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.5,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        <Box>
          Mode: {mode.toUpperCase()} | 
          Lines: {localContent.split('\n').length} | 
          Characters: {localContent.length}
          {selection && (
            <span> | Selected: {selection.end - selection.start}</span>
          )}
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {collaborative && collaborators.length > 0 && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption" color="text.secondary">
                {collaborators.filter(c => c.isActive).length} active
              </Typography>
              {collaborators
                .filter(c => c.isActive)
                .slice(0, 3)
                .map((collaborator, index) => (
                  <Avatar
                    key={collaborator.user.id}
                    sx={{
                      width: 16,
                      height: 16,
                      fontSize: '0.6rem',
                      bgcolor: `hsl(${index * 45}, 70%, 50%)`,
                    }}
                  >
                    {collaborator.user.displayName.charAt(0)}
                  </Avatar>
                ))
              }
            </Box>
          )}
          
          <Typography variant="caption">
            Pos: {cursorPosition}
          </Typography>
        </Box>
      </Box>

      {/* Formatting popover */}
      <Popover
        open={Boolean(formatPopoverAnchor)}
        anchorEl={formatPopoverAnchor}
        onClose={() => setFormatPopoverAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle2" gutterBottom>
            Text Formatting
          </Typography>
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={currentFormatting.fontFamily || 'inherit'}
              onChange={(e) => setCurrentFormatting(prev => ({ ...prev, fontFamily: e.target.value }))}
            >
              <MenuItem value="inherit">Default</MenuItem>
              <MenuItem value="Arial">Arial</MenuItem>
              <MenuItem value="Times New Roman">Times New Roman</MenuItem>
              <MenuItem value="Courier New">Courier New</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="caption" gutterBottom>
            Font Size
          </Typography>
          <Slider
            value={currentFormatting.fontSize || 14}
            onChange={(_, value) => setCurrentFormatting(prev => ({ ...prev, fontSize: value as number }))}
            min={8}
            max={72}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
      </Popover>
    </Box>
  );
});

RichTextEditor.displayName = 'RichTextEditor';