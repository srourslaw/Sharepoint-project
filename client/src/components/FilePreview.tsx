import React, { useState } from 'react';
import { Box, Typography, IconButton, Paper, Tabs, Tab, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { 
  Close as CloseIcon,
  Visibility as PreviewIcon,
  Info as InfoIcon,
  History as VersionsIcon,
  GetApp as DownloadIcon,
  MoreVert as MoreVertIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon
} from '@mui/icons-material';
import { SharePointFile } from '../types';
import { useFilePreview } from '../hooks/useFilePreview';
import { formatFileSize, formatDate } from '../utils/formatters';

interface FilePreviewProps {
  selectedFiles: string[];
  height: number | string;
  onClose: () => void;
}

type PreviewTab = 'preview' | 'details' | 'versions';

export const FilePreview: React.FC<FilePreviewProps> = ({
  selectedFiles,
  height,
  onClose,
}) => {
  const actualHeight = typeof height === 'string' && height === '100%' ? '100%' : height;
  console.log('🚀 FilePreview: Rendering WITHIN dashboard with files:', selectedFiles, 'height:', height);
  
  const [activeTab, setActiveTab] = useState<PreviewTab>('preview');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentFileId = selectedFiles[0] || null;
  const { file, content, loading, error } = useFilePreview(currentFileId);

  console.log('🚀 FilePreview: File data:', { file: file?.name, content: content?.substring(0, 50), hasFile: !!file, hasContent: !!content });

  if (loading) {
    return (
      <Paper sx={{ height, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6">Loading...</Typography>
      </Paper>
    );
  }

  if (error || !file || !content) {
    console.log('❌ FilePreview: No file or content, showing error');
    return (
      <Paper sx={{ height, width: '100%', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Preview Error</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography color="error">Error: {error || 'No file or content found'}</Typography>
      </Paper>
    );
  }

  const parseExcelTextToGrid = (textContent: string) => {
    const lines = textContent.split('\n').filter(line => line.trim());

    // Find data table lines (skip summary info)
    const dataStartIndex = lines.findIndex(line =>
      line.includes('|') && (line.includes('Month') || line.includes('Rate') || line.includes('Total'))
    );

    if (dataStartIndex === -1) return null;

    const dataLines = lines.slice(dataStartIndex).filter(line => line.includes('|'));
    if (dataLines.length < 2) return null;

    // Parse header row
    const headerLine = dataLines[0];
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);

    // Create columns
    const columns: GridColDef[] = headers.map((header, index) => ({
      field: `col${index}`,
      headerName: header,
      width: 150,
      sortable: true,
    }));

    // Parse data rows
    const rows: GridRowsProp = dataLines.slice(1).map((line, rowIndex) => {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      const row: any = { id: rowIndex };

      cells.forEach((cell, colIndex) => {
        row[`col${colIndex}`] = cell;
      });

      return row;
    }).filter(row => Object.keys(row).length > 1); // Filter out empty rows

    return { columns, rows };
  };

  const renderContent = () => {
    const isPdf = file.mimeType === 'application/pdf';
    const isImage = file.mimeType.startsWith('image/');
    const isExcel = file.extension === 'xlsx' || file.extension === 'xls';
    const isWord = file.extension === 'docx' || file.extension === 'doc';
    const isPowerPoint = file.extension === 'pptx' || file.extension === 'ppt';
    const isOffice = isWord || isExcel || isPowerPoint;

    console.log('🎯 FilePreview: Rendering content type:', { isPdf, isImage, isExcel, isWord, isPowerPoint, mimeType: file.mimeType, extension: file.extension });

    if (isPdf) {
      console.log('📕 FilePreview: Rendering PDF document');

      // Multiple PDF rendering approaches for better compatibility
      const pdfUrl = content.startsWith('blob:') ? content : `/api/sharepoint-advanced/files/${file.id}/content`;

      console.log('📕 FilePreview: Using PDF URL:', pdfUrl);
      console.log('📕 FilePreview: Content type:', typeof content, 'Length:', content?.length);

      // Try different PDF embedding methods based on content type
      if (content && content.startsWith('blob:')) {
        // For blob URLs, use direct embedding
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <embed
              src={pdfUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              style={{
                minHeight: '600px',
                border: 'none',
                flex: 1
              }}
            />
          </Box>
        );
      } else {
        // For API URLs, try iframe with different parameters
        const embedUrl = `${pdfUrl}#view=FitH&toolbar=1&navpanes=0&scrollbar=1&page=1&zoom=100`;

        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                display: 'block',
                minHeight: '600px'
              }}
              title={`PDF: ${String(file.name || file.displayName || 'Document')}`}
              onLoad={() => console.log('📕 PDF iframe loaded successfully')}
              onError={(e) => {
                console.error('📕 PDF iframe error, trying embed fallback:', e);
                // Replace iframe with embed fallback
                const iframe = e.target as HTMLIFrameElement;
                const embedElement = document.createElement('embed');
                embedElement.src = pdfUrl;
                embedElement.type = 'application/pdf';
                embedElement.width = '100%';
                embedElement.height = '100%';
                embedElement.style.border = 'none';
                embedElement.style.minHeight = '600px';
                iframe.parentNode?.replaceChild(embedElement, iframe);
              }}
            />
          </Box>
        );
      }
    }

    if (isImage) {
      console.log('🖼️ FilePreview: Rendering image/screenshot');

      // Handle both blob URLs and direct API URLs for images
      const imageUrl = content.startsWith('blob:') ? content : `/api/sharepoint-advanced/files/${file.id}/content`;
      console.log('🖼️ FilePreview: Using Image URL:', imageUrl);
      console.log('🖼️ FilePreview: Content type:', typeof content, 'Length:', content?.length);
      
      return (
        <Box sx={{
          width: '100%',
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          position: 'relative',
          p: 2
        }}>
          <img
            src={imageUrl}
            alt={String(file.name || file.displayName || 'Image preview')}
            style={{
              maxWidth: '95%',
              maxHeight: '95%',
              objectFit: 'contain',
              display: 'block',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              cursor: 'zoom-in'
            }}
            onLoad={() => console.log('🖼️ Image loaded successfully:', imageUrl)}
            onError={(e) => {
              console.error('🖼️ Image load error:', e);
              console.error('🖼️ Failed image URL:', imageUrl);
              // Try alternative URL on error
              const img = e.target as HTMLImageElement;
              if (!img.src.includes('blob:')) {
                img.src = `/api/sharepoint-advanced/files/${file.id}/content?alt=media`;
              }
            }}
            onClick={(e) => {
              // Allow click to zoom or open in new tab
              const img = e.target as HTMLImageElement;
              window.open(img.src, '_blank');
            }}
          />
        </Box>
      );
    }

    // Excel/Spreadsheet files - enhanced with DataGrid for proper spreadsheet view
    if (isExcel) {
      console.log('📊 FilePreview: Rendering Excel with DataGrid');
      console.log('📊 FilePreview: content available:', !!content, 'type:', typeof content);

      // If we have text content, try to parse it as a spreadsheet
      if (content && typeof content === 'string' && !content.startsWith('blob:') && content.trim().length > 0) {
        const gridData = parseExcelTextToGrid(content);

        if (gridData && gridData.rows.length > 0) {
          console.log('📊 FilePreview: Parsed Excel data successfully, rows:', gridData.rows.length);

          return (
            <Box sx={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              backgroundColor: '#fff',
              p: 2
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', mb: 2 }}>
                📊 {String(file.name || file.displayName || 'Spreadsheet')}
              </Typography>
              <Box sx={{ height: 'calc(100% - 60px)', width: '100%' }}>
                <DataGrid
                  rows={gridData.rows}
                  columns={gridData.columns}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 25 },
                    },
                  }}
                  pageSizeOptions={[10, 25, 50]}
                  disableRowSelectionOnClick
                  sx={{
                    border: '1px solid #e0e0e0',
                    '& .MuiDataGrid-cell': {
                      borderRight: '1px solid #e0e0e0',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 'bold',
                    },
                  }}
                />
              </Box>
            </Box>
          );
        }
      }

      // Fallback to iframe approach if parsing fails or no content
      console.log('📊 FilePreview: Using iframe fallback for Excel');
      const directUrl = `/api/sharepoint-advanced/files/${file.id}/content`;
      const officeOnlineUrl = file.webUrl ?
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.webUrl)}` :
        null;

      return (
        <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <iframe
            src={directUrl}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              display: 'block',
              minHeight: '600px'
            }}
            title={`Excel: ${String(file.name || file.displayName || 'Spreadsheet')}`}
            onLoad={() => console.log('📊 Excel iframe loaded successfully with direct API')}
            onError={(e) => {
              console.error('📊 Excel direct API failed, trying Office Online fallback:', e);
              const iframe = e.target as HTMLIFrameElement;
              if (officeOnlineUrl && iframe.src !== officeOnlineUrl) {
                console.log('📊 Switching to Office Online URL:', officeOnlineUrl);
                iframe.src = officeOnlineUrl;
              } else {
                console.error('📊 No valid Office Online URL available');
                const errorHtml = `
                  <html><body style="padding:20px;font-family:Arial;">
                    <h3>Spreadsheet Preview Unavailable</h3>
                    <p>Unable to preview this Excel file. Please download it to view the content.</p>
                    <p><a href="${directUrl}" download>Download File</a></p>
                  </body></html>
                `;
                iframe.src = 'data:text/html,' + encodeURIComponent(errorHtml);
              }
            }}
          />
        </Box>
      );
    }

    // Word documents - enhanced handling for different SharePoint contexts
    if (isWord) {
      console.log('📄 FilePreview: Rendering Word document');
      console.log('📄 FilePreview: content available:', !!content, 'type:', typeof content);
      console.log('📄 FilePreview: content preview:', content ? content.substring(0, 100) + '...' : 'none');

      // If we have text content, display it
      if (content && typeof content === 'string' && !content.startsWith('blob:') && content.trim().length > 0) {
        return (
          <Box sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            p: 4,
            backgroundColor: '#fff'
          }}>
            <Typography variant="body1" sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              fontSize: '16px',
              fontFamily: '"Times New Roman", serif',
              maxWidth: '800px',
              margin: '0 auto',
              textAlign: 'justify'
            }}>
              {String(content)}
            </Typography>
          </Box>
        );
      } else {
        // Fallback: try to load directly through API or show download option
        const directUrl = `/api/sharepoint-advanced/files/${file.id}/content`;

        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={directUrl}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                display: 'block',
                minHeight: '600px'
              }}
              title={`Word: ${String(file.name || file.displayName || 'Document')}`}
              onLoad={() => console.log('📄 Word iframe loaded successfully')}
              onError={(e) => {
                console.error('📄 Word iframe error, showing download option:', e);
                const iframe = e.target as HTMLIFrameElement;
                const errorHtml = `
                  <html><body style="padding:20px;font-family:Arial;">
                    <h3>Document Preview Unavailable</h3>
                    <p>Unable to preview this Word document. Please download it to view the content.</p>
                    <p><a href="${directUrl}" download>Download Document</a></p>
                  </body></html>
                `;
                iframe.src = 'data:text/html,' + encodeURIComponent(errorHtml);
              }}
            />
          </Box>
        );
      }
    }

    // PowerPoint files - enhanced with fallback strategies
    if (isPowerPoint) {
      console.log('📽️ FilePreview: Rendering PowerPoint with fallback strategies');
      console.log('📽️ FilePreview: file.webUrl:', file.webUrl);

      // Try direct API first, then Office Online as fallback
      const directUrl = `/api/sharepoint-advanced/files/${file.id}/content`;
      const officeOnlineUrl = file.webUrl ?
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.webUrl)}` :
        null;

      return (
        <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <iframe
            src={directUrl}
            width="100%"
            height="100%"
            style={{
              border: 'none',
              display: 'block',
              minHeight: '600px'
            }}
            title={`PowerPoint: ${String(file.name || file.displayName || 'Presentation')}`}
            onLoad={() => console.log('📽️ PowerPoint iframe loaded successfully with direct API')}
            onError={(e) => {
              console.error('📽️ PowerPoint direct API failed, trying Office Online fallback:', e);
              const iframe = e.target as HTMLIFrameElement;
              if (officeOnlineUrl && iframe.src !== officeOnlineUrl) {
                console.log('📽️ Switching to Office Online URL:', officeOnlineUrl);
                iframe.src = officeOnlineUrl;
              } else {
                console.error('📽️ No valid Office Online URL available');
                // Show error message in iframe
                const errorHtml = `
                  <html><body style="padding:20px;font-family:Arial;">
                    <h3>Presentation Preview Unavailable</h3>
                    <p>Unable to preview this PowerPoint file. Please download it to view the content.</p>
                    <p><a href="${directUrl}" download>Download File</a></p>
                  </body></html>
                `;
                iframe.src = 'data:text/html,' + encodeURIComponent(errorHtml);
              }
            }}
          />
        </Box>
      );
    }

    return (
      <Box sx={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Typography variant="h6" color="text.secondary">
          Cannot preview this file type: {file.mimeType}
        </Typography>
      </Box>
    );
  };

  const renderFileDetails = () => {
    if (!file) return null;

    return (
      <Box sx={{ p: 4, minHeight: '100%', overflow: 'auto', backgroundColor: '#fff' }}>
        <Typography variant="h6" gutterBottom>
          File Details
        </Typography>
        
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'auto 1fr', maxWidth: 600 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Name:</Typography>
          <Typography variant="body2">{String(file.displayName || file.name || 'Unknown')}</Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Size:</Typography>
          <Typography variant="body2">{formatFileSize(file.size)}</Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Type:</Typography>
          <Typography variant="body2">{file.mimeType}</Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Created:</Typography>
          <Typography variant="body2">{formatDate(file.createdDateTime)}</Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Modified:</Typography>
          <Typography variant="body2">{formatDate(file.lastModifiedDateTime)}</Typography>
          
          {file.createdBy && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Created by:</Typography>
              <Typography variant="body2">{String(file.createdBy.displayName || 'Unknown')}</Typography>
            </>
          )}
          
          {file.lastModifiedBy && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Modified by:</Typography>
              <Typography variant="body2">{String(file.lastModifiedBy.displayName || 'Unknown')}</Typography>
            </>
          )}
          
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Path:</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            {String(file.parentPath || '/')}
          </Typography>
          
          {file.webUrl && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>SharePoint URL:</Typography>
              <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                <a href={file.webUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
                  Open in SharePoint
                </a>
              </Typography>
            </>
          )}
        </Box>
      </Box>
    );
  };

  const renderVersionHistory = () => (
    <Box sx={{ p: 4, minHeight: '100%', overflow: 'auto', backgroundColor: '#fff' }}>
      <Typography variant="h6" gutterBottom>
        Version History
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Version history feature coming soon.
      </Typography>
    </Box>
  );

  const handleDownload = async () => {
    if (!file) return;
    
    try {
      console.log('🔽 Downloading file:', file.displayName || file.name);
      
      const downloadUrl = `/api/sharepoint-advanced/files/${file.id}/content`;
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.displayName || file.name || 'file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download completed');
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleMenuAction = (action: string) => {
    console.log('🎯 handleMenuAction called with:', action);
    setAnchorEl(null);
    
    if (!file) {
      console.error('❌ No file available');
      alert('No file selected');
      return;
    }
    
    console.log('📁 File info:', {
      name: file.displayName || file.name,
      webUrl: file.webUrl,
      id: file.id
    });
    
    switch (action) {
      case 'share':
        console.log('🔄 Processing share action...');
        const shareUrl = file.webUrl || `File: ${file.displayName || file.name}`;
        alert(`Share URL:\n${shareUrl}`);
        
        // Try to copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            console.log('✅ Copied to clipboard');
          }).catch((err) => {
            console.error('❌ Clipboard failed:', err);
          });
        }
        break;
        
      case 'copy':
        console.log('🔄 Processing copy action...');
        const fileUrl = `/api/sharepoint-advanced/files/${file.id}/content`;
        alert(`File URL:\n${fileUrl}`);
        
        if (navigator.clipboard) {
          navigator.clipboard.writeText(fileUrl).then(() => {
            console.log('✅ File URL copied to clipboard');
          }).catch((err) => {
            console.error('❌ Clipboard failed:', err);
          });
        }
        break;
        
      case 'edit':
        console.log('🔄 Processing edit action...');
        if (file.webUrl) {
          console.log('🌐 Opening SharePoint URL:', file.webUrl);
          window.open(file.webUrl, '_blank');
        } else {
          alert('Edit functionality not available for this file.\nNo SharePoint URL found.');
        }
        break;
        
      case 'delete':
        console.log('🔄 Processing delete action...');
        const fileName = file.displayName || file.name || 'Unknown file';
        const confirmed = confirm(`Are you sure you want to delete "${fileName}"?\n\nThis action cannot be undone.`);
        if (confirmed) {
          alert('Delete functionality would be implemented here.\nThis is currently a placeholder.');
          console.log('🗑️ User confirmed deletion of:', fileName);
        } else {
          console.log('❌ User cancelled deletion');
        }
        break;
        
      default:
        console.log('❓ Unknown action:', action);
        alert(`Unknown action: ${action}`);
        break;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preview':
        return renderContent();
      case 'details':
        return renderFileDetails();
      case 'versions':
        return renderVersionHistory();
      default:
        return renderContent();
    }
  };

  return (
    <Paper sx={{
      height: actualHeight,
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: '#f8f9fa',
          minHeight: 64
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {String(file?.displayName || file?.name || 'File Preview')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton
            onClick={handleDownload}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              border: '1px solid #7c3aed',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              },
              color: '#7c3aed',
              width: 32,
              height: 32
            }}
            title="Download file"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              border: '1px solid #7c3aed',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              },
              color: '#7c3aed',
              width: 32,
              height: 32
            }}
            title="More actions"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              border: '1px solid #7c3aed',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              },
              color: '#7c3aed',
              width: 32,
              height: 32
            }}
            title="Close preview"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            label="Preview"
            value="preview"
            icon={<PreviewIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none', fontSize: '0.875rem' }}
          />
          <Tab
            label="Details"
            value="details"
            icon={<InfoIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none', fontSize: '0.875rem' }}
          />
          <Tab
            label="Versions"
            value="versions"
            icon={<VersionsIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: 'none', fontSize: '0.875rem' }}
          />
        </Tabs>
      </Box>

      {/* Content Area - Takes up remaining space */}
      <Box sx={{
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {renderTabContent()}
      </Box>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { mt: 1 }
        }}
      >
        <MenuItem onClick={(e) => {
          console.log('📤 Share clicked');
          handleMenuAction('share');
        }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          Share
        </MenuItem>
        <MenuItem onClick={(e) => {
          console.log('🔗 Copy link clicked');
          handleMenuAction('copy');
        }}>
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          Copy link
        </MenuItem>
        <MenuItem onClick={(e) => {
          console.log('✏️ Edit clicked');
          handleMenuAction('edit');
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={(e) => {
          console.log('🗑️ Delete clicked');
          handleMenuAction('delete');
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Paper>
  );
};