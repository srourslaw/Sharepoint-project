import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { AIModelConfig, AIAnalysisType } from '../types';

interface AIModelSettingsProps {
  models: AIModelConfig[];
  onSave: (models: AIModelConfig[]) => void;
  onTestModel: (model: AIModelConfig) => Promise<boolean>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const AIModelSettings: React.FC<AIModelSettingsProps> = ({
  models,
  onSave,
  onTestModel,
}) => {
  const [localModels, setLocalModels] = useState<AIModelConfig[]>(models);
  const [editingModel, setEditingModel] = useState<AIModelConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setLocalModels(models);
  }, [models]);

  const defaultModel: Omit<AIModelConfig, 'id'> = {
    name: '',
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    apiKey: '',
    endpoint: '',
    parameters: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      stopSequences: [],
    },
    rateLimits: {
      requestsPerMinute: 60,
      tokensPerMinute: 90000,
      dailyLimit: 1000000,
    },
    costTracking: {
      inputCostPerToken: 0.0015,
      outputCostPerToken: 0.002,
      currency: 'USD',
    },
    isDefault: false,
    capabilities: ['text', 'analysis', 'summarization'],
    contextWindow: 4096,
    supportedFeatures: [
      AIAnalysisType.SUMMARIZATION,
      AIAnalysisType.SENTIMENT,
      AIAnalysisType.KEYWORD_EXTRACTION,
    ],
  };

  const providerDefaults = {
    openai: {
      models: ['gpt-4', 'gpt-3.5-turbo', 'text-davinci-003'],
      endpoint: 'https://api.openai.com/v1',
      contextWindow: 4096,
    },
    azure: {
      models: ['gpt-4', 'gpt-35-turbo', 'text-davinci-003'],
      endpoint: 'https://your-resource.openai.azure.com',
      contextWindow: 4096,
    },
    anthropic: {
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      endpoint: 'https://api.anthropic.com/v1',
      contextWindow: 200000,
    },
    local: {
      models: ['llama-2', 'mistral', 'codellama'],
      endpoint: 'http://localhost:11434/v1',
      contextWindow: 2048,
    },
  };

  const handleAddModel = () => {
    setEditingModel({
      ...defaultModel,
      id: `model_${Date.now()}`,
    });
    setTabValue(0);
    setIsDialogOpen(true);
  };

  const handleEditModel = (model: AIModelConfig) => {
    setEditingModel({ ...model });
    setTabValue(0);
    setIsDialogOpen(true);
  };

  const handleDeleteModel = (modelId: string) => {
    const updatedModels = localModels.filter(model => model.id !== modelId);
    setLocalModels(updatedModels);
    onSave(updatedModels);
  };

  const handleSaveModel = () => {
    if (!editingModel) return;

    const isNew = !localModels.find(model => model.id === editingModel.id);
    let updatedModels: AIModelConfig[];

    if (isNew) {
      updatedModels = [...localModels, editingModel];
    } else {
      updatedModels = localModels.map(model =>
        model.id === editingModel.id ? editingModel : model
      );
    }

    if (editingModel.isDefault) {
      updatedModels = updatedModels.map(model =>
        model.id === editingModel.id
          ? model
          : { ...model, isDefault: false }
      );
    }

    setLocalModels(updatedModels);
    onSave(updatedModels);
    setIsDialogOpen(false);
    setEditingModel(null);
  };

  const handleProviderChange = (provider: keyof typeof providerDefaults) => {
    if (!editingModel) return;
    
    const providerConfig = providerDefaults[provider];
    setEditingModel({
      ...editingModel,
      provider,
      model: providerConfig.models[0],
      endpoint: providerConfig.endpoint,
      contextWindow: providerConfig.contextWindow,
    });
  };

  const toggleShowSecret = (modelId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      openai: '#10A37F',
      azure: '#0078D4',
      anthropic: '#D4A574',
      local: '#6B7280',
    };
    return colors[provider as keyof typeof colors] || '#6B7280';
  };

  const calculateMonthlyCost = (model: AIModelConfig) => {
    const { requestsPerMinute, dailyLimit } = model.rateLimits;
    const dailyRequests = Math.min(requestsPerMinute * 60 * 24, dailyLimit || Infinity);
    const monthlyRequests = dailyRequests * 30;
    const avgTokensPerRequest = 500;
    const monthlyCost = monthlyRequests * avgTokensPerRequest * model.costTracking.inputCostPerToken;
    return monthlyCost.toFixed(2);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">AI Model Configuration</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddModel}
        >
          Add Model
        </Button>
      </Box>

      {localModels.length === 0 ? (
        <Alert severity="info">
          No AI models configured. Add a model to enable AI features.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {localModels.map((model) => (
            <Grid item xs={12} md={6} key={model.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6">{model.name}</Typography>
                      {model.isDefault && (
                        <Chip 
                          label="Default" 
                          color="primary" 
                          size="small"
                          icon={<StarIcon />}
                        />
                      )}
                    </Box>
                    <Box>
                      <IconButton onClick={() => handleEditModel(model)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteModel(model.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Chip
                    label={model.provider.toUpperCase()}
                    size="small"
                    sx={{ 
                      mb: 2,
                      bgcolor: getProviderColor(model.provider),
                      color: 'white',
                    }}
                  />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Model: {model.model}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <SpeedIcon fontSize="small" />
                      <Typography variant="body2">
                        {model.contextWindow.toLocaleString()} tokens
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AttachMoneyIcon fontSize="small" />
                      <Typography variant="body2">
                        ~${calculateMonthlyCost(model)}/mo
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Temperature: {model.parameters.temperature}
                  </Typography>

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Features:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {model.supportedFeatures.slice(0, 3).map((feature) => (
                        <Chip
                          key={feature}
                          label={feature.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {model.supportedFeatures.length > 3 && (
                        <Chip
                          label={`+${model.supportedFeatures.length - 3} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Rate Limits
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(model.rateLimits.requestsPerMinute / 200) * 100}
                      sx={{ mt: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {model.rateLimits.requestsPerMinute} req/min
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
          {editingModel?.id && localModels.find(m => m.id === editingModel.id)
            ? 'Edit AI Model'
            : 'Add New AI Model'
          }
        </DialogTitle>
        <DialogContent>
          {editingModel && (
            <Box sx={{ mt: 2 }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label="Basic Configuration" />
                <Tab label="Parameters" />
                <Tab label="Rate Limits" />
                <Tab label="Cost Tracking" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Model Name"
                      value={editingModel.name}
                      onChange={(e) =>
                        setEditingModel({ ...editingModel, name: e.target.value })
                      }
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Provider</InputLabel>
                      <Select
                        value={editingModel.provider}
                        onChange={(e) =>
                          handleProviderChange(e.target.value as keyof typeof providerDefaults)
                        }
                      >
                        <MenuItem value="openai">OpenAI</MenuItem>
                        <MenuItem value="azure">Azure OpenAI</MenuItem>
                        <MenuItem value="anthropic">Anthropic</MenuItem>
                        <MenuItem value="local">Local Model</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Model</InputLabel>
                      <Select
                        value={editingModel.model}
                        onChange={(e) =>
                          setEditingModel({ ...editingModel, model: e.target.value })
                        }
                      >
                        {providerDefaults[editingModel.provider].models.map((model) => (
                          <MenuItem key={model} value={model}>{model}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Context Window"
                      type="number"
                      value={editingModel.contextWindow}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          contextWindow: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Endpoint"
                      value={editingModel.endpoint || ''}
                      onChange={(e) =>
                        setEditingModel({ ...editingModel, endpoint: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <TextField
                        fullWidth
                        label="API Key"
                        type={showSecrets[editingModel.id] ? 'text' : 'password'}
                        value={editingModel.apiKey || ''}
                        onChange={(e) =>
                          setEditingModel({ ...editingModel, apiKey: e.target.value })
                        }
                      />
                      <IconButton
                        onClick={() => toggleShowSecret(editingModel.id)}
                        sx={{ ml: 1 }}
                      >
                        {showSecrets[editingModel.id] ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editingModel.isDefault}
                          onChange={(e) =>
                            setEditingModel({ ...editingModel, isDefault: e.target.checked })
                          }
                        />
                      }
                      label="Set as Default Model"
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography gutterBottom>Temperature: {editingModel.parameters.temperature}</Typography>
                    <Slider
                      value={editingModel.parameters.temperature}
                      onChange={(_, value) =>
                        setEditingModel({
                          ...editingModel,
                          parameters: { ...editingModel.parameters, temperature: value as number },
                        })
                      }
                      min={0}
                      max={2}
                      step={0.1}
                      marks={[
                        { value: 0, label: 'Focused' },
                        { value: 1, label: 'Balanced' },
                        { value: 2, label: 'Creative' },
                      ]}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Tokens"
                      type="number"
                      value={editingModel.parameters.maxTokens}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          parameters: {
                            ...editingModel.parameters,
                            maxTokens: parseInt(e.target.value, 10),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Top P"
                      type="number"
                      inputProps={{ min: 0, max: 1, step: 0.1 }}
                      value={editingModel.parameters.topP}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          parameters: {
                            ...editingModel.parameters,
                            topP: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Frequency Penalty"
                      type="number"
                      inputProps={{ min: -2, max: 2, step: 0.1 }}
                      value={editingModel.parameters.frequencyPenalty}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          parameters: {
                            ...editingModel.parameters,
                            frequencyPenalty: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Presence Penalty"
                      type="number"
                      inputProps={{ min: -2, max: 2, step: 0.1 }}
                      value={editingModel.parameters.presencePenalty}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          parameters: {
                            ...editingModel.parameters,
                            presencePenalty: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Requests per Minute"
                      type="number"
                      value={editingModel.rateLimits.requestsPerMinute}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          rateLimits: {
                            ...editingModel.rateLimits,
                            requestsPerMinute: parseInt(e.target.value, 10),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Tokens per Minute"
                      type="number"
                      value={editingModel.rateLimits.tokensPerMinute}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          rateLimits: {
                            ...editingModel.rateLimits,
                            tokensPerMinute: parseInt(e.target.value, 10),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Daily Limit"
                      type="number"
                      value={editingModel.rateLimits.dailyLimit || ''}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          rateLimits: {
                            ...editingModel.rateLimits,
                            dailyLimit: e.target.value ? parseInt(e.target.value, 10) : undefined,
                          },
                        })
                      }
                    />
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Input Cost per Token"
                      type="number"
                      inputProps={{ step: 0.0001 }}
                      value={editingModel.costTracking.inputCostPerToken}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          costTracking: {
                            ...editingModel.costTracking,
                            inputCostPerToken: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Output Cost per Token"
                      type="number"
                      inputProps={{ step: 0.0001 }}
                      value={editingModel.costTracking.outputCostPerToken}
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          costTracking: {
                            ...editingModel.costTracking,
                            outputCostPerToken: parseFloat(e.target.value),
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={editingModel.costTracking.currency}
                        onChange={(e) =>
                          setEditingModel({
                            ...editingModel,
                            costTracking: {
                              ...editingModel.costTracking,
                              currency: e.target.value,
                            },
                          })
                        }
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="JPY">JPY</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                      <Typography variant="h6" gutterBottom>
                        Estimated Monthly Cost: ${calculateMonthlyCost(editingModel)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Based on current rate limits and average token usage
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveModel}
            variant="contained"
            disabled={!editingModel?.name || !editingModel?.model}
          >
            Save Model
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};