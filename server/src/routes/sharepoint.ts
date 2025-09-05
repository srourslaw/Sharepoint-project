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
        // MOCK DATA for development - return sample SharePoint sites
        const mockSites = {
          value: [
            {
              id: 'bluewaveintelligence.sharepoint.com,12345678-1234-1234-1234-123456789012,87654321-4321-4321-4321-210987654321',
              name: 'BlueWave Intelligence Team Site',
              displayName: 'BlueWave Intelligence',
              webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team',
              description: 'Main team collaboration site',
              siteCollection: {
                hostname: 'bluewaveintelligence.sharepoint.com'
              }
            },
            {
              id: 'bluewaveintelligence.sharepoint.com,11111111-2222-3333-4444-555555555555,66666666-7777-8888-9999-000000000000',
              name: 'Project Documents',
              displayName: 'Project Documents',
              webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/projects',
              description: 'Shared project documentation',
              siteCollection: {
                hostname: 'bluewaveintelligence.sharepoint.com'
              }
            },
            {
              id: 'bluewaveintelligence.sharepoint.com,aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee,ffffffff-0000-1111-2222-333333333333',
              name: 'Knowledge Base',
              displayName: 'Knowledge Base',
              webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/kb',
              description: 'Company knowledge base and documentation',
              siteCollection: {
                hostname: 'bluewaveintelligence.sharepoint.com'
              }
            }
          ]
        };

        res.json({
          success: true,
          data: mockSites,
          message: 'Sites retrieved successfully (demo data)'
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
        // MOCK DATA for development - return sample OneDrive files
        const mockFiles = {
          value: [
            {
              id: '01ABCDEF1234567890ABCDEF1234567890',
              name: 'Project Proposal.docx',
              displayName: 'Project Proposal.docx',
              size: 156743,
              createdDateTime: '2024-12-15T10:30:00Z',
              lastModifiedDateTime: '2024-12-20T14:45:00Z',
              file: {
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              },
              createdBy: {
                user: {
                  displayName: 'Hussein Srour'
                }
              },
              lastModifiedBy: {
                user: {
                  displayName: 'Hussein Srour'
                }
              },
              webUrl: 'https://bluewaveintelligence-my.sharepoint.com/personal/hussein_srour_bluewaveintelligence_com_au/Documents/Project%20Proposal.docx'
            },
            {
              id: '01ABCDEF1234567890ABCDEF1234567891',
              name: 'Financial Analysis.xlsx',
              displayName: 'Financial Analysis.xlsx',
              size: 287456,
              createdDateTime: '2024-12-18T09:15:00Z',
              lastModifiedDateTime: '2024-12-22T16:20:00Z',
              file: {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              },
              createdBy: {
                user: {
                  displayName: 'Hussein Srour'
                }
              },
              lastModifiedBy: {
                user: {
                  displayName: 'Hussein Srour'
                }
              },
              webUrl: 'https://bluewaveintelligence-my.sharepoint.com/personal/hussein_srour_bluewaveintelligence_com_au/Documents/Financial%20Analysis.xlsx'
            },
            {
              id: '01ABCDEF1234567890ABCDEF1234567892',
              name: 'Team Meeting Notes.pdf',
              displayName: 'Team Meeting Notes.pdf',
              size: 45832,
              createdDateTime: '2024-12-10T11:00:00Z',
              lastModifiedDateTime: '2024-12-19T13:30:00Z',
              file: {
                mimeType: 'application/pdf'
              },
              createdBy: {
                user: {
                  displayName: 'Hussein Srour'
                }
              },
              lastModifiedBy: {
                user: {
                  displayName: 'Hussein Srour'
                }
              },
              webUrl: 'https://bluewaveintelligence-my.sharepoint.com/personal/hussein_srour_bluewaveintelligence_com_au/Documents/Team%20Meeting%20Notes.pdf'
            }
          ]
        };

        res.json({
          success: true,
          data: mockFiles,
          message: 'Files retrieved successfully (demo data)'
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
        const { siteId } = req.params;

        // MOCK DATA for development - return sample SharePoint lists
        const mockLists = {
          value: [
            {
              id: 'abcdef12-3456-7890-abcd-ef1234567890',
              displayName: 'Documents',
              name: 'Documents',
              description: 'Document library for team files',
              list: {
                template: 'documentLibrary'
              },
              webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents`
            },
            {
              id: 'fedcba09-8765-4321-fedc-ba0987654321',
              displayName: 'Tasks',
              name: 'Tasks',
              description: 'Team task list',
              list: {
                template: 'tasks'
              },
              webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Lists/Tasks`
            },
            {
              id: '123abc45-6789-0def-1234-56789abcdef0',
              displayName: 'Team Calendar',
              name: 'Events',
              description: 'Team events and meetings',
              list: {
                template: 'events'
              },
              webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Lists/Calendar`
            }
          ]
        };

        res.json({
          success: true,
          data: mockLists,
          message: 'Site lists retrieved successfully (demo data)'
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