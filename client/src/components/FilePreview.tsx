import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, Tabs, Tab, Menu, MenuItem, ListItemIcon, Button, Slider } from '@mui/material';
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
import { FileEditor } from './FileEditor';

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
  const [editMode, setEditMode] = useState(false);

  // Edit mode states
  const [selectedTool, setSelectedTool] = useState<'draw' | 'highlight' | 'text' | 'none'>('none');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [brushSize, setBrushSize] = useState(2);
  const [annotations, setAnnotations] = useState<any[]>([]);

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
    const isText = file.extension === 'txt' || file.mimeType.startsWith('text/') || file.mimeType === 'text/plain';
    const isOffice = isWord || isExcel || isPowerPoint;

    console.log('🎯 FilePreview: Rendering content type:', { isPdf, isImage, isExcel, isWord, isPowerPoint, isText, mimeType: file.mimeType, extension: file.extension });

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

    // Excel/Spreadsheet files - enhanced with Microsoft Graph preview URLs
    if (isExcel) {
      console.log('📊 FilePreview: Rendering Excel with Microsoft Graph preview');
      console.log('📊 FilePreview: content available:', !!content, 'type:', typeof content);

      // If content is a Microsoft Graph preview URL, use it directly
      if (content && typeof content === 'string' && (content.startsWith('https://') || content.startsWith('http://'))) {
        console.log('📊 FilePreview: Using Microsoft Graph preview URL for Excel');
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={content}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                display: 'block',
                minHeight: '600px'
              }}
              title={`Excel: ${String(file.name || file.displayName || 'Spreadsheet')}`}
              onLoad={() => console.log('📊 Excel Microsoft Graph preview loaded successfully')}
              onError={(e) => {
                console.error('📊 Microsoft Graph preview failed, trying direct API:', e);
                const iframe = e.target as HTMLIFrameElement;
                const directUrl = `/api/sharepoint-advanced/files/${file.id}/content`;
                iframe.src = directUrl;
              }}
            />
          </Box>
        );
      }

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

    // Word documents - enhanced with Microsoft Graph preview URLs
    if (isWord) {
      console.log('📄 FilePreview: Rendering Word document with Microsoft Graph preview');
      console.log('📄 FilePreview: content available:', !!content, 'type:', typeof content);
      console.log('📄 FilePreview: content preview:', content ? content.substring(0, 100) + '...' : 'none');

      // If content is a Microsoft Graph preview URL, use it directly
      if (content && typeof content === 'string' && (content.startsWith('https://') || content.startsWith('http://'))) {
        console.log('📄 FilePreview: Using Microsoft Graph preview URL for Word');
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={content}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                display: 'block',
                minHeight: '600px'
              }}
              title={`Word: ${String(file.name || file.displayName || 'Document')}`}
              onLoad={() => console.log('📄 Word Microsoft Graph preview loaded successfully')}
              onError={(e) => {
                console.error('📄 Microsoft Graph preview failed, trying direct API:', e);
                const iframe = e.target as HTMLIFrameElement;
                const directUrl = `/api/sharepoint-advanced/files/${file.id}/content`;
                iframe.src = directUrl;
              }}
            />
          </Box>
        );
      }

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

    // Text files - display content in a readable format
    if (isText) {
      console.log('📝 FilePreview: Rendering text file');

      if (content && typeof content === 'string') {
        return (
          <Box sx={{
            width: '100%',
            height: '100%',
            overflow: 'auto',
            backgroundColor: '#fff',
            padding: 3
          }}>
            <Typography variant="h6" gutterBottom>
              {String(file.name || file.displayName || 'Text File')}
            </Typography>
            <Paper
              sx={{
                padding: 2,
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                overflow: 'auto',
                maxHeight: '70vh'
              }}
            >
              {content}
            </Paper>
          </Box>
        );
      }

      // If no content, show loading or error message
      return (
        <Box sx={{ padding: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Text File Preview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Loading text content...
          </Typography>
        </Box>
      );
    }

    // PowerPoint files - enhanced with Microsoft Graph preview URLs
    if (isPowerPoint) {
      // If content is a Microsoft Graph preview URL, use it directly (like Excel/Word)
      if (content && typeof content === 'string' && (content.startsWith('https://') || content.startsWith('http://'))) {
        console.log('📽️ PowerPoint: Using Microsoft Graph preview URL');
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={content}
              width="100%"
              height="100%"
              title={`PowerPoint: ${String(file.name || file.displayName || 'Presentation')}`}
              onLoad={() => console.log('📽️ PowerPoint Microsoft Graph preview loaded successfully')}
            />
          </Box>
        );
      }

      console.log('📽️ FilePreview: Rendering PowerPoint with fallback strategies');
      console.log('📽️ FilePreview: file.webUrl:', file.webUrl);

      // Fallback to Office Online preview
      const officeOnlineUrl = file.webUrl ?
        `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.webUrl)}` :
        null;

      if (officeOnlineUrl) {
        return (
          <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <iframe
              src={officeOnlineUrl}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                display: 'block',
                minHeight: '600px'
              }}
              title={`PowerPoint: ${String(file.name || file.displayName || 'Presentation')}`}
              onLoad={() => console.log('📽️ PowerPoint Office Online loaded successfully')}
            />
          </Box>
        );
      }

      // Final fallback - show download message
      return (
        <Box sx={{ padding: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Presentation Preview Unavailable
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Unable to preview this PowerPoint file. Please download it to view the content.
          </Typography>
          <Button
            variant="contained"
            href={`/api/sharepoint-advanced/files/${file.id}/content`}
            download
            sx={{ mt: 2 }}
          >
            Download File
          </Button>
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


  // SharePoint save functionality
  const handleSaveToSharePoint = async (editedContent: Blob, annotations?: any[]) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', editedContent, file.displayName);
      if (annotations) {
        formData.append('annotations', JSON.stringify(annotations));
      }

      const response = await fetch(`/api/sharepoint-advanced/files/${file.id}/update`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('✅ File saved to SharePoint successfully');
        // Refresh the preview to show updated content
        window.location.reload();
      } else {
        console.error('❌ Failed to save file to SharePoint');
      }
    } catch (error) {
      console.error('❌ Error saving file:', error);
    }
  };

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
        return renderPreviewWithEditMode();
      case 'details':
        return renderFileDetails();
      case 'versions':
        return renderVersionHistory();
      default:
        return renderContent();
    }
  };

  // Enhanced preview with edit mode toggle
  const renderPreviewWithEditMode = () => {
    const isPDF = file?.extension?.toLowerCase() === 'pdf';
    const isImage = file?.extension && ['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(file.extension.toLowerCase());
    const isEditable = isPDF || isImage;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Edit Mode Toggle - Only show for editable files */}
        {isEditable && (
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            display: 'flex',
            gap: 1
          }}>
            <Button
              size="small"
              variant={editMode ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setEditMode(!editMode)}
              sx={{
                backgroundColor: editMode ? 'primary.main' : 'background.paper',
                color: editMode ? 'white' : 'primary.main',
                boxShadow: 2,
                '&:hover': {
                  backgroundColor: editMode ? 'primary.dark' : 'primary.light',
                  color: 'white'
                }
              }}
            >
              {editMode ? '✏️ Exit Edit' : '✏️ Edit Mode'}
            </Button>
          </Box>
        )}

        {/* Original PDF/Image content */}
        <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {renderContent()}

          {/* Edit Mode Overlay - Only when edit mode is active */}
          {editMode && isEditable && <EditModeOverlay />}
        </Box>
      </Box>
    );
  };

  // EditModeOverlay Component - Floating toolbar and canvas
  const EditModeOverlay: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Handle tool selection
    const handleToolSelect = (tool: 'draw' | 'highlight' | 'text') => {
      setSelectedTool(selectedTool === tool ? 'none' : tool);
    };

    // Handle save to SharePoint
    const handleSave = async () => {
      if (canvasRef.current && annotations.length > 0) {
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            handleSaveToSharePoint(blob, annotations);
            console.log('✅ Saved annotations to SharePoint');
          }
        });
      } else {
        console.log('ℹ️ No annotations to save');
      }
    };

    // Canvas drawing handlers
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (selectedTool === 'draw' || selectedTool === 'highlight') {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineWidth = selectedTool === 'highlight' ? 15 : brushSize;
            ctx.strokeStyle = selectedTool === 'highlight' ?
              hexToRgba(highlightColor, 0.4) : '#000000';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
          }
        }
      }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDrawing && (selectedTool === 'draw' || selectedTool === 'highlight')) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.lineTo(x, y);
            ctx.stroke();
          }
        }
      }
    };

    const handleCanvasMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        // Add annotation to array for saving
        setAnnotations(prev => [...prev, {
          type: selectedTool,
          color: selectedTool === 'highlight' ? highlightColor : '#000000',
          size: selectedTool === 'highlight' ? 15 : brushSize,
          timestamp: new Date().toISOString()
        }]);
      }
    };

    // Helper function to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return (
      <>
        {/* Floating Toolbar */}
        <Box sx={{
          position: 'absolute',
          top: 50,
          left: 8,
          zIndex: 20,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          minWidth: 140
        }}>
          {/* Draw Tool */}
          <Button
            size="small"
            variant={selectedTool === 'draw' ? 'contained' : 'outlined'}
            onClick={() => handleToolSelect('draw')}
            startIcon={<Typography>✏️</Typography>}
            sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
          >
            Draw
          </Button>

          {/* Highlight Tool */}
          <Button
            size="small"
            variant={selectedTool === 'highlight' ? 'contained' : 'outlined'}
            onClick={() => handleToolSelect('highlight')}
            startIcon={<Typography>🖍️</Typography>}
            sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
          >
            Highlight
          </Button>

          {/* Color Picker for Highlight */}
          {selectedTool === 'highlight' && (
            <Box sx={{ px: 1, py: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Color:</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                {['#FFFF00', '#00FF00', '#FF0000', '#0000FF', '#FF00FF'].map(color => (
                  <Box
                    key={color}
                    onClick={() => setHighlightColor(color)}
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: color,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: highlightColor === color ? '2px solid #000' : '1px solid #ccc'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Text Tool */}
          <Button
            size="small"
            variant={selectedTool === 'text' ? 'contained' : 'outlined'}
            onClick={() => handleToolSelect('text')}
            startIcon={<Typography>📝</Typography>}
            sx={{ justifyContent: 'flex-start', fontSize: '0.75rem' }}
          >
            Text
          </Button>

          {/* Save Button */}
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={handleSave}
            startIcon={<Typography>💾</Typography>}
            sx={{
              justifyContent: 'flex-start',
              fontSize: '0.75rem',
              mt: 1,
              backgroundColor: 'success.main'
            }}
          >
            Save
          </Button>

          {/* Annotations Count */}
          {annotations.length > 0 && (
            <Typography variant="caption" sx={{
              textAlign: 'center',
              fontSize: '0.6rem',
              color: 'text.secondary',
              mt: 0.5
            }}>
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={800}
          height={1000}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 15,
            pointerEvents: selectedTool !== 'none' ? 'auto' : 'none',
            cursor: selectedTool === 'draw' ? 'crosshair' :
                    selectedTool === 'highlight' ? 'cell' :
                    selectedTool === 'text' ? 'text' : 'default'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </>
    );
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