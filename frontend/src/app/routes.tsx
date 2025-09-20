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
import ProtectedRoute from '../routes/ProtectedRoute';


export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/feedback', element: <Feedback /> },
  { path: '/sobre', element: <Sobre /> },
  { path: '/servicos', element: <Servicos /> },
  { path: '/login', element: <Login /> },
  { path: '/redefinir-senha', element: <RedefinirSenha /> },

  // Painel
  { path: '/admin', element: <ProtectedRoute><Admin /></ProtectedRoute> },
  { path: '/admin/categorias', element: <ProtectedRoute><AdminCategories /></ProtectedRoute> },
  { path: '/admin/feedbacks', element: <ProtectedRoute><AdminFeedbacks /></ProtectedRoute> },
  { path: '/admin/usuarios', element: <ProtectedRoute><AdminUsers /></ProtectedRoute> },


]);
