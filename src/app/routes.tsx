import { createBrowserRouter, Navigate } from 'react-router';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ReportRepair from './pages/ReportRepair';
import CheckStatus from './pages/CheckStatus';
import UpdateRepair from './pages/UpdateRepair';
import ChatBot from './pages/ChatBot';
import UserManagement from './pages/UserManagement';
import Analytics from './pages/Analytics';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'report',
        element: <ReportRepair />,
      },
      {
        path: 'status',
        element: <CheckStatus />,
      },
      {
        path: 'update',
        element: <UpdateRepair />,
      },
      {
        path: 'chat',
        element: <ChatBot />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);