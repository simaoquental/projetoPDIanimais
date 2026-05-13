import React, { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function Registar() {
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [erroNome, setErroNome] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroPassword, setErroPassword] = useState('');

  const validarFormulario = () => {
    let valido = true;
    setErroNome('');
    setErroEmail('');
    setErroPassword('');

    if (nome.trim().length < 2) {
      setErroNome('O nome deve ter pelo menos 2 caracteres.');
      valido = false;
    }
    if (!validarEmail(email)) {
      setErroEmail('Introduza um email válido.');
      valido = false;
    }
    if (password.length < 6) {
      setErroPassword('A palavra-passe deve ter pelo menos 6 caracteres.');
      valido = false;
    }
    return valido;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!validarFormulario()) return;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome },
        },
      });

      if (error) {
        setErro(error.message);
        return;
      }

      if (data.user) {
        setSucesso("Conta criada com sucesso! Verifique o seu email se necessário.");
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro("Erro ao conectar ao serviço de autenticação.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center pt-12 px-6">

      <div className="flex flex-col items-center mb-10 text-center">
        <div className="bg-[#14b8a6] p-3 rounded-[1.25rem] shadow-sm mb-4 w-20 h-20 flex items-center justify-center">
          <img src="/pawlife_logo.png" alt="PawLife Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl text-black mb-2" style={{ fontFamily: "'Pacifico', cursive" }}>PawLife</h1>
        <p className="text-slate-500 font-medium max-w-[300px] leading-relaxed">
          A plataforma completa para o bem-estar do seu melhor amigo.
        </p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm w-full max-w-[440px] border border-slate-100">
        <h2 className="text-[26px] font-bold text-[#0f172a] text-center mb-6">Criar nova conta</h2>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold text-center transition-all">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="mb-6 p-4 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl text-sm font-bold text-center transition-all">
            {sucesso}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Nome completo</label>
            <div className="relative h-12">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><User size={20} /></span>
              <input
                type="text"
                placeholder="Nome"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setErroNome(''); }}
                className={`w-full h-full bg-[#f8fafc] border rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all ${erroNome ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
            {erroNome && <p className="text-xs font-bold text-red-500 ml-1">{erroNome}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
            <div className="relative h-12">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Mail size={20} /></span>
              <input
                type="email"
                placeholder="nome@gmail.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErroEmail(''); }}
                className={`w-full h-full bg-[#f8fafc] border rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all ${erroEmail ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
            {erroEmail && <p className="text-xs font-bold text-red-500 ml-1">{erroEmail}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Palavra-passe</label>
            <div className="relative h-12">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Lock size={20} /></span>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErroPassword(''); }}
                className={`w-full h-full bg-[#f8fafc] border rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all ${erroPassword ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
            {erroPassword && <p className="text-xs font-bold text-red-500 ml-1">{erroPassword}</p>}
          </div>

          <button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold py-4 rounded-xl mt-2 transition-all shadow-md active:scale-95">
            Registar
          </button>
        </form>
      </div>

      <div className="mt-8 text-slate-500 font-medium text-sm">
        Já tem conta? <Link to="/login" className="text-[#0d9488] font-bold hover:underline">Iniciar sessão</Link>
      </div>
    </div>
  );
}