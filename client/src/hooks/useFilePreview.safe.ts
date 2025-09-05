import { useState, useEffect } from 'react';
import { SharePointFile } from '../types';

interface UseFilePreviewReturn {
  file: SharePointFile | null;
  content: string | null;
  loading: boolean;
  error: string | null;
  downloadFile: () => Promise<void>;
  refreshFile: () => Promise<void>;
}

// Mock file database - matches the files from useSharePointFiles.safe.ts
const mockFiles: Record<string, SharePointFile> = {
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
  'safe-folder-1': {
    id: 'safe-folder-1',
    name: 'Archive',
    displayName: 'Archive',
    size: 0,
    webUrl: 'https://company.sharepoint.com/sites/portal/documents/archive',
    mimeType: 'application/folder',
    extension: '',
    createdDateTime: '2023-01-01T00:00:00Z',
    lastModifiedDateTime: new Date().toISOString(),
    parentPath: '/Documents',
    isFolder: true,
    lastModifiedBy: {
      displayName: 'System',
      email: 'system@company.com'
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

// Mock file content for different file types
const mockFileContent: Record<string, string> = {
  'safe-file-1': `# Business Plan - Executive Summary

## Company Overview
Our company is a leading provider of innovative solutions in the technology sector. We specialize in developing cutting-edge applications that solve real-world problems for businesses and consumers alike.

## Market Analysis
The market for our products is rapidly growing, with an estimated size of $50 billion globally. Key trends include:
- Increased digital transformation
- Growing demand for automation
- Rising importance of data analytics

## Financial Projections
- Year 1 Revenue: $500,000
- Year 2 Revenue: $1,200,000
- Year 3 Revenue: $2,800,000

## Key Objectives
1. Establish market presence
2. Build strong customer base
3. Achieve profitability by year 2
4. Expand to international markets

This document contains sensitive business information and should be treated as confidential.`,

  'safe-file-2': `Financial Report - Q4 2023

Revenue:
- Product Sales: $1,250,000
- Service Revenue: $380,000
- Total Revenue: $1,630,000

Expenses:
- Cost of Goods Sold: $650,000
- Operating Expenses: $420,000
- Marketing: $180,000
- R&D: $200,000
- Total Expenses: $1,450,000

Net Income: $180,000

Key Metrics:
- Gross Margin: 48.2%
- Operating Margin: 11.0%
- Customer Acquisition Cost: $45
- Customer Lifetime Value: $890`,

  'safe-file-3': `Presentation Outline:

Slide 1: Title - Quarterly Business Review
Slide 2: Agenda
- Financial Performance
- Market Updates
- Product Roadmap
- Team Updates

Slide 3: Financial Highlights
- Revenue Growth: 23% YoY
- New Customers: 45
- Customer Retention: 92%

Slide 4: Market Opportunities
- Emerging Markets
- New Product Categories
- Strategic Partnerships

Slide 5: Next Quarter Goals
- Launch new product line
- Expand sales team
- Enter European market`
};

export const useFilePreview = (fileId: string | null): UseFilePreviewReturn => {
  const [file, setFile] = useState<SharePointFile | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFile = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      console.log('useFilePreview.safe: Fetching file with mock data for ID:', id);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      const fileData = mockFiles[id];
      
      if (!fileData) {
        throw new Error(`File with ID ${id} not found`);
      }

      setFile(fileData);

      // Set mock content based on file type
      if (fileData.isFolder) {
        setContent(null);
      } else {
        const mockContent = mockFileContent[id];
        if (mockContent) {
          setContent(mockContent);
        } else {
          // Generate generic content for unknown files
          setContent(`This is a preview of ${fileData.displayName}.

File Type: ${fileData.extension.toUpperCase()}
Size: ${(fileData.size / 1024).toFixed(1)} KB
Last Modified: ${new Date(fileData.lastModifiedDateTime).toLocaleDateString()}

Content preview is not available for this file type in the demo version.
In a real SharePoint environment, this would show the actual file content or a preview generated by Microsoft Office Online.

To view the full content, you would normally download the file or open it in the associated application.`);
        }
      }

    } catch (err: any) {
      console.error('Error in safe file preview:', err);
      setError(err.message || 'Failed to fetch file');
      setFile(null);
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (): Promise<void> => {
    if (!file) return;

    try {
      setLoading(true);
      
      // In a real implementation, this would download the file
      console.log('Download initiated for:', file.name);
      
      // Create a mock download by creating a text file with the content
      if (content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name.replace(/\.[^/.]+$/, '.txt'); // Change extension to .txt for demo
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const refreshFile = async (): Promise<void> => {
    if (fileId) {
      await fetchFile(fileId);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchFile(fileId);
    } else {
      setFile(null);
      setContent(null);
      setError(null);
    }
  }, [fileId]);

  return {
    file,
    content,
    loading,
    error,
    downloadFile,
    refreshFile,
  };
};