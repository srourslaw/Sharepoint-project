import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tab,
  Tabs,
  Card,
  CardContent,
  CardActions,
  Slider,
  Alert,
  Button,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as AIIcon,
  Chat as ChatIcon,
  Summarize as SummarizeIcon,
  Translate as TranslateIcon,
  Compare as CompareIcon,
  Psychology as SentimentIcon,
  AutoAwesome as MagicIcon,
} from '@mui/icons-material';

import { SummarizationRequest, SummarizationResult } from '../types';
import { useAIFeatures } from '../hooks/useAIFeatures';
import { EnhancedAIChat } from './EnhancedAIChat';

interface AIPanelProps {
  selectedFiles: string[];
  onFileSelect?: (fileIds: string[]) => void;
  currentPath?: string;
  onClose?: () => void;
}

type AIFeature = 'chat' | 'summarize' | 'translate' | 'compare' | 'sentiment' | 'extract';

export const AIPanel: React.FC<AIPanelProps> = ({ selectedFiles, onFileSelect, currentPath, onClose }) => {
  const [activeFeature, setActiveFeature] = useState<AIFeature>('chat');

  const {
    summarizeDocuments,
    translateContent,
    analyzeContent,
    extractContent,
    loading,
    error,
  } = useAIFeatures();

  const [summarizationSettings, setSummarizationSettings] = useState<SummarizationRequest>({
    text: '',
    summaryType: 'abstractive',
    length: 'medium',
    includeKeywords: true,
    includeMetrics: true,
  });

  const handleSummarize = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await summarizeDocuments({
        documentIds: selectedFiles,
        ...summarizationSettings,
      });
    } catch (error) {
      console.error('Failed to summarize:', error);
    }
  };

  const renderChatInterface = () => (
    <EnhancedAIChat
      selectedFiles={selectedFiles}
      height="100%"
      onClose={onClose}
    />
  );

  const renderSummarizeInterface = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Document Summarization
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>
            Summary Settings
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Summary Type
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {['extractive', 'abstractive', 'bullet_points', 'executive', 'technical', 'creative'].map((type) => (
                <Chip
                  key={type}
                  label={type.replace('_', ' ')}
                  size="small"
                  clickable
                  color={summarizationSettings.summaryType === type ? 'primary' : 'default'}
                  onClick={() => setSummarizationSettings(prev => ({ ...prev, summaryType: type as any }))}
                />
              ))}
            </Box>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Length: {summarizationSettings.length}
            </Typography>
            <Slider
              value={summarizationSettings.length === 'short' ? 0 : summarizationSettings.length === 'medium' ? 1 : 2}
              onChange={(_, value) => {
                const length = value === 0 ? 'short' : value === 1 ? 'medium' : 'long';
                setSummarizationSettings(prev => ({ ...prev, length }));
              }}
              step={1}
              marks={[
                { value: 0, label: 'Short' },
                { value: 1, label: 'Medium' },
                { value: 2, label: 'Long' },
              ]}
              min={0}
              max={2}
            />
          </Box>
        </CardContent>
        
        <CardActions>
          <Button
            variant="contained"
            startIcon={<SummarizeIcon />}
            onClick={handleSummarize}
            disabled={selectedFiles.length === 0 || loading}
            fullWidth
          >
            {loading ? 'Summarizing...' : 'Generate Summary'}
          </Button>
        </CardActions>
      </Card>

      {selectedFiles.length === 0 && (
        <Alert severity="info">
          Select one or more documents to summarize.
        </Alert>
      )}
    </Box>
  );

  const renderFeatureInterface = () => {
    switch (activeFeature) {
      case 'chat':
        return renderChatInterface();
      case 'summarize':
        return renderSummarizeInterface();
      case 'translate':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Translation</Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon - translate documents to different languages.
            </Typography>
          </Box>
        );
      case 'compare':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Document Comparison</Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon - compare multiple documents for similarities and differences.
            </Typography>
          </Box>
        );
      case 'sentiment':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Sentiment Analysis</Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon - analyze the emotional tone and sentiment of documents.
            </Typography>
          </Box>
        );
      case 'extract':
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Content Extraction</Typography>
            <Typography variant="body2" color="text.secondary">
              Coming soon - extract key information, entities, and insights from documents.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (activeFeature === 'chat') {
    return renderChatInterface();
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <AIIcon color="primary" />
            <Typography variant="h6">AI Assistant</Typography>
          </Box>
          
          {onClose && (
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Feature Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeFeature}
          onChange={(_, newValue) => setActiveFeature(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label="Chat"
            value="chat"
            icon={<ChatIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
          <Tab
            label="Summarize"
            value="summarize"
            icon={<SummarizeIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
          <Tab
            label="Translate"
            value="translate"
            icon={<TranslateIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
          <Tab
            label="Compare"
            value="compare"
            icon={<CompareIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
          <Tab
            label="Sentiment"
            value="sentiment"
            icon={<SentimentIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
          <Tab
            label="Extract"
            value="extract"
            icon={<MagicIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none' }}
          />
        </Tabs>
      </Box>

      {/* Content Area */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderFeatureInterface()}
      </Box>
    </Box>
  );
};