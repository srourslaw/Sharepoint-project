import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  IconButton,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  Archive as ArchiveIcon,
  DeleteForever as DeleteForeverIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DataRetentionPolicy } from '../types';

interface DataRetentionSettingsProps {
  policies: DataRetentionPolicy[];
  onSave: (policies: DataRetentionPolicy[]) => void;
}

export const DataRetentionSettings: React.FC<DataRetentionSettingsProps> = ({
  policies,
  onSave,
}) => {
  const [localPolicies, setLocalPolicies] = useState<DataRetentionPolicy[]>(policies);
  const [editingPolicy, setEditingPolicy] = useState<DataRetentionPolicy | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setLocalPolicies(policies);
  }, [policies]);

  const defaultPolicy: Omit<DataRetentionPolicy, 'id' | 'createdBy' | 'createdAt' | 'lastModified'> = {
    name: '',
    description: '',
    enabled: true,
    rules: {
      chatHistory: {
        retainDays: 365,
        autoDelete: true,
        archiveBeforeDelete: true,
      },
      userActivity: {
        retainDays: 90,
        anonymizeAfterDays: 30,
        detailedLogsRetainDays: 7,
      },
      fileAnalysis: {
        retainDays: 180,
        keepSummariesOnly: false,
      },
      performanceMetrics: {
        detailedRetainDays: 30,
        aggregatedRetainDays: 365,
        compressionSchedule: 'weekly',
      },
      exports: {
        retainDays: 30,
        maxFileSize: 100,
        autoCleanup: true,
      },
    },
    compliance: {
      gdprCompliant: false,
      hipaaCompliant: false,
      customRequirements: [],
    },
  };

  const handleAddPolicy = () => {
    setEditingPolicy({
      ...defaultPolicy,
      id: `policy_${Date.now()}`,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    });
    setIsDialogOpen(true);
  };

  const handleEditPolicy = (policy: DataRetentionPolicy) => {
    setEditingPolicy({ ...policy });
    setIsDialogOpen(true);
  };

  const handleDeletePolicy = (policyId: string) => {
    const updatedPolicies = localPolicies.filter(policy => policy.id !== policyId);
    setLocalPolicies(updatedPolicies);
    onSave(updatedPolicies);
  };

  const handleSavePolicy = () => {
    if (!editingPolicy) return;

    const isNew = !localPolicies.find(policy => policy.id === editingPolicy.id);
    let updatedPolicies: DataRetentionPolicy[];

    if (isNew) {
      updatedPolicies = [...localPolicies, editingPolicy];
    } else {
      updatedPolicies = localPolicies.map(policy =>
        policy.id === editingPolicy.id 
          ? { ...editingPolicy, lastModified: new Date().toISOString() }
          : policy
      );
    }

    setLocalPolicies(updatedPolicies);
    onSave(updatedPolicies);
    setIsDialogOpen(false);
    setEditingPolicy(null);
  };

  const handleRuleChange = (section: keyof DataRetentionPolicy['rules'], field: string, value: any) => {
    if (!editingPolicy) return;
    
    setEditingPolicy({
      ...editingPolicy,
      rules: {
        ...editingPolicy.rules,
        [section]: {
          ...editingPolicy.rules[section],
          [field]: value,
        },
      },
    });
  };

  const getRetentionSummary = (policy: DataRetentionPolicy) => {
    const rules = policy.rules;
    return [
      `Chat: ${rules.chatHistory.retainDays} days`,
      `Activity: ${rules.userActivity.retainDays} days`,
      `Analysis: ${rules.fileAnalysis.retainDays} days`,
      `Metrics: ${rules.performanceMetrics.detailedRetainDays}/${rules.performanceMetrics.aggregatedRetainDays} days`,
    ];
  };

  const getComplianceFlags = (policy: DataRetentionPolicy) => {
    const flags = [];
    if (policy.compliance.gdprCompliant) flags.push('GDPR');
    if (policy.compliance.hipaaCompliant) flags.push('HIPAA');
    if (policy.compliance.customRequirements?.length) {
      flags.push(...policy.compliance.customRequirements);
    }
    return flags;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Data Retention Policies</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPolicy}
        >
          Add Policy
        </Button>
      </Box>

      {localPolicies.length === 0 ? (
        <Alert severity="info">
          No data retention policies configured. Add a policy to manage data lifecycle.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {localPolicies.map((policy) => (
            <Grid item xs={12} key={policy.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{policy.name}</Typography>
                      <Chip
                        label={policy.enabled ? 'Active' : 'Inactive'}
                        color={policy.enabled ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleEditPolicy(policy)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeletePolicy(policy.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {policy.description}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle2" gutterBottom>
                        Retention Summary
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {getRetentionSummary(policy).map((summary, index) => (
                          <Chip
                            key={index}
                            label={summary}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Compliance
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {getComplianceFlags(policy).length > 0 ? (
                          getComplianceFlags(policy).map((flag, index) => (
                            <Chip
                              key={index}
                              label={flag}
                              size="small"
                              color="primary"
                              icon={<ShieldIcon />}
                            />
                          ))
                        ) : (
                          <Chip
                            label="Standard"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(policy.createdAt).toLocaleDateString()} • 
                      Last Modified: {new Date(policy.lastModified).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {editingPolicy?.id && localPolicies.find(p => p.id === editingPolicy.id)
            ? 'Edit Data Retention Policy'
            : 'Add New Data Retention Policy'
          }
        </DialogTitle>
        <DialogContent>
          {editingPolicy && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Policy Name"
                    value={editingPolicy.name}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, name: e.target.value })
                    }
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingPolicy.enabled}
                        onChange={(e) =>
                          setEditingPolicy({ ...editingPolicy, enabled: e.target.checked })
                        }
                      />
                    }
                    label="Enable Policy"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={editingPolicy.description}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, description: e.target.value })
                    }
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Retention Rules
                </Typography>

                {/* Chat History */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ChatIcon />
                      <Typography>Chat History</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Retain Days"
                          type="number"
                          value={editingPolicy.rules.chatHistory.retainDays}
                          onChange={(e) =>
                            handleRuleChange('chatHistory', 'retainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingPolicy.rules.chatHistory.autoDelete}
                              onChange={(e) =>
                                handleRuleChange('chatHistory', 'autoDelete', e.target.checked)
                              }
                            />
                          }
                          label="Auto Delete"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingPolicy.rules.chatHistory.archiveBeforeDelete}
                              onChange={(e) =>
                                handleRuleChange('chatHistory', 'archiveBeforeDelete', e.target.checked)
                              }
                            />
                          }
                          label="Archive Before Delete"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* User Activity */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <SecurityIcon />
                      <Typography>User Activity</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Retain Days"
                          type="number"
                          value={editingPolicy.rules.userActivity.retainDays}
                          onChange={(e) =>
                            handleRuleChange('userActivity', 'retainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Anonymize After Days"
                          type="number"
                          value={editingPolicy.rules.userActivity.anonymizeAfterDays || ''}
                          onChange={(e) =>
                            handleRuleChange('userActivity', 'anonymizeAfterDays', 
                              e.target.value ? parseInt(e.target.value, 10) : undefined)
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Detailed Logs Retain Days"
                          type="number"
                          value={editingPolicy.rules.userActivity.detailedLogsRetainDays}
                          onChange={(e) =>
                            handleRuleChange('userActivity', 'detailedLogsRetainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* File Analysis */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AnalyticsIcon />
                      <Typography>File Analysis</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Retain Days"
                          type="number"
                          value={editingPolicy.rules.fileAnalysis.retainDays}
                          onChange={(e) =>
                            handleRuleChange('fileAnalysis', 'retainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingPolicy.rules.fileAnalysis.keepSummariesOnly}
                              onChange={(e) =>
                                handleRuleChange('fileAnalysis', 'keepSummariesOnly', e.target.checked)
                              }
                            />
                          }
                          label="Keep Summaries Only"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Performance Metrics */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssessmentIcon />
                      <Typography>Performance Metrics</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Detailed Retain Days"
                          type="number"
                          value={editingPolicy.rules.performanceMetrics.detailedRetainDays}
                          onChange={(e) =>
                            handleRuleChange('performanceMetrics', 'detailedRetainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Aggregated Retain Days"
                          type="number"
                          value={editingPolicy.rules.performanceMetrics.aggregatedRetainDays}
                          onChange={(e) =>
                            handleRuleChange('performanceMetrics', 'aggregatedRetainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Compression Schedule</InputLabel>
                          <Select
                            value={editingPolicy.rules.performanceMetrics.compressionSchedule}
                            onChange={(e) =>
                              handleRuleChange('performanceMetrics', 'compressionSchedule', e.target.value)
                            }
                          >
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>

                {/* Exports */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <StorageIcon />
                      <Typography>Exports</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Retain Days"
                          type="number"
                          value={editingPolicy.rules.exports.retainDays}
                          onChange={(e) =>
                            handleRuleChange('exports', 'retainDays', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Max File Size (MB)"
                          type="number"
                          value={editingPolicy.rules.exports.maxFileSize}
                          onChange={(e) =>
                            handleRuleChange('exports', 'maxFileSize', parseInt(e.target.value, 10))
                          }
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={editingPolicy.rules.exports.autoCleanup}
                              onChange={(e) =>
                                handleRuleChange('exports', 'autoCleanup', e.target.checked)
                              }
                            />
                          }
                          label="Auto Cleanup"
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Box>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Compliance Settings
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editingPolicy.compliance.gdprCompliant}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              compliance: {
                                ...editingPolicy.compliance,
                                gdprCompliant: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="GDPR Compliant"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editingPolicy.compliance.hipaaCompliant}
                          onChange={(e) =>
                            setEditingPolicy({
                              ...editingPolicy,
                              compliance: {
                                ...editingPolicy.compliance,
                                hipaaCompliant: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="HIPAA Compliant"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Custom Requirements (comma-separated)"
                      value={editingPolicy.compliance.customRequirements?.join(', ') || ''}
                      onChange={(e) =>
                        setEditingPolicy({
                          ...editingPolicy,
                          compliance: {
                            ...editingPolicy.compliance,
                            customRequirements: e.target.value
                              ? e.target.value.split(',').map(req => req.trim())
                              : [],
                          },
                        })
                      }
                      placeholder="SOX, PCI DSS, ISO 27001"
                    />
                  </Grid>
                </Grid>
              </Box>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Warning:</strong> Enabling data retention policies will automatically delete data 
                  according to the configured rules. Make sure you have proper backups before enabling 
                  automatic deletion.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePolicy}
            variant="contained"
            disabled={!editingPolicy?.name}
          >
            Save Policy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};