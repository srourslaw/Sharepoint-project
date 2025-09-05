import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AuthMiddleware } from '../middleware/authMiddleware';
import { AuthService } from '../services/authService';
import { SharePointService } from '../services/sharepointService';
import { FileType, SearchOptions, ListOptions } from '../types/sharepoint';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Add any file type restrictions here if needed
    cb(null, true);
  }
});

export const createAdvancedSharePointRoutes = (authService: AuthService, authMiddleware: AuthMiddleware): Router => {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware.requireAuth);

  // Feature flag for enabling real SharePoint API
  const isRealSharePointEnabled = process.env.ENABLE_REAL_SHAREPOINT === 'true';

  // Create SharePoint service instance for each request
  const getSharePointService = (req: Request): SharePointService => {
    if (!req.session?.accessToken) {
      throw new Error('No access token available');
    }
    const graphClient = authService.getGraphClient(req.session.accessToken);
    return new SharePointService(graphClient);
  };

  // ==================== SITES AND LIBRARIES ====================

  /**
   * GET /api/sharepoint-advanced/drives/root/items/root/children
   * Root level - show available SharePoint sites as folders
   */
  router.get('/drives/root/items/root/children', async (req: Request, res: Response): Promise<void> => {
    try {
      if (isRealSharePointEnabled) {
        try {
          console.log('🔍 Getting SharePoint sites for root navigation...');
          const graphClient = authService.getGraphClient(req.session!.accessToken);
          
          // Try multiple approaches to get sites
          let sitesResponse: { value: any[] } = { value: [] };
          
          // FIRST: Try to get the user's specific SharePoint sites directly
          try {
            console.log('🔍 Trying to get specific SharePoint sites by hostname...');
            const specificSiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com').get();
            console.log('✅ Found specific site:', specificSiteResponse.displayName);
            
            // Also try the allcompany subsite
            try {
              const subsiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com:/sites/allcompany').get();
              console.log('✅ Found allcompany subsite:', subsiteResponse.displayName);
              sitesResponse.value = [specificSiteResponse, subsiteResponse];
            } catch (subsiteError: any) {
              console.log('⚠️ Allcompany subsite not accessible, using root site only');
              sitesResponse.value = [specificSiteResponse];
            }
          } catch (specificSiteError: any) {
            console.log('⚠️ Specific site access failed, trying standard approaches...');
            console.error('Specific site error:', specificSiteError.message);
            
            try {
              // Second try: Get all sites (requires Sites.Read.All)
              console.log('🔍 Trying to get all sites...');
              sitesResponse = await graphClient.api('/sites?$select=id,displayName,name,webUrl,description').get();
              console.log(`✅ Found ${sitesResponse.value?.length || 0} sites via /sites endpoint`);
              
              // If we got 0 sites, that might mean no access to the sites collection, try alternatives
              if (!sitesResponse.value || sitesResponse.value.length === 0) {
                console.log('⚠️  No sites returned from /sites endpoint, trying alternative approaches...');
                throw new Error('No sites found, trying alternatives');
              }
            } catch (sitesError: any) {
              console.log('⚠️  /sites endpoint failed, trying alternative approaches...');
              
              try {
                // Third try: Get root site for the tenant
                console.log('🔍 Trying to get tenant root site...');
                const rootSite = await graphClient.api('/sites/root').get();
                console.log('✅ Found tenant root site:', rootSite.displayName);
                sitesResponse.value = [rootSite];
              } catch (rootError: any) {
                console.log('⚠️  Root site access failed, trying user drives...');
                
                try {
                  // Fourth try: Get user's drives (OneDrive, SharePoint libraries they have access to)
                  console.log('🔍 Trying to get user drives...');
                  const drivesResponse = await graphClient.api('/me/drives').get();
                  console.log(`✅ Found ${drivesResponse.value?.length || 0} drives`);
                  
                  // Convert drives to site-like objects
                  sitesResponse.value = drivesResponse.value?.map((drive: any) => ({
                    id: drive.id,
                    displayName: drive.name || 'OneDrive',
                    name: drive.name || 'OneDrive',
                    webUrl: drive.webUrl,
                    description: `${drive.driveType} - ${drive.name}`,
                    driveId: drive.id
                  })) || [];
                } catch (drivesError: any) {
                  console.log('❌ All Graph API attempts failed:', drivesError.message);
                  throw drivesError;
                }
              }
            }
          }
          
          // Convert sites to folder-like items for navigation
          const siteFolders = (sitesResponse.value || []).map((site: any) => ({
            id: site.id,
            name: site.displayName || site.name,
            displayName: site.displayName || site.name,
            folder: { childCount: 1 }, // Mark as folder
            webUrl: site.webUrl,
            description: site.description,
            isFolder: true,
            parentPath: '/',
            extension: '', // No extension for folders
            mimeType: 'folder',
            size: 0,
            createdDateTime: new Date().toISOString(),
            lastModifiedDateTime: new Date().toISOString()
          }));
          
          console.log('✅ Converted', siteFolders.length, 'sites to navigatable folders');
          
          res.json({
            success: true,
            data: {
              items: siteFolders,
              totalCount: siteFolders.length,
              currentPage: 1,
              totalPages: 1
            },
            message: `Found ${siteFolders.length} SharePoint sites`,
            isRealData: true
          });
          return;
        } catch (apiError: any) {
          console.error('❌ Graph API error getting root sites:', apiError);
          console.error('❌ Sites error details:', {
            status: apiError.status || apiError.statusCode,
            message: apiError.message,
            code: apiError.code,
            body: apiError.body || apiError.response?.data
          });
          console.log('🔄 Falling back to mock sites');
        }
      }

      // Mock sites as folders for navigation
      const mockSiteFolders = [
        {
          id: 'site-1',
          name: 'BlueWave Intelligence Team',
          displayName: 'BlueWave Intelligence Team',
          folder: { childCount: 3 },
          isFolder: true,
          parentPath: '/',
          extension: '', // No extension for folders
          mimeType: 'folder',
          size: 0,
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team',
          description: 'Main team collaboration site',
          createdDateTime: '2024-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString()
        },
        {
          id: 'site-2', 
          name: 'Project Documents',
          displayName: 'Project Documents',
          folder: { childCount: 2 },
          isFolder: true,
          parentPath: '/',
          extension: '', // No extension for folders
          mimeType: 'folder',
          size: 0,
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/projects',
          description: 'Shared project documentation',
          createdDateTime: '2024-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString()
        }
      ];

      res.json({
        success: true,
        data: {
          items: mockSiteFolders,
          totalCount: mockSiteFolders.length,
          currentPage: 1,
          totalPages: 1
        },
        message: `Found ${mockSiteFolders.length} SharePoint sites (demo data)`
      });
      
    } catch (error: any) {
      console.error('Root navigation error:', error);
      res.status(500).json({
        error: {
          code: 'ROOT_NAVIGATION_ERROR',
          message: 'Failed to load SharePoint sites',
          details: error.message
        }
      });
    }
  });

  // ==================== SITES AND LIBRARIES ====================

  /**
   * GET /api/sharepoint-advanced/sites
   * Get all SharePoint sites
   */
  router.get('/sites', async (req: Request, res: Response): Promise<void> => {
    try {
      if (isRealSharePointEnabled) {
        // Use direct Graph API calls instead of SharePoint service
        try {
          console.log('🔍 Attempting to get real SharePoint sites via direct Graph API...');
          const graphClient = authService.getGraphClient(req.session!.accessToken);
          const sitesResponse = await graphClient.api('/sites?$select=id,displayName,name,webUrl,description').get();
          
          console.log('✅ Successfully retrieved', sitesResponse.value?.length || 0, 'SharePoint sites');
          res.json({
            success: true,
            data: sitesResponse.value || [],
            message: `Retrieved ${sitesResponse.value?.length || 0} SharePoint sites from your tenant`,
            isRealData: true
          });
          return;
        } catch (sharepointError: any) {
          console.error('❌ SharePoint Graph API error:', sharepointError);
          
          // Fall back to mock data on error
          console.log('🔄 Falling back to mock data due to SharePoint error');
        }
      }

      // MOCK DATA for development - return sample SharePoint sites
      const mockSites = [
        {
          id: 'bluewaveintelligence.sharepoint.com,12345678-1234-1234-1234-123456789012,87654321-4321-4321-4321-210987654321',
          name: 'BlueWave Intelligence Team Site',
          displayName: 'BlueWave Intelligence',
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team',
          description: 'Main team collaboration site',
          siteCollection: {
            hostname: 'bluewaveintelligence.sharepoint.com'
          },
          drives: [
            {
              id: 'b!abcdef123456789012345678901234567890123456789012345678901234567890',
              name: 'Documents',
              driveType: 'documentLibrary',
              itemCount: 42
            }
          ]
        },
        {
          id: 'bluewaveintelligence.sharepoint.com,11111111-2222-3333-4444-555555555555,66666666-7777-8888-9999-000000000000',
          name: 'Project Documents',
          displayName: 'Project Documents', 
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/projects',
          description: 'Shared project documentation',
          siteCollection: {
            hostname: 'bluewaveintelligence.sharepoint.com'
          },
          drives: [
            {
              id: 'b!fedcba098765432109876543210987654321098765432109876543210987654321',
              name: 'Project Files',
              driveType: 'documentLibrary',
              itemCount: 28
            }
          ]
        },
        {
          id: 'bluewaveintelligence.sharepoint.com,aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee,ffffffff-0000-1111-2222-333333333333',
          name: 'Knowledge Base',
          displayName: 'Knowledge Base',
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/kb',
          description: 'Company knowledge base and documentation',
          siteCollection: {
            hostname: 'bluewaveintelligence.sharepoint.com'
          },
          drives: [
            {
              id: 'b!123abc456789def012345678901234567890123456789012345678901234567890',
              name: 'Knowledge Articles',
              driveType: 'documentLibrary',
              itemCount: 67
            }
          ]
        }
      ];
      
      res.json({
        success: true,
        data: mockSites,
        message: `Retrieved ${mockSites.length} SharePoint sites (demo data)`
      });
    } catch (error: any) {
      console.error('Get sites error:', error);
      res.status(500).json({
        error: {
          code: 'GET_SITES_ERROR',
          message: 'Failed to retrieve SharePoint sites',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/sites/:siteId
   * Get specific SharePoint site
   */
  router.get('/sites/:siteId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteId } = req.params;
      const sharePointService = getSharePointService(req);
      
      const site = await sharePointService.getSite(siteId);
      
      res.json({
        success: true,
        data: site,
        message: 'Site retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get site error:', error);
      res.status(500).json({
        error: {
          code: 'GET_SITE_ERROR',
          message: 'Failed to retrieve SharePoint site',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/sites/:siteId/drives
   * Get document libraries for a site
   */
  router.get('/sites/:siteId/drives', async (req: Request, res: Response): Promise<void> => {
    try {
      // MOCK DATA for development - return sample document libraries
      const mockDrives = [
        {
          id: 'b!abcdef123456789012345678901234567890123456789012345678901234567890',
          name: 'Documents',
          displayName: 'Documents',
          driveType: 'documentLibrary',
          itemCount: 42,
          siteId: req.params.siteId
        },
        {
          id: 'b!fedcba098765432109876543210987654321098765432109876543210987654321',
          name: 'Shared Documents',
          displayName: 'Shared Documents',
          driveType: 'documentLibrary',
          itemCount: 28,
          siteId: req.params.siteId
        }
      ];
      
      res.json({
        success: true,
        data: mockDrives,
        message: `Retrieved ${mockDrives.length} document libraries (demo data)`
      });
    } catch (error: any) {
      console.error('Get drives error:', error);
      res.status(500).json({
        error: {
          code: 'GET_DRIVES_ERROR',
          message: 'Failed to retrieve document libraries',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/sites/:siteId/libraries
   * Get document libraries for a site (alias for drives endpoint)
   */
  router.get('/sites/:siteId/libraries', async (req: Request, res: Response): Promise<void> => {
    try {
      if (isRealSharePointEnabled) {
        // Use real SharePoint API  
        const { siteId } = req.params;
        const sharePointService = getSharePointService(req);
        const libraries = await sharePointService.getDocumentLibraries(siteId);
        
        res.json({
          success: true,
          data: libraries,
          message: `Retrieved ${libraries.length} libraries`
        });
        return;
      }

      // MOCK DATA for development - return sample libraries
      const mockLibraries = [
        {
          id: 'abcdef12-3456-7890-abcd-ef1234567890',
          displayName: 'Documents',
          name: 'Documents',
          description: 'Document library for team files',
          itemCount: 42,
          parentSite: {
            id: req.params.siteId,
            displayName: 'Team Site'
          },
          driveId: 'b!abcdef123456789012345678901234567890123456789012345678901234567890',
          webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents`
        },
        {
          id: 'fedcba09-8765-4321-fedc-ba0987654321',
          displayName: 'Shared Files',
          name: 'Shared Files',
          description: 'Shared project files',
          itemCount: 28,
          parentSite: {
            id: req.params.siteId,
            displayName: 'Team Site'
          },
          driveId: 'b!fedcba098765432109876543210987654321098765432109876543210987654321',
          webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Files`
        }
      ];
      
      res.json({
        success: true,
        data: mockLibraries,
        message: `Retrieved ${mockLibraries.length} libraries (demo data)`
      });
    } catch (error: any) {
      console.error('Get libraries error:', error);
      res.status(500).json({
        error: {
          code: 'GET_LIBRARIES_ERROR',
          message: 'Failed to retrieve libraries',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/me/drive
   * Get user's OneDrive
   */
  router.get('/me/drive', async (req: Request, res: Response): Promise<void> => {
    try {
      const sharePointService = getSharePointService(req);
      const drive = await sharePointService.getUserDrive();
      
      res.json({
        success: true,
        data: drive,
        message: 'OneDrive retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get user drive error:', error);
      res.status(500).json({
        error: {
          code: 'GET_USER_DRIVE_ERROR',
          message: 'Failed to retrieve OneDrive',
          details: error.message
        }
      });
    }
  });

  // ==================== FILES AND FOLDERS ====================

  /**
   * GET /api/sharepoint-advanced/drives/:driveId/items/:itemId?/children
   * List items in a folder
   */
  router.get('/drives/:driveId/items/:itemId?/children', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      console.log(`📂 SITE BROWSING REQUEST: driveId="${driveId}", itemId="${itemId || 'root'}"`);
      console.log('📂 Full request params:', req.params);
      console.log('📂 Full request path:', req.path);
      
      if (isRealSharePointEnabled) {
        try {
          console.log(`🔍 Getting real SharePoint items for driveId: ${driveId}, itemId: ${itemId || 'root'}`);
          const graphClient = authService.getGraphClient(req.session!.accessToken);
          
          // If driveId looks like a site ID, we need to get the site's default drive first
          if (driveId && driveId.includes(',')) {
            console.log('🔍 DriveId looks like a site ID, getting site drives...');
            try {
              const drivesResponse = await graphClient.api(`/sites/${driveId}/drives`).get();
              console.log(`✅ Found ${drivesResponse.value?.length || 0} drives for site`);
              
              if (drivesResponse.value && drivesResponse.value.length > 0) {
                // Use the first drive (usually the default document library)
                const defaultDrive = drivesResponse.value[0];
                console.log(`🔍 Using default drive: ${defaultDrive.name} (${defaultDrive.id})`);
                
                // Get items from the default drive's root
                const itemsPath = itemId ? `/drives/${defaultDrive.id}/items/${itemId}/children` : `/drives/${defaultDrive.id}/root/children`;
                console.log(`🔍 Calling: ${itemsPath}`);
                const itemsResponse = await graphClient.api(itemsPath).get();
                
                console.log(`✅ Found ${itemsResponse.value?.length || 0} items in site drive`);
                res.json({
                  success: true,
                  data: itemsResponse.value || [],
                  message: `Retrieved ${itemsResponse.value?.length || 0} items from SharePoint`
                });
                return;
              }
            } catch (siteError: any) {
              console.error('❌ Site drives error:', siteError.message);
              // Fall through to try as regular drive
            }
          }
          
          // Handle specific SharePoint sites
          if (driveId === 'netorgft18344752.sharepoint.com') {
            console.log('🔍 Accessing Communication site - getting drives first...');
            
            // First get the site drives to find the correct drive ID
            try {
              const siteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com/drives').get();
              console.log(`📂 Found ${siteResponse.value?.length || 0} drives in Communication site`);
              
              if (siteResponse.value && siteResponse.value.length > 0) {
                // Use the first drive (usually the default document library)
                const defaultDrive = siteResponse.value[0];
                console.log(`🔍 Using drive: ${defaultDrive.id} (${defaultDrive.name})`);
                
                const itemsResponse = await graphClient.api(`/drives/${defaultDrive.id}/root/children`).get();
                console.log(`✅ Found ${itemsResponse.value?.length || 0} items in Communication site`);
                
                // Map SharePoint items to expected frontend format
                const mappedItems = (itemsResponse.value || []).map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  displayName: item.name, // Frontend expects displayName
                  size: item.size || 0,
                  webUrl: item.webUrl,
                  mimeType: item.file?.mimeType || (item.folder ? 'folder' : 'application/octet-stream'),
                  extension: item.file ? (item.name.split('.').pop() || '') : '',
                  createdDateTime: item.createdDateTime,
                  lastModifiedDateTime: item.lastModifiedDateTime,
                  parentPath: item.parentReference?.path || '/',
                  isFolder: !!item.folder,
                  lastModifiedBy: item.lastModifiedBy?.user || { displayName: 'Unknown', email: '' },
                  createdBy: item.createdBy?.user || { displayName: 'Unknown', email: '' }
                }));
                
                res.json({
                  success: true,
                  data: {
                    items: mappedItems,
                    totalCount: mappedItems.length,
                    currentPage: 1,
                    totalPages: 1
                  },
                  message: `Retrieved ${mappedItems.length} items from Communication site`
                });
                return;
              }
            } catch (driveError: any) {
              console.error('❌ Error getting Communication site drives:', driveError.message);
            }
          } else if (driveId === 'netorgft18344752.sharepoint.com:sites:allcompany') {
            console.log('🔍 Accessing All Company subsite - getting drives first...');
            
            // First get the subsite drives to find the correct drive ID
            try {
              const subsiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com:/sites/allcompany:/drives').get();
              console.log(`📂 Found ${subsiteResponse.value?.length || 0} drives in All Company subsite`);
              
              if (subsiteResponse.value && subsiteResponse.value.length > 0) {
                // Use the first drive (usually the default document library)
                const defaultDrive = subsiteResponse.value[0];
                console.log(`🔍 Using drive: ${defaultDrive.id} (${defaultDrive.name})`);
                
                const itemsResponse = await graphClient.api(`/drives/${defaultDrive.id}/root/children`).get();
                console.log(`✅ Found ${itemsResponse.value?.length || 0} items in All Company subsite`);
                
                // Map SharePoint items to expected frontend format
                const mappedItems = (itemsResponse.value || []).map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  displayName: item.name, // Frontend expects displayName
                  size: item.size || 0,
                  webUrl: item.webUrl,
                  mimeType: item.file?.mimeType || (item.folder ? 'folder' : 'application/octet-stream'),
                  extension: item.file ? (item.name.split('.').pop() || '') : '',
                  createdDateTime: item.createdDateTime,
                  lastModifiedDateTime: item.lastModifiedDateTime,
                  parentPath: item.parentReference?.path || '/',
                  isFolder: !!item.folder,
                  lastModifiedBy: item.lastModifiedBy?.user || { displayName: 'Unknown', email: '' },
                  createdBy: item.createdBy?.user || { displayName: 'Unknown', email: '' }
                }));
                
                res.json({
                  success: true,
                  data: {
                    items: mappedItems,
                    totalCount: mappedItems.length,
                    currentPage: 1,
                    totalPages: 1
                  },
                  message: `Retrieved ${mappedItems.length} items from All Company subsite`
                });
                return;
              }
            } catch (driveError: any) {
              console.error('❌ Error getting All Company subsite drives:', driveError.message);
            }
          }
          
          // Try as regular drive ID
          const itemsPath = itemId ? `/drives/${driveId}/items/${itemId}/children` : `/drives/${driveId}/root/children`;
          console.log(`🔍 Calling: ${itemsPath}`);
          const itemsResponse = await graphClient.api(itemsPath).get();
          
          console.log(`✅ Found ${itemsResponse.value?.length || 0} items in drive`);
          res.json({
            success: true,
            data: itemsResponse.value || [],
            message: `Retrieved ${itemsResponse.value?.length || 0} items from SharePoint`
          });
          return;
          
        } catch (sharepointError: any) {
          console.error('❌ SharePoint drive items error:', sharepointError);
          console.log('🔄 Falling back to mock data due to SharePoint error');
        }
      }
      
      // MOCK DATA fallback - return sample files and folders
      const mockItems = [
        {
          id: '01ABCDEF1234567890ABCDEF1234567890',
          name: 'Project Proposal.docx',
          displayName: 'Project Proposal.docx',
          size: 156743,
          createdDateTime: '2024-12-15T10:30:00Z',
          lastModifiedDateTime: '2024-12-20T14:45:00Z',
          file: {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            hashes: {
              quickXorHash: 'abc123def456'
            }
          },
          createdBy: {
            user: {
              displayName: 'Hussein Srour',
              email: 'hussein.srour@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Hussein Srour',
              email: 'hussein.srour@bluewaveintelligence.com.au'
            }
          },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Project%20Proposal.docx'
        },
        {
          id: '01ABCDEF1234567890ABCDEF1234567891',
          name: 'Financial Analysis.xlsx',
          displayName: 'Financial Analysis.xlsx',
          size: 287456,
          createdDateTime: '2024-12-18T09:15:00Z',
          lastModifiedDateTime: '2024-12-22T16:20:00Z',
          file: {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            hashes: {
              quickXorHash: 'def456ghi789'
            }
          },
          createdBy: {
            user: {
              displayName: 'Sarah Johnson',
              email: 'sarah.johnson@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Hussein Srour',
              email: 'hussein.srour@bluewaveintelligence.com.au'
            }
          },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Financial%20Analysis.xlsx'
        },
        {
          id: '01ABCDEF1234567890ABCDEF1234567892',
          name: 'Reports',
          displayName: 'Reports',
          folder: {
            childCount: 8
          },
          createdDateTime: '2024-11-05T14:20:00Z',
          lastModifiedDateTime: '2024-12-21T11:30:00Z',
          createdBy: {
            user: {
              displayName: 'Admin User',
              email: 'admin@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Hussein Srour',
              email: 'hussein.srour@bluewaveintelligence.com.au'
            }
          },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Reports'
        },
        {
          id: '01ABCDEF1234567890ABCDEF1234567893',
          name: 'Team Meeting Notes.pdf',
          displayName: 'Team Meeting Notes.pdf',
          size: 45832,
          createdDateTime: '2024-12-10T11:00:00Z',
          lastModifiedDateTime: '2024-12-19T13:30:00Z',
          file: {
            mimeType: 'application/pdf',
            hashes: {
              quickXorHash: 'ghi789jkl012'
            }
          },
          createdBy: {
            user: {
              displayName: 'Mike Chen',
              email: 'mike.chen@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Mike Chen',
              email: 'mike.chen@bluewaveintelligence.com.au'
            }
          },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Team%20Meeting%20Notes.pdf'
        }
      ];
      
      res.json({
        success: true,
        data: mockItems,
        message: `Retrieved ${mockItems.length} items (demo data)`
      });
    } catch (error: any) {
      console.error('List items error:', error);
      res.status(500).json({
        error: {
          code: 'LIST_ITEMS_ERROR',
          message: 'Failed to retrieve folder contents',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/sites/:siteId/drives/default/root/children
   * List root files in site's default document library (alias for drives endpoint)
   */
  router.get('/sites/:siteId/drives/default/root/children', async (req: Request, res: Response): Promise<void> => {
    try {
      if (isRealSharePointEnabled) {
        // Use direct Graph API calls instead of SharePoint service
        try {
          const { siteId } = req.params;
          console.log('🔍 Getting files from site:', siteId);
          
          const graphClient = authService.getGraphClient(req.session!.accessToken);
          
          // Get site's default drive first
          const drivesResponse = await graphClient.api(`/sites/${siteId}/drives`).get();
          const defaultDrive = drivesResponse.value.find((drive: any) => 
            drive.name === 'Documents' || drive.driveType === 'documentLibrary'
          );
          
          if (!defaultDrive) {
            throw new Error('Default document library not found');
          }
          
          // Get files from the root of the drive
          const filesResponse = await graphClient.api(`/drives/${defaultDrive.id}/root/children`).get();
          
          console.log('✅ Retrieved', filesResponse.value?.length || 0, 'files from site');
          
          // Return in the expected paginated format
          res.json({
            success: true,
            data: {
              items: filesResponse.value || [],
              totalCount: filesResponse.value?.length || 0,
              currentPage: 1,
              totalPages: 1
            },
            message: `Retrieved ${filesResponse.value?.length || 0} files from site`,
            isRealData: true
          });
          return;
        } catch (apiError: any) {
          console.error('❌ Graph API error getting site files:', apiError);
          console.error('❌ Error details:', {
            status: apiError.status || apiError.statusCode,
            message: apiError.message,
            code: apiError.code,
            body: apiError.body || apiError.response?.data
          });
          console.log('🔄 Falling back to mock data due to API error');
        }
      }

      // MOCK DATA for development - return sample files specific to site
      const { siteId } = req.params;
      
      // Customize mock data based on site ID for variety
      const siteSpecificFiles = [
        {
          id: `01${siteId.slice(0, 30)}567890ABCDEF1234567890`,
          name: 'Site Overview.docx',
          displayName: 'Site Overview.docx',
          size: 89432,
          createdDateTime: '2024-12-01T08:15:00Z',
          lastModifiedDateTime: '2024-12-23T10:20:00Z',
          file: {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            hashes: {
              quickXorHash: `hash${siteId.slice(-8)}`
            }
          },
          createdBy: {
            user: {
              displayName: 'Team Admin',
              email: 'admin@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Hussein Srour',
              email: 'hussein.srour@bluewaveintelligence.com.au'
            }
          },
          webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Site%20Overview.docx`
        },
        {
          id: `02${siteId.slice(0, 30)}567890ABCDEF1234567891`,
          name: 'Quarterly Report.pdf',
          displayName: 'Quarterly Report.pdf',
          size: 234567,
          createdDateTime: '2024-12-05T14:30:00Z',
          lastModifiedDateTime: '2024-12-20T16:45:00Z',
          file: {
            mimeType: 'application/pdf',
            hashes: {
              quickXorHash: `pdf${siteId.slice(-6)}`
            }
          },
          createdBy: {
            user: {
              displayName: 'Sarah Johnson',
              email: 'sarah.johnson@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Sarah Johnson',
              email: 'sarah.johnson@bluewaveintelligence.com.au'
            }
          },
          webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Quarterly%20Report.pdf`
        },
        {
          id: `03${siteId.slice(0, 30)}567890ABCDEF1234567892`,
          name: 'Archive',
          displayName: 'Archive',
          folder: {
            childCount: 15
          },
          createdDateTime: '2024-10-15T09:00:00Z',
          lastModifiedDateTime: '2024-12-18T14:22:00Z',
          createdBy: {
            user: {
              displayName: 'System',
              email: 'system@bluewaveintelligence.com.au'
            }
          },
          lastModifiedBy: {
            user: {
              displayName: 'Hussein Srour',
              email: 'hussein.srour@bluewaveintelligence.com.au'
            }
          },
          webUrl: `https://bluewaveintelligence.sharepoint.com/sites/team/Shared%20Documents/Archive`
        }
      ];
      
      res.json({
        success: true,
        data: {
          items: siteSpecificFiles,
          totalCount: siteSpecificFiles.length,
          currentPage: 1,
          totalPages: 1
        },
        message: `Retrieved ${siteSpecificFiles.length} items from site (demo data)`
      });
    } catch (error: any) {
      console.error('List site files error:', error);
      res.status(500).json({
        error: {
          code: 'LIST_SITE_FILES_ERROR',
          message: 'Failed to retrieve site files',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/files/:fileId
   * Get file metadata (simplified endpoint for file preview)
   */
  router.get('/files/:fileId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      
      if (isRealSharePointEnabled) {
        try {
          console.log('🔍 Getting real file metadata for ID:', fileId);
          const graphClient = authService.getGraphClient(req.session!.accessToken);
          
          // We need to find the file in the correct drive
          // First, try to find which drive contains this file by checking both our SharePoint sites
          let fileResponse = null;
          
          // Try Communication site first
          try {
            console.log('🔍 Searching Communication site for file...');
            const commSiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com/drives').get();
            
            for (const drive of commSiteResponse.value || []) {
              try {
                fileResponse = await graphClient.api(`/drives/${drive.id}/items/${fileId}`).get();
                console.log(`✅ Found file in Communication site drive: ${drive.name}`);
                break;
              } catch (driveError) {
                // File not in this drive, continue searching
              }
            }
          } catch (siteError) {
            console.log('⚠️ Could not search Communication site');
          }
          
          // If not found in Communication site, try All Company subsite
          if (!fileResponse) {
            try {
              console.log('🔍 Searching All Company subsite for file...');
              const subsiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com:/sites/allcompany:/drives').get();
              
              for (const drive of subsiteResponse.value || []) {
                try {
                  fileResponse = await graphClient.api(`/drives/${drive.id}/items/${fileId}`).get();
                  console.log(`✅ Found file in All Company drive: ${drive.name}`);
                  break;
                } catch (driveError) {
                  // File not in this drive, continue searching
                }
              }
            } catch (subsiteError) {
              console.log('⚠️ Could not search All Company subsite');
            }
          }
          
          if (!fileResponse) {
            throw new Error(`File with ID ${fileId} not found in any accessible drive`);
          }
          
          console.log('✅ Retrieved real file metadata:', fileResponse.name);
          
          res.json({
            success: true,
            data: {
              id: fileResponse.id,
              name: fileResponse.name,
              displayName: fileResponse.name,
              size: fileResponse.size || 0,
              webUrl: fileResponse.webUrl,
              mimeType: fileResponse.file?.mimeType || 'application/octet-stream',
              extension: fileResponse.name.split('.').pop() || '',
              createdDateTime: fileResponse.createdDateTime,
              lastModifiedDateTime: fileResponse.lastModifiedDateTime,
              parentPath: fileResponse.parentReference?.path || '/',
              isFolder: !!fileResponse.folder,
              lastModifiedBy: fileResponse.lastModifiedBy?.user || { displayName: 'Unknown', email: '' },
              createdBy: fileResponse.createdBy?.user || { displayName: 'Unknown', email: '' }
            },
            message: 'File metadata retrieved successfully',
            isRealData: true
          });
          return;
        } catch (apiError: any) {
          console.error('❌ Graph API error getting file metadata:', apiError);
          console.log('🔄 Falling back to mock data for file preview');
        }
      }
      
      // Use safe mock data that matches our AI service
      // Check if this is a mock file ID pattern
      if (fileId.includes('bluewaveintelligence.sharepoin') || fileId.startsWith('01') || fileId.startsWith('02') || fileId.startsWith('03')) {
        console.log('🔄 Recognized mock file ID pattern, using mock data for preview');
      }

      // Create dynamic mock file based on the fileId pattern
      let dynamicMockFile = null;
      if (fileId.includes('01') && fileId.includes('bluewaveintelligence')) {
        dynamicMockFile = {
          id: fileId,
          name: 'Site Overview.docx',
          displayName: 'Site Overview.docx',
          size: 89432,
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/documents/site-overview.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
          createdDateTime: '2024-12-01T08:15:00Z',
          lastModifiedDateTime: '2024-12-23T10:20:00Z',
          parentPath: '/Documents',
          isFolder: false,
          lastModifiedBy: { displayName: 'Team Admin', email: 'admin@bluewaveintelligence.com.au' },
          createdBy: { displayName: 'Team Admin', email: 'admin@bluewaveintelligence.com.au' }
        };
      } else if (fileId.includes('02') && fileId.includes('bluewaveintelligence')) {
        dynamicMockFile = {
          id: fileId,
          name: 'Quarterly Report.pdf',
          displayName: 'Quarterly Report.pdf',
          size: 234578,
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/documents/quarterly-report.pdf',
          mimeType: 'application/pdf',
          extension: 'pdf',
          createdDateTime: '2024-11-15T14:30:00Z',
          lastModifiedDateTime: '2024-12-18T16:45:00Z',
          parentPath: '/Documents',
          isFolder: false,
          lastModifiedBy: { displayName: 'Sarah Johnson', email: 'sarah.johnson@bluewaveintelligence.com.au' },
          createdBy: { displayName: 'Sarah Johnson', email: 'sarah.johnson@bluewaveintelligence.com.au' }
        };
      } else if (fileId.includes('03') && fileId.includes('bluewaveintelligence')) {
        dynamicMockFile = {
          id: fileId,
          name: 'Archive',
          displayName: 'Archive',
          folder: { childCount: 5 },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team/documents/archive',
          mimeType: 'folder',
          extension: '',
          createdDateTime: '2024-10-15T09:00:00Z',
          lastModifiedDateTime: '2024-12-18T14:22:00Z',
          parentPath: '/Documents',
          isFolder: true,
          lastModifiedBy: { displayName: 'System', email: 'system@bluewaveintelligence.com.au' },
          createdBy: { displayName: 'System', email: 'system@bluewaveintelligence.com.au' }
        };
      } else if (fileId === 'site-1') {
        dynamicMockFile = {
          id: fileId,
          name: 'BlueWave Intelligence Team',
          displayName: 'BlueWave Intelligence Team',
          folder: { childCount: 3 },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/team',
          mimeType: 'folder',
          extension: '',
          createdDateTime: '2024-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/',
          isFolder: true,
          lastModifiedBy: { displayName: 'System', email: 'system@bluewaveintelligence.com.au' },
          createdBy: { displayName: 'System', email: 'system@bluewaveintelligence.com.au' }
        };
      } else if (fileId === 'site-2') {
        dynamicMockFile = {
          id: fileId,
          name: 'Project Documents',
          displayName: 'Project Documents',
          folder: { childCount: 2 },
          webUrl: 'https://bluewaveintelligence.sharepoint.com/sites/projects',
          mimeType: 'folder',
          extension: '',
          createdDateTime: '2024-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/',
          isFolder: true,
          lastModifiedBy: { displayName: 'System', email: 'system@bluewaveintelligence.com.au' },
          createdBy: { displayName: 'System', email: 'system@bluewaveintelligence.com.au' }
        };
      }

      if (dynamicMockFile) {
        res.json({
          success: true,
          data: dynamicMockFile,
          message: 'File metadata retrieved (demo data)'
        });
        return;
      }

      const mockFileDatabase: Record<string, any> = {
        'safe-file-1': {
          id: 'safe-file-1',
          name: 'Business Plan.docx',
          displayName: 'Business Plan.docx',
          size: 32768,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/business-plan.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extension: 'docx',
          createdDateTime: '2023-01-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/Documents',
          isFolder: false,
          lastModifiedBy: {
            displayName: 'John Doe',
            email: 'john.doe@company.com'
          },
          createdBy: {
            displayName: 'John Doe',
            email: 'john.doe@company.com'
          }
        },
        'safe-file-2': {
          id: 'safe-file-2',
          name: 'Financial Report.xlsx',
          displayName: 'Financial Report.xlsx',
          size: 65536,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/financial-report.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: 'xlsx',
          createdDateTime: '2023-02-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/Documents',
          isFolder: false,
          lastModifiedBy: {
            displayName: 'Jane Smith',
            email: 'jane.smith@company.com'
          },
          createdBy: {
            displayName: 'Jane Smith',
            email: 'jane.smith@company.com'
          }
        },
        'safe-file-3': {
          id: 'safe-file-3',
          name: 'Presentation.pptx',
          displayName: 'Presentation.pptx',
          size: 98304,
          webUrl: 'https://company.sharepoint.com/sites/portal/documents/presentation.pptx',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          extension: 'pptx',
          createdDateTime: '2023-03-01T00:00:00Z',
          lastModifiedDateTime: new Date().toISOString(),
          parentPath: '/Documents',
          isFolder: false,
          lastModifiedBy: {
            displayName: 'Bob Johnson',
            email: 'bob.johnson@company.com'
          },
          createdBy: {
            displayName: 'Bob Johnson',
            email: 'bob.johnson@company.com'
          }
        }
      };
      
      const file = mockFileDatabase[fileId];
      if (!file) {
        res.status(404).json({
          error: {
            code: 'FILE_NOT_FOUND',
            message: `File with ID ${fileId} not found`
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: file,
        message: 'File metadata retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get file metadata error:', error);
      res.status(500).json({
        error: {
          code: 'GET_FILE_ERROR',
          message: 'Failed to retrieve file metadata',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/drives/:driveId/items/:itemId
   * Get item metadata
   */
  router.get('/drives/:driveId/items/:itemId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      const sharePointService = getSharePointService(req);
      
      const item = await sharePointService.getItemMetadata(driveId, itemId);
      
      res.json({
        success: true,
        data: item,
        message: 'Item metadata retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get item metadata error:', error);
      res.status(500).json({
        error: {
          code: 'GET_ITEM_ERROR',
          message: 'Failed to retrieve item metadata',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/drives/:driveId/items/:itemId/content
   * Download file content
   */
  router.get('/drives/:driveId/items/:itemId/content', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      const { extractText = 'false', format = 'binary' } = req.query;
      
      const sharePointService = getSharePointService(req);
      const fileContent = await sharePointService.downloadFile(
        driveId, 
        itemId, 
        extractText === 'true'
      );
      
      // Get file metadata for proper headers
      const item = await sharePointService.getItemMetadata(driveId, itemId);
      
      if (format === 'json') {
        // Return file content as JSON with metadata
        res.json({
          success: true,
          data: {
            ...fileContent,
            content: fileContent.content.toString('base64'), // Convert to base64 for JSON
            item: item
          },
          message: 'File content retrieved successfully'
        });
      } else {
        // Return raw file content
        res.set({
          'Content-Type': fileContent.mimeType,
          'Content-Length': fileContent.size.toString(),
          'Content-Disposition': `attachment; filename="${item.name}"`,
          'X-File-Size': fileContent.size.toString(),
          'X-File-Type': fileContent.mimeType
        });
        
        if (fileContent.extractedText) {
          res.set('X-Extracted-Text-Length', fileContent.extractedText.length.toString());
        }
        
        res.send(fileContent.content);
      }
    } catch (error: any) {
      console.error('Download file error:', error);
      res.status(500).json({
        error: {
          code: 'DOWNLOAD_FILE_ERROR',
          message: 'Failed to download file',
          details: error.message
        }
      });
    }
  });

  /**
   * POST /api/sharepoint-advanced/drives/:driveId/items/:parentId/children
   * Upload files
   */
  router.post('/drives/:driveId/items/:parentId/children', 
    upload.array('files', 10), 
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { driveId, parentId } = req.params;
        const files = req.files as Express.Multer.File[];
        const { conflictBehavior = 'rename' } = req.body;
        
        if (!files || files.length === 0) {
          res.status(400).json({
            error: {
              code: 'NO_FILES_PROVIDED',
              message: 'No files were uploaded'
            }
          });
          return;
        }

        const sharePointService = getSharePointService(req);
        const uploadResults = [];
        
        for (const file of files) {
          try {
            const result = await sharePointService.uploadFile(driveId, parentId, {
              fileName: file.originalname,
              content: file.buffer,
              mimeType: file.mimetype,
              conflictBehavior: conflictBehavior as any
            });
            
            uploadResults.push({
              success: true,
              fileName: file.originalname,
              item: result
            });
          } catch (error: any) {
            uploadResults.push({
              success: false,
              fileName: file.originalname,
              error: error.message
            });
          }
        }
        
        const successCount = uploadResults.filter(r => r.success).length;
        
        res.json({
          success: successCount > 0,
          data: uploadResults,
          message: `Uploaded ${successCount} of ${files.length} files successfully`
        });
      } catch (error: any) {
        console.error('Upload files error:', error);
        res.status(500).json({
          error: {
            code: 'UPLOAD_FILES_ERROR',
            message: 'Failed to upload files',
            details: error.message
          }
        });
      }
    }
  );

  /**
   * PUT /api/sharepoint-advanced/drives/:driveId/items/:itemId/content
   * Update file content
   */
  router.put('/drives/:driveId/items/:itemId/content', 
    upload.single('file'), 
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { driveId, itemId } = req.params;
        const file = req.file;
        
        if (!file) {
          res.status(400).json({
            error: {
              code: 'NO_FILE_PROVIDED',
              message: 'No file was provided for update'
            }
          });
          return;
        }

        const sharePointService = getSharePointService(req);
        const result = await sharePointService.updateFile(
          driveId, 
          itemId, 
          file.buffer, 
          file.mimetype
        );
        
        res.json({
          success: true,
          data: result,
          message: 'File updated successfully'
        });
      } catch (error: any) {
        console.error('Update file error:', error);
        res.status(500).json({
          error: {
            code: 'UPDATE_FILE_ERROR',
            message: 'Failed to update file',
            details: error.message
          }
        });
      }
    }
  );

  /**
   * DELETE /api/sharepoint-advanced/drives/:driveId/items/:itemId
   * Delete file or folder
   */
  router.delete('/drives/:driveId/items/:itemId', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      const sharePointService = getSharePointService(req);
      
      await sharePointService.deleteItem(driveId, itemId);
      
      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error: any) {
      console.error('Delete item error:', error);
      res.status(500).json({
        error: {
          code: 'DELETE_ITEM_ERROR',
          message: 'Failed to delete item',
          details: error.message
        }
      });
    }
  });

  // ==================== ADVANCED OPERATIONS ====================

  /**
   * GET /api/sharepoint-advanced/search
   * Search across drives
   */
  router.get('/search', async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        q: query, 
        driveId, 
        fileType, 
        modifiedAfter, 
        modifiedBefore,
        sizeMin,
        sizeMax,
        limit = '50',
        offset = '0'
      } = req.query;
      
      if (!query) {
        res.status(400).json({
          error: {
            code: 'MISSING_QUERY',
            message: 'Search query is required'
          }
        });
        return;
      }

      const options: SearchOptions = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };
      
      if (fileType) options.fileType = fileType as FileType;
      if (modifiedAfter) options.modifiedAfter = new Date(modifiedAfter as string);
      if (modifiedBefore) options.modifiedBefore = new Date(modifiedBefore as string);
      if (sizeMin) options.sizeMin = parseInt(sizeMin as string);
      if (sizeMax) options.sizeMax = parseInt(sizeMax as string);

      const sharePointService = getSharePointService(req);
      const results = await sharePointService.searchItems(
        query as string, 
        driveId as string, 
        options
      );
      
      res.json({
        success: true,
        data: results,
        message: `Found ${results.length} items matching "${query}"`
      });
    } catch (error: any) {
      console.error('Search error:', error);
      res.status(500).json({
        error: {
          code: 'SEARCH_ERROR',
          message: 'Search failed',
          details: error.message
        }
      });
    }
  });

  /**
   * POST /api/sharepoint-advanced/drives/:driveId/items/:parentId/folders
   * Create new folder
   */
  router.post('/drives/:driveId/items/:parentId/folders', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, parentId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        res.status(400).json({
          error: {
            code: 'MISSING_FOLDER_NAME',
            message: 'Folder name is required'
          }
        });
        return;
      }

      const sharePointService = getSharePointService(req);
      const folder = await sharePointService.createFolder(driveId, parentId, name);
      
      res.json({
        success: true,
        data: folder,
        message: 'Folder created successfully'
      });
    } catch (error: any) {
      console.error('Create folder error:', error);
      res.status(500).json({
        error: {
          code: 'CREATE_FOLDER_ERROR',
          message: 'Failed to create folder',
          details: error.message
        }
      });
    }
  });

  /**
   * POST /api/sharepoint-advanced/drives/:driveId/items/:itemId/copy
   * Copy item
   */
  router.post('/drives/:driveId/items/:itemId/copy', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      const { targetDriveId, targetParentId, newName } = req.body;
      
      if (!targetDriveId || !targetParentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_TARGET_INFO',
            message: 'Target drive ID and parent ID are required'
          }
        });
        return;
      }

      const sharePointService = getSharePointService(req);
      await sharePointService.copyItem(driveId, itemId, targetDriveId, targetParentId, newName);
      
      res.json({
        success: true,
        message: 'Item copy initiated successfully'
      });
    } catch (error: any) {
      console.error('Copy item error:', error);
      res.status(500).json({
        error: {
          code: 'COPY_ITEM_ERROR',
          message: 'Failed to copy item',
          details: error.message
        }
      });
    }
  });

  /**
   * PATCH /api/sharepoint-advanced/drives/:driveId/items/:itemId/move
   * Move item
   */
  router.patch('/drives/:driveId/items/:itemId/move', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      const { targetParentId, newName } = req.body;
      
      if (!targetParentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_TARGET_PARENT',
            message: 'Target parent ID is required'
          }
        });
        return;
      }

      const sharePointService = getSharePointService(req);
      const result = await sharePointService.moveItem(driveId, itemId, targetParentId, newName);
      
      res.json({
        success: true,
        data: result,
        message: 'Item moved successfully'
      });
    } catch (error: any) {
      console.error('Move item error:', error);
      res.status(500).json({
        error: {
          code: 'MOVE_ITEM_ERROR',
          message: 'Failed to move item',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/drives/:driveId/items/:itemId/versions
   * Get file versions
   */
  router.get('/drives/:driveId/items/:itemId/versions', async (req: Request, res: Response): Promise<void> => {
    try {
      const { driveId, itemId } = req.params;
      const sharePointService = getSharePointService(req);
      
      const versions = await sharePointService.getFileVersions(driveId, itemId);
      
      res.json({
        success: true,
        data: versions,
        message: `Retrieved ${versions.length} file versions`
      });
    } catch (error: any) {
      console.error('Get file versions error:', error);
      res.status(500).json({
        error: {
          code: 'GET_VERSIONS_ERROR',
          message: 'Failed to retrieve file versions',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/cache/stats
   * Get cache statistics
   */
  router.get('/cache/stats', async (req: Request, res: Response): Promise<void> => {
    try {
      const sharePointService = getSharePointService(req);
      const stats = sharePointService.getCacheStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Cache statistics retrieved successfully'
      });
    } catch (error: any) {
      console.error('Get cache stats error:', error);
      res.status(500).json({
        error: {
          code: 'CACHE_STATS_ERROR',
          message: 'Failed to retrieve cache statistics',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/admin/integration-status
   * Get current SharePoint integration status and enable/disable toggle
   */
  router.get('/admin/integration-status', async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({
        success: true,
        data: {
          isRealSharePointEnabled: isRealSharePointEnabled,
          environment: process.env.NODE_ENV || 'development',
          hasAccessToken: !!req.session?.accessToken,
          authStatus: req.session?.accessToken ? 'authenticated' : 'not_authenticated',
          credentials: {
            clientId: process.env.SHAREPOINT_CLIENT_ID?.substring(0, 8) + '...',
            tenantId: process.env.SHAREPOINT_TENANT_ID?.substring(0, 8) + '...',
            hasClientSecret: !!process.env.SHAREPOINT_CLIENT_SECRET
          }
        },
        message: 'SharePoint integration status retrieved'
      });
    } catch (error: any) {
      console.error('Get integration status error:', error);
      res.status(500).json({
        error: {
          code: 'INTEGRATION_STATUS_ERROR',
          message: 'Failed to get integration status',
          details: error.message
        }
      });
    }
  });

  /**
   * POST /api/sharepoint-advanced/admin/test-auth
   * Test just the authentication flow without making SharePoint calls
   */
  router.post('/admin/test-auth', async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('Testing authentication setup...');
      
      // Test 1: Check if we have access token
      const hasToken = !!req.session?.accessToken;
      
      if (!hasToken) {
        res.json({
          success: false,
          data: {
            authTest: 'no_token',
            message: 'No access token found - user needs to authenticate',
            recommendation: 'User should sign in first'
          }
        });
        return;
      }

      // Test 2: Try to create Graph client (don't make API calls yet)
      try {
        const graphClient = authService.getGraphClient(req.session!.accessToken);
        
        res.json({
          success: true,
          data: {
            authTest: 'client_created',
            message: 'Graph client created successfully',
            tokenLength: req.session!.accessToken.length,
            recommendation: 'Ready for API calls'
          }
        });
      } catch (clientError: any) {
        res.json({
          success: false,
          data: {
            authTest: 'client_failed',
            message: 'Could not create Graph client',
            error: clientError.message,
            recommendation: 'Check authentication configuration'
          }
        });
      }
    } catch (error: any) {
      console.error('Test auth error:', error);
      res.status(500).json({
        error: {
          code: 'AUTH_TEST_ERROR',
          message: 'Failed to test authentication',
          details: error.message
        }
      });
    }
  });

  /**
   * POST /api/sharepoint-advanced/admin/test-real-api
   * Test real SharePoint API connection safely
   */
  router.post('/admin/test-real-api', async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.session?.accessToken) {
        res.status(401).json({
          error: {
            code: 'NOT_AUTHENTICATED',
            message: 'Please authenticate with SharePoint first'
          }
        });
        return;
      }

      // Test the real SharePoint API connection
      const sharePointService = getSharePointService(req);
      
      console.log('Testing real SharePoint API connection...');
      const startTime = Date.now();
      
      try {
        // Try to get sites first (lowest impact test)
        const sites = await sharePointService.getSites();
        const responseTime = Date.now() - startTime;
        
        res.json({
          success: true,
          data: {
            connectionTest: 'passed',
            responseTime: `${responseTime}ms`,
            sitesFound: sites.length,
            firstSite: sites[0] ? {
              id: sites[0].id,
              displayName: sites[0].displayName,
              webUrl: sites[0].webUrl
            } : null,
            recommendation: sites.length > 0 ? 'Ready to enable real SharePoint integration' : 'Sites found but may need permissions'
          },
          message: 'SharePoint API test completed successfully'
        });
      } catch (apiError: any) {
        const responseTime = Date.now() - startTime;
        
        res.json({
          success: false,
          data: {
            connectionTest: 'failed',
            responseTime: `${responseTime}ms`,
            errorType: apiError.name || 'Unknown',
            errorMessage: apiError.message || 'Unknown error',
            recommendation: apiError.message?.includes('Forbidden') ? 
              'Check SharePoint permissions for the app registration' :
              apiError.message?.includes('Unauthorized') ?
              'Check authentication credentials' :
              'Review SharePoint configuration and network connectivity'
          },
          message: 'SharePoint API test failed - using mock data is recommended'
        });
      }
    } catch (error: any) {
      console.error('Test real API error:', error);
      res.status(500).json({
        error: {
          code: 'API_TEST_ERROR',
          message: 'Failed to test SharePoint API',
          details: error.message
        }
      });
    }
  });

  /**
   * DELETE /api/sharepoint-advanced/cache
   * Clear cache
   */
  router.delete('/cache', async (req: Request, res: Response): Promise<void> => {
    try {
      const { pattern } = req.query;
      const sharePointService = getSharePointService(req);
      
      if (pattern) {
        const count = sharePointService.invalidateCache(pattern as string);
        res.json({
          success: true,
          message: `Invalidated ${count} cache entries matching pattern: ${pattern}`
        });
      } else {
        sharePointService.clearCache();
        res.json({
          success: true,
          message: 'All cache entries cleared'
        });
      }
    } catch (error: any) {
      console.error('Clear cache error:', error);
      res.status(500).json({
        error: {
          code: 'CLEAR_CACHE_ERROR',
          message: 'Failed to clear cache',
          details: error.message
        }
      });
    }
  });

  /**
   * GET /api/sharepoint-advanced/files/:fileId/content
   * Get file content for preview
   */
  router.get('/files/:fileId/content', async (req: Request, res: Response): Promise<void> => {
    try {
      const { fileId } = req.params;
      console.log('🔍 Getting file content for:', fileId);
      
      if (isRealSharePointEnabled) {
        try {
          const graphClient = authService.getGraphClient(req.session!.accessToken);
          
          // We need to find the file in the correct drive, similar to metadata endpoint
          let fileContent = null;
          
          // Try Communication site first
          try {
            console.log('🔍 Searching Communication site for file content...');
            const commSiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com/drives').get();
            
            for (const drive of commSiteResponse.value || []) {
              try {
                fileContent = await graphClient.api(`/drives/${drive.id}/items/${fileId}/content`).get();
                console.log(`✅ Found file content in Communication site drive: ${drive.name}`);
                break;
              } catch (driveError) {
                // File not in this drive, continue searching
              }
            }
          } catch (siteError) {
            console.log('⚠️ Could not search Communication site for content');
          }
          
          // If not found in Communication site, try All Company subsite
          if (!fileContent) {
            try {
              console.log('🔍 Searching All Company subsite for file content...');
              const subsiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com:/sites/allcompany:/drives').get();
              
              for (const drive of subsiteResponse.value || []) {
                try {
                  fileContent = await graphClient.api(`/drives/${drive.id}/items/${fileId}/content`).get();
                  console.log(`✅ Found file content in All Company drive: ${drive.name}`);
                  break;
                } catch (driveError) {
                  // File not in this drive, continue searching
                }
              }
            } catch (subsiteError) {
              console.log('⚠️ Could not search All Company subsite for content');
            }
          }
          
          if (!fileContent) {
            throw new Error(`File content with ID ${fileId} not found in any accessible drive`);
          }
          
          // Get file metadata to determine content type
          let fileMetadata = null;
          
          // Try to find file metadata to get proper content type
          try {
            // Try Communication site first
            const commSiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com/drives').get();
            for (const drive of commSiteResponse.value || []) {
              try {
                fileMetadata = await graphClient.api(`/drives/${drive.id}/items/${fileId}`).get();
                break;
              } catch (driveError) {
                // File not in this drive, continue searching
              }
            }
            
            // If not found in Communication site, try All Company subsite
            if (!fileMetadata) {
              const subsiteResponse = await graphClient.api('/sites/netorgft18344752.sharepoint.com:/sites/allcompany:/drives').get();
              for (const drive of subsiteResponse.value || []) {
                try {
                  fileMetadata = await graphClient.api(`/drives/${drive.id}/items/${fileId}`).get();
                  break;
                } catch (driveError) {
                  // File not in this drive, continue searching
                }
              }
            }
          } catch (metadataError) {
            console.log('⚠️ Could not get file metadata for content type');
          }
          
          // Set appropriate content type based on file metadata
          if (fileMetadata && fileMetadata.file && fileMetadata.file.mimeType) {
            res.setHeader('Content-Type', fileMetadata.file.mimeType);
          } else {
            res.setHeader('Content-Type', 'application/octet-stream');
          }
          
          const content = fileContent;
          res.send(content);
          return;
        } catch (apiError: any) {
          console.error('❌ Graph API error getting file content:', apiError);
        }
      }
      
      // Return mock content for demo
      const mockContent = `This is demo content for ${fileId}.\n\nThis file contains sample business information and data that would normally be retrieved from your actual SharePoint document.\n\nIn a real implementation, this would be the actual file content from Microsoft SharePoint.`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.send(mockContent);
      
    } catch (error: any) {
      console.error('File content error:', error);
      res.status(404).json({
        error: {
          code: 'FILE_CONTENT_NOT_FOUND',
          message: 'File content not available',
          details: error.message
        }
      });
    }
  });

  /**
   * DEBUG: Test SharePoint API directly
   */
  router.get('/debug/test-api', authMiddleware.requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔍 DEBUG: Testing SharePoint API directly...');
      
      if (!req.session?.accessToken) {
        console.log('❌ DEBUG: No access token found');
        res.status(401).json({ error: 'No access token' });
        return;
      }
      
      console.log('✅ DEBUG: Access token exists, creating Graph client...');
      const graphClient = authService.getGraphClient(req.session.accessToken);
      
      console.log('🔍 DEBUG: Making Graph API call to /sites...');
      const sitesResponse = await graphClient.api('/sites?$select=id,displayName,name,webUrl').get();
      
      console.log('✅ DEBUG: Graph API success! Sites found:', sitesResponse.value?.length || 0);
      console.log('🔍 DEBUG: First site:', sitesResponse.value?.[0]);
      
      res.json({
        success: true,
        sitesCount: sitesResponse.value?.length || 0,
        sites: sitesResponse.value || [],
        debugInfo: 'Direct Graph API call successful'
      });
      
    } catch (error: any) {
      console.error('❌ DEBUG: Graph API test failed:', error);
      console.error('❌ DEBUG: Error details:', {
        status: error.status || error.statusCode,
        message: error.message,
        code: error.code,
        body: error.body || error.response?.data
      });
      
      res.status(500).json({
        error: {
          message: error.message,
          status: error.status || error.statusCode,
          details: error.body || error.response?.data
        }
      });
    }
  });

  return router;
};