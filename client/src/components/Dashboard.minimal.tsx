import React from 'react';

export const Dashboard: React.FC = () => {
  console.log('Dashboard.minimal rendering...');

  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimal Dashboard</h1>
      <p>This is the absolute minimal Dashboard with no imports or dependencies.</p>
      <p>If this still shows b.length error, the issue is not in Dashboard.</p>
    </div>
  );
};