import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Registar from './registar';
import Home from './home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redireciona a raiz (o link inicial) direto para o login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Páginas de Autenticação (Sem a barra lateral) */}
        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Registar />} />
        
        {/* Página Principal do Dashboard (Com a barra lateral) */}
        <Route path="/home" element={<Home />} />

        {/* Rota de segurança: se o utilizador escrever um link que não existe, volta ao login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;