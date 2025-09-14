import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Paper,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Fullscreen as FullscreenIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { ChartSeries, ChartDataPoint } from '../types';

interface AnalyticsChartProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'funnel' | 'composed';
  data: ChartSeries[];
  height?: number | string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  colors?: string[];
  customConfig?: any;
  onDataPointClick?: (data: any) => void;
  onExport?: () => void;
  onRefresh?: () => void;
}

interface ChartMenuProps {
  onExport?: () => void;
  onRefresh?: () => void;
  onFullscreen?: () => void;
  onSettings?: () => void;
}

const ChartMenu: React.FC<ChartMenuProps> = ({
  onExport,
  onRefresh,
  onFullscreen,
  onSettings,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton size="small" onClick={handleClick}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {onRefresh && (
          <MenuItem onClick={() => { onRefresh(); handleClose(); }}>
            <RefreshIcon sx={{ mr: 1 }} />
            Refresh Data
          </MenuItem>
        )}
        {onExport && (
          <MenuItem onClick={() => { onExport(); handleClose(); }}>
            <DownloadIcon sx={{ mr: 1 }} />
            Export Chart
          </MenuItem>
        )}
        {onFullscreen && (
          <MenuItem onClick={() => { onFullscreen(); handleClose(); }}>
            <FullscreenIcon sx={{ mr: 1 }} />
            Fullscreen
          </MenuItem>
        )}
        {onSettings && (
          <MenuItem onClick={() => { onSettings(); handleClose(); }}>
            <SettingsIcon sx={{ mr: 1 }} />
            Chart Settings
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  title,
  subtitle,
  type,
  data,
  height = 400,
  showLegend = true,
  showGrid = true,
  showTooltip = true,
  interactive = true,
  colors,
  customConfig,
  onDataPointClick,
  onExport,
  onRefresh,
}) => {
  const theme = useTheme();
  
  // Default color palette
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
    '#9c27b0',
    '#ff5722',
    '#607d8b',
    '#795548',
  ];

  const chartColors = colors || defaultColors;

  // Transform data for different chart types
  const transformDataForChart = () => {
    if (!data || data.length === 0) return [];

    switch (type) {
      case 'pie':
        // For pie charts, use the first series
        return data[0]?.data.map((point, index) => ({
          name: point.label || point.x,
          value: point.y,
          fill: chartColors[index % chartColors.length],
        })) || [];

      case 'treemap':
        return data[0]?.data.map((point, index) => ({
          name: point.label || point.x,
          size: point.y,
          fill: chartColors[index % chartColors.length],
        })) || [];

      case 'funnel':
        return data[0]?.data.map((point, index) => ({
          name: point.label || point.x,
          value: point.y,
          fill: chartColors[index % chartColors.length],
        })) || [];

      case 'radar':
        // For radar charts, transform to have a common x-axis
        const radarData: any[] = [];
        if (data[0]) {
          data[0].data.forEach(point => {
            const existing = radarData.find(d => d.subject === (point.label || point.x));
            if (existing) {
              data.forEach((series, seriesIndex) => {
                const seriesPoint = series.data.find(p => (p.label || p.x) === (point.label || point.x));
                if (seriesPoint) {
                  existing[series.name] = seriesPoint.y;
                }
              });
            } else {
              const newPoint: any = { subject: point.label || point.x };
              data.forEach((series, seriesIndex) => {
                const seriesPoint = series.data.find(p => (p.label || p.x) === (point.label || point.x));
                newPoint[series.name] = seriesPoint?.y || 0;
              });
              radarData.push(newPoint);
            }
          });
        }
        return radarData;

      default:
        // For line, bar, area, scatter charts, merge all series data
        const combinedData: any[] = [];
        
        // Get all unique x values
        const allXValues = Array.from(new Set(
          data.flatMap(series => series.data.map(point => point.x))
        )).sort();

        allXValues.forEach(xValue => {
          const dataPoint: any = { x: xValue };
          
          data.forEach(series => {
            const point = series.data.find(p => p.x === xValue);
            dataPoint[series.name] = point?.y || 0;
          });
          
          combinedData.push(dataPoint);
        });
        
        return combinedData;
    }
  };

  const chartData = transformDataForChart();

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 60 },
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />}
            <XAxis
              dataKey="x"
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                // Map numeric values back to day labels
                const dayMap: { [key: number]: string } = {
                  1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun'
                };
                return dayMap[value as number] || value;
              }}
            />
            <YAxis 
              stroke={theme.palette.text.secondary}
              tick={{ fontSize: 12 }}
            />
            {showTooltip && <RechartsTooltip />}
            {showLegend && <Legend />}
            {data.map((series, index) => (
              <Line
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stroke={series.color || chartColors[index % chartColors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                onClick={onDataPointClick}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />}
            <XAxis dataKey="x" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            {showTooltip && <RechartsTooltip />}
            {showLegend && <Legend />}
            {data.map((series, index) => (
              <Area
                key={series.name}
                type="monotone"
                dataKey={series.name}
                stackId="1"
                stroke={series.color || chartColors[index % chartColors.length]}
                fill={series.color || chartColors[index % chartColors.length]}
                fillOpacity={0.3}
                onClick={onDataPointClick}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />}
            <XAxis dataKey="x" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            {showTooltip && <RechartsTooltip />}
            {showLegend && <Legend />}
            {data.map((series, index) => (
              <Bar
                key={series.name}
                dataKey={series.name}
                fill={series.color || chartColors[index % chartColors.length]}
                onClick={onDataPointClick}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelStyle={{ fontSize: '11px', fontWeight: '500' }}
              onClick={onDataPointClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            {showTooltip && <RechartsTooltip />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />}
            <XAxis dataKey="x" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            {showTooltip && <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />}
            {showLegend && <Legend />}
            {data.map((series, index) => (
              <Scatter
                key={series.name}
                name={series.name}
                data={series.data}
                fill={series.color || chartColors[index % chartColors.length]}
                onClick={onDataPointClick}
              />
            ))}
          </ScatterChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke={alpha(theme.palette.text.secondary, 0.2)} />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis tick={{ fontSize: 10 }} />
            {showTooltip && <RechartsTooltip />}
            {showLegend && <Legend />}
            {data.map((series, index) => (
              <Radar
                key={series.name}
                name={series.name}
                dataKey={series.name}
                stroke={series.color || chartColors[index % chartColors.length]}
                fill={series.color || chartColors[index % chartColors.length]}
                fillOpacity={0.1}
                strokeWidth={2}
              />
            ))}
          </RadarChart>
        );

      case 'treemap':
        return (
          <Treemap
            data={chartData}
            dataKey="size"
            aspectRatio={4/3}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Treemap>
        );

      case 'funnel':
        return (
          <FunnelChart>
            <Funnel
              dataKey="value"
              data={chartData}
              isAnimationActive
              onClick={onDataPointClick}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList position="center" />
            </Funnel>
            {showTooltip && <RechartsTooltip />}
          </FunnelChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.2)} />}
            <XAxis dataKey="x" stroke={theme.palette.text.secondary} />
            <YAxis stroke={theme.palette.text.secondary} />
            {showTooltip && <RechartsTooltip />}
            {showLegend && <Legend />}
            {data.map((series, index) => {
              const color = series.color || chartColors[index % chartColors.length];
              
              // Alternate between bars and lines for different series
              if (series.type === 'bar' || index % 2 === 0) {
                return (
                  <Bar
                    key={series.name}
                    dataKey={series.name}
                    fill={color}
                    onClick={onDataPointClick}
                  />
                );
              } else {
                return (
                  <Line
                    key={series.name}
                    type="monotone"
                    dataKey={series.name}
                    stroke={color}
                    strokeWidth={2}
                    onClick={onDataPointClick}
                  />
                );
              }
            })}
          </ComposedChart>
        );

      default:
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary' 
          }}>
            <Typography>Unsupported chart type: {type}</Typography>
          </Box>
        );
    }
  };

  if (!data || data.length === 0) {
    return (
      <Card sx={{ height }}>
        <CardHeader 
          title={title}
          subheader={subtitle}
          action={
            <ChartMenu
              onExport={onExport}
              onRefresh={onRefresh}
            />
          }
        />
        <CardContent sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: 'calc(100% - 80px)',
          color: 'text.secondary' 
        }}>
          <Typography>No data available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height }}>
      <CardHeader 
        title={title}
        subheader={subtitle}
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'body2' }}
        action={
          interactive && (
            <ChartMenu
              onExport={onExport}
              onRefresh={onRefresh}
            />
          )
        }
      />
      <CardContent sx={{ height: 'calc(100% - 80px)', p: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// Pre-configured chart components for common use cases
export const DocumentUsageChart: React.FC<{
  data: ChartSeries[];
  timeframe?: string;
}> = ({ data, timeframe = 'Last 30 days' }) => (
  <AnalyticsChart
    title="Document Usage Trends"
    subtitle={timeframe}
    type="line"
    data={data}
    height={400}
  />
);

export const AIInteractionChart: React.FC<{
  data: ChartSeries[];
  type?: 'line' | 'bar' | 'pie';
}> = ({ data, type = 'bar' }) => (
  <AnalyticsChart
    title="AI Interaction Analytics"
    subtitle="Success rate and usage patterns"
    type={type}
    data={data}
    height={400}
  />
);

export const PerformanceMetricsChart: React.FC<{
  data: ChartSeries[];
}> = ({ data }) => (
  <AnalyticsChart
    title="System Performance Metrics"
    subtitle="Response time, throughput, and error rates"
    type="composed"
    data={data}
    height={400}
  />
);

export const StorageUsageChart: React.FC<{
  data: ChartSeries[];
  type?: 'pie' | 'treemap';
}> = ({ data, type = 'treemap' }) => (
  <AnalyticsChart
    title="Storage Usage Breakdown"
    subtitle="File types and sizes"
    type={type}
    data={data}
    height={400}
  />
);

export const UserActivityChart: React.FC<{
  data: ChartSeries[];
}> = ({ data }) => (
  <AnalyticsChart
    title="User Activity Patterns"
    subtitle="Activity distribution and trends"
    type="area"
    data={data}
    height={400}
  />
);

// Chart grid component for dashboard layouts
export const AnalyticsChartGrid: React.FC<{
  charts: Array<{
    id: string;
    component: React.ReactNode;
    gridSize: { xs: number; sm?: number; md?: number; lg?: number };
  }>;
}> = ({ charts }) => (
  <Grid container spacing={3}>
    {charts.map(chart => (
      <Grid 
        key={chart.id} 
        item 
        xs={chart.gridSize.xs}
        sm={chart.gridSize.sm}
        md={chart.gridSize.md}
        lg={chart.gridSize.lg}
      >
        {chart.component}
      </Grid>
    ))}
  </Grid>
);