import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Feedback from '../pages/Feedback';
import Sobre from '../pages/Sobre';
import Servicos from '../pages/Servicos';
import Login from '../pages/Login';
import RedefinirSenha from '../pages/RedefinirSenha';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminFeedbacks from '../pages/admin/AdminFeedbacks';
import AdminUsers from '../pages/admin/AdminUsers';
import ProtectedRoute from '../routes/ProtectedRoute';
import Admin from '../pages/admin/Overview';
import AdminLayout from '../components/Layout/AdminLayout';


export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/feedback', element: <Feedback /> },
  { path: '/sobre', element: <Sobre /> },
  { path: '/servicos', element: <Servicos /> },
  { path: '/login', element: <Login /> },
  { path: '/redefinir-senha', element: <RedefinirSenha /> },
  
  {
   path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true,   lazy: async () => ({ Component: (await import('../pages/admin/Overview')).default }) },
      { path: 'categorias', lazy: async () => ({ Component: (await import('../pages/admin/AdminCategories')).default }) },
      { path: 'perguntas', lazy: async () => ({ Component: (await import('../pages/admin/AdminQuestions')).default }) },
      { path: 'feedbacks',  lazy: async () => ({ Component: (await import('../pages/admin/AdminFeedbacks')).default }) },
      { path: 'usuarios',   lazy: async () => ({ Component: (await import('../pages/admin/AdminUsers')).default }) },
    ],
  },

]);
