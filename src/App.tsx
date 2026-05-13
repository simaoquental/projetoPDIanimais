import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './privateRoute';
import Login from './login';
import Registar from './registar';
import Home from './dashboard';
import Animais from './animais';
import Calendario from './calendario';
import Saude from './saude';
import PerfilAnimal from './perfilAnimal';
import Alimentacao from './alimentacao';
import Adocao from './adocao';
import Atividades from './atividades';
import Perfil from './perfil';
import Admin from './admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Registar />} />

        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/animais" element={<PrivateRoute><Animais /></PrivateRoute>} />
        <Route path="/perfil/:id" element={<PrivateRoute><PerfilAnimal /></PrivateRoute>} />
        <Route path="/calendario" element={<PrivateRoute><Calendario /></PrivateRoute>} />
        <Route path="/saude" element={<PrivateRoute><Saude /></PrivateRoute>} />
        <Route path="/alimentacao" element={<PrivateRoute><Alimentacao /></PrivateRoute>} />
        <Route path="/adocao" element={<PrivateRoute><Adocao /></PrivateRoute>} />
        <Route path="/atividades" element={<PrivateRoute><Atividades /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;