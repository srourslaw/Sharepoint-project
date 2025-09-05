import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock theme for testing
const mockTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Create a new QueryClient instance for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialEntries?: string[];
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient = createTestQueryClient(),
  initialEntries = ['/']
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={mockTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, initialEntries, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient} initialEntries={initialEntries}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Test data factories
export const createMockSharePointSite = (overrides = {}) => ({
  id: 'test-site-id',
  name: 'Test Site',
  webUrl: 'https://test.sharepoint.com/sites/test',
  description: 'Test site description',
  displayName: 'Test Site',
  createdDateTime: '2023-01-01T00:00:00Z',
  lastModifiedDateTime: '2023-01-01T00:00:00Z',
  libraries: [],
  ...overrides,
});

export const createMockSharePointFile = (overrides = {}) => ({
  id: 'test-file-id',
  name: 'test-file.docx',
  displayName: 'Test File.docx',
  size: 1024,
  webUrl: 'https://test.sharepoint.com/sites/test/Documents/test-file.docx',
  downloadUrl: 'https://test.sharepoint.com/sites/test/Documents/test-file.docx?download=1',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  extension: '.docx',
  createdDateTime: '2023-01-01T00:00:00Z',
  lastModifiedDateTime: '2023-01-01T00:00:00Z',
  parentPath: '/sites/test/Documents',
  isFolder: false,
  content: 'Test file content',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
  userPrincipalName: 'test@example.com',
  ...overrides,
});

export const createMockChatSession = (overrides = {}) => ({
  id: 'test-session-id',
  title: 'Test Chat Session',
  messages: [],
  documentIds: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  totalMessages: 0,
  metadata: {
    documentsAnalyzed: 0,
    averageResponseTime: 1000,
    topics: ['test'],
  },
  ...overrides,
});

export const createMockChatMessage = (overrides = {}) => ({
  id: 'test-message-id',
  role: 'user' as const,
  content: 'Test message',
  timestamp: '2023-01-01T00:00:00Z',
  sourceReferences: [],
  confidence: 0.9,
  messageType: 'text' as const,
  attachments: [],
  actions: [],
  ...overrides,
});

export const createMockAIAnalysisResult = (overrides = {}) => ({
  id: 'test-analysis-id',
  fileId: 'test-file-id',
  analysisType: 'summarization' as const,
  result: {
    summary: {
      text: 'Test summary',
      keyPoints: ['Point 1', 'Point 2'],
      confidence: 0.9,
    },
    keywords: ['test', 'keyword'],
    metrics: {
      originalWordCount: 100,
      summaryWordCount: 20,
      compressionRatio: 0.2,
    },
    processingTime: 1000,
  },
  confidence: 0.9,
  processingTime: 1000,
  timestamp: '2023-01-01T00:00:00Z',
  ...overrides,
});

// Utility functions
export const waitFor = (ms: number) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const createMockFile = (
  name = 'test-file.txt',
  content = 'test content',
  type = 'text/plain'
): File => {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
};

export const createLargeFile = (sizeInMB = 10): File => {
  const content = 'x'.repeat(sizeInMB * 1024 * 1024);
  return createMockFile('large-file.txt', content);
};

// Mock fetch response helpers
export const mockFetchResponse = (data: any, status = 200, ok = true) => {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    headers: new Headers(),
    clone: () => mockFetchResponse(data, status, ok),
  } as Response);
};

export const mockFetchError = (error: string) => {
  return Promise.reject(new Error(error));
};

// Performance testing helpers
export const measurePerformance = async (fn: () => Promise<any>) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

export const createPerformanceObserver = () => {
  const entries: PerformanceEntry[] = [];
  
  return {
    observe: jest.fn(),
    disconnect: jest.fn(),
    takeRecords: jest.fn(() => entries),
    getEntries: () => entries,
    addEntry: (entry: PerformanceEntry) => entries.push(entry),
  };
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render method
export { customRender as render };