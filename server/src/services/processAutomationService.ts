import { AuthService } from './authService';
import { PnPService } from './pnpService';
import { EnhancedDocumentAnalysisService } from './enhancedDocumentAnalysisService';
import { GeminiService } from './geminiService';

// Core workflow interfaces
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  schedule?: WorkflowSchedule;
  metadata: {
    created: string;
    modified: string;
    author: string;
    category: WorkflowCategory;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface WorkflowTrigger {
  id: string;
  type: 'document_created' | 'document_modified' | 'document_accessed' | 'metadata_changed' | 'schedule' | 'manual' | 'api_webhook';
  config: {
    [key: string]: any;
  };
  filters?: TriggerFilter[];
}

interface WorkflowAction {
  id: string;
  name: string;
  type: 'move_document' | 'copy_document' | 'delete_document' | 'update_metadata' | 'send_notification' | 'create_approval' | 'run_analysis' | 'archive_document' | 'apply_retention' | 'send_email' | 'webhook_call';
  config: {
    [key: string]: any;
  };
  order: number;
  conditions?: ActionCondition[];
}

interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex_match' | 'file_size' | 'file_age' | 'metadata_exists';
  value: any;
  logicalOperator?: 'and' | 'or';
}

interface WorkflowSchedule {
  type: 'daily' | 'weekly' | 'monthly' | 'interval';
  config: {
    time?: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    intervalMinutes?: number;
  };
  timezone: string;
}

type WorkflowCategory = 'document_lifecycle' | 'compliance' | 'approval_process' | 'content_management' | 'analytics' | 'integration' | 'custom';

interface TriggerFilter {
  field: string;
  operator: string;
  value: any;
}

interface ActionCondition {
  field: string;
  operator: string;
  value: any;
}

// Workflow execution interfaces
interface WorkflowExecution {
  id: string;
  workflowId: string;
  documentId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  steps: ExecutionStep[];
  context: ExecutionContext;
  error?: WorkflowError;
}

interface ExecutionStep {
  stepId: string;
  actionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
  retryCount: number;
}

interface ExecutionContext {
  documentId?: string;
  metadata?: { [key: string]: any };
  variables?: { [key: string]: any };
  permissions?: string[];
  initiatedBy: string;
}

interface WorkflowError {
  code: string;
  message: string;
  details?: any;
  step?: string;
  timestamp: string;
}

// Document lifecycle management
interface DocumentLifecyclePolicyRule {
  id: string;
  name: string;
  condition: LifecycleCondition;
  action: LifecycleAction;
  enabled: boolean;
  priority: number;
}

interface LifecycleCondition {
  field: 'document_age' | 'last_accessed' | 'file_size' | 'document_type' | 'metadata_field' | 'tag_presence';
  operator: 'greater_than' | 'less_than' | 'equals' | 'contains';
  value: any;
  unit?: 'days' | 'months' | 'years' | 'bytes' | 'kb' | 'mb' | 'gb';
}

interface LifecycleAction {
  type: 'archive' | 'delete' | 'move' | 'notify' | 'change_permissions' | 'add_tag' | 'update_metadata';
  config: {
    [key: string]: any;
  };
}

// Approval workflow interfaces
interface ApprovalWorkflow {
  id: string;
  name: string;
  steps: ApprovalStep[];
  autoStart: boolean;
  reminderSettings: ReminderSettings;
  escalationSettings: EscalationSettings;
}

interface ApprovalStep {
  id: string;
  name: string;
  approvers: Approver[];
  approvalType: 'any' | 'all' | 'majority';
  timeLimit?: number; // hours
  order: number;
}

interface Approver {
  type: 'user' | 'group' | 'role';
  id: string;
  email: string;
  name: string;
}

interface ReminderSettings {
  enabled: boolean;
  intervals: number[]; // hours
  template: string;
}

interface EscalationSettings {
  enabled: boolean;
  timeLimit: number; // hours
  escalateTo: Approver[];
  template: string;
}

// Business process monitoring
interface ProcessMetrics {
  workflowId: string;
  executionCount: number;
  successRate: number;
  averageDuration: number;
  failureReasons: { [reason: string]: number };
  performanceMetrics: {
    documentsProcessed: number;
    timesSaved: number; // minutes
    errorsReduced: number;
    complianceRate: number;
  };
  trends: {
    daily: MetricPoint[];
    weekly: MetricPoint[];
    monthly: MetricPoint[];
  };
}

interface MetricPoint {
  timestamp: string;
  value: number;
  metadata?: { [key: string]: any };
}

export class ProcessAutomationService {
  private authService: AuthService;
  private pnpService: PnPService;
  private analysisService: EnhancedDocumentAnalysisService;
  private geminiService: GeminiService;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private lifecyclePolicies: DocumentLifecyclePolicyRule[] = [];
  private approvalWorkflows: Map<string, ApprovalWorkflow> = new Map();

  constructor(authService: AuthService, pnpService: PnPService, analysisService: EnhancedDocumentAnalysisService, geminiService: GeminiService) {
    this.authService = authService;
    this.pnpService = pnpService;
    this.analysisService = analysisService;
    this.geminiService = geminiService;
  }

  async initialize(accessToken: string): Promise<void> {
    console.log('🔧 Initializing Process Automation service...');
    await this.pnpService.initialize(accessToken);
    await this.analysisService.initialize(accessToken);
    await this.loadDefaultWorkflows();
    await this.loadDefaultLifecyclePolicies();
    console.log('✅ Process Automation service initialized successfully');
  }

  // Workflow management
  async createWorkflow(definition: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> {
    console.log(`📋 Creating new workflow: ${definition.name}`);

    const workflow: WorkflowDefinition = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: definition.name || 'Untitled Workflow',
      description: definition.description || '',
      version: '1.0.0',
      enabled: definition.enabled ?? true,
      triggers: definition.triggers || [],
      actions: definition.actions || [],
      conditions: definition.conditions || [],
      schedule: definition.schedule,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 'system',
        category: definition.metadata?.category || 'custom',
        priority: definition.metadata?.priority || 'medium'
      }
    };

    this.workflows.set(workflow.id, workflow);
    console.log(`✅ Workflow created: ${workflow.id}`);
    return workflow;
  }

  async executeWorkflow(workflowId: string, context: Partial<ExecutionContext> = {}): Promise<WorkflowExecution> {
    console.log(`🚀 Starting workflow execution: ${workflowId}`);

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      documentId: context.documentId,
      status: 'running',
      startTime: new Date().toISOString(),
      steps: [],
      context: {
        documentId: context.documentId,
        metadata: context.metadata || {},
        variables: context.variables || {},
        permissions: context.permissions || [],
        initiatedBy: context.initiatedBy || 'system'
      }
    };

    this.executions.set(execution.id, execution);

    try {
      // Evaluate conditions
      const conditionsResult = await this.evaluateConditions(workflow.conditions, execution.context);
      if (!conditionsResult) {
        execution.status = 'completed';
        execution.endTime = new Date().toISOString();
        console.log(`⏭️ Workflow conditions not met, skipping: ${workflowId}`);
        return execution;
      }

      // Execute actions in order
      const sortedActions = workflow.actions.sort((a, b) => a.order - b.order);
      for (const action of sortedActions) {
        const stepResult = await this.executeAction(action, execution);
        execution.steps.push(stepResult);

        if (stepResult.status === 'failed') {
          execution.status = 'failed';
          execution.error = {
            code: 'ACTION_EXECUTION_FAILED',
            message: `Action ${action.name} failed`,
            details: stepResult.error,
            step: action.id,
            timestamp: new Date().toISOString()
          };
          break;
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed';
      }

    } catch (error: any) {
      console.error(`❌ Workflow execution failed:`, error);
      execution.status = 'failed';
      execution.error = {
        code: 'WORKFLOW_EXECUTION_ERROR',
        message: error.message || 'Unknown error',
        details: error,
        timestamp: new Date().toISOString()
      };
    } finally {
      execution.endTime = new Date().toISOString();
      execution.duration = new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime();
    }

    console.log(`✅ Workflow execution completed: ${execution.id} (Status: ${execution.status})`);
    return execution;
  }

  // Document lifecycle management
  async processDocumentLifecycle(documentId: string, documentMetadata: any): Promise<LifecycleAction[]> {
    console.log(`📄 Processing document lifecycle: ${documentId}`);

    const applicableActions: LifecycleAction[] = [];
    const sortedPolicies = this.lifecyclePolicies
      .filter(policy => policy.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const policy of sortedPolicies) {
      const conditionMet = await this.evaluateLifecycleCondition(policy.condition, documentId, documentMetadata);
      if (conditionMet) {
        console.log(`📋 Applying lifecycle policy: ${policy.name}`);
        await this.executeLifecycleAction(policy.action, documentId, documentMetadata);
        applicableActions.push(policy.action);
      }
    }

    console.log(`✅ Document lifecycle processed: ${documentId}, ${applicableActions.length} actions applied`);
    return applicableActions;
  }

  // Approval workflows
  async createApprovalWorkflow(documentId: string, workflowConfig: Partial<ApprovalWorkflow>): Promise<string> {
    console.log(`📋 Creating approval workflow for document: ${documentId}`);

    const approvalWorkflow: ApprovalWorkflow = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: workflowConfig.name || `Document Approval - ${documentId}`,
      steps: workflowConfig.steps || [],
      autoStart: workflowConfig.autoStart ?? true,
      reminderSettings: workflowConfig.reminderSettings || {
        enabled: true,
        intervals: [24, 72, 168], // 1 day, 3 days, 1 week
        template: 'default'
      },
      escalationSettings: workflowConfig.escalationSettings || {
        enabled: false,
        timeLimit: 168, // 1 week
        escalateTo: [],
        template: 'default'
      }
    };

    this.approvalWorkflows.set(approvalWorkflow.id, approvalWorkflow);

    if (approvalWorkflow.autoStart) {
      await this.startApprovalProcess(approvalWorkflow.id, documentId);
    }

    console.log(`✅ Approval workflow created: ${approvalWorkflow.id}`);
    return approvalWorkflow.id;
  }

  // Process monitoring and analytics
  async getWorkflowMetrics(workflowId?: string): Promise<ProcessMetrics[]> {
    console.log(`📊 Generating workflow metrics${workflowId ? ` for ${workflowId}` : ''}`);

    const metrics: ProcessMetrics[] = [];
    const workflowsToAnalyze = workflowId ? [workflowId] : Array.from(this.workflows.keys());

    for (const wfId of workflowsToAnalyze) {
      const workflow = this.workflows.get(wfId);
      if (!workflow) continue;

      const executions = Array.from(this.executions.values()).filter(exec => exec.workflowId === wfId);
      const successfulExecutions = executions.filter(exec => exec.status === 'completed');
      const failedExecutions = executions.filter(exec => exec.status === 'failed');

      const metric: ProcessMetrics = {
        workflowId: wfId,
        executionCount: executions.length,
        successRate: executions.length > 0 ? (successfulExecutions.length / executions.length) * 100 : 0,
        averageDuration: successfulExecutions.length > 0
          ? successfulExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / successfulExecutions.length
          : 0,
        failureReasons: this.aggregateFailureReasons(failedExecutions),
        performanceMetrics: {
          documentsProcessed: executions.filter(exec => exec.documentId).length,
          timesSaved: this.calculateTimeSaved(executions),
          errorsReduced: this.calculateErrorsReduced(executions),
          complianceRate: this.calculateComplianceRate(executions)
        },
        trends: {
          daily: this.generateTrends(executions, 'daily'),
          weekly: this.generateTrends(executions, 'weekly'),
          monthly: this.generateTrends(executions, 'monthly')
        }
      };

      metrics.push(metric);
    }

    console.log(`✅ Generated metrics for ${metrics.length} workflows`);
    return metrics;
  }

  // Batch processing
  async processBatchDocuments(documentIds: string[], workflowId?: string): Promise<{ successful: string[], failed: string[], results: any[] }> {
    console.log(`🔄 Processing batch of ${documentIds.length} documents`);

    const results: any[] = [];
    const successful: string[] = [];
    const failed: string[] = [];

    const batchSize = 10; // Process in batches to avoid overload
    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (documentId) => {
        try {
          let result;

          if (workflowId) {
            // Execute specific workflow
            result = await this.executeWorkflow(workflowId, { documentId });
          } else {
            // Process lifecycle policies
            const documentInfo = await this.pnpService.getFileDetails(documentId, documentId);
            result = await this.processDocumentLifecycle(documentId, documentInfo);
          }

          successful.push(documentId);
          return { documentId, success: true, result };
        } catch (error: any) {
          console.error(`❌ Failed to process document ${documentId}:`, error);
          failed.push(documentId);
          return { documentId, success: false, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to prevent rate limiting
      if (i + batchSize < documentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`✅ Batch processing completed: ${successful.length} successful, ${failed.length} failed`);
    return { successful, failed, results };
  }

  // Private helper methods
  private async loadDefaultWorkflows(): Promise<void> {
    // Load default document lifecycle workflow
    await this.createWorkflow({
      name: 'Document Lifecycle Management',
      description: 'Automated document archiving and retention based on age and usage',
      triggers: [
        {
          id: 'schedule_trigger',
          type: 'schedule',
          config: { interval: 'daily', time: '02:00' }
        }
      ],
      actions: [
        {
          id: 'analyze_documents',
          name: 'Analyze Document Age',
          type: 'run_analysis',
          config: { analysisType: 'lifecycle' },
          order: 1
        },
        {
          id: 'archive_old_documents',
          name: 'Archive Old Documents',
          type: 'archive_document',
          config: { ageThreshold: 365 }, // 1 year
          order: 2
        }
      ],
      conditions: [],
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 'system',
        category: 'document_lifecycle',
        priority: 'high'
      }
    });

    // Load default approval workflow
    await this.createWorkflow({
      name: 'Document Approval Process',
      description: 'Multi-stage document approval with notifications',
      triggers: [
        {
          id: 'document_created_trigger',
          type: 'document_created',
          config: { contentType: 'policy' }
        }
      ],
      actions: [
        {
          id: 'create_approval',
          name: 'Create Approval Request',
          type: 'create_approval',
          config: { approvalType: 'standard' },
          order: 1
        },
        {
          id: 'send_notification',
          name: 'Notify Approvers',
          type: 'send_notification',
          config: { template: 'approval_request' },
          order: 2
        }
      ],
      conditions: [
        {
          id: 'content_type_check',
          field: 'contentType',
          operator: 'equals',
          value: 'policy'
        }
      ],
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        author: 'system',
        category: 'approval_process',
        priority: 'high'
      }
    });
  }

  private async loadDefaultLifecyclePolicies(): Promise<void> {
    this.lifecyclePolicies = [
      {
        id: 'archive_old_documents',
        name: 'Archive documents older than 1 year',
        condition: {
          field: 'document_age',
          operator: 'greater_than',
          value: 365,
          unit: 'days'
        },
        action: {
          type: 'archive',
          config: { location: 'archive_library', keepMetadata: true }
        },
        enabled: true,
        priority: 100
      },
      {
        id: 'delete_temp_files',
        name: 'Delete temporary files older than 30 days',
        condition: {
          field: 'document_age',
          operator: 'greater_than',
          value: 30,
          unit: 'days'
        },
        action: {
          type: 'delete',
          config: { moveToRecycleBin: true }
        },
        enabled: true,
        priority: 90
      }
    ];
  }

  private async evaluateConditions(conditions: WorkflowCondition[], context: ExecutionContext): Promise<boolean> {
    if (conditions.length === 0) return true;

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, context);
      // For now, all conditions must be true (AND logic)
      if (!result) return false;
    }

    return true;
  }

  private async evaluateCondition(condition: WorkflowCondition, context: ExecutionContext): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'not_contains':
        return typeof fieldValue === 'string' && !fieldValue.includes(condition.value);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'regex_match':
        return new RegExp(condition.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(field: string, context: ExecutionContext): any {
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private async executeAction(action: WorkflowAction, execution: WorkflowExecution): Promise<ExecutionStep> {
    const step: ExecutionStep = {
      stepId: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      actionId: action.id,
      status: 'running',
      startTime: new Date().toISOString(),
      retryCount: 0
    };

    try {
      console.log(`🔧 Executing action: ${action.name} (${action.type})`);

      let result: any = null;

      switch (action.type) {
        case 'move_document':
          result = await this.moveDocument(execution.documentId!, action.config);
          break;
        case 'copy_document':
          result = await this.copyDocument(execution.documentId!, action.config);
          break;
        case 'update_metadata':
          result = await this.updateDocumentMetadata(execution.documentId!, action.config);
          break;
        case 'send_notification':
          result = await this.sendNotification(action.config);
          break;
        case 'run_analysis':
          result = await this.runDocumentAnalysis(execution.documentId!, action.config);
          break;
        case 'archive_document':
          result = await this.archiveDocument(execution.documentId!, action.config);
          break;
        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      step.status = 'completed';
      step.result = result;
      console.log(`✅ Action completed: ${action.name}`);

    } catch (error: any) {
      console.error(`❌ Action failed: ${action.name}`, error);
      step.status = 'failed';
      step.error = error.message || 'Unknown error';
    } finally {
      step.endTime = new Date().toISOString();
    }

    return step;
  }

  private async evaluateLifecycleCondition(condition: LifecycleCondition, documentId: string, metadata: any): Promise<boolean> {
    const currentDate = new Date();

    switch (condition.field) {
      case 'document_age':
        const created = new Date(metadata.created || metadata.Created);
        const ageInDays = Math.floor((currentDate.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

        switch (condition.unit) {
          case 'days':
            return this.compareValues(ageInDays, condition.operator, condition.value);
          case 'months':
            return this.compareValues(ageInDays / 30, condition.operator, condition.value);
          case 'years':
            return this.compareValues(ageInDays / 365, condition.operator, condition.value);
        }
        break;

      case 'file_size':
        const sizeInBytes = metadata.size || metadata.Length || 0;
        let sizeToCompare = sizeInBytes;

        switch (condition.unit) {
          case 'kb':
            sizeToCompare = sizeInBytes / 1024;
            break;
          case 'mb':
            sizeToCompare = sizeInBytes / (1024 * 1024);
            break;
          case 'gb':
            sizeToCompare = sizeInBytes / (1024 * 1024 * 1024);
            break;
        }

        return this.compareValues(sizeToCompare, condition.operator, condition.value);

      default:
        return false;
    }

    return false;
  }

  private compareValues(actual: number, operator: string, expected: number): boolean {
    switch (operator) {
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'equals':
        return actual === expected;
      default:
        return false;
    }
  }

  private async executeLifecycleAction(action: LifecycleAction, documentId: string, metadata: any): Promise<void> {
    switch (action.type) {
      case 'archive':
        await this.archiveDocument(documentId, action.config);
        break;
      case 'delete':
        await this.deleteDocument(documentId, action.config);
        break;
      case 'move':
        await this.moveDocument(documentId, action.config);
        break;
      case 'add_tag':
        await this.addDocumentTag(documentId, action.config);
        break;
    }
  }

  // Document operation methods
  private async moveDocument(documentId: string, config: any): Promise<any> {
    console.log(`📁 Moving document ${documentId} to ${config.destination}`);
    // Implementation would integrate with PnP.js to move document
    return { moved: true, destination: config.destination };
  }

  private async copyDocument(documentId: string, config: any): Promise<any> {
    console.log(`📄 Copying document ${documentId} to ${config.destination}`);
    // Implementation would integrate with PnP.js to copy document
    return { copied: true, destination: config.destination };
  }

  private async updateDocumentMetadata(documentId: string, config: any): Promise<any> {
    console.log(`🏷️ Updating metadata for document ${documentId}`);
    // Implementation would integrate with PnP.js to update metadata
    return { updated: true, metadata: config.metadata };
  }

  private async sendNotification(config: any): Promise<any> {
    console.log(`📧 Sending notification: ${config.template || 'default'}`);
    // Implementation would send email/teams notification
    return { sent: true, recipients: config.recipients || [] };
  }

  private async runDocumentAnalysis(documentId: string, config: any): Promise<any> {
    console.log(`🔍 Running analysis for document ${documentId}`);
    // Integration with EnhancedDocumentAnalysisService
    return { analyzed: true, analysisType: config.analysisType };
  }

  private async archiveDocument(documentId: string, config: any): Promise<any> {
    console.log(`📦 Archiving document ${documentId}`);
    // Implementation would move document to archive location
    return { archived: true, location: config.location };
  }

  private async deleteDocument(documentId: string, config: any): Promise<any> {
    console.log(`🗑️ Deleting document ${documentId}`);
    // Implementation would delete document (with recycle bin option)
    return { deleted: true, recycleBin: config.moveToRecycleBin };
  }

  private async addDocumentTag(documentId: string, config: any): Promise<any> {
    console.log(`🏷️ Adding tag to document ${documentId}: ${config.tag}`);
    // Implementation would add tag to document
    return { tagged: true, tag: config.tag };
  }

  private async startApprovalProcess(workflowId: string, documentId: string): Promise<void> {
    console.log(`🚀 Starting approval process for document: ${documentId}`);
    // Implementation would create approval tasks and send notifications
  }

  // Analytics helper methods
  private aggregateFailureReasons(failedExecutions: WorkflowExecution[]): { [reason: string]: number } {
    const reasons: { [reason: string]: number } = {};

    for (const execution of failedExecutions) {
      const reason = execution.error?.code || 'UNKNOWN_ERROR';
      reasons[reason] = (reasons[reason] || 0) + 1;
    }

    return reasons;
  }

  private calculateTimeSaved(executions: WorkflowExecution[]): number {
    // Estimate time saved based on automated actions
    return executions.length * 15; // Assume 15 minutes saved per execution
  }

  private calculateErrorsReduced(executions: WorkflowExecution[]): number {
    // Estimate errors reduced through automation
    return Math.floor(executions.length * 0.8); // 80% error reduction estimate
  }

  private calculateComplianceRate(executions: WorkflowExecution[]): number {
    const successfulExecutions = executions.filter(exec => exec.status === 'completed');
    return executions.length > 0 ? (successfulExecutions.length / executions.length) * 100 : 100;
  }

  private generateTrends(executions: WorkflowExecution[], period: 'daily' | 'weekly' | 'monthly'): MetricPoint[] {
    // Group executions by time period and generate trend data
    const trends: MetricPoint[] = [];
    const now = new Date();

    // Generate sample trend data for demonstration
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      trends.push({
        timestamp: date.toISOString(),
        value: Math.floor(Math.random() * 10) + 1,
        metadata: { period }
      });
    }

    return trends.reverse();
  }
}