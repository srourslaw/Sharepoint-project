import { AuthService } from './authService';
import { PnPService } from './pnpService';
import { GeminiService } from './geminiService';

// Core PII detection interfaces
interface PIIDetectionResult {
  documentId: string;
  scanId: string;
  detectionStatus: 'completed' | 'in_progress' | 'failed';
  scanTimestamp: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: ComplianceStatus;
  findings: PIIFinding[];
  statistics: DetectionStatistics;
  recommendations: SecurityRecommendation[];
  metadata: {
    scanDuration: number;
    confidenceScore: number;
    lastUpdated: string;
    version: string;
  };
}

interface PIIFinding {
  id: string;
  type: PIIType;
  category: PIICategory;
  location: ContentLocation;
  value: string; // Partially masked for security
  confidence: number; // 0-100
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  regulatory: RegulatoryFramework[];
  remediation: RemediationAction[];
}

interface ContentLocation {
  page?: number;
  line?: number;
  column?: number;
  offset?: number;
  length?: number;
  section?: string;
  fieldName?: string;
}

interface ComplianceStatus {
  gdpr: {
    compliant: boolean;
    violations: ComplianceViolation[];
    riskScore: number;
  };
  ccpa: {
    compliant: boolean;
    violations: ComplianceViolation[];
    riskScore: number;
  };
  hipaa: {
    compliant: boolean;
    violations: ComplianceViolation[];
    riskScore: number;
  };
  sox: {
    compliant: boolean;
    violations: ComplianceViolation[];
    riskScore: number;
  };
  pci: {
    compliant: boolean;
    violations: ComplianceViolation[];
    riskScore: number;
  };
  custom: CustomComplianceRule[];
}

interface ComplianceViolation {
  ruleId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  finding: string;
  recommendations: string[];
  regulatoryReference: string;
}

interface DetectionStatistics {
  totalFindings: number;
  findingsByType: { [key in PIIType]?: number };
  findingsByCategory: { [key in PIICategory]?: number };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  complianceScore: number; // 0-100
  dataProcessingRisk: number; // 0-100
}

interface SecurityRecommendation {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionType: 'encrypt' | 'redact' | 'restrict_access' | 'delete' | 'archive' | 'audit' | 'monitor';
  estimatedEffort: 'minutes' | 'hours' | 'days' | 'weeks';
  complianceImpact: number; // 0-100
  businessImpact: 'minimal' | 'low' | 'medium' | 'high';
}

type PIIType = 'ssn' | 'credit_card' | 'email' | 'phone' | 'drivers_license' | 'passport' | 'bank_account' | 'tax_id' | 'national_id' | 'health_record' | 'biometric' | 'ip_address' | 'coordinates' | 'financial_account' | 'insurance_id' | 'employee_id' | 'student_id' | 'custom_identifier';

type PIICategory = 'identity' | 'financial' | 'health' | 'contact' | 'government' | 'biometric' | 'location' | 'behavioral' | 'technical' | 'professional';

type RegulatoryFramework = 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'pci_dss' | 'ferpa' | 'glba' | 'pipeda' | 'lgpd' | 'custom';

interface RemediationAction {
  type: 'encrypt' | 'mask' | 'redact' | 'remove' | 'restrict' | 'audit';
  description: string;
  automated: boolean;
  priority: number;
}

interface CustomComplianceRule {
  ruleId: string;
  name: string;
  description: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

// Batch scanning interfaces
interface BatchScanRequest {
  documentIds: string[];
  scanOptions: ScanOptions;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notificationConfig?: NotificationConfig;
}

interface ScanOptions {
  deepScan: boolean;
  includeMetadata: boolean;
  enableOCR: boolean;
  customRules: CustomComplianceRule[];
  regulatoryFrameworks: RegulatoryFramework[];
  confidenceThreshold: number; // 0-100
  maxFileSize: number; // MB
}

interface NotificationConfig {
  onCompletion: boolean;
  onHighRiskFound: boolean;
  recipients: string[];
  template: string;
}

interface BatchScanResult {
  batchId: string;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
  };
  results: PIIDetectionResult[];
  summary: {
    totalFindings: number;
    highRiskDocuments: number;
    complianceViolations: number;
    averageRiskScore: number;
    processingTime: number;
  };
}

// Data classification interfaces
interface DataClassification {
  documentId: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted' | 'secret';
  sensitivityLevel: number; // 0-100
  dataTypes: DataType[];
  retentionPeriod: number; // months
  accessRestrictions: AccessRestriction[];
  encryptionRequired: boolean;
  auditRequired: boolean;
  geographicRestrictions: string[];
}

interface DataType {
  type: string;
  category: PIICategory;
  sensitivity: number;
  count: number;
  locations: ContentLocation[];
}

interface AccessRestriction {
  type: 'role' | 'user' | 'group' | 'location' | 'time';
  value: string;
  condition: string;
}

// Monitoring and audit interfaces
interface AuditEvent {
  eventId: string;
  documentId: string;
  eventType: 'scan_completed' | 'pii_detected' | 'compliance_violation' | 'access_granted' | 'access_denied' | 'data_modified' | 'data_deleted';
  timestamp: string;
  userId: string;
  details: { [key: string]: any };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  outcome: 'success' | 'failure' | 'blocked';
}

interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  reportType: 'summary' | 'detailed' | 'violations' | 'trends';
  timeframe: {
    start: string;
    end: string;
  };
  scope: {
    documentCount: number;
    frameworksCovered: RegulatoryFramework[];
    departmentsIncluded: string[];
  };
  findings: {
    totalDocuments: number;
    documentsWithPII: number;
    complianceViolations: ComplianceViolation[];
    riskDistribution: DetectionStatistics['riskDistribution'];
    trends: {
      period: string;
      value: number;
      change: number;
    }[];
  };
  recommendations: SecurityRecommendation[];
}

export class PIIDetectionService {
  private authService: AuthService;
  private pnpService: PnPService;
  private geminiService: GeminiService;
  private detectionResults: Map<string, PIIDetectionResult> = new Map();
  private batchScans: Map<string, BatchScanResult> = new Map();
  private auditEvents: AuditEvent[] = [];
  private customRules: CustomComplianceRule[] = [];

  // PII detection patterns
  private piiPatterns = {
    ssn: /\b(?:\d{3}-\d{2}-\d{4}|\d{3}\d{2}\d{4}|\d{3} \d{2} \d{4})\b/g,
    credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    drivers_license: /\b[A-Z]{1,2}[0-9]{6,8}\b/g,
    bank_account: /\b[0-9]{8,17}\b/g,
    ip_address: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
    tax_id: /\b\d{2}-\d{7}\b/g,
    passport: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
    coordinates: /\b-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+\b/g
  };

  constructor(authService: AuthService, pnpService: PnPService, geminiService: GeminiService) {
    this.authService = authService;
    this.pnpService = pnpService;
    this.geminiService = geminiService;
  }

  async initialize(accessToken: string): Promise<void> {
    console.log('🔐 Initializing PII Detection service...');
    await this.pnpService.initialize(accessToken);
    await this.loadCustomRules();
    console.log('✅ PII Detection service initialized successfully');
  }

  // Main PII detection method
  async scanDocument(documentId: string, options: Partial<ScanOptions> = {}): Promise<PIIDetectionResult> {
    console.log(`🔍 Starting PII scan for document: ${documentId}`);

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    const defaultOptions: ScanOptions = {
      deepScan: true,
      includeMetadata: true,
      enableOCR: false,
      customRules: this.customRules,
      regulatoryFrameworks: ['gdpr', 'ccpa', 'hipaa'],
      confidenceThreshold: 80,
      maxFileSize: 100 // 100MB
    };

    const scanOptions = { ...defaultOptions, ...options };

    try {
      // Get document content
      const documentContent = await this.extractDocumentContent(documentId, scanOptions);

      // Perform PII detection
      const findings = await this.detectPII(documentContent, scanOptions);

      // Assess compliance status
      const complianceStatus = await this.assessCompliance(findings, scanOptions.regulatoryFrameworks);

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(findings, complianceStatus);

      // Generate statistics
      const statistics = this.generateStatistics(findings);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(findings, complianceStatus, riskLevel);

      // Create result
      const result: PIIDetectionResult = {
        documentId,
        scanId,
        detectionStatus: 'completed',
        scanTimestamp: new Date().toISOString(),
        riskLevel,
        complianceStatus,
        findings,
        statistics,
        recommendations,
        metadata: {
          scanDuration: Date.now() - startTime,
          confidenceScore: this.calculateOverallConfidence(findings),
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      // Store result
      this.detectionResults.set(documentId, result);

      // Log audit event
      await this.logAuditEvent({
        eventId: `audit_${Date.now()}`,
        documentId,
        eventType: 'scan_completed',
        timestamp: new Date().toISOString(),
        userId: 'system',
        details: {
          scanId,
          findingsCount: findings.length,
          riskLevel,
          complianceViolations: Object.values(complianceStatus).reduce((sum, framework) =>
            sum + (framework.violations?.length || 0), 0)
        },
        riskLevel,
        outcome: 'success'
      });

      console.log(`✅ PII scan completed for ${documentId}: ${findings.length} findings, risk level: ${riskLevel}`);
      return result;

    } catch (error: any) {
      console.error(`❌ PII scan failed for ${documentId}:`, error);

      const failedResult: PIIDetectionResult = {
        documentId,
        scanId,
        detectionStatus: 'failed',
        scanTimestamp: new Date().toISOString(),
        riskLevel: 'low',
        complianceStatus: this.createEmptyComplianceStatus(),
        findings: [],
        statistics: this.createEmptyStatistics(),
        recommendations: [],
        metadata: {
          scanDuration: Date.now() - startTime,
          confidenceScore: 0,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      this.detectionResults.set(documentId, failedResult);
      throw error;
    }
  }

  // Batch scanning functionality
  async scanDocumentBatch(request: BatchScanRequest): Promise<string> {
    console.log(`🔄 Starting batch PII scan for ${request.documentIds.length} documents`);

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const batchResult: BatchScanResult = {
      batchId,
      status: 'in_progress',
      progress: {
        total: request.documentIds.length,
        processed: 0,
        failed: 0,
        percentage: 0
      },
      results: [],
      summary: {
        totalFindings: 0,
        highRiskDocuments: 0,
        complianceViolations: 0,
        averageRiskScore: 0,
        processingTime: 0
      }
    };

    this.batchScans.set(batchId, batchResult);

    // Process documents in batches to avoid overwhelming the system
    const processBatch = async () => {
      const batchSize = 5;
      const startTime = Date.now();

      try {
        for (let i = 0; i < request.documentIds.length; i += batchSize) {
          const batch = request.documentIds.slice(i, i + batchSize);

          const batchPromises = batch.map(async (documentId) => {
            try {
              const result = await this.scanDocument(documentId, request.scanOptions);
              batchResult.results.push(result);
              batchResult.progress.processed++;

              if (result.riskLevel === 'high' || result.riskLevel === 'critical') {
                batchResult.summary.highRiskDocuments++;
              }

              return result;
            } catch (error) {
              console.error(`Failed to scan document ${documentId}:`, error);
              batchResult.progress.failed++;
              return null;
            }
          });

          await Promise.all(batchPromises);

          // Update progress
          batchResult.progress.percentage = Math.round(
            (batchResult.progress.processed + batchResult.progress.failed) / request.documentIds.length * 100
          );

          // Add delay between batches to prevent rate limiting
          if (i + batchSize < request.documentIds.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Calculate final summary
        batchResult.summary.totalFindings = batchResult.results.reduce((sum, result) => sum + result.findings.length, 0);
        batchResult.summary.complianceViolations = batchResult.results.reduce((sum, result) => {
          return sum + Object.values(result.complianceStatus).reduce((frameSum, framework) =>
            frameSum + (framework.violations?.length || 0), 0);
        }, 0);
        batchResult.summary.averageRiskScore = this.calculateAverageRiskScore(batchResult.results);
        batchResult.summary.processingTime = Date.now() - startTime;
        batchResult.status = 'completed';

        console.log(`✅ Batch scan completed: ${batchId}, ${batchResult.progress.processed} successful, ${batchResult.progress.failed} failed`);

      } catch (error: any) {
        console.error(`❌ Batch scan failed: ${batchId}`, error);
        batchResult.status = 'failed';
      }

      this.batchScans.set(batchId, batchResult);
    };

    // Start processing asynchronously
    processBatch();

    return batchId;
  }

  // Data classification
  async classifyDocument(documentId: string): Promise<DataClassification> {
    console.log(`🏷️ Classifying document: ${documentId}`);

    const scanResult = await this.getOrCreateScanResult(documentId);

    const classification: DataClassification = {
      documentId,
      classification: this.determineClassificationLevel(scanResult),
      sensitivityLevel: this.calculateSensitivityLevel(scanResult.findings),
      dataTypes: this.extractDataTypes(scanResult.findings),
      retentionPeriod: this.determineRetentionPeriod(scanResult),
      accessRestrictions: this.generateAccessRestrictions(scanResult),
      encryptionRequired: this.determineEncryptionRequirement(scanResult),
      auditRequired: this.determineAuditRequirement(scanResult),
      geographicRestrictions: this.determineGeographicRestrictions(scanResult)
    };

    console.log(`✅ Document classified: ${documentId} - ${classification.classification} (${classification.sensitivityLevel}% sensitivity)`);
    return classification;
  }

  // Compliance reporting
  async generateComplianceReport(timeframe: { start: string; end: string }, frameworks: RegulatoryFramework[] = []): Promise<ComplianceReport> {
    console.log(`📊 Generating compliance report for ${timeframe.start} to ${timeframe.end}`);

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const relevantResults = Array.from(this.detectionResults.values()).filter(result => {
      const scanDate = new Date(result.scanTimestamp);
      return scanDate >= new Date(timeframe.start) && scanDate <= new Date(timeframe.end);
    });

    const allViolations: ComplianceViolation[] = [];
    const riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

    relevantResults.forEach(result => {
      riskDistribution[result.riskLevel]++;

      Object.values(result.complianceStatus).forEach(framework => {
        if (framework.violations) {
          allViolations.push(...framework.violations);
        }
      });
    });

    const report: ComplianceReport = {
      reportId,
      generatedAt: new Date().toISOString(),
      reportType: 'summary',
      timeframe,
      scope: {
        documentCount: relevantResults.length,
        frameworksCovered: frameworks.length > 0 ? frameworks : ['gdpr', 'ccpa', 'hipaa', 'sox', 'pci_dss'],
        departmentsIncluded: ['All'] // Could be expanded to track by department
      },
      findings: {
        totalDocuments: relevantResults.length,
        documentsWithPII: relevantResults.filter(result => result.findings.length > 0).length,
        complianceViolations: allViolations,
        riskDistribution,
        trends: this.calculateComplianceTrends(relevantResults, timeframe)
      },
      recommendations: await this.generateComplianceRecommendations(allViolations, riskDistribution)
    };

    console.log(`✅ Compliance report generated: ${reportId}`);
    return report;
  }

  // Get scan results
  async getScanResult(documentId: string): Promise<PIIDetectionResult | null> {
    return this.detectionResults.get(documentId) || null;
  }

  async getBatchScanResult(batchId: string): Promise<BatchScanResult | null> {
    return this.batchScans.get(batchId) || null;
  }

  // Private helper methods
  private async extractDocumentContent(documentId: string, options: ScanOptions): Promise<string> {
    // In a real implementation, this would extract content from the document
    // For now, return sample content for demonstration
    throw new Error('Document content extraction not implemented - real SharePoint content required');
  }

  private async detectPII(content: string, options: ScanOptions): Promise<PIIFinding[]> {
    const findings: PIIFinding[] = [];
    let findingId = 1;

    // Pattern-based detection
    for (const [type, pattern] of Object.entries(this.piiPatterns)) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const index = content.indexOf(match);

          findings.push({
            id: `finding_${findingId++}`,
            type: type as PIIType,
            category: this.getCategory(type as PIIType),
            location: {
              offset: index,
              length: match.length
            },
            value: this.maskValue(match, type as PIIType),
            confidence: this.calculatePatternConfidence(type as PIIType, match),
            context: this.extractContext(content, index, 50),
            severity: this.determineSeverity(type as PIIType),
            regulatory: this.getRegulatory(type as PIIType),
            remediation: this.getRemediation(type as PIIType)
          });
        }
      }
    }

    // AI-powered detection using Gemini
    if (options.deepScan) {
      const aiFindings = await this.performAIDetection(content, options);
      findings.push(...aiFindings);
    }

    // Custom rule detection
    if (options.customRules) {
      const customFindings = this.detectCustomPatterns(content, options.customRules);
      findings.push(...customFindings);
    }

    return findings.filter(finding => finding.confidence >= options.confidenceThreshold);
  }

  private async performAIDetection(content: string, options: ScanOptions): Promise<PIIFinding[]> {
    try {
      const prompt = `Analyze the following text for personally identifiable information (PII). Look for patterns that might not match standard regex patterns but could still contain sensitive data. Return findings in structured format:

Text: ${content}

Please identify:
1. Any financial information (account numbers, financial IDs)
2. Health-related identifiers
3. Government-issued identifiers
4. Personal identifiers
5. Location information that could identify individuals
6. Any other sensitive patterns

Format each finding with: type, value (masked), confidence (0-100), context`;

      // This would use the Gemini service for AI-powered detection
      // For now, return empty array as this would require integration
      return [];
    } catch (error) {
      console.error('AI detection failed:', error);
      return [];
    }
  }

  private detectCustomPatterns(content: string, customRules: CustomComplianceRule[]): PIIFinding[] {
    const findings: PIIFinding[] = [];
    let findingId = 1000; // Start custom findings at 1000

    customRules.filter(rule => rule.enabled).forEach(rule => {
      const pattern = new RegExp(rule.pattern, 'g');
      const matches = content.match(pattern);

      if (matches) {
        matches.forEach(match => {
          const index = content.indexOf(match);

          findings.push({
            id: `custom_${findingId++}`,
            type: 'custom_identifier',
            category: 'professional',
            location: {
              offset: index,
              length: match.length
            },
            value: this.maskValue(match, 'custom_identifier'),
            confidence: 90, // High confidence for custom rules
            context: this.extractContext(content, index, 50),
            severity: rule.severity,
            regulatory: ['custom'],
            remediation: [{
              type: 'audit',
              description: `Review custom pattern: ${rule.name}`,
              automated: false,
              priority: 3
            }]
          });
        });
      }
    });

    return findings;
  }

  private async assessCompliance(findings: PIIFinding[], frameworks: RegulatoryFramework[]): Promise<ComplianceStatus> {
    const status: ComplianceStatus = {
      gdpr: { compliant: true, violations: [], riskScore: 0 },
      ccpa: { compliant: true, violations: [], riskScore: 0 },
      hipaa: { compliant: true, violations: [], riskScore: 0 },
      sox: { compliant: true, violations: [], riskScore: 0 },
      pci: { compliant: true, violations: [], riskScore: 0 },
      custom: []
    };

    // GDPR Assessment
    if (frameworks.includes('gdpr')) {
      const gdprFindings = findings.filter(f =>
        ['email', 'phone', 'ip_address', 'biometric', 'health_record'].includes(f.type)
      );

      if (gdprFindings.length > 0) {
        status.gdpr.compliant = false;
        status.gdpr.violations.push({
          ruleId: 'gdpr_article_6',
          description: 'Personal data processing requires lawful basis',
          severity: 'high',
          finding: `Found ${gdprFindings.length} instances of personal data`,
          recommendations: ['Implement consent mechanisms', 'Document lawful basis', 'Enable data subject rights'],
          regulatoryReference: 'GDPR Article 6'
        });
        status.gdpr.riskScore = Math.min(gdprFindings.length * 20, 100);
      }
    }

    // CCPA Assessment
    if (frameworks.includes('ccpa')) {
      const ccpaFindings = findings.filter(f =>
        ['ssn', 'drivers_license', 'email', 'phone', 'biometric'].includes(f.type)
      );

      if (ccpaFindings.length > 0) {
        status.ccpa.compliant = false;
        status.ccpa.violations.push({
          ruleId: 'ccpa_1798.140',
          description: 'Consumer personal information requires disclosure and rights',
          severity: 'medium',
          finding: `Found ${ccpaFindings.length} instances of consumer personal information`,
          recommendations: ['Implement privacy policy updates', 'Enable consumer rights portal', 'Data inventory maintenance'],
          regulatoryReference: 'CCPA § 1798.140'
        });
        status.ccpa.riskScore = Math.min(ccpaFindings.length * 15, 100);
      }
    }

    // HIPAA Assessment
    if (frameworks.includes('hipaa')) {
      const hipaaFindings = findings.filter(f =>
        ['health_record', 'ssn', 'insurance_id'].includes(f.type)
      );

      if (hipaaFindings.length > 0) {
        status.hipaa.compliant = false;
        status.hipaa.violations.push({
          ruleId: 'hipaa_164.502',
          description: 'Protected Health Information (PHI) requires safeguards',
          severity: 'critical',
          finding: `Found ${hipaaFindings.length} instances of PHI`,
          recommendations: ['Implement encryption', 'Access controls', 'Audit trails', 'Staff training'],
          regulatoryReference: 'HIPAA § 164.502'
        });
        status.hipaa.riskScore = Math.min(hipaaFindings.length * 25, 100);
      }
    }

    return status;
  }

  private calculateRiskLevel(findings: PIIFinding[], complianceStatus: ComplianceStatus): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // Base risk from findings
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical': riskScore += 25; break;
        case 'high': riskScore += 15; break;
        case 'medium': riskScore += 8; break;
        case 'low': riskScore += 3; break;
      }
    });

    // Compliance risk
    const complianceRisk = Math.max(
      complianceStatus.gdpr.riskScore,
      complianceStatus.ccpa.riskScore,
      complianceStatus.hipaa.riskScore,
      complianceStatus.sox.riskScore,
      complianceStatus.pci.riskScore
    );

    riskScore += complianceRisk;

    if (riskScore >= 80) return 'critical';
    if (riskScore >= 50) return 'high';
    if (riskScore >= 20) return 'medium';
    return 'low';
  }

  private generateStatistics(findings: PIIFinding[]): DetectionStatistics {
    const stats: DetectionStatistics = {
      totalFindings: findings.length,
      findingsByType: {},
      findingsByCategory: {},
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      complianceScore: 0,
      dataProcessingRisk: 0
    };

    findings.forEach(finding => {
      // Count by type
      stats.findingsByType[finding.type] = (stats.findingsByType[finding.type] || 0) + 1;

      // Count by category
      stats.findingsByCategory[finding.category] = (stats.findingsByCategory[finding.category] || 0) + 1;

      // Risk distribution
      stats.riskDistribution[finding.severity]++;
    });

    // Calculate compliance score (inverse of risk)
    const totalRiskPoints = stats.riskDistribution.critical * 4 + stats.riskDistribution.high * 3 +
                           stats.riskDistribution.medium * 2 + stats.riskDistribution.low * 1;
    stats.complianceScore = Math.max(0, 100 - (totalRiskPoints * 5));

    // Data processing risk
    stats.dataProcessingRisk = Math.min(totalRiskPoints * 2, 100);

    return stats;
  }

  private async generateRecommendations(findings: PIIFinding[], complianceStatus: ComplianceStatus, riskLevel: string): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];
    let recId = 1;

    // High-level recommendations based on risk
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push({
        id: `rec_${recId++}`,
        priority: 'critical',
        title: 'Immediate Data Protection Required',
        description: 'Document contains high-risk PII that requires immediate protection measures',
        actionType: 'encrypt',
        estimatedEffort: 'hours',
        complianceImpact: 90,
        businessImpact: 'high'
      });
    }

    // Specific recommendations based on findings
    const ssnFindings = findings.filter(f => f.type === 'ssn');
    if (ssnFindings.length > 0) {
      recommendations.push({
        id: `rec_${recId++}`,
        priority: 'high',
        title: 'Social Security Number Protection',
        description: `Found ${ssnFindings.length} SSN(s). Implement masking or encryption.`,
        actionType: 'redact',
        estimatedEffort: 'minutes',
        complianceImpact: 85,
        businessImpact: 'minimal'
      });
    }

    // Compliance-specific recommendations
    if (!complianceStatus.gdpr.compliant) {
      recommendations.push({
        id: `rec_${recId++}`,
        priority: 'high',
        title: 'GDPR Compliance Required',
        description: 'Implement GDPR compliance measures for personal data processing',
        actionType: 'audit',
        estimatedEffort: 'days',
        complianceImpact: 95,
        businessImpact: 'medium'
      });
    }

    return recommendations;
  }

  // Utility methods
  private getCategory(type: PIIType): PIICategory {
    const categoryMap: { [key in PIIType]: PIICategory } = {
      ssn: 'identity',
      credit_card: 'financial',
      email: 'contact',
      phone: 'contact',
      drivers_license: 'government',
      passport: 'government',
      bank_account: 'financial',
      tax_id: 'government',
      national_id: 'government',
      health_record: 'health',
      biometric: 'biometric',
      ip_address: 'technical',
      coordinates: 'location',
      financial_account: 'financial',
      insurance_id: 'health',
      employee_id: 'professional',
      student_id: 'professional',
      custom_identifier: 'professional'
    };

    return categoryMap[type] || 'identity';
  }

  private maskValue(value: string, type: PIIType): string {
    switch (type) {
      case 'ssn':
        return value.replace(/\d(?=\d{4})/g, '*');
      case 'credit_card':
        return value.replace(/\d(?=\d{4})/g, '*');
      case 'email':
        const [user, domain] = value.split('@');
        return `${user.charAt(0)}***@${domain}`;
      case 'phone':
        return value.replace(/\d/g, '*').substring(0, value.length - 4) + value.slice(-4);
      default:
        return value.replace(/./g, '*');
    }
  }

  private calculatePatternConfidence(type: PIIType, match: string): number {
    // Return confidence based on pattern quality
    const confidenceMap: { [key in PIIType]: number } = {
      ssn: 95,
      credit_card: 90,
      email: 98,
      phone: 85,
      drivers_license: 80,
      passport: 85,
      bank_account: 75,
      tax_id: 90,
      national_id: 80,
      health_record: 85,
      biometric: 90,
      ip_address: 95,
      coordinates: 90,
      financial_account: 75,
      insurance_id: 85,
      employee_id: 70,
      student_id: 70,
      custom_identifier: 80
    };

    return confidenceMap[type] || 70;
  }

  private extractContext(content: string, index: number, contextLength: number): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return content.substring(start, end);
  }

  private determineSeverity(type: PIIType): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: { [key in PIIType]: 'low' | 'medium' | 'high' | 'critical' } = {
      ssn: 'critical',
      credit_card: 'critical',
      health_record: 'critical',
      biometric: 'critical',
      bank_account: 'high',
      tax_id: 'high',
      passport: 'high',
      drivers_license: 'medium',
      national_id: 'medium',
      insurance_id: 'medium',
      email: 'low',
      phone: 'low',
      ip_address: 'low',
      coordinates: 'medium',
      financial_account: 'high',
      employee_id: 'low',
      student_id: 'low',
      custom_identifier: 'medium'
    };

    return severityMap[type] || 'medium';
  }

  private getRegulatory(type: PIIType): RegulatoryFramework[] {
    const regulatoryMap: { [key in PIIType]: RegulatoryFramework[] } = {
      ssn: ['gdpr', 'ccpa', 'sox'],
      credit_card: ['pci_dss', 'gdpr', 'ccpa'],
      health_record: ['hipaa', 'gdpr'],
      biometric: ['gdpr', 'ccpa', 'pipeda'],
      email: ['gdpr', 'ccpa', 'pipeda'],
      phone: ['gdpr', 'ccpa'],
      bank_account: ['pci_dss', 'glba', 'gdpr'],
      tax_id: ['sox', 'gdpr'],
      passport: ['gdpr', 'ccpa'],
      drivers_license: ['gdpr', 'ccpa'],
      national_id: ['gdpr', 'ccpa'],
      insurance_id: ['hipaa', 'gdpr'],
      ip_address: ['gdpr'],
      coordinates: ['gdpr', 'ccpa'],
      financial_account: ['pci_dss', 'glba', 'gdpr'],
      employee_id: ['gdpr'],
      student_id: ['ferpa', 'gdpr'],
      custom_identifier: ['custom']
    };

    return regulatoryMap[type] || ['gdpr'];
  }

  private getRemediation(type: PIIType): RemediationAction[] {
    const criticalTypes = ['ssn', 'credit_card', 'health_record', 'biometric'];

    if (criticalTypes.includes(type)) {
      return [
        { type: 'encrypt', description: 'Encrypt sensitive data', automated: true, priority: 1 },
        { type: 'restrict', description: 'Restrict access to authorized personnel only', automated: true, priority: 2 },
        { type: 'audit', description: 'Enable audit logging for access', automated: true, priority: 3 }
      ];
    }

    return [
      { type: 'mask', description: 'Mask data in non-production environments', automated: true, priority: 1 },
      { type: 'audit', description: 'Monitor access patterns', automated: true, priority: 2 }
    ];
  }

  private calculateOverallConfidence(findings: PIIFinding[]): number {
    if (findings.length === 0) return 100;

    const totalConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0);
    return Math.round(totalConfidence / findings.length);
  }

  private createEmptyComplianceStatus(): ComplianceStatus {
    return {
      gdpr: { compliant: true, violations: [], riskScore: 0 },
      ccpa: { compliant: true, violations: [], riskScore: 0 },
      hipaa: { compliant: true, violations: [], riskScore: 0 },
      sox: { compliant: true, violations: [], riskScore: 0 },
      pci: { compliant: true, violations: [], riskScore: 0 },
      custom: []
    };
  }

  private createEmptyStatistics(): DetectionStatistics {
    return {
      totalFindings: 0,
      findingsByType: {},
      findingsByCategory: {},
      riskDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      complianceScore: 100,
      dataProcessingRisk: 0
    };
  }

  private async getOrCreateScanResult(documentId: string): Promise<PIIDetectionResult> {
    let result = this.detectionResults.get(documentId);

    if (!result) {
      result = await this.scanDocument(documentId);
    }

    return result;
  }

  private determineClassificationLevel(scanResult: PIIDetectionResult): 'public' | 'internal' | 'confidential' | 'restricted' | 'secret' {
    switch (scanResult.riskLevel) {
      case 'critical': return 'secret';
      case 'high': return 'restricted';
      case 'medium': return 'confidential';
      case 'low': return scanResult.findings.length > 0 ? 'internal' : 'public';
    }
  }

  private calculateSensitivityLevel(findings: PIIFinding[]): number {
    if (findings.length === 0) return 0;

    let sensitivityScore = 0;
    findings.forEach(finding => {
      switch (finding.severity) {
        case 'critical': sensitivityScore += 25; break;
        case 'high': sensitivityScore += 15; break;
        case 'medium': sensitivityScore += 8; break;
        case 'low': sensitivityScore += 3; break;
      }
    });

    return Math.min(100, sensitivityScore);
  }

  private extractDataTypes(findings: PIIFinding[]): DataType[] {
    const typeMap = new Map<string, DataType>();

    findings.forEach(finding => {
      const key = `${finding.type}_${finding.category}`;

      if (typeMap.has(key)) {
        const dataType = typeMap.get(key)!;
        dataType.count++;
        dataType.locations.push(finding.location);
      } else {
        typeMap.set(key, {
          type: finding.type,
          category: finding.category,
          sensitivity: finding.severity === 'critical' ? 100 : finding.severity === 'high' ? 75 : finding.severity === 'medium' ? 50 : 25,
          count: 1,
          locations: [finding.location]
        });
      }
    });

    return Array.from(typeMap.values());
  }

  private generateAccessRestrictions(scanResult: PIIDetectionResult): AccessRestriction[] {
    const restrictions: AccessRestriction[] = [];

    if (scanResult.riskLevel === 'critical' || scanResult.riskLevel === 'high') {
      restrictions.push(
        { type: 'role', value: 'privacy_officer', condition: 'required' },
        { type: 'role', value: 'data_steward', condition: 'required' }
      );
    }

    return restrictions;
  }

  private determineRetentionPeriod(scanResult: PIIDetectionResult): number {
    // Return retention period in months based on regulatory requirements
    const hasHealthData = scanResult.findings.some(f => f.category === 'health');
    const hasFinancialData = scanResult.findings.some(f => f.category === 'financial');

    if (hasHealthData) return 72; // 6 years for HIPAA
    if (hasFinancialData) return 84; // 7 years for financial records
    return 36; // 3 years default
  }

  private determineEncryptionRequirement(scanResult: PIIDetectionResult): boolean {
    return scanResult.riskLevel === 'critical' || scanResult.riskLevel === 'high';
  }

  private determineAuditRequirement(scanResult: PIIDetectionResult): boolean {
    return scanResult.findings.length > 0;
  }

  private determineGeographicRestrictions(scanResult: PIIDetectionResult): string[] {
    const restrictions: string[] = [];

    // GDPR restrictions for EU data
    const hasGDPRData = scanResult.findings.some(f => f.regulatory.includes('gdpr'));
    if (hasGDPRData) {
      restrictions.push('EU_ONLY');
    }

    return restrictions;
  }

  private calculateAverageRiskScore(results: PIIDetectionResult[]): number {
    if (results.length === 0) return 0;

    const riskValues = { low: 25, medium: 50, high: 75, critical: 100 };
    const totalScore = results.reduce((sum, result) => sum + riskValues[result.riskLevel], 0);

    return Math.round(totalScore / results.length);
  }

  private calculateComplianceTrends(results: PIIDetectionResult[], timeframe: { start: string; end: string }) {
    // Generate trend data based on results over time
    const trends: { period: string; value: number; change: number; }[] = [];

    // This would implement actual trend calculation
    // For now, return sample data
    return [
      { period: 'week1', value: 85, change: 5 },
      { period: 'week2', value: 90, change: 5 },
      { period: 'week3', value: 88, change: -2 },
      { period: 'week4', value: 92, change: 4 }
    ];
  }

  private async generateComplianceRecommendations(violations: ComplianceViolation[], riskDistribution: any): Promise<SecurityRecommendation[]> {
    const recommendations: SecurityRecommendation[] = [];

    if (violations.length > 0) {
      recommendations.push({
        id: 'comp_rec_1',
        priority: 'high',
        title: 'Address Compliance Violations',
        description: `${violations.length} compliance violations require immediate attention`,
        actionType: 'audit',
        estimatedEffort: 'days',
        complianceImpact: 95,
        businessImpact: 'medium'
      });
    }

    return recommendations;
  }

  private async loadCustomRules(): Promise<void> {
    // Load custom compliance rules from configuration
    this.customRules = [
      {
        ruleId: 'employee_id_pattern',
        name: 'Employee ID Pattern',
        description: 'Detects company employee ID patterns',
        pattern: 'EMP[0-9]{6}',
        severity: 'medium',
        enabled: true
      },
      {
        ruleId: 'project_code_pattern',
        name: 'Project Code Pattern',
        description: 'Detects internal project codes',
        pattern: 'PROJ-[A-Z]{3}-[0-9]{4}',
        severity: 'low',
        enabled: true
      }
    ];
  }

  private async logAuditEvent(event: AuditEvent): Promise<void> {
    this.auditEvents.push(event);
    console.log(`📝 Audit event logged: ${event.eventType} for ${event.documentId}`);
  }
}

// Export singleton instance - will be initialized by routes with required services
let piiDetectionServiceInstance: PIIDetectionService | null = null;

export const getPiiDetectionService = (authService?: any, pnpService?: any, geminiService?: any): PIIDetectionService => {
  if (!piiDetectionServiceInstance && authService && pnpService && geminiService) {
    piiDetectionServiceInstance = new PIIDetectionService(authService, pnpService, geminiService);
  }
  return piiDetectionServiceInstance!;
};

// For backward compatibility
export const piiDetectionService = {
  scanDocument: async (documentId: string, options?: any) => {
    const instance = getPiiDetectionService();
    return instance ? instance.scanDocument(documentId, options) : Promise.reject('Service not initialized');
  },
  scanDocumentBatch: async (request: any) => {
    const instance = getPiiDetectionService();
    return instance ? instance.scanDocumentBatch(request) : Promise.reject('Service not initialized');
  },
  getBatchScanResult: async (batchId: string) => {
    const instance = getPiiDetectionService();
    return instance ? instance.getBatchScanResult(batchId) : Promise.reject('Service not initialized');
  },
  generateComplianceReport: async (timeframe: any, frameworks?: any) => {
    const instance = getPiiDetectionService();
    return instance ? instance.generateComplianceReport(timeframe, frameworks) : Promise.reject('Service not initialized');
  }
};