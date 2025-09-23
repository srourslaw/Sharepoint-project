import { ErrorBoundary } from 'react-error-boundary';
import { RouterProvider } from 'react-router-dom';
import router from './Routers/AppRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from './context/snackbar-provider';
import { DialogProvider } from './context/dialog-provider';

const queryClient = new QueryClient();

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en">
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
          <DialogProvider>
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
              <RouterProvider router={router} />
            </ErrorBoundary>
          </DialogProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </LocalizationProvider>
  );
}

export default App;
