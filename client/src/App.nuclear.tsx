import React from 'react';
import { Box, Typography } from '@mui/material';

const App: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Ultra Minimal App Test
      </Typography>
      <Typography variant="body1">
        If you see this without React errors, the issue is in the complex components.
      </Typography>
      <Typography variant="body2" sx={{ mt: 2, color: 'success.main' }}>
        This only uses basic Material-UI components with string content.
      </Typography>
    </Box>
  );
};

export default App;