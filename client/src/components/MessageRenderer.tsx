import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Card,
  CardContent,
  Collapse,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip,
  Badge,
  Divider,
} from '@mui/material';
import {
  Person as UserIcon,
  SmartToy as BotIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  Link as LinkIcon,
  Description as FileIcon,
  Schedule as TimeIcon,
  Psychology as ConfidenceIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ChatMessage, SourceReference, QuickAction } from '../types';
import { formatDate, formatDuration } from '../utils/formatters';

interface MessageRendererProps {
  message: ChatMessage;
  onCopy: (content: string) => void;
  onActionClick?: (action: QuickAction) => void;
  showActions?: boolean;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  message,
  onCopy,
  onActionClick,
  showActions = true,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);
  const [showReferences, setShowReferences] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  const formatContent = (content: string) => {
    // Check if content contains code blocks, tables, or other formatted content
    const hasCodeBlock = content.includes('```');
    const hasTable = content.includes('|') && content.includes('\n');
    const hasMarkdown = /[*_`#\[\]()]/g.test(content);

    if (hasMarkdown || hasCodeBlock || hasTable) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={oneLight}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code
                  className={className}
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            table({ children }) {
              return (
                <TableContainer component={Paper} sx={{ my: 2 }}>
                  <Table size="small">{children}</Table>
                </TableContainer>
              );
            },
            thead({ children }) {
              return <TableHead>{children}</TableHead>;
            },
            tbody({ children }) {
              return <TableBody>{children}</TableBody>;
            },
            tr({ children }) {
              return <TableRow>{children}</TableRow>;
            },
            td({ children }) {
              return <TableCell>{children}</TableCell>;
            },
            th({ children }) {
              return <TableCell component="th">{children}</TableCell>;
            },
            a({ href, children }) {
              return (
                <Link href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </Link>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }

    // Simple text with line breaks
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const renderSourceReferences = () => {
    if (!message.sourceReferences || message.sourceReferences.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Sources ({message.sourceReferences.length})
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowReferences(!showReferences)}
          >
            <ExpandMoreIcon
              sx={{
                transform: showReferences ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>
        </Box>
        
        <Collapse in={showReferences}>
          <Box display="flex" flexDirection="column" gap={1}>
            {message.sourceReferences.map((ref: SourceReference, index) => (
              <Card key={index} variant="outlined" sx={{ borderRadius: 1 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box display="flex" alignItems="flex-start" gap={1}>
                    <FileIcon color="primary" fontSize="small" />
                    <Box flexGrow={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {ref.fileName}
                        {ref.pageNumber && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {' '}(Page {ref.pageNumber})
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        "{ref.snippet}"
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip
                          label={`${Math.round(ref.confidence * 100)}% confident`}
                          size="small"
                          variant="outlined"
                          color={ref.confidence > 0.8 ? 'success' : ref.confidence > 0.6 ? 'warning' : 'default'}
                        />
                        <Chip
                          label={`${Math.round(ref.relevanceScore * 100)}% relevant`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  };

  const renderActions = () => {
    if (!showActions || !message.actions || message.actions.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {message.actions.map((action) => (
          <Chip
            key={action.id}
            label={action.label}
            size="small"
            variant="outlined"
            clickable
            disabled={!action.enabled}
            onClick={() => onActionClick && onActionClick(action as QuickAction)}
          />
        ))}
      </Box>
    );
  };

  const renderAttachments = () => {
    if (!message.attachments || message.attachments.length === 0) {
      return null;
    }

    return (
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {message.attachments.map((attachment, index) => (
          <Chip
            key={index}
            label={attachment.name}
            size="small"
            variant="outlined"
            icon={<FileIcon />}
            color={attachment.status === 'ready' ? 'success' : 'default'}
          />
        ))}
      </Box>
    );
  };

  const renderMetadata = () => {
    if (!message.metadata) return null;

    return (
      <Collapse in={showMetadata}>
        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <Box component="span" fontWeight={600}>Processing time:</Box>{' '}
            {message.metadata.processingTime ? formatDuration(message.metadata.processingTime / 1000) : 'N/A'}
          </Typography>
          {message.metadata.tokenCount && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              <Box component="span" fontWeight={600}>Tokens:</Box> {message.metadata.tokenCount}
            </Typography>
          )}
          {message.metadata.model && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              <Box component="span" fontWeight={600}>Model:</Box> {message.metadata.model}
            </Typography>
          )}
        </Box>
      </Collapse>
    );
  };

  if (isSystem) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Alert severity="info" variant="outlined" sx={{ maxWidth: '70%' }}>
          {message.content}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        mb: 2,
        alignItems: 'flex-start',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        gap: 1,
      }}
    >
      {!isUser && (
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
          <BotIcon fontSize="small" />
        </Avatar>
      )}

      <Box sx={{ maxWidth: '70%', minWidth: '200px' }}>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            bgcolor: isUser ? '#1976d2' : 'background.paper',
            color: isUser ? '#ffffff !important' : 'text.primary',
            borderRadius: 2,
            borderTopLeftRadius: !isUser ? 0 : 2,
            borderTopRightRadius: isUser ? 0 : 2,
            position: 'relative',
            '& *': {
              color: isUser ? '#ffffff !important' : 'inherit',
            },
            '& .MuiTypography-root': {
              color: isUser ? '#ffffff !important' : 'inherit',
            }
          }}
        >
          {/* Message Content */}
          <Typography
            variant="body2"
            component="div"
            sx={{
              '& p': { mb: 1, '&:last-child': { mb: 0 } },
              '& ul, & ol': { pl: 2, mb: 1 },
              '& blockquote': { borderLeft: 2, borderColor: 'divider', pl: 2, my: 1 },
              color: isUser ? '#ffffff !important' : 'inherit',
              '& *': {
                color: isUser ? '#ffffff !important' : 'inherit',
              }
            }}
          >
            {formatContent(message.content)}
          </Typography>

          {/* Attachments */}
          {renderAttachments()}

          {/* Confidence Badge */}
          {message.confidence && !isUser && (
            <Box sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={`${Math.round(message.confidence * 100)}% confident`}
                color={message.confidence > 0.8 ? 'success' : message.confidence > 0.6 ? 'warning' : 'default'}
                variant="outlined"
              />
            </Box>
          )}

          {/* Actions */}
          {renderActions()}

          {/* Timestamp and Metadata */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mt={1}
            pt={1}
            borderTop={1}
            borderColor="divider"
            sx={{ opacity: 0.7 }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: isUser ? '#ffffff !important' : 'text.secondary'
              }}
            >
              {formatDate(message.timestamp)}
            </Typography>

            <Box display="flex" alignItems="center" gap={0.5}>
              {message.metadata && (
                <IconButton
                  size="small"
                  onClick={() => setShowMetadata(!showMetadata)}
                  sx={{ color: isUser ? '#ffffff !important' : 'text.secondary' }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              )}
              
              <IconButton
                size="small"
                onClick={() => onCopy(message.content)}
                sx={{ color: isUser ? '#ffffff !important' : 'text.secondary' }}
              >
                <CopyIcon fontSize="small" />
              </IconButton>

              {!isUser && (
                <>
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          </Box>

          {/* Metadata Details */}
          {renderMetadata()}
        </Paper>

        {/* Source References */}
        {renderSourceReferences()}
      </Box>

      {isUser && (
        <Avatar sx={{ bgcolor: 'grey.400', width: 32, height: 32 }}>
          <UserIcon fontSize="small" />
        </Avatar>
      )}
    </Box>
  );
};