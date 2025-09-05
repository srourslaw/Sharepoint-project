import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  Paper,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Button,
  Alert,
  CircularProgress,
  Autocomplete,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Description as FileIcon,
  Folder as FolderIcon,
  Person as PersonIcon,
  CalendarToday as DateIcon,
  Storage as SizeIcon,
  Label as TagIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Tune as TuneIcon,
  SavedSearch as SavedSearchIcon,
  History as HistoryIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { SharePointFile, SharePointSite, SharePointLibrary, User } from '../types';

interface SearchResult {
  item: SharePointFile | SharePointLibrary | SharePointSite;
  type: 'file' | 'folder' | 'site';
  relevanceScore: number;
  highlightedSnippet?: string;
  matchedProperties: string[];
}

interface SearchFilters {
  sites: string[];
  fileTypes: string[];
  authors: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  sizeRange: {
    min: number;
    max: number;
  };
  tags: string[];
  properties: {
    [key: string]: string;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

interface SharePointSearchEngineProps {
  onResultSelect?: (result: SearchResult) => void;
  onNavigate?: (path: string) => void;
  initialQuery?: string;
  showAdvancedFilters?: boolean;
}

export const SharePointSearchEngine: React.FC<SharePointSearchEngineProps> = ({
  onResultSelect,
  onNavigate,
  initialQuery = '',
  showAdvancedFilters = true,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Filter states
  const [filters, setFilters] = useState<SearchFilters>({
    sites: [],
    fileTypes: [],
    authors: [],
    dateRange: {},
    sizeRange: { min: 0, max: 1000 }, // MB
    tags: [],
    properties: {},
  });

  // Search suggestions and autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // Available options for filters
  const [availableSites, setAvailableSites] = useState<SharePointSite[]>([]);
  const [availableFileTypes, setAvailableFileTypes] = useState<string[]>([]);
  const [availableAuthors, setAvailableAuthors] = useState<User[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>();

  // Load initial data
  useEffect(() => {
    loadFilterOptions();
    loadSearchHistory();
    loadSavedSearches();
    loadPopularSearches();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim()) {
      searchTimeout.current = setTimeout(() => {
        performSearch();
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, filters]);

  const loadFilterOptions = async () => {
    try {
      const [sitesRes, fileTypesRes, authorsRes, tagsRes] = await Promise.all([
        fetch('/api/sites'),
        fetch('/api/search/file-types'),
        fetch('/api/search/authors'),
        fetch('/api/search/tags'),
      ]);

      const [sites, fileTypes, authors, tags] = await Promise.all([
        sitesRes.json(),
        fileTypesRes.json(),
        authorsRes.json(),
        tagsRes.json(),
      ]);

      setAvailableSites(sites.data || []);
      setAvailableFileTypes(fileTypes.data || []);
      setAvailableAuthors(authors.data || []);
      setAvailableTags(tags.data || []);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('sharepoint_search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/search/saved');
      const data = await response.json();
      if (data.success) {
        setSavedSearches(data.data);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const loadPopularSearches = async () => {
    try {
      const response = await fetch('/api/search/popular');
      const data = await response.json();
      if (data.success) {
        setPopularSearches(data.data);
      }
    } catch (error) {
      console.error('Failed to load popular searches:', error);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      setError(null);

      const searchParams = {
        query: query.trim(),
        filters,
        includeSnippets: true,
        maxResults: 50,
      };

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.data.results);
        updateSearchHistory(query.trim());
        updateSearchSuggestions(data.data.suggestions || []);
      } else {
        setError(data.error?.message || 'Search failed');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const updateSearchHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('sharepoint_search_history', JSON.stringify(newHistory));
  };

  const updateSearchSuggestions = (newSuggestions: string[]) => {
    setSuggestions(newSuggestions);
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      sites: [],
      fileTypes: [],
      authors: [],
      dateRange: {},
      sizeRange: { min: 0, max: 1000 },
      tags: [],
      properties: {},
    });
  };

  const saveCurrentSearch = async () => {
    if (!query.trim()) return;

    const searchName = prompt('Enter a name for this saved search:');
    if (!searchName) return;

    try {
      const response = await fetch('/api/search/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: searchName,
          query: query.trim(),
          filters,
        }),
      });

      if (response.ok) {
        await loadSavedSearches();
      }
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    
    // Update usage count
    fetch(`/api/search/saved/${savedSearch.id}/use`, { method: 'POST' });
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'file': return <FileIcon />;
      case 'folder': return <FolderIcon />;
      case 'site': return <FolderIcon color="primary" />;
      default: return <FileIcon />;
    }
  };

  const getResultTitle = (result: SearchResult) => {
    return result.item.name || result.item.displayName;
  };

  const getResultSubtitle = (result: SearchResult) => {
    const item = result.item as SharePointFile;
    const parts = [];
    
    if (result.type === 'file') {
      if (item.size) {
        parts.push(`${(item.size / 1024 / 1024).toFixed(2)} MB`);
      }
      if (item.lastModifiedDateTime) {
        parts.push(`Modified ${new Date(item.lastModifiedDateTime).toLocaleDateString()}`);
      }
      if (item.lastModifiedBy) {
        parts.push(`by ${item.lastModifiedBy.displayName}`);
      }
    }
    
    return parts.join(' • ');
  };

  const formatRelevanceScore = (score: number) => {
    return Math.round(score * 100);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.sites.length > 0) count++;
    if (filters.fileTypes.length > 0) count++;
    if (filters.authors.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.sizeRange.min > 0 || filters.sizeRange.max < 1000) count++;
    if (filters.tags.length > 0) count++;
    if (Object.keys(filters.properties).length > 0) count++;
    return count;
  };

  const renderSearchSuggestions = () => {
    if (!query && searchHistory.length === 0 && savedSearches.length === 0) return null;

    return (
      <Paper sx={{ mt: 1, maxHeight: 300, overflow: 'auto' }}>
        {!query && (
          <>
            {/* Search History */}
            {searchHistory.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
                  <HistoryIcon sx={{ fontSize: 16, mr: 1 }} />
                  Recent Searches
                </Typography>
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => setQuery(historyItem)}
                  >
                    <ListItemText primary={historyItem} />
                  </ListItem>
                ))}
              </Box>
            )}

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <Box>
                <Divider />
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
                  <SavedSearchIcon sx={{ fontSize: 16, mr: 1 }} />
                  Saved Searches
                </Typography>
                {savedSearches.slice(0, 5).map((savedSearch) => (
                  <ListItem
                    key={savedSearch.id}
                    button
                    onClick={() => loadSavedSearch(savedSearch)}
                  >
                    <ListItemText
                      primary={savedSearch.name}
                      secondary={savedSearch.query}
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={savedSearch.useCount}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </Box>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <Box>
                <Divider />
                <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
                  <TrendingUpIcon sx={{ fontSize: 16, mr: 1 }} />
                  Popular Searches
                </Typography>
                {popularSearches.slice(0, 5).map((popularSearch, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => setQuery(popularSearch)}
                  >
                    <ListItemText primary={popularSearch} />
                  </ListItem>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Live Suggestions */}
        {query && suggestions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ p: 2, pb: 1 }}>
              Suggestions
            </Typography>
            {suggestions.slice(0, 5).map((suggestion, index) => (
              <ListItem
                key={index}
                button
                onClick={() => setQuery(suggestion)}
              >
                <ListItemIcon>
                  <SearchIcon />
                </ListItemIcon>
                <ListItemText primary={suggestion} />
              </ListItem>
            ))}
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Box>
      {/* Search Input */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          ref={searchInputRef}
          fullWidth
          placeholder="Search files, folders, and sites..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && performSearch()}
          InputProps={{
            startAdornment: (
              <IconButton size="small" onClick={performSearch}>
                <SearchIcon />
              </IconButton>
            ),
            endAdornment: query && (
              <IconButton size="small" onClick={() => setQuery('')}>
                <ClearIcon />
              </IconButton>
            ),
          }}
        />
        
        {showAdvancedFilters && (
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'default'}
          >
            <Badge badgeContent={getActiveFilterCount()} color="error">
              <FilterIcon />
            </Badge>
          </IconButton>
        )}
        
        <IconButton onClick={saveCurrentSearch} disabled={!query.trim()}>
          <StarIcon />
        </IconButton>
      </Box>

      {/* Search Suggestions */}
      {renderSearchSuggestions()}

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Advanced Filters</Typography>
            <Button size="small" onClick={clearFilters} startIcon={<ClearIcon />}>
              Clear All
            </Button>
          </Box>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label="Location & Type" />
            <Tab label="Date & Size" />
            <Tab label="People & Tags" />
            <Tab label="Properties" />
          </Tabs>

          {/* Location & Type Filters */}
          {tabValue === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Autocomplete
                multiple
                options={availableSites}
                getOptionLabel={(site) => site.displayName}
                value={availableSites.filter(site => filters.sites.includes(site.id))}
                onChange={(_, sites) => handleFilterChange('sites', sites.map(s => s.id))}
                renderInput={(params) => <TextField {...params} label="Sites" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.displayName} {...getTagProps({ index })} size="small" />
                  ))
                }
              />

              <Autocomplete
                multiple
                options={availableFileTypes}
                value={filters.fileTypes}
                onChange={(_, types) => handleFilterChange('fileTypes', types)}
                renderInput={(params) => <TextField {...params} label="File Types" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} size="small" />
                  ))
                }
              />
            </Box>
          )}

          {/* Date & Size Filters */}
          {tabValue === 1 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Date Range
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    type="date"
                    label="Start Date"
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : undefined,
                    })}
                  />
                  <TextField
                    type="date"
                    label="End Date"
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : undefined,
                    })}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  File Size (MB)
                </Typography>
                <Slider
                  range
                  value={[filters.sizeRange.min, filters.sizeRange.max]}
                  onChange={(_, value) => handleFilterChange('sizeRange', {
                    min: (value as number[])[0],
                    max: (value as number[])[1],
                  })}
                  min={0}
                  max={1000}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0' },
                    { value: 100, label: '100MB' },
                    { value: 500, label: '500MB' },
                    { value: 1000, label: '1GB' },
                  ]}
                />
              </Box>
            </Box>
          )}

          {/* People & Tags Filters */}
          {tabValue === 2 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Autocomplete
                multiple
                options={availableAuthors}
                getOptionLabel={(author) => author.displayName}
                value={availableAuthors.filter(author => filters.authors.includes(author.id))}
                onChange={(_, authors) => handleFilterChange('authors', authors.map(a => a.id))}
                renderInput={(params) => <TextField {...params} label="Authors" />}
              />

              <Autocomplete
                multiple
                options={availableTags}
                value={filters.tags}
                onChange={(_, tags) => handleFilterChange('tags', tags)}
                renderInput={(params) => <TextField {...params} label="Tags" />}
              />
            </Box>
          )}

          {/* Properties Filters */}
          {tabValue === 3 && (
            <Alert severity="info">
              Property filters will be available in a future update.
            </Alert>
          )}
        </Paper>
      </Collapse>

      {/* Search Results */}
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isSearching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!isSearching && results.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Search Results ({results.length})
            </Typography>
            
            <List>
              {results.map((result, index) => (
                <React.Fragment key={`${result.type}-${result.item.id}`}>
                  <ListItem
                    button
                    onClick={() => onResultSelect?.(result)}
                  >
                    <ListItemIcon>
                      {getResultIcon(result)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1">
                            {getResultTitle(result)}
                          </Typography>
                          <Chip
                            label={result.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${formatRelevanceScore(result.relevanceScore)}%`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {getResultSubtitle(result)}
                          </Typography>
                          
                          {result.highlightedSnippet && (
                            <Typography
                              variant="body2"
                              sx={{
                                mt: 0.5,
                                fontStyle: 'italic',
                                '& mark': {
                                  backgroundColor: 'yellow',
                                  padding: '0 2px',
                                },
                              }}
                              dangerouslySetInnerHTML={{
                                __html: result.highlightedSnippet
                              }}
                            />
                          )}
                          
                          {result.matchedProperties.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                              {result.matchedProperties.map(prop => (
                                <Chip
                                  key={prop}
                                  label={prop}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem', height: 20 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {!isSearching && query && results.length === 0 && (
          <Alert severity="info">
            No results found for "{query}". Try adjusting your search terms or filters.
          </Alert>
        )}
      </Box>
    </Box>
  );
};