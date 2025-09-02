import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Feedback from '../pages/Feedback';
import Sobre from '../pages/Sobre';
import Servicos from '../pages/Servicos';
import Login from '../pages/Login';
import RedefinirSenha from '../pages/RedefinirSenha';
import Admin from '../pages/Admin';
import AdminCategories from '../pages/AdminCategories';
import AdminFeedbacks from '../pages/AdminFeedbacks';
import AdminUsers from '../pages/AdminUsers';

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/feedback', element: <Feedback /> },
  { path: '/sobre', element: <Sobre /> },
  { path: '/servicos', element: <Servicos /> },
  { path: '/login', element: <Login /> },
  { path: '/redefinir-senha', element: <RedefinirSenha /> },

  // Painel
  { path: '/admin', element: <Admin /> },
  { path: '/admin/categorias', element: <AdminCategories /> },
  { path: '/admin/feedbacks', element: <AdminFeedbacks /> },
  { path: '/admin/usuarios', element: <AdminUsers /> },
]);
