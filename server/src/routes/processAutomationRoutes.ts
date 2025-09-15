import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { ProcessAutomationService } from '../services/processAutomationService';
import { PnPService } from '../services/pnpService';
import { EnhancedDocumentAnalysisService } from '../services/enhancedDocumentAnalysisService';
import { GeminiService } from '../services/geminiService';
import { GeminiServiceConfig, GeminiErrorCode } from '../types/gemini';
import { geminiConfig } from '../utils/config';

export function createProcessAutomationRoutes(authService: AuthService, authMiddleware: AuthMiddleware): Router {
  const router = Router();

  // Initialize services
  const geminiServiceConfig: GeminiServiceConfig = {
    apiKey: geminiConfig.apiKey,
    model: 'gemini-pro',
    defaultOptions: {
      temperature: 0.7,
      topK: 40,
      topP: 0.8,
      maxTokens: 2048
    },
    rateLimiting: {
      maxRequests: 100,
      windowMs: 60 * 1000 // 1 minute
    },
    retryOptions: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [GeminiErrorCode.RATE_LIMIT_EXCEEDED, GeminiErrorCode.MODEL_OVERLOADED]
    },
    cachingEnabled: true,
    streamingEnabled: true
  };

  const geminiService = new GeminiService(geminiServiceConfig);
  const pnpService = new PnPService(authService);
  const analysisService = new EnhancedDocumentAnalysisService(authService, geminiService);
  const automationService = new ProcessAutomationService(authService, pnpService, analysisService, geminiService);

  /**
   * GET /api/automation/health
   * Health check for process automation service
   */
  router.get('/health', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🏥 Process Automation service health check requested');

      // Initialize service with user's access token
      await automationService.initialize(req.session!.accessToken);

      const healthStatus = {
        service: 'ProcessAutomationService',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        features: {
          workflowEngine: 'operational',
          documentLifecycle: 'operational',
          approvalWorkflows: 'operational',
          processMonitoring: 'operational',
          batchProcessing: 'operational'
        },
        integrations: {
          pnpService: 'connected',
          analysisService: 'connected',
          geminiService: 'connected',
          authService: 'connected'
        },
        capabilities: {
          workflowTypes: ['document_lifecycle', 'compliance', 'approval_process', 'content_management', 'analytics', 'integration', 'custom'],
          triggerTypes: ['document_created', 'document_modified', 'document_accessed', 'metadata_changed', 'schedule', 'manual', 'api_webhook'],
          actionTypes: ['move_document', 'copy_document', 'delete_document', 'update_metadata', 'send_notification', 'create_approval', 'run_analysis', 'archive_document', 'apply_retention', 'send_email', 'webhook_call'],
          lifecycleActions: ['archive', 'delete', 'move', 'notify', 'change_permissions', 'add_tag', 'update_metadata']
        }
      };

      console.log('✅ Process Automation service health check completed successfully');
      res.json({
        success: true,
        message: 'Process Automation service is healthy and operational',
        data: healthStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Process Automation service health check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Process automation service health check failed',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/automation/workflows/create
   * Create a new automation workflow
   */
  router.post('/workflows/create', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowDefinition } = req.body;

      if (!workflowDefinition) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_WORKFLOW_DEFINITION',
            message: 'Workflow definition is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`🔧 Creating new workflow: ${workflowDefinition.name}`);

      // Initialize service
      await automationService.initialize(req.session!.accessToken);

      // Create workflow
      const workflow = await automationService.createWorkflow(workflowDefinition);

      console.log(`✅ Workflow created successfully: ${workflow.id}`);

      res.json({
        success: true,
        message: 'Workflow created successfully',
        data: {
          workflow,
          statistics: {
            id: workflow.id,
            name: workflow.name,
            version: workflow.version,
            enabled: workflow.enabled,
            triggersCount: workflow.triggers.length,
            actionsCount: workflow.actions.length,
            conditionsCount: workflow.conditions.length,
            category: workflow.metadata.category,
            priority: workflow.metadata.priority
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Workflow creation failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WORKFLOW_CREATION_FAILED',
          message: 'Failed to create workflow',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/automation/workflows/execute
   * Execute a specific workflow
   */
  router.post('/workflows/execute', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId, documentId, context } = req.body;

      if (!workflowId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_WORKFLOW_ID',
            message: 'Workflow ID is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`🚀 Executing workflow: ${workflowId}${documentId ? ` for document: ${documentId}` : ''}`);

      // Initialize service
      await automationService.initialize(req.session!.accessToken);

      // Prepare execution context
      const executionContext = {
        documentId,
        metadata: context?.metadata || {},
        variables: context?.variables || {},
        permissions: context?.permissions || [],
        initiatedBy: req.user?.id || 'unknown'
      };

      // Execute workflow
      const execution = await automationService.executeWorkflow(workflowId, executionContext);

      console.log(`✅ Workflow execution completed: ${execution.id} (Status: ${execution.status})`);

      res.json({
        success: true,
        message: 'Workflow executed successfully',
        data: {
          execution,
          summary: {
            executionId: execution.id,
            workflowId: execution.workflowId,
            status: execution.status,
            duration: execution.duration,
            stepsCompleted: execution.steps.filter(step => step.status === 'completed').length,
            stepsTotal: execution.steps.length,
            startTime: execution.startTime,
            endTime: execution.endTime
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Workflow execution failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'WORKFLOW_EXECUTION_FAILED',
          message: 'Failed to execute workflow',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/automation/lifecycle/process
   * Process document lifecycle management
   */
  router.post('/lifecycle/process', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId, documentIds, metadata } = req.body;

      if (!documentId && !documentIds) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID or document IDs are required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`📄 Processing document lifecycle${documentIds ? ` for ${documentIds.length} documents` : ` for document: ${documentId}`}`);

      // Initialize service
      await automationService.initialize(req.session!.accessToken);

      let result;

      if (documentIds && Array.isArray(documentIds)) {
        // Batch processing
        result = await automationService.processBatchDocuments(documentIds);
      } else {
        // Single document processing
        result = await automationService.processDocumentLifecycle(documentId, metadata || {});
      }

      console.log(`✅ Document lifecycle processing completed`);

      res.json({
        success: true,
        message: 'Document lifecycle processing completed successfully',
        data: {
          result,
          summary: Array.isArray(result) ? {
            actionsApplied: result.length,
            documentId: documentId
          } : {
            documentsProcessed: result.successful?.length + result.failed?.length || 0,
            successful: result.successful?.length || 0,
            failed: result.failed?.length || 0
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Document lifecycle processing failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LIFECYCLE_PROCESSING_FAILED',
          message: 'Failed to process document lifecycle',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/automation/approval/create
   * Create an approval workflow
   */
  router.post('/approval/create', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId, workflowConfig } = req.body;

      if (!documentId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`📋 Creating approval workflow for document: ${documentId}`);

      // Initialize service
      await automationService.initialize(req.session!.accessToken);

      // Create approval workflow
      const workflowId = await automationService.createApprovalWorkflow(documentId, workflowConfig || {});

      console.log(`✅ Approval workflow created successfully: ${workflowId}`);

      res.json({
        success: true,
        message: 'Approval workflow created successfully',
        data: {
          workflowId,
          documentId,
          config: workflowConfig,
          summary: {
            approvalSteps: workflowConfig?.steps?.length || 0,
            autoStart: workflowConfig?.autoStart ?? true,
            reminderEnabled: workflowConfig?.reminderSettings?.enabled ?? true,
            escalationEnabled: workflowConfig?.escalationSettings?.enabled ?? false
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Approval workflow creation failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'APPROVAL_WORKFLOW_CREATION_FAILED',
          message: 'Failed to create approval workflow',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/automation/metrics
   * Get workflow metrics and analytics
   */
  router.get('/metrics', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { workflowId } = req.query;

      console.log(`📊 Generating workflow metrics${workflowId ? ` for workflow: ${workflowId}` : ''}`);

      // Initialize service
      await automationService.initialize(req.session!.accessToken);

      // Get metrics
      const metrics = await automationService.getWorkflowMetrics(workflowId as string);

      console.log(`✅ Generated metrics for ${metrics.length} workflows`);

      const totalExecutions = metrics.reduce((sum, metric) => sum + metric.executionCount, 0);
      const averageSuccessRate = metrics.length > 0
        ? metrics.reduce((sum, metric) => sum + metric.successRate, 0) / metrics.length
        : 0;
      const totalTimeSaved = metrics.reduce((sum, metric) => sum + metric.performanceMetrics.timesSaved, 0);
      const totalDocumentsProcessed = metrics.reduce((sum, metric) => sum + metric.performanceMetrics.documentsProcessed, 0);

      res.json({
        success: true,
        message: 'Workflow metrics generated successfully',
        data: {
          metrics,
          summary: {
            totalWorkflows: metrics.length,
            totalExecutions,
            averageSuccessRate: Math.round(averageSuccessRate * 100) / 100,
            totalTimeSaved,
            totalDocumentsProcessed,
            overallComplianceRate: metrics.length > 0
              ? Math.round((metrics.reduce((sum, metric) => sum + metric.performanceMetrics.complianceRate, 0) / metrics.length) * 100) / 100
              : 0
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Failed to generate workflow metrics:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'METRICS_GENERATION_FAILED',
          message: 'Failed to generate workflow metrics',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * POST /api/automation/batch/process
   * Batch process multiple documents
   */
  router.post('/batch/process', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentIds, workflowId, options } = req.body;

      if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DOCUMENT_IDS',
            message: 'Valid document IDs array is required'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log(`🔄 Starting batch processing for ${documentIds.length} documents`);

      // Initialize service
      await automationService.initialize(req.session!.accessToken);

      // Process batch
      const startTime = Date.now();
      const result = await automationService.processBatchDocuments(documentIds, workflowId);
      const processingTime = Date.now() - startTime;

      console.log(`✅ Batch processing completed: ${result.successful.length}/${documentIds.length} successful`);

      res.json({
        success: true,
        message: 'Batch processing completed successfully',
        data: {
          result,
          summary: {
            totalDocuments: documentIds.length,
            successful: result.successful.length,
            failed: result.failed.length,
            successRate: Math.round((result.successful.length / documentIds.length) * 100 * 100) / 100,
            processingTimeMs: processingTime,
            averageTimePerDocument: Math.round(processingTime / documentIds.length),
            workflowUsed: workflowId || 'lifecycle_policies'
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Batch processing failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BATCH_PROCESSING_FAILED',
          message: 'Failed to process document batch',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /api/automation/capabilities
   * Get process automation service capabilities
   */
  router.get('/capabilities', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📋 Process automation capabilities requested');

      const capabilities = {
        service: 'ProcessAutomationService',
        version: '1.0.0',
        features: {
          workflowEngine: {
            description: 'Advanced rule-based automation system',
            capabilities: [
              'Custom workflow creation and execution',
              'Multiple trigger types (schedule, events, manual)',
              'Conditional logic and branching',
              'Action chaining and orchestration',
              'Real-time execution monitoring'
            ]
          },
          documentLifecycle: {
            description: 'Automated document lifecycle management',
            capabilities: [
              'Age-based archiving and retention',
              'Size-based cleanup policies',
              'Content type specific rules',
              'Automated metadata updates',
              'Compliance enforcement'
            ]
          },
          approvalWorkflows: {
            description: 'Multi-stage approval processes',
            capabilities: [
              'Sequential and parallel approvals',
              'Role-based approval routing',
              'Automated reminders and escalation',
              'Custom approval templates',
              'Integration with notifications'
            ]
          },
          processMonitoring: {
            description: 'Real-time workflow monitoring and analytics',
            capabilities: [
              'Execution status tracking',
              'Performance metrics and KPIs',
              'Error analysis and reporting',
              'Trend analysis and forecasting',
              'Custom dashboard creation'
            ]
          },
          batchProcessing: {
            description: 'Enterprise-scale batch operations',
            capabilities: [
              'Concurrent document processing',
              'Progress tracking and reporting',
              'Error handling and retry logic',
              'Rate limiting and throttling',
              'Scalable architecture'
            ]
          }
        },
        integrations: {
          microsoftGraph: 'Full SharePoint and OneDrive integration',
          aiServices: 'Gemini AI integration for intelligent processing',
          documentAnalysis: 'Integration with enhanced analysis service',
          duplicateDetection: 'Integration with duplicate detection service',
          pnpJs: 'PnP.js SharePoint framework integration'
        },
        supportedOperations: {
          workflows: [
            'create', 'execute', 'monitor', 'update', 'delete', 'enable/disable'
          ],
          lifecycle: [
            'archive', 'delete', 'move', 'copy', 'tag', 'update_metadata'
          ],
          approvals: [
            'create_workflow', 'assign_approvers', 'track_status', 'send_reminders', 'escalate'
          ],
          batch: [
            'bulk_process', 'bulk_update', 'bulk_lifecycle', 'progress_tracking'
          ]
        },
        limits: {
          maxWorkflowsPerUser: 100,
          maxActionsPerWorkflow: 50,
          maxBatchSize: 1000,
          maxConcurrentExecutions: 50,
          executionTimeout: 3600 // seconds
        }
      };

      console.log('✅ Process automation capabilities compiled successfully');

      res.json({
        success: true,
        message: 'Process automation capabilities retrieved successfully',
        data: capabilities,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ Failed to get process automation capabilities:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CAPABILITIES_RETRIEVAL_FAILED',
          message: 'Failed to retrieve process automation capabilities',
          details: error.message || error
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  return router;
}