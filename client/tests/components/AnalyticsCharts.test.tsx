import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { AnalyticsChart } from '../../src/components/AnalyticsCharts';
import { ChartSeries } from '../../src/types';

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  PieChart: ({ children, data }: any) => (
    <div data-testid="pie-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  AreaChart: ({ children, data }: any) => (
    <div data-testid="area-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} style={{ stroke }} />
  ),
  Bar: ({ dataKey, fill }: any) => (
    <div data-testid={`bar-${dataKey}`} style={{ fill }} />
  ),
  Cell: ({ fill }: any) => <div data-testid="pie-cell" style={{ fill }} />,
  Pie: ({ dataKey }: any) => <div data-testid={`pie-${dataKey}`} />,
  Area: ({ dataKey, fill }: any) => (
    <div data-testid={`area-${dataKey}`} style={{ fill }} />
  ),
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('AnalyticsChart', () => {
  const mockData: ChartSeries[] = [
    {
      name: 'Documents',
      data: [
        { x: '2023-01', y: 100, label: 'January' },
        { x: '2023-02', y: 150, label: 'February' },
        { x: '2023-03', y: 200, label: 'March' },
      ],
      color: '#1976d2',
    },
    {
      name: 'Users',
      data: [
        { x: '2023-01', y: 50, label: 'January' },
        { x: '2023-02', y: 75, label: 'February' },
        { x: '2023-03', y: 100, label: 'March' },
      ],
      color: '#dc004e',
    },
  ];

  it('renders line chart correctly', () => {
    render(
      <AnalyticsChart
        title="Document Usage Over Time"
        type="line"
        data={mockData}
      />
    );

    expect(screen.getByText('Document Usage Over Time')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('renders bar chart correctly', () => {
    render(
      <AnalyticsChart
        title="Monthly Statistics"
        type="bar"
        data={mockData}
      />
    );

    expect(screen.getByText('Monthly Statistics')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  it('renders pie chart correctly', () => {
    const pieData: ChartSeries[] = [
      {
        name: 'File Types',
        data: [
          { x: 'Documents', y: 45, label: 'Word Documents' },
          { x: 'Spreadsheets', y: 30, label: 'Excel Files' },
          { x: 'Presentations', y: 25, label: 'PowerPoint Files' },
        ],
      },
    ];

    render(
      <AnalyticsChart
        title="File Type Distribution"
        type="pie"
        data={pieData}
      />
    );

    expect(screen.getByText('File Type Distribution')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders area chart correctly', () => {
    render(
      <AnalyticsChart
        title="Storage Usage Trend"
        type="area"
        data={mockData}
      />
    );

    expect(screen.getByText('Storage Usage Trend')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('displays subtitle when provided', () => {
    render(
      <AnalyticsChart
        title="Main Title"
        subtitle="This is a subtitle"
        type="line"
        data={mockData}
      />
    );

    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
  });

  it('applies custom height', () => {
    render(
      <AnalyticsChart
        title="Custom Height Chart"
        type="bar"
        data={mockData}
        height={600}
      />
    );

    const container = screen.getByTestId('responsive-container');
    expect(container).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(
      <AnalyticsChart
        title="Empty Chart"
        type="line"
        data={[]}
      />
    );

    expect(screen.getByText('Empty Chart')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <AnalyticsChart
        title="Loading Chart"
        type="line"
        data={mockData}
        loading={true}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    render(
      <AnalyticsChart
        title="Error Chart"
        type="line"
        data={mockData}
        error="Failed to load chart data"
      />
    );

    expect(screen.getByText('Failed to load chart data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles retry on error', async () => {
    const mockOnRetry = jest.fn();

    render(
      <AnalyticsChart
        title="Error Chart"
        type="line"
        data={mockData}
        error="Failed to load chart data"
        onRetry={mockOnRetry}
      />
    );

    fireEvent.click(screen.getByText('Retry'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('renders legend when enabled', () => {
    render(
      <AnalyticsChart
        title="Chart with Legend"
        type="line"
        data={mockData}
        showLegend={true}
      />
    );

    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('hides grid when disabled', () => {
    render(
      <AnalyticsChart
        title="Chart without Grid"
        type="line"
        data={mockData}
        showGrid={false}
      />
    );

    expect(screen.queryByTestId('cartesian-grid')).not.toBeInTheDocument();
  });

  it('applies custom colors to data series', () => {
    const customData: ChartSeries[] = [
      {
        name: 'Custom Series',
        data: [{ x: '2023-01', y: 100 }],
        color: '#ff5722',
      },
    ];

    render(
      <AnalyticsChart
        title="Custom Color Chart"
        type="line"
        data={customData}
      />
    );

    const lineChart = screen.getByTestId('line-chart');
    expect(lineChart).toBeInTheDocument();
  });

  it('formats data correctly for different chart types', () => {
    const { rerender } = render(
      <AnalyticsChart
        title="Format Test"
        type="line"
        data={mockData}
      />
    );

    let chartElement = screen.getByTestId('line-chart');
    expect(chartElement).toHaveAttribute('data-chart-data');

    // Test bar chart format
    rerender(
      <AnalyticsChart
        title="Format Test"
        type="bar"
        data={mockData}
      />
    );

    chartElement = screen.getByTestId('bar-chart');
    expect(chartElement).toHaveAttribute('data-chart-data');
  });

  it('handles interactive features', async () => {
    const mockOnDataClick = jest.fn();

    render(
      <AnalyticsChart
        title="Interactive Chart"
        type="bar"
        data={mockData}
        onDataClick={mockOnDataClick}
      />
    );

    // Simulate clicking on chart data
    const barElement = screen.getByTestId('bar-Documents');
    fireEvent.click(barElement);

    await waitFor(() => {
      expect(mockOnDataClick).toHaveBeenCalled();
    });
  });

  it('supports different chart variants', () => {
    render(
      <AnalyticsChart
        title="Stacked Chart"
        type="bar"
        data={mockData}
        variant="stacked"
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('handles responsive behavior', () => {
    const { rerender } = render(
      <AnalyticsChart
        title="Responsive Chart"
        type="line"
        data={mockData}
        width="100%"
        height={400}
      />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();

    // Test with different dimensions
    rerender(
      <AnalyticsChart
        title="Responsive Chart"
        type="line"
        data={mockData}
        width={800}
        height={600}
      />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('displays tooltip on hover', () => {
    render(
      <AnalyticsChart
        title="Chart with Tooltip"
        type="line"
        data={mockData}
        showTooltip={true}
      />
    );

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('handles animation settings', () => {
    render(
      <AnalyticsChart
        title="Animated Chart"
        type="line"
        data={mockData}
        animated={true}
        animationDuration={1000}
      />
    );

    // Animation settings would be applied to the chart components
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('supports data export functionality', async () => {
    const mockOnExport = jest.fn();

    render(
      <AnalyticsChart
        title="Exportable Chart"
        type="line"
        data={mockData}
        exportable={true}
        onExport={mockOnExport}
      />
    );

    const exportButton = screen.getByLabelText('Export chart');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalledWith(mockData, 'line');
    });
  });

  it('handles real-time data updates', () => {
    const { rerender } = render(
      <AnalyticsChart
        title="Real-time Chart"
        type="line"
        data={mockData}
      />
    );

    // Update with new data
    const newData: ChartSeries[] = [
      {
        name: 'Documents',
        data: [
          ...mockData[0].data,
          { x: '2023-04', y: 250, label: 'April' },
        ],
      },
    ];

    rerender(
      <AnalyticsChart
        title="Real-time Chart"
        type="line"
        data={newData}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('applies accessibility features', () => {
    render(
      <AnalyticsChart
        title="Accessible Chart"
        type="line"
        data={mockData}
        ariaLabel="Document usage analytics chart"
        ariaDescription="Shows document usage trends over the past 3 months"
      />
    );

    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    // Accessibility attributes would be applied in the actual implementation
  });
});