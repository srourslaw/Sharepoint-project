# SharePoint AI Dashboard

A comprehensive, responsive React dashboard for SharePoint and AI-powered document management, built with Material-UI and TypeScript.

## Features Implemented

### 🏗️ Dashboard Architecture
- **Material-UI Components**: Professional UI with Microsoft design language
- **Responsive Layout**: Optimized for mobile, tablet, and desktop devices
- **TypeScript Support**: Full type safety throughout the application
- **Custom Theme**: Microsoft-inspired color palette and styling

### 🧭 Navigation & File Management
- **Navigation Sidebar**: Hierarchical view of SharePoint sites and libraries
- **Breadcrumb Navigation**: Easy path navigation with collapsible breadcrumbs
- **File Browser**: Grid and list views with sorting and filtering
- **Search & Filter**: Advanced filtering by file type, date, size, and author
- **File Preview**: Built-in preview for images, PDFs, videos, audio, and text files

### 🤖 AI-Powered Features
- **AI Chat Interface**: Document Q&A with context-aware responses
- **Document Summarization**: Multiple summary types (extractive, abstractive, bullet points, etc.)
- **Translation Services**: Multi-language document translation
- **Content Extraction**: Keyword and entity extraction from documents
- **Sentiment Analysis**: Emotional tone analysis of documents
- **Document Comparison**: Compare multiple documents for similarities

### 📱 Responsive Design
- **Mobile-First**: Optimized for mobile devices with touch-friendly interface
- **Adaptive Layout**: Sidebar and AI panel collapse on smaller screens
- **Flexible Grid**: File cards adapt to screen size (2-6 columns)
- **Touch Interactions**: Swipe gestures and touch-optimized controls

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx           # Main dashboard layout
│   ├── NavigationSidebar.tsx   # Site and library navigation
│   ├── MainContent.tsx         # File browser and management
│   ├── AIPanel.tsx            # AI features interface
│   ├── FilePreview.tsx        # File preview component
│   ├── BreadcrumbNavigation.tsx # Path navigation
│   └── SearchAndFilter.tsx    # Advanced search and filtering
├── hooks/
│   ├── useSharePointData.ts   # SharePoint API integration
│   ├── useSharePointFiles.ts  # File management
│   ├── useAIFeatures.ts       # AI services integration
│   └── useFilePreview.ts      # File preview functionality
├── services/
│   └── api.ts                 # HTTP client with authentication
├── types/
│   └── index.ts               # TypeScript type definitions
├── utils/
│   └── formatters.ts          # Utility functions
└── App.tsx                    # Main application with theme
```

## Key Components

### Dashboard Layout
- **Responsive App Bar**: Contains navigation controls and user info
- **Collapsible Sidebar**: Shows SharePoint sites and libraries hierarchy
- **Main Content Area**: File browser with multiple view modes
- **AI Panel**: Interactive AI features (chat, summarization, etc.)
- **File Preview**: Bottom panel for previewing selected files

### AI Features
1. **Document Chat**: Ask questions about selected documents
2. **Summarization**: Generate summaries with customizable length and type
3. **Translation**: Translate documents to multiple languages
4. **Content Extraction**: Extract keywords, entities, and key information
5. **Sentiment Analysis**: Analyze emotional tone and sentiment
6. **Document Comparison**: Find similarities and differences between documents

### File Management
- **Multiple View Modes**: Grid view for visual browsing, list view for detailed info
- **Advanced Search**: Filter by file type, size, date range, and author
- **File Operations**: Download, share, edit, delete actions
- **Bulk Selection**: Select multiple files for batch operations
- **File Preview**: Preview images, PDFs, videos, audio, and text files inline

## Responsive Breakpoints

- **xs (0px+)**: Mobile portrait - Single column layout
- **sm (600px+)**: Mobile landscape - Condensed navigation
- **md (960px+)**: Tablet - Show both sidebar and AI panel
- **lg (1280px+)**: Desktop - Full feature layout
- **xl (1920px+)**: Large desktop - Maximum content width

## Dependencies Added

```json
{
  "@emotion/react": "^11.11.1",
  "@emotion/styled": "^11.11.0",
  "@mui/icons-material": "^5.14.19",
  "@mui/material": "^5.14.20",
  "@mui/lab": "^5.0.0-alpha.155",
  "@mui/x-data-grid": "^6.18.1",
  "@mui/x-date-pickers": "^6.18.1",
  "@mui/x-tree-view": "^6.17.0",
  "react-router-dom": "^6.8.1",
  "axios": "^1.6.2",
  "date-fns": "^2.30.0"
}
```

## Running the Dashboard

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create `.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:3001
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## API Integration

The dashboard integrates with the following server endpoints:

### SharePoint APIs
- `GET /api/sharepoint-advanced/sites` - List SharePoint sites
- `GET /api/sharepoint-advanced/sites/:id/libraries` - List site libraries  
- `GET /api/sharepoint-advanced/drives/:id/items/:itemId/children` - List folder contents
- `GET /api/sharepoint-advanced/files/:id/content` - Download file content

### AI Feature APIs
- `POST /api/ai/chat/start` - Start document chat session
- `POST /api/ai/chat/message` - Send chat message
- `POST /api/ai/summarize` - Summarize documents
- `POST /api/ai/translate` - Translate documents
- `POST /api/ai/extract` - Extract content and keywords
- `POST /api/ai/sentiment` - Analyze sentiment

## Theme Customization

The dashboard uses a custom Material-UI theme with:
- **Microsoft Design Language**: Colors and typography matching Microsoft 365
- **Accessibility**: WCAG compliant contrast ratios and focus indicators
- **Dark Mode Support**: Ready for dark theme implementation
- **Custom Components**: Styled buttons, cards, and navigation elements

## Future Enhancements

- [ ] Real-time collaboration features
- [ ] Advanced document analytics
- [ ] Custom AI model integration
- [ ] Offline support with service workers
- [ ] Advanced permission management
- [ ] Integration with Microsoft Graph API
- [ ] Custom dashboard widgets
- [ ] Advanced reporting and analytics

## Performance Optimizations

- **Code Splitting**: Lazy loading of components
- **Virtualization**: Efficient rendering of large file lists
- **Caching**: Intelligent caching of API responses
- **Image Optimization**: Thumbnail generation and lazy loading
- **Bundle Optimization**: Tree shaking and minification

The dashboard is now ready for production use with a comprehensive set of features for SharePoint document management and AI-powered document analysis.