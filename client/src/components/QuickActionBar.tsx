import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Summarize as SummarizeIcon,
  Translate as TranslateIcon,
  Psychology as AnalyzeIcon,
  Compare as CompareIcon,
  AutoAwesome as ExtractIcon,
  QuestionAnswer as QuestionIcon,
  TrendingUp as TrendIcon,
  Topic as TopicIcon,
  Language as LanguageIcon,
  TextFields as TextIcon,
  MoreHoriz as MoreIcon,
  ExpandMore as ExpandIcon,
  Lightbulb as InsightIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

import { QuickAction } from '../types';

interface QuickActionBarProps {
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
  selectedFilesCount: number;
  compact?: boolean;
  maxVisible?: number;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions,
  onActionClick,
  selectedFilesCount,
  compact = false,
  maxVisible = 6,
}) => {
  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  const defaultActions: QuickAction[] = [
    {
      id: 'ask-question',
      label: 'Ask Question',
      prompt: 'What would you like to know about these documents?',
      icon: 'question',
      category: 'analysis',
      requiresDocuments: true,
    },
    {
      id: 'summarize',
      label: 'Summarize',
      prompt: 'Please provide a comprehensive summary of the selected documents.',
      icon: 'summarize',
      category: 'summary',
      requiresDocuments: true,
    },
    {
      id: 'extract-keywords',
      label: 'Extract Keywords',
      prompt: 'Extract the key terms and important concepts from these documents.',
      icon: 'extract',
      category: 'extraction',
      requiresDocuments: true,
    },
    {
      id: 'analyze-sentiment',
      label: 'Analyze Sentiment',
      prompt: 'Analyze the overall tone and sentiment of these documents.',
      icon: 'analyze',
      category: 'analysis',
      requiresDocuments: true,
    },
    {
      id: 'translate',
      label: 'Translate',
      prompt: 'Translate the content of these documents to another language.',
      icon: 'translate',
      category: 'translation',
      requiresDocuments: true,
    },
    {
      id: 'compare',
      label: 'Compare',
      prompt: 'Compare these documents and highlight similarities and differences.',
      icon: 'compare',
      category: 'comparison',
      requiresDocuments: true,
    },
    {
      id: 'find-insights',
      label: 'Find Insights',
      prompt: 'Identify key insights, patterns, and important findings in these documents.',
      icon: 'insight',
      category: 'analysis',
      requiresDocuments: true,
    },
    {
      id: 'create-report',
      label: 'Create Report',
      prompt: 'Create a detailed analytical report based on these documents.',
      icon: 'assessment',
      category: 'analysis',
      requiresDocuments: true,
    },
  ];

  const allActions = [...(actions.length > 0 ? actions : defaultActions)];
  const visibleActions = showAllActions ? allActions : allActions.slice(0, maxVisible);
  const hiddenActions = allActions.slice(maxVisible);

  const getActionIcon = (iconName: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (iconName) {
      case 'question': return <QuestionIcon {...iconProps} />;
      case 'summarize': return <SummarizeIcon {...iconProps} />;
      case 'extract': return <ExtractIcon {...iconProps} />;
      case 'analyze': return <AnalyzeIcon {...iconProps} />;
      case 'translate': return <TranslateIcon {...iconProps} />;
      case 'compare': return <CompareIcon {...iconProps} />;
      case 'insight': return <InsightIcon {...iconProps} />;
      case 'assessment': return <AssessmentIcon {...iconProps} />;
      case 'trend': return <TrendIcon {...iconProps} />;
      case 'topic': return <TopicIcon {...iconProps} />;
      case 'language': return <LanguageIcon {...iconProps} />;
      case 'text': return <TextIcon {...iconProps} />;
      default: return <QuestionIcon {...iconProps} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analysis': return 'primary';
      case 'summary': return 'secondary';
      case 'extraction': return 'success';
      case 'translation': return 'warning';
      case 'comparison': return 'info';
      default: return 'default';
    }
  };

  const handleActionClick = (action: QuickAction) => {
    if (action.requiresDocuments && selectedFilesCount === 0) {
      return; // Show tooltip or warning
    }
    onActionClick(action);
    setMoreMenuAnchorEl(null);
  };

  if (compact) {
    return (
      <Grid container spacing={2}>
        {visibleActions.map((action) => (
          <Grid item xs={12} sm={6} md={6} key={action.id}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={getActionIcon(action.icon)}
              disabled={action.requiresDocuments && selectedFilesCount === 0}
              onClick={() => handleActionClick(action)}
              sx={{
                p: 2,
                height: 64,
                justifyContent: 'flex-start',
                textAlign: 'left',
                fontSize: '0.875rem',
                textTransform: 'none',
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              <Box sx={{ ml: 1, textAlign: 'left' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {action.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {action.description || (action.prompt ? action.prompt.substring(0, 50) : '')}...
                </Typography>
              </Box>
            </Button>
          </Grid>
        ))}
        
        {hiddenActions.length > 0 && (
          <>
            <Grid item xs={12}>
              <Button
                variant="text"
                size="small"
                onClick={(e) => setMoreMenuAnchorEl(e.currentTarget)}
                startIcon={<MoreIcon />}
              >
                Show More Actions
              </Button>
            </Grid>
            
            <Menu
              anchorEl={moreMenuAnchorEl}
              open={Boolean(moreMenuAnchorEl)}
              onClose={() => setMoreMenuAnchorEl(null)}
            >
              {hiddenActions.map((action) => (
                <MenuItem
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={action.requiresDocuments && selectedFilesCount === 0}
                >
                  <ListItemIcon>
                    {getActionIcon(action.icon)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={action.label}
                    secondary={action.description || (action.prompt ? action.prompt.substring(0, 40) : '')}
                  />
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Grid>
    );
  }

  // Full layout for welcome screen and expanded view
  return (
    <Box>
      {selectedFilesCount === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Select documents to enable AI analysis features
        </Alert>
      )}
      
      <Grid container spacing={2}>
        {visibleActions.map((action) => (
          <Grid item xs={12} key={action.id}>
            <Card
              sx={{
                cursor: action.requiresDocuments && selectedFilesCount === 0 ? 'not-allowed' : 'pointer',
                opacity: action.requiresDocuments && selectedFilesCount === 0 ? 0.5 : 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: action.requiresDocuments && selectedFilesCount === 0 ? 'none' : 'translateY(-2px)',
                  boxShadow: action.requiresDocuments && selectedFilesCount === 0 ? 'none' : 4,
                },
                height: '100%',
              }}
              onClick={() => handleActionClick(action)}
            >
              <CardContent sx={{ p: 3, textAlign: 'left', height: '100%', display: 'flex', alignItems: 'center', minHeight: 80 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    bgcolor: `${getCategoryColor(action.category)}.light`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    flexShrink: 0,
                  }}
                >
                  {getActionIcon(action.icon)}
                </Box>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontSize: '1rem', mb: 0.5, lineHeight: 1.2 }}>
                    {action.label}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                    {action.description || (action.prompt ? action.prompt : 'Click to execute this action')}
                  </Typography>
                </Box>
                
                {action.requiresDocuments && (
                  <Chip
                    label="Requires documents"
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1, fontSize: '0.7rem' }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {hiddenActions.length > 0 && (
        <Box textAlign="center" mt={2}>
          <Button
            variant="outlined"
            startIcon={<ExpandIcon sx={{ transform: showAllActions ? 'rotate(180deg)' : 'rotate(0deg)' }} />}
            onClick={() => setShowAllActions(!showAllActions)}
            size="small"
          >
            {showAllActions ? 'Show Less' : `Show ${hiddenActions.length} More`}
          </Button>
        </Box>
      )}
      
      <Collapse in={showAllActions}>
        <Box mt={2}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {hiddenActions.map((action) => (
              <Grid item xs={12} key={action.id}>
                <Card
                  sx={{
                    cursor: action.requiresDocuments && selectedFilesCount === 0 ? 'not-allowed' : 'pointer',
                    opacity: action.requiresDocuments && selectedFilesCount === 0 ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: action.requiresDocuments && selectedFilesCount === 0 ? 'none' : 'translateY(-2px)',
                      boxShadow: action.requiresDocuments && selectedFilesCount === 0 ? 'none' : 4,
                    },
                    height: '100%',
                  }}
                  onClick={() => handleActionClick(action)}
                >
                  <CardContent sx={{ p: 3, textAlign: 'left', height: '100%', display: 'flex', alignItems: 'center', minHeight: 80 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        bgcolor: `${getCategoryColor(action.category)}.light`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        flexShrink: 0,
                      }}
                    >
                      {getActionIcon(action.icon)}
                    </Box>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ fontSize: '1rem', mb: 0.5, lineHeight: 1.2 }}>
                        {action.label}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.4 }}>
                        {action.description || (action.prompt ? action.prompt : 'Click to execute this action')}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Collapse>
    </Box>
  );
};