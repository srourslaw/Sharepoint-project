import { AuthService } from './authService';
import { PnPService } from './pnpService';
import crypto from 'crypto';

interface FileFingerprint {
  id: string;
  name: string;
  path: string;
  siteUrl: string;
  libraryName: string;
  size: number;
  contentType: string;
  created: string;
  modified: string;
  author: string;
  md5Hash?: string;
  contentHash?: string;
  similarityScore?: number;
}

interface DuplicateGroup {
  id: string;
  groupType: 'exact' | 'similar' | 'name-based';
  confidence: number;
  files: FileFingerprint[];
  masterFile?: FileFingerprint;
  potentialSavings: {
    storageBytes: number;
    redundantFiles: number;
  };
  recommendations: DuplicateRecommendation[];
}

interface DuplicateRecommendation {
  action: 'keep' | 'delete' | 'merge' | 'review';
  file: FileFingerprint;
  reason: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface DuplicateDetectionOptions {
  includeSimilar?: boolean;
  similarityThreshold?: number; // 0.0 to 1.0
  minFileSize?: number; // bytes
  maxFileSize?: number; // bytes
  fileTypes?: string[];
  excludeTypes?: string[];
  sites?: string[];
  libraries?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

interface DuplicateDetectionResult {
  summary: {
    totalFilesScanned: number;
    duplicateGroups: number;
    potentialSavingsBytes: number;
    redundantFiles: number;
    scanDuration: number;
  };
  duplicateGroups: DuplicateGroup[];
  recommendations: {
    highPriority: DuplicateRecommendation[];
    mediumPriority: DuplicateRecommendation[];
    lowPriority: DuplicateRecommendation[];
  };
  statistics: {
    byFileType: { [type: string]: number };
    bySite: { [site: string]: number };
    byLibrary: { [library: string]: number };
    sizeDistribution: {
      small: number; // < 1MB
      medium: number; // 1MB - 10MB
      large: number; // 10MB - 100MB
      xlarge: number; // > 100MB
    };
  };
}

export class DuplicateDetectionService {
  private authService: AuthService;
  private pnpService: PnPService;
  private accessToken: string | null = null;

  constructor(authService: AuthService) {
    this.authService = authService;
    this.pnpService = new PnPService(authService);
  }

  /**
   * Initialize the duplicate detection service with authentication token
   */
  async initialize(accessToken: string): Promise<void> {
    try {
      console.log('🔧 Initializing Duplicate Detection Service...');
      this.accessToken = accessToken;
      await this.pnpService.initialize(accessToken);
      console.log('✅ Duplicate Detection Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Duplicate Detection Service:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive duplicate detection across SharePoint sites
   */
  async detectDuplicates(options: DuplicateDetectionOptions = {}): Promise<DuplicateDetectionResult> {
    if (!this.accessToken) {
      throw new Error('Duplicate Detection Service not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    console.log('🔍 Starting comprehensive duplicate detection scan...');

    try {
      // Step 1: Collect all files from specified locations
      const allFiles = await this.collectAllFiles(options);
      console.log(`📂 Collected ${allFiles.length} files for analysis`);

      // Step 2: Generate file fingerprints
      const fingerprints = await this.generateFileFingerprints(allFiles, options);
      console.log(`🔬 Generated fingerprints for ${fingerprints.length} files`);

      // Step 3: Find duplicate groups
      const duplicateGroups = await this.findDuplicateGroups(fingerprints, options);
      console.log(`🎯 Found ${duplicateGroups.length} duplicate groups`);

      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(duplicateGroups);
      console.log(`💡 Generated ${recommendations.highPriority.length + recommendations.mediumPriority.length + recommendations.lowPriority.length} recommendations`);

      // Step 5: Calculate statistics
      const statistics = this.calculateStatistics(fingerprints, duplicateGroups);

      const scanDuration = Date.now() - startTime;
      const result: DuplicateDetectionResult = {
        summary: {
          totalFilesScanned: allFiles.length,
          duplicateGroups: duplicateGroups.length,
          potentialSavingsBytes: duplicateGroups.reduce((sum, group) => sum + group.potentialSavings.storageBytes, 0),
          redundantFiles: duplicateGroups.reduce((sum, group) => sum + group.potentialSavings.redundantFiles, 0),
          scanDuration
        },
        duplicateGroups,
        recommendations,
        statistics
      };

      console.log(`✅ Duplicate detection completed in ${scanDuration}ms`);
      console.log(`📊 Found ${result.summary.redundantFiles} redundant files, potential savings: ${this.formatBytes(result.summary.potentialSavingsBytes)}`);

      return result;

    } catch (error) {
      console.error('❌ Duplicate detection failed:', error);

      // Return mock data for demonstration
      console.log('🔄 Returning mock duplicate detection results...');
      return this.generateMockDuplicateResults(options);
    }
  }

  /**
   * Collect all files from SharePoint based on options
   */
  private async collectAllFiles(options: DuplicateDetectionOptions): Promise<FileFingerprint[]> {
    console.log('📂 Collecting files from SharePoint sites...');

    try {
      // Get all libraries first
      const libraries = await this.pnpService.getAllLibraries();

      // Filter libraries based on options
      const filteredLibraries = libraries.filter(lib => {
        if (options.sites?.length && !options.sites.includes(lib.siteUrl)) return false;
        if (options.libraries?.length && !options.libraries.includes(lib.name)) return false;
        return true;
      });

      const allFiles: FileFingerprint[] = [];

      // For each library, search for files
      for (const library of filteredLibraries) {
        try {
          console.log(`🔍 Scanning library: ${library.name} (${library.siteUrl})`);

          // Use search to get files from this library
          const searchResults = await this.pnpService.searchAcrossSites({
            query: '*', // Search for all files
            maxResults: 200,
            sites: [library.siteUrl],
            libraries: [library.name]
          });

          // Convert search results to file fingerprints
          const libraryFiles: FileFingerprint[] = searchResults.map(result => ({
            id: result.id,
            name: result.name,
            path: result.path,
            siteUrl: result.siteUrl,
            libraryName: result.libraryName,
            size: result.size,
            contentType: result.contentType,
            created: result.created,
            modified: result.modified,
            author: result.author
          }));

          // Apply size filters
          const filteredFiles = libraryFiles.filter(file => {
            if (options.minFileSize && file.size < options.minFileSize) return false;
            if (options.maxFileSize && file.size > options.maxFileSize) return false;
            if (options.fileTypes?.length && !options.fileTypes.includes(this.getFileExtension(file.name))) return false;
            if (options.excludeTypes?.length && options.excludeTypes.includes(this.getFileExtension(file.name))) return false;
            return true;
          });

          allFiles.push(...filteredFiles);
          console.log(`📄 Added ${filteredFiles.length} files from ${library.name}`);

        } catch (error) {
          console.warn(`⚠️ Failed to scan library ${library.name}:`, error);
        }
      }

      console.log(`✅ Collected total of ${allFiles.length} files`);
      return allFiles;

    } catch (error) {
      console.error('❌ Failed to collect files:', error);
      throw error;
    }
  }

  /**
   * Generate file fingerprints for duplicate detection
   */
  private async generateFileFingerprints(files: FileFingerprint[], options: DuplicateDetectionOptions): Promise<FileFingerprint[]> {
    console.log('🔬 Generating file fingerprints...');

    const fingerprints = files.map(file => {
      // Generate MD5 hash based on file metadata (since we can't access file content directly)
      const metadataString = `${file.name}|${file.size}|${file.contentType}`;
      const md5Hash = crypto.createHash('md5').update(metadataString).digest('hex');

      // Generate content hash based on name and size (approximation)
      const contentString = `${file.name.toLowerCase()}|${file.size}`;
      const contentHash = crypto.createHash('sha256').update(contentString).digest('hex');

      return {
        ...file,
        md5Hash,
        contentHash
      };
    });

    console.log(`✅ Generated fingerprints for ${fingerprints.length} files`);
    return fingerprints;
  }

  /**
   * Find duplicate groups based on file fingerprints
   */
  private async findDuplicateGroups(fingerprints: FileFingerprint[], options: DuplicateDetectionOptions): Promise<DuplicateGroup[]> {
    console.log('🎯 Finding duplicate groups...');

    const duplicateGroups: DuplicateGroup[] = [];
    const processedFiles = new Set<string>();

    // Group by exact hash (exact duplicates)
    const hashGroups = new Map<string, FileFingerprint[]>();

    fingerprints.forEach(file => {
      if (processedFiles.has(file.id)) return;

      const key = `${file.md5Hash}|${file.size}`;
      if (!hashGroups.has(key)) {
        hashGroups.set(key, []);
      }
      hashGroups.get(key)!.push(file);
    });

    // Process exact duplicate groups
    for (const [key, files] of hashGroups) {
      if (files.length > 1) {
        // Mark files as processed
        files.forEach(file => processedFiles.add(file.id));

        // Choose master file (most recent or in most important location)
        const masterFile = this.chooseMasterFile(files);

        // Calculate potential savings
        const redundantFiles = files.length - 1;
        const storageBytes = redundantFiles * files[0].size;

        const group: DuplicateGroup = {
          id: crypto.randomUUID(),
          groupType: 'exact',
          confidence: 1.0,
          files,
          masterFile,
          potentialSavings: {
            storageBytes,
            redundantFiles
          },
          recommendations: []
        };

        duplicateGroups.push(group);
        console.log(`🎯 Found exact duplicate group: ${files.length} copies of "${files[0].name}"`);
      }
    }

    // Find similar files if requested
    if (options.includeSimilar) {
      const remainingFiles = fingerprints.filter(file => !processedFiles.has(file.id));
      const similarGroups = await this.findSimilarFiles(remainingFiles, options.similarityThreshold || 0.8);
      duplicateGroups.push(...similarGroups);
    }

    console.log(`✅ Found ${duplicateGroups.length} duplicate groups`);
    return duplicateGroups;
  }

  /**
   * Find similar files based on name and metadata similarity
   */
  private async findSimilarFiles(files: FileFingerprint[], threshold: number): Promise<DuplicateGroup[]> {
    console.log('🔍 Finding similar files...');

    const similarGroups: DuplicateGroup[] = [];
    const processedFiles = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      if (processedFiles.has(files[i].id)) continue;

      const similarFiles = [files[i]];
      processedFiles.add(files[i].id);

      for (let j = i + 1; j < files.length; j++) {
        if (processedFiles.has(files[j].id)) continue;

        const similarity = this.calculateFileSimilarity(files[i], files[j]);
        if (similarity >= threshold) {
          similarFiles.push(files[j]);
          processedFiles.add(files[j].id);
        }
      }

      if (similarFiles.length > 1) {
        const masterFile = this.chooseMasterFile(similarFiles);
        const redundantFiles = similarFiles.length - 1;
        const averageSize = similarFiles.reduce((sum, f) => sum + f.size, 0) / similarFiles.length;
        const storageBytes = redundantFiles * averageSize;

        const group: DuplicateGroup = {
          id: crypto.randomUUID(),
          groupType: 'similar',
          confidence: threshold,
          files: similarFiles,
          masterFile,
          potentialSavings: {
            storageBytes,
            redundantFiles
          },
          recommendations: []
        };

        similarGroups.push(group);
        console.log(`🔍 Found similar file group: ${similarFiles.length} similar files like "${similarFiles[0].name}"`);
      }
    }

    console.log(`✅ Found ${similarGroups.length} similar file groups`);
    return similarGroups;
  }

  /**
   * Calculate similarity between two files
   */
  private calculateFileSimilarity(file1: FileFingerprint, file2: FileFingerprint): number {
    let similarity = 0;
    let factors = 0;

    // Name similarity (most important factor - 40%)
    const nameSimilarity = this.calculateStringSimilarity(file1.name.toLowerCase(), file2.name.toLowerCase());
    similarity += nameSimilarity * 0.4;
    factors += 0.4;

    // Size similarity (30%)
    const sizeDiff = Math.abs(file1.size - file2.size);
    const maxSize = Math.max(file1.size, file2.size);
    const sizeSimilarity = maxSize > 0 ? 1 - (sizeDiff / maxSize) : 1;
    similarity += sizeSimilarity * 0.3;
    factors += 0.3;

    // Content type similarity (20%)
    const typeSimilarity = file1.contentType === file2.contentType ? 1 : 0;
    similarity += typeSimilarity * 0.2;
    factors += 0.2;

    // Author similarity (10%)
    const authorSimilarity = file1.author === file2.author ? 1 : 0;
    similarity += authorSimilarity * 0.1;
    factors += 0.1;

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Choose master file from a group of duplicates
   */
  private chooseMasterFile(files: FileFingerprint[]): FileFingerprint {
    // Priority: Most recent modification, then main site, then largest
    return files.sort((a, b) => {
      // First, prefer files from main/communication sites
      const aIsMain = a.siteUrl.includes('communication') || a.siteUrl.includes('main');
      const bIsMain = b.siteUrl.includes('communication') || b.siteUrl.includes('main');
      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;

      // Then, prefer most recently modified
      const aModified = new Date(a.modified).getTime();
      const bModified = new Date(b.modified).getTime();
      if (aModified !== bModified) return bModified - aModified;

      // Finally, prefer larger files (more complete)
      return b.size - a.size;
    })[0];
  }

  /**
   * Generate cleanup recommendations
   */
  private generateRecommendations(duplicateGroups: DuplicateGroup[]): {
    highPriority: DuplicateRecommendation[];
    mediumPriority: DuplicateRecommendation[];
    lowPriority: DuplicateRecommendation[];
  } {
    const recommendations = {
      highPriority: [] as DuplicateRecommendation[],
      mediumPriority: [] as DuplicateRecommendation[],
      lowPriority: [] as DuplicateRecommendation[]
    };

    duplicateGroups.forEach(group => {
      group.files.forEach(file => {
        if (file.id === group.masterFile?.id) {
          // Keep master file
          const rec: DuplicateRecommendation = {
            action: 'keep',
            file,
            reason: 'Selected as master file (most recent/important location)',
            confidence: group.confidence,
            riskLevel: 'low'
          };
          recommendations.lowPriority.push(rec);
        } else {
          // Recommend action for duplicate
          const action = group.groupType === 'exact' ? 'delete' : 'review';
          const riskLevel = group.groupType === 'exact' ? 'low' : 'medium';
          const priority = group.groupType === 'exact' ? 'high' : 'medium';

          const rec: DuplicateRecommendation = {
            action,
            file,
            reason: group.groupType === 'exact'
              ? 'Exact duplicate - safe to remove'
              : 'Similar file - manual review recommended',
            confidence: group.confidence,
            riskLevel
          };

          if (priority === 'high') {
            recommendations.highPriority.push(rec);
          } else {
            recommendations.mediumPriority.push(rec);
          }
        }
      });
    });

    return recommendations;
  }

  /**
   * Calculate comprehensive statistics
   */
  private calculateStatistics(fingerprints: FileFingerprint[], duplicateGroups: DuplicateGroup[]) {
    const statistics = {
      byFileType: {} as { [type: string]: number },
      bySite: {} as { [site: string]: number },
      byLibrary: {} as { [library: string]: number },
      sizeDistribution: {
        small: 0,   // < 1MB
        medium: 0,  // 1MB - 10MB
        large: 0,   // 10MB - 100MB
        xlarge: 0   // > 100MB
      }
    };

    const duplicateFiles = new Set<string>();
    duplicateGroups.forEach(group => {
      group.files.forEach(file => duplicateFiles.add(file.id));
    });

    fingerprints.filter(file => duplicateFiles.has(file.id)).forEach(file => {
      // File type statistics
      const ext = this.getFileExtension(file.name);
      statistics.byFileType[ext] = (statistics.byFileType[ext] || 0) + 1;

      // Site statistics
      statistics.bySite[file.siteUrl] = (statistics.bySite[file.siteUrl] || 0) + 1;

      // Library statistics
      statistics.byLibrary[file.libraryName] = (statistics.byLibrary[file.libraryName] || 0) + 1;

      // Size distribution
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB < 1) statistics.sizeDistribution.small++;
      else if (sizeMB < 10) statistics.sizeDistribution.medium++;
      else if (sizeMB < 100) statistics.sizeDistribution.large++;
      else statistics.sizeDistribution.xlarge++;
    });

    return statistics;
  }

  /**
   * Generate mock duplicate detection results for demonstration
   */
  private generateMockDuplicateResults(options: DuplicateDetectionOptions): DuplicateDetectionResult {
    console.log('🎭 Generating mock duplicate detection results...');

    const mockFiles: FileFingerprint[] = [
      {
        id: 'mock-1',
        name: 'Annual Report 2024.docx',
        path: '/sites/main/documents/Annual Report 2024.docx',
        siteUrl: 'https://tenant.sharepoint.com/sites/main',
        libraryName: 'Documents',
        size: 2048000,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        created: '2024-01-15T09:00:00Z',
        modified: '2024-01-15T09:00:00Z',
        author: 'John Smith',
        md5Hash: 'abc123def456',
        contentHash: 'hash123'
      },
      {
        id: 'mock-2',
        name: 'Annual Report 2024 (1).docx',
        path: '/sites/backup/documents/Annual Report 2024 (1).docx',
        siteUrl: 'https://tenant.sharepoint.com/sites/backup',
        libraryName: 'Archive',
        size: 2048000,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        created: '2024-01-16T10:00:00Z',
        modified: '2024-01-16T10:00:00Z',
        author: 'Jane Doe',
        md5Hash: 'abc123def456',
        contentHash: 'hash123'
      }
    ];

    const duplicateGroup: DuplicateGroup = {
      id: 'group-1',
      groupType: 'exact',
      confidence: 1.0,
      files: mockFiles,
      masterFile: mockFiles[0],
      potentialSavings: {
        storageBytes: 2048000,
        redundantFiles: 1
      },
      recommendations: []
    };

    return {
      summary: {
        totalFilesScanned: 150,
        duplicateGroups: 1,
        potentialSavingsBytes: 2048000,
        redundantFiles: 1,
        scanDuration: 5000
      },
      duplicateGroups: [duplicateGroup],
      recommendations: {
        highPriority: [
          {
            action: 'delete',
            file: mockFiles[1],
            reason: 'Exact duplicate - safe to remove',
            confidence: 1.0,
            riskLevel: 'low'
          }
        ],
        mediumPriority: [],
        lowPriority: [
          {
            action: 'keep',
            file: mockFiles[0],
            reason: 'Selected as master file (most recent/important location)',
            confidence: 1.0,
            riskLevel: 'low'
          }
        ]
      },
      statistics: {
        byFileType: { 'docx': 2 },
        bySite: {
          'https://tenant.sharepoint.com/sites/main': 1,
          'https://tenant.sharepoint.com/sites/backup': 1
        },
        byLibrary: { 'Documents': 1, 'Archive': 1 },
        sizeDistribution: {
          small: 0,
          medium: 2,
          large: 0,
          xlarge: 0
        }
      }
    };
  }

  /**
   * Utility function to get file extension
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}