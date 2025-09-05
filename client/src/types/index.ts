// SharePoint Types
export interface SharePointSite {
  id: string;
  name: string;
  webUrl: string;
  description?: string;
  displayName: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  libraries?: SharePointLibrary[];
}

export interface SharePointLibrary {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  webUrl: string;
  parentSite?: SharePointSite;
  itemCount: number;
  lastModifiedDateTime: string;
}

export interface SharePointFile {
  id: string;
  name: string;
  displayName: string;
  size: number;
  webUrl: string;
  downloadUrl?: string;
  mimeType: string;
  extension: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  createdBy?: User;
  lastModifiedBy?: User;
  parentPath: string;
  isFolder: boolean;
  thumbnail?: string;
  content?: string;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  userPrincipalName: string;
}

// AI Features Types
export interface AIAnalysisResult {
  id: string;
  fileId: string;
  analysisType: AIAnalysisType;
  result: any;
  confidence: number;
  processingTime: number;
  timestamp: string;
}

export enum AIAnalysisType {
  SUMMARIZATION = 'summarization',
  SENTIMENT = 'sentiment',
  KEYWORD_EXTRACTION = 'keyword_extraction',
  ENTITY_EXTRACTION = 'entity_extraction',
  TRANSLATION = 'translation',
  COMPARISON = 'comparison'
}

export interface SummarizationRequest {
  text: string;
  summaryType: 'extractive' | 'abstractive' | 'bullet_points' | 'executive' | 'technical' | 'creative';
  length: 'short' | 'medium' | 'long';
  includeKeywords?: boolean;
  includeMetrics?: boolean;
}

export interface SummarizationResult {
  summary: {
    text: string;
    keyPoints: string[];
    confidence: number;
  };
  keywords?: string[];
  metrics?: {
    originalWordCount: number;
    summaryWordCount: number;
    compressionRatio: number;
  };
  processingTime: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
  totalMessages: number;
  metadata?: {
    documentsAnalyzed: number;
    averageResponseTime: number;
    topics: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceReferences?: SourceReference[];
  confidence?: number;
  messageType?: 'text' | 'action' | 'file' | 'error' | 'typing';
  attachments?: ChatAttachment[];
  actions?: ChatAction[];
  formatting?: MessageFormatting;
  metadata?: {
    processingTime?: number;
    tokenCount?: number;
    model?: string;
  };
}

export interface SourceReference {
  fileId: string;
  fileName: string;
  snippet: string;
  pageNumber?: number;
  confidence: number;
  relevanceScore: number;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  thumbnailUrl?: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  analysisResults?: any;
}

export interface ChatAction {
  id: string;
  type: 'summarize' | 'translate' | 'extract' | 'analyze' | 'compare';
  label: string;
  description: string;
  icon: string;
  parameters?: any;
  enabled: boolean;
}

export interface MessageFormatting {
  hasCode: boolean;
  hasTable: boolean;
  hasList: boolean;
  hasLinks: boolean;
  language?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: 'analysis' | 'summary' | 'extraction' | 'translation' | 'comparison';
  requiresDocuments: boolean;
  parameters?: any;
}

export interface ChatExportOptions {
  format: 'json' | 'txt' | 'pdf' | 'html' | 'markdown';
  includeMetadata: boolean;
  includeAttachments: boolean;
  includeSourceReferences: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  messageTypes?: string[];
}

// File Editor Types
export interface FileVersion {
  id: string;
  versionNumber: string;
  created: string;
  createdBy: User;
  size: number;
  comment?: string;
  isCurrentVersion: boolean;
  downloadUrl: string;
  content?: string;
}

export interface FileChange {
  id: string;
  timestamp: string;
  user: User;
  changeType: 'insert' | 'delete' | 'format' | 'replace';
  position: {
    start: number;
    end?: number;
  };
  content: string;
  originalContent?: string;
  accepted: boolean;
}

export interface CollaborativeSession {
  sessionId: string;
  fileId: string;
  participants: Array<{
    user: User;
    joinedAt: string;
    cursor?: {
      position: number;
      selection?: { start: number; end: number };
    };
    isActive: boolean;
  }>;
  createdAt: string;
  lastActivity: string;
}

export interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: string;
  version: string;
  changes: FileChange[];
  collaborativeSession?: CollaborativeSession;
  undoStack: EditorAction[];
  redoStack: EditorAction[];
  cursorPosition: number;
  selection?: { start: number; end: number };
}

export interface EditorAction {
  type: 'insert' | 'delete' | 'replace' | 'format';
  timestamp: string;
  position: { start: number; end?: number };
  content: string;
  originalContent?: string;
  formatting?: TextFormatting;
}

export interface TextFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  listType?: 'bullet' | 'numbered' | 'none';
}

export interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // milliseconds
  maxRetries: number;
  retryDelay: number;
}

export interface FileEditorProps {
  file: SharePointFile;
  readOnly?: boolean;
  autoSave?: AutoSaveConfig;
  collaborative?: boolean;
  onSave?: (content: string, version: string) => Promise<void>;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export interface SentimentAnalysisResult {
  overallSentiment: {
    score: number; // -1 to 1
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  emotionalTone?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  processingTime: number;
}

// Dashboard UI Types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SearchFilters {
  fileType: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sizeRange: {
    min?: number;
    max?: number;
  };
  author: string[];
}

export interface ViewMode {
  type: 'grid' | 'list' | 'table';
  itemsPerPage: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T = any> {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

// Layout Types
export interface LayoutState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  aiPanelOpen: boolean;
  aiPanelWidth: number;
  previewOpen: boolean;
  previewHeight: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  children?: NavigationItem[];
  badge?: string | number;
  expanded?: boolean;
}

// Analytics Types
export interface DocumentUsageStats {
  fileId: string;
  fileName: string;
  viewCount: number;
  downloadCount: number;
  editCount: number;
  shareCount: number;
  commentCount: number;
  lastAccessed: string;
  totalTimeSpent: number; // in minutes
  uniqueUsers: number;
  popularTimes: {
    hour: number;
    count: number;
  }[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  locationData: {
    country: string;
    city: string;
    count: number;
  }[];
}

export interface AIInteractionStats {
  id: string;
  type: AIAnalysisType;
  timestamp: string;
  userId: string;
  fileId?: string;
  processingTime: number;
  accuracy?: number;
  userRating?: number;
  tokenUsage: number;
  cost?: number;
  success: boolean;
  errorType?: string;
  sessionId?: string;
}

export interface PerformanceMetrics {
  timestamp: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  peakConcurrentUsers: number;
  apiCallCount: number;
  cacheHitRate: number;
  uptime: number; // percentage
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface StorageUsageStats {
  totalStorage: number; // bytes
  usedStorage: number; // bytes
  availableStorage: number; // bytes
  fileCount: number;
  folderCount: number;
  averageFileSize: number;
  largestFiles: {
    fileId: string;
    fileName: string;
    size: number;
    lastModified: string;
  }[];
  storageByType: {
    fileType: string;
    count: number;
    totalSize: number;
  }[];
  growthTrend: {
    date: string;
    totalSize: number;
    fileCount: number;
  }[];
  quotaUsage: number; // percentage
  predictedFullDate?: string;
}

export interface AnalyticsDashboardData {
  documentStats: DocumentUsageStats[];
  aiInteractions: AIInteractionStats[];
  performanceMetrics: PerformanceMetrics[];
  userActivity: UserActivityLog[];
  storageUsage: StorageUsageStats;
  topUsers: {
    userId: string;
    userName: string;
    activityCount: number;
    lastActive: string;
  }[];
  popularDocuments: {
    fileId: string;
    fileName: string;
    score: number;
    trend: 'up' | 'down' | 'stable';
  }[];
}

export interface AnalyticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  users?: string[];
  fileTypes?: string[];
  sites?: string[];
  actions?: string[];
  aiTypes?: AIAnalysisType[];
  includeSystem?: boolean;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  type?: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'document_usage' | 'ai_analytics' | 'performance' | 'user_activity' | 'storage' | 'custom';
  dateGenerated: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: AnalyticsFilter;
  summary: {
    totalDocuments: number;
    totalUsers: number;
    totalInteractions: number;
    avgResponseTime: number;
    storageUsed: number;
    keyInsights: string[];
  };
  charts: {
    id: string;
    title: string;
    type: string;
    data: ChartSeries[];
  }[];
  tables: {
    id: string;
    title: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
}

// Settings Types
export interface SharePointConnectionConfig {
  id: string;
  name: string;
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  certificateThumbprint?: string;
  siteUrl: string;
  authenticationType: 'oauth' | 'certificate' | 'app_only';
  scopes: string[];
  timeout: number;
  retryAttempts: number;
  testConnection?: boolean;
  isDefault: boolean;
  createdAt: string;
  lastTested?: string;
  status: 'active' | 'inactive' | 'error';
  errorMessage?: string;
}

export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'azure' | 'anthropic' | 'local';
  model: string;
  apiKey?: string;
  endpoint?: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    stopSequences?: string[];
  };
  rateLimits: {
    requestsPerMinute: number;
    tokensPerMinute: number;
    dailyLimit?: number;
  };
  costTracking: {
    inputCostPerToken: number;
    outputCostPerToken: number;
    currency: string;
  };
  isDefault: boolean;
  capabilities: string[];
  contextWindow: number;
  supportedFeatures: AIAnalysisType[];
}

export interface UICustomizationSettings {
  theme: 'light' | 'dark' | 'auto' | 'high_contrast';
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra_large';
  density: 'compact' | 'comfortable' | 'spacious';
  layout: {
    sidebarPosition: 'left' | 'right';
    panelLayout: 'horizontal' | 'vertical' | 'tabs';
    showBreadcrumbs: boolean;
    showQuickActions: boolean;
    compactMode: boolean;
  };
  dashboard: {
    defaultView: 'grid' | 'list' | 'table';
    itemsPerPage: number;
    showThumbnails: boolean;
    showMetadata: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  animations: {
    enabled: boolean;
    speed: 'slow' | 'normal' | 'fast';
    transitions: boolean;
  };
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    address: string;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    events: {
      documentShared: boolean;
      documentModified: boolean;
      aiAnalysisComplete: boolean;
      systemAlerts: boolean;
      securityEvents: boolean;
      storageWarnings: boolean;
    };
  };
  browser: {
    enabled: boolean;
    sound: boolean;
    events: {
      chatMessages: boolean;
      documentUpdates: boolean;
      systemNotifications: boolean;
      errorAlerts: boolean;
    };
  };
  mobile: {
    enabled: boolean;
    pushToken?: string;
    quiet_hours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel?: string;
    events: string[];
  };
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rules: {
    chatHistory: {
      retainDays: number;
      autoDelete: boolean;
      archiveBeforeDelete: boolean;
    };
    userActivity: {
      retainDays: number;
      anonymizeAfterDays?: number;
      detailedLogsRetainDays: number;
    };
    fileAnalysis: {
      retainDays: number;
      keepSummariesOnly: boolean;
    };
    performanceMetrics: {
      detailedRetainDays: number;
      aggregatedRetainDays: number;
      compressionSchedule: 'daily' | 'weekly' | 'monthly';
    };
    exports: {
      retainDays: number;
      maxFileSize: number; // MB
      autoCleanup: boolean;
    };
  };
  compliance: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    customRequirements?: string[];
  };
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export interface ExportImportSettings {
  export: {
    defaultFormat: 'json' | 'csv' | 'xlsx' | 'pdf';
    maxFileSize: number; // MB
    compression: boolean;
    encryption: {
      enabled: boolean;
      algorithm?: 'AES-256' | 'AES-128';
    };
    includeMetadata: boolean;
    batchSize: number;
    parallelJobs: number;
  };
  import: {
    allowedFormats: string[];
    maxFileSize: number; // MB
    validation: {
      strictMode: boolean;
      skipInvalidRows: boolean;
      requireHeaders: boolean;
    };
    duplicateHandling: 'skip' | 'overwrite' | 'append' | 'prompt';
    batchSize: number;
  };
  scheduling: {
    enabled: boolean;
    exportSchedules: {
      id: string;
      name: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      time: string;
      enabled: boolean;
      recipients: string[];
      format: string;
      filters?: any;
    }[];
  };
}

export interface AccessibilitySettings {
  screenReader: {
    enabled: boolean;
    announceNavigation: boolean;
    announceUpdates: boolean;
    verbosity: 'minimal' | 'normal' | 'verbose';
  };
  keyboard: {
    enabled: boolean;
    showFocusIndicator: boolean;
    customShortcuts: {
      [key: string]: string;
    };
    skipLinks: boolean;
  };
  visual: {
    highContrast: boolean;
    reducedMotion: boolean;
    largeText: boolean;
    colorBlindFriendly: boolean;
    focusIndicatorSize: 'small' | 'medium' | 'large';
  };
  motor: {
    stickyKeys: boolean;
    clickHoldDelay: number;
    doubleClickSpeed: number;
    hoverDelay: number;
  };
}

export interface AppSettings {
  id: string;
  userId: string;
  sharepoint: SharePointConnectionConfig[];
  aiModels: AIModelConfig[];
  ui: UICustomizationSettings;
  notifications: NotificationSettings;
  dataRetention: DataRetentionPolicy[];
  exportImport: ExportImportSettings;
  accessibility: AccessibilitySettings;
  lastModified: string;
  version: string;
}

export interface SettingsValidationResult {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }[];
  warnings?: {
    field: string;
    message: string;
  }[];
}

export interface SettingsBackup {
  id: string;
  name: string;
  settings: Partial<AppSettings>;
  createdAt: string;
  createdBy: string;
  size: number;
  checksum: string;
}