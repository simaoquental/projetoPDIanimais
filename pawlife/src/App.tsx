import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login';
import Registar from './registar';
import Home from './dashboard';
import Animais from './animais';
import Calendario from './calendario';
import Saude from './saude';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/registar" element={<Registar />} />
        
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />

        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/animais" element={<Animais />} />

        <Route path="/calendario" element={<Calendario />} />
        <Route path="/saude" element={<Saude />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;