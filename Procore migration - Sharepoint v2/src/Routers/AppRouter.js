import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainPage from '../Components/MainPage';
import LandingPage from '../Components/LandingPage';
import ErrorPage from '../Components/ErrorPage';
import Root from '../Components/Root';

export const router = createBrowserRouter([
  {
    path: '/:accountSelect?',
    element: <LandingPage />,
  },
  {
    path: '/main',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        path: 'view',
        element: <Navigate to="/main" replace />,
      },
      {
        path: 'view/:docId',
        element: <MainPage />,
      },
      {
        path: 'download',
        element: <Navigate to="/main" replace />,
      },
      {
        path: 'download/:docId',
        element: <MainPage />,
      },
      {
        path: 'bulk-downloads',
        element: <Navigate to="/main" replace />,
      },
      {
        path: 'bulk-downloads/:downloadKey',
        element: <MainPage />,
      },
      {
        path: 'split-drawing',
        element: <Navigate to="/main" replace />,
      },
      {
        path: 'split-drawing/:docName',
        element: <MainPage />,
      },
    ],
  },
]);

export default router;
