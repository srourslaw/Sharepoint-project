import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { PnPService } from '../services/pnpService';

export function createPnPRoutes(authService: AuthService, authMiddleware: AuthMiddleware): Router {
  const router = Router();
  const pnpService = new PnPService(authService);

  /**
   * GET /api/pnp/health
   * Health check and connectivity test for PnP.js service
   */
  router.get('/health', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🏥 PnP.js health check requested');

      // Initialize PnP service with user's access token
      await pnpService.initialize(req.session!.accessToken);

      // Test connectivity
      const isConnected = await pnpService.testConnectivity();

      res.json({
        success: true,
        service: 'PnP.js SharePoint Service',
        status: isConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        capabilities: [
          'Cross-site search',
          'Library enumeration',
          'Enhanced file details',
          'Advanced filtering'
        ]
      });

    } catch (error) {
      console.error('❌ PnP.js health check failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PNP_HEALTH_CHECK_FAILED',
          message: 'PnP.js service health check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * POST /api/pnp/search
   * Perform cross-site search using PnP.js enhanced search capabilities
   */
  router.post('/search', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, maxResults, sortBy, sortOrder, fileTypes, sites, libraries, dateRange } = req.body;

      console.log(`🔍 PnP.js cross-site search requested: "${query}"`);

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SEARCH_QUERY',
            message: 'Search query is required'
          }
        });
        return;
      }

      // Initialize PnP service
      await pnpService.initialize(req.session!.accessToken);

      // Parse date range if provided
      let parsedDateRange;
      if (dateRange) {
        parsedDateRange = {
          start: dateRange.start ? new Date(dateRange.start) : undefined,
          end: dateRange.end ? new Date(dateRange.end) : undefined
        };
      }

      // Perform the search
      const searchResults = await pnpService.searchAcrossSites({
        query: query.trim(),
        maxResults: Math.min(maxResults || 50, 200), // Cap at 200 results
        sortBy: sortBy || 'relevance',
        sortOrder: sortOrder || 'desc',
        fileTypes: fileTypes || [],
        sites: sites || [],
        libraries: libraries || [],
        dateRange: parsedDateRange
      });

      console.log(`✅ PnP.js search completed: ${searchResults.length} results`);

      res.json({
        success: true,
        results: searchResults,
        totalCount: searchResults.length,
        searchQuery: query,
        timestamp: new Date().toISOString(),
        searchOptions: {
          maxResults: maxResults || 50,
          sortBy: sortBy || 'relevance',
          sortOrder: sortOrder || 'desc',
          fileTypes: fileTypes || [],
          sites: sites || [],
          libraries: libraries || []
        }
      });

    } catch (error) {
      console.error('❌ PnP.js search failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PNP_SEARCH_FAILED',
          message: 'Cross-site search failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /api/pnp/libraries
   * Get all document libraries across SharePoint sites
   */
  router.get('/libraries', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📚 PnP.js libraries enumeration requested');

      // Initialize PnP service
      await pnpService.initialize(req.session!.accessToken);

      // Get all libraries
      const libraries = await pnpService.getAllLibraries();

      console.log(`✅ PnP.js libraries enumeration completed: ${libraries.length} libraries`);

      res.json({
        success: true,
        libraries: libraries,
        totalCount: libraries.length,
        timestamp: new Date().toISOString(),
        summary: {
          totalLibraries: libraries.length,
          sitesWithLibraries: [...new Set(libraries.map(lib => lib.siteUrl))].length,
          averageItemsPerLibrary: Math.round(
            libraries.reduce((sum, lib) => sum + lib.itemCount, 0) / libraries.length
          ) || 0
        }
      });

    } catch (error) {
      console.error('❌ PnP.js libraries enumeration failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PNP_LIBRARIES_FAILED',
          message: 'Libraries enumeration failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /api/pnp/files/:fileId/details
   * Get enhanced file details using PnP.js
   */
  router.get('/files/:fileId/details', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      const { siteUrl } = req.query;

      console.log(`📄 PnP.js file details requested: ${fileId}`);

      if (!siteUrl || typeof siteUrl !== 'string') {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_SITE_URL',
            message: 'Site URL is required for file details retrieval'
          }
        });
        return;
      }

      // Initialize PnP service
      await pnpService.initialize(req.session!.accessToken);

      // Get file details
      const fileDetails = await pnpService.getFileDetails(siteUrl, fileId);

      console.log(`✅ PnP.js file details retrieved: ${fileDetails.Name}`);

      res.json({
        success: true,
        file: fileDetails,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ PnP.js file details failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PNP_FILE_DETAILS_FAILED',
          message: 'File details retrieval failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  });

  /**
   * GET /api/pnp/capabilities
   * Get information about PnP.js service capabilities and features
   */
  router.get('/capabilities', authMiddleware.optionalAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📋 PnP.js capabilities information requested');

      res.json({
        success: true,
        service: 'PnP.js Enhanced SharePoint Service',
        version: '1.0.0',
        capabilities: {
          search: {
            description: 'Cross-site search with advanced filtering',
            features: [
              'Full-text search across multiple SharePoint sites',
              'File type filtering (PDF, DOCX, XLSX, etc.)',
              'Date range filtering',
              'Site-specific search',
              'Library-specific search',
              'Relevance and chronological sorting',
              'Duplicate detection and removal'
            ],
            maxResults: 200,
            supportedSortOptions: ['relevance', 'created', 'modified', 'name']
          },
          libraries: {
            description: 'Document library enumeration and analysis',
            features: [
              'Cross-site library discovery',
              'Library metadata extraction',
              'Item count statistics',
              'Library categorization',
              'Access permissions analysis'
            ]
          },
          files: {
            description: 'Enhanced file details and metadata',
            features: [
              'Extended file metadata',
              'Content type information',
              'Custom property extraction',
              'Version history access',
              'Permission analysis',
              'Relationship mapping'
            ]
          },
          performance: {
            description: 'Optimized for enterprise-scale operations',
            features: [
              'Batched API requests',
              'Intelligent caching',
              'Rate limiting compliance',
              'Error resilience',
              'Retry mechanisms'
            ]
          }
        },
        integrations: [
          'Microsoft Graph API',
          'SharePoint REST API',
          'Azure Active Directory',
          'Office 365 services'
        ],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ PnP.js capabilities request failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PNP_CAPABILITIES_FAILED',
          message: 'Failed to retrieve service capabilities'
        }
      });
    }
  });

  return router;
}