import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { AuthService } from '../services/authService';

export const createSharePointRoutes = (authService: AuthService, authMiddleware: AuthMiddleware): Router => {
  const router = Router();

  /**
   * GET /sharepoint/sites
   * Get SharePoint sites accessible to the user
   */
  router.get('/sites',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        // This endpoint should not be used - redirect to sharepoint-advanced
        res.status(410).json({
          error: {
            code: 'ENDPOINT_DEPRECATED',
            message: 'This endpoint has been deprecated. Use /api/sharepoint-advanced/sites instead',
            details: 'Mock data has been removed from this endpoint'
          }
        });
      } catch (error: any) {
        console.error('SharePoint sites error:', error);
        res.status(500).json({
          error: {
            code: 'SHAREPOINT_SITES_ERROR',
            message: 'Failed to retrieve SharePoint sites',
            details: error.message
          }
        });
      }
    }
  );

  /**
   * GET /sharepoint/files
   * Get files from user's OneDrive
   */
  router.get('/files',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        // This endpoint should not be used - redirect to sharepoint-advanced
        res.status(410).json({
          error: {
            code: 'ENDPOINT_DEPRECATED',
            message: 'This endpoint has been deprecated. Use /api/sharepoint-advanced/files instead',
            details: 'Mock data has been removed from this endpoint'
          }
        });
      } catch (error: any) {
        console.error('SharePoint files error:', error);
        res.status(500).json({
          error: {
            code: 'SHAREPOINT_FILES_ERROR',
            message: 'Failed to retrieve files',
            details: error.message
          }
        });
      }
    }
  );

  /**
   * GET /sharepoint/site/:siteId/lists
   * Get lists from a specific SharePoint site
   */
  router.get('/site/:siteId/lists',
    authMiddleware.requireAuth,
    async (req: Request, res: Response): Promise<void> => {
      try {
        // This endpoint should not be used - redirect to sharepoint-advanced
        res.status(410).json({
          error: {
            code: 'ENDPOINT_DEPRECATED',
            message: 'This endpoint has been deprecated. Use /api/sharepoint-advanced/sites/{siteId}/lists instead',
            details: 'Mock data has been removed from this endpoint'
          }
        });
      } catch (error: any) {
        console.error('SharePoint site lists error:', error);
        res.status(500).json({
          error: {
            code: 'SHAREPOINT_LISTS_ERROR',
            message: 'Failed to retrieve site lists',
            details: error.message
          }
        });
      }
    }
  );

  return router;
};