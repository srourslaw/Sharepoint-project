import React from 'react';

function App() {
  console.log('Minimal App starting...');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Minimal App - Step 1</h1>
      <p>Absolute minimal React app with no external dependencies</p>
      <p>If this still shows b.length error, the issue is in React or build system</p>
    </div>
  );
}

export default App;