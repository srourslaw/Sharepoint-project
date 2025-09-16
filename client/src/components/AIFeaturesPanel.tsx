import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  SmartToy,
  Psychology,
  Security,
  AutoFixHigh,
  FindReplace,
  ExpandMore,
  Refresh,
  Info,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';

interface AIFeaturesPanelProps {
  selectedFiles: string[];
  onAnalysisComplete?: (result: any) => void;
}

interface AnalysisResult {
  type: 'analysis' | 'automation' | 'pii' | 'duplicates' | 'search';
  status: 'loading' | 'success' | 'error';
  data: any;
  timestamp: string;
}

export const AIFeaturesPanel: React.FC<AIFeaturesPanelProps> = ({
  selectedFiles,
  onAnalysisComplete
}) => {
  const [results, setResults] = useState<{ [key: string]: AnalysisResult }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Document Analysis (Phase 3)
  const runDocumentAnalysis = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar('Please select a document first', 'error');
      return;
    }

    setLoading({ ...loading, analysis: true });

    try {
      const response = await fetch('/api/analysis/process/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: selectedFiles[0],
          options: {
            generateSummary: true,
            generateTags: true,
            enhanceMetadata: true,
            multiFormat: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        analysis: {
          type: 'analysis',
          status: 'success',
          data: result.data,
          timestamp: new Date().toISOString()
        }
      }));

      showSnackbar(`Document analysis completed! Found ${result.data?.tags?.length || 0} tags and generated multi-format summaries`);
      onAnalysisComplete?.(result.data);

    } catch (error: any) {
      console.error('Document analysis failed:', error);
      setResults(prev => ({
        ...prev,
        analysis: {
          type: 'analysis',
          status: 'error',
          data: { error: error.message },
          timestamp: new Date().toISOString()
        }
      }));
      showSnackbar('Document analysis failed', 'error');
    } finally {
      setLoading({ ...loading, analysis: false });
    }
  };

  // PII Detection (Phase 5)
  const runPIIDetection = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar('Please select a document first', 'error');
      return;
    }

    setLoading({ ...loading, pii: true });

    try {
      const response = await fetch('/api/privacy/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: selectedFiles[0],
          options: {
            deepScan: true,
            includeMetadata: true,
            regulatoryFrameworks: ['gdpr', 'ccpa', 'hipaa'],
            confidenceThreshold: 80
          }
        })
      });

      if (!response.ok) {
        throw new Error(`PII scan failed: ${response.statusText}`);
      }

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        pii: {
          type: 'pii',
          status: 'success',
          data: result.data,
          timestamp: new Date().toISOString()
        }
      }));

      const riskLevel = result.data?.riskLevel || 'low';
      const findingsCount = result.data?.findings?.length || 0;

      showSnackbar(
        `PII scan completed! Risk level: ${riskLevel.toUpperCase()}, ${findingsCount} findings detected`,
        riskLevel === 'high' || riskLevel === 'critical' ? 'error' : 'success'
      );

    } catch (error: any) {
      console.error('PII detection failed:', error);
      setResults(prev => ({
        ...prev,
        pii: {
          type: 'pii',
          status: 'error',
          data: { error: error.message },
          timestamp: new Date().toISOString()
        }
      }));
      showSnackbar('PII detection failed', 'error');
    } finally {
      setLoading({ ...loading, pii: false });
    }
  };

  // Process Automation (Phase 4)
  const runProcessAutomation = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar('Please select documents first', 'error');
      return;
    }

    setLoading({ ...loading, automation: true });

    try {
      const response = await fetch('/api/automation/lifecycle/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentIds: selectedFiles,
          metadata: { source: 'dashboard_automation' }
        })
      });

      if (!response.ok) {
        throw new Error(`Automation failed: ${response.statusText}`);
      }

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        automation: {
          type: 'automation',
          status: 'success',
          data: result.data,
          timestamp: new Date().toISOString()
        }
      }));

      const processedCount = result.data?.summary?.successful || 0;
      showSnackbar(`Process automation completed! ${processedCount} documents processed successfully`);

    } catch (error: any) {
      console.error('Process automation failed:', error);
      setResults(prev => ({
        ...prev,
        automation: {
          type: 'automation',
          status: 'error',
          data: { error: error.message },
          timestamp: new Date().toISOString()
        }
      }));
      showSnackbar('Process automation failed', 'error');
    } finally {
      setLoading({ ...loading, automation: false });
    }
  };

  // Duplicate Detection (Phase 2)
  const runDuplicateDetection = async () => {
    setLoading({ ...loading, duplicates: true });

    try {
      const response = await fetch('/api/duplicates/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scanType: 'comprehensive',
          options: {
            includeMetadata: true,
            confidenceThreshold: 0.8,
            maxResults: 100
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Duplicate detection failed: ${response.statusText}`);
      }

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        duplicates: {
          type: 'duplicates',
          status: 'success',
          data: result.data,
          timestamp: new Date().toISOString()
        }
      }));

      const duplicateGroups = result.data?.duplicateGroups?.length || 0;
      const totalDuplicates = result.data?.statistics?.totalDuplicates || 0;

      showSnackbar(`Duplicate scan completed! Found ${duplicateGroups} duplicate groups containing ${totalDuplicates} files`);

    } catch (error: any) {
      console.error('Duplicate detection failed:', error);
      setResults(prev => ({
        ...prev,
        duplicates: {
          type: 'duplicates',
          status: 'error',
          data: { error: error.message },
          timestamp: new Date().toISOString()
        }
      }));
      showSnackbar('Duplicate detection failed', 'error');
    } finally {
      setLoading({ ...loading, duplicates: false });
    }
  };

  // Render analysis results
  const renderAnalysisResults = (result: AnalysisResult) => {
    if (!result || result.status === 'loading') {
      return <CircularProgress size={20} />;
    }

    if (result.status === 'error') {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Analysis failed: {result.data?.error || 'Unknown error'}
        </Alert>
      );
    }

    switch (result.type) {
      case 'analysis':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ✅ Document Analysis Results
            </Typography>

            {result.data?.summaries && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    📄 Multi-Format Summaries Generated
                  </Typography>
                  <Grid container spacing={1}>
                    {Object.entries(result.data.summaries).map(([format, summary]: [string, any]) => (
                      <Grid item xs={6} key={format}>
                        <Chip
                          label={`${format} (${summary.summary?.length || 0} chars)`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {result.data?.tags && (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    🏷️ Smart Tags ({result.data.tags.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {result.data.tags.slice(0, 10).map((tag: any, index: number) => (
                      <Chip
                        key={index}
                        label={`${tag.tag || tag} (${Math.round((tag.confidence || 0.8) * 100)}%)`}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 'pii':
        const riskLevel = result.data?.riskLevel || 'low';
        const riskColor = riskLevel === 'critical' ? 'error' : riskLevel === 'high' ? 'warning' : riskLevel === 'medium' ? 'info' : 'success';

        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              🛡️ PII Detection Results
            </Typography>

            <Alert severity={riskColor as any} sx={{ mb: 2 }}>
              Risk Level: {riskLevel.toUpperCase()} - {result.data?.findings?.length || 0} PII findings detected
            </Alert>

            {result.data?.findings && result.data.findings.length > 0 && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Detected PII Types:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {Array.from(new Set(result.data.findings.map((f: any) => f.type))).slice(0, 8).map((type: any) => (
                      <Chip
                        key={type}
                        label={type.replace('_', ' ').toUpperCase()}
                        size="small"
                        color={riskColor as any}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 'automation':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              ⚡ Process Automation Results
            </Typography>

            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Documents Processed
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {result.data?.summary?.successful || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Actions Applied
                    </Typography>
                    <Typography variant="h6" color="secondary">
                      {result.data?.result?.length || 0}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      case 'duplicates':
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              🔍 Duplicate Detection Results
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Duplicate Groups
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {result.data?.duplicateGroups?.length || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total Duplicates
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {result.data?.statistics?.totalDuplicates || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SmartToy color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" color="primary">
            AI-Powered Document Intelligence
          </Typography>
          <Tooltip title="Advanced AI features for document analysis, automation, and compliance">
            <IconButton size="small" sx={{ ml: 1 }}>
              <Info />
            </IconButton>
          </Tooltip>
        </Box>

        {selectedFiles.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {selectedFiles.length} document{selectedFiles.length > 1 ? 's' : ''} selected for analysis
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Document Analysis (Phase 3) */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Psychology color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Smart Analysis
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  Multi-format summaries, intelligent tagging & metadata enhancement
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={runDocumentAnalysis}
                  disabled={loading.analysis || selectedFiles.length === 0}
                  startIcon={loading.analysis ? <CircularProgress size={16} /> : <AutoFixHigh />}
                >
                  {loading.analysis ? 'Analyzing...' : 'Analyze Document'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* PII Detection (Phase 5) */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Security color="error" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    PII Detection
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  Scan for sensitive data, GDPR/CCPA compliance & privacy risks
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  onClick={runPIIDetection}
                  disabled={loading.pii || selectedFiles.length === 0}
                  startIcon={loading.pii ? <CircularProgress size={16} /> : <Security />}
                >
                  {loading.pii ? 'Scanning...' : 'Scan for PII'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Process Automation (Phase 4) */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AutoFixHigh color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Automation
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  Document lifecycle management & workflow automation
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  onClick={runProcessAutomation}
                  disabled={loading.automation || selectedFiles.length === 0}
                  startIcon={loading.automation ? <CircularProgress size={16} /> : <AutoFixHigh />}
                >
                  {loading.automation ? 'Processing...' : 'Run Automation'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Duplicate Detection (Phase 2) */}
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FindReplace color="warning" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Find Duplicates
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  Intelligent duplicate detection & storage optimization
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="warning"
                  onClick={runDuplicateDetection}
                  disabled={loading.duplicates}
                  startIcon={loading.duplicates ? <CircularProgress size={16} /> : <FindReplace />}
                >
                  {loading.duplicates ? 'Scanning...' : 'Find Duplicates'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Results Section */}
        {Object.values(results).some(result => result) && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>

            {Object.entries(results).map(([key, result]) => (
              result && (
                <Accordion key={key} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography sx={{ flexGrow: 1 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} Analysis
                      </Typography>
                      {result.status === 'success' && <CheckCircle color="success" sx={{ mr: 1 }} />}
                      {result.status === 'error' && <Error color="error" sx={{ mr: 1 }} />}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(result.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderAnalysisResults(result)}
                  </AccordionDetails>
                </Accordion>
              )
            ))}
          </Box>
        )}

        {/* Service Status */}
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            🚀 All AI services are operational and ready for enterprise-scale document processing
          </Typography>
        </Box>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};