import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Registar from './registar';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Quando o site abre, vai direto para o Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Registar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;