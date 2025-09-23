import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css';
import App from './App';
// import router from './Routers/AppRouter';
import reportWebVitals from './reportWebVitals';
// import { RouterProvider } from 'react-router-dom';
// import { ErrorBoundary } from "react-error-boundary";
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './configs/msal';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
  <MsalProvider instance={msalInstance}>
    <App />,
  </MsalProvider>,
  // </React.StrictMode>
);

reportWebVitals();
