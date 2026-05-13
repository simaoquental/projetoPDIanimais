import React, { useState, useEffect } from 'react';
import { Mail, Lock, X, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

type PassoRecuperar = 'email' | 'codigo' | 'novaPassword' | 'sucesso';

const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [erroPassword, setErroPassword] = useState('');

  const [mostrarModal, setMostrarModal] = useState(false);
  const [passo, setPasso] = useState<PassoRecuperar>('email');
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaPassword, setNovaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [erroModal, setErroModal] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr === "undefined") localStorage.removeItem('user');
  }, []);

  const validarFormulario = () => {
    let valido = true;
    setErroEmail('');
    setErroPassword('');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!validarFormulario()) return;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setErro(authError.message === "Invalid login credentials"
          ? "Email ou palavra-passe incorretos."
          : authError.message);
        return;
      }

      if (authData.user) {
        const { data: userData } = await supabase
          .from('utilizadores')
          .select('*')
          .eq('id_utilizador', authData.user.id)
          .single();

        setSucesso("Login efetuado com sucesso!");

        const userParaGuardar = {
          id: authData.user.id,
          email: authData.user.email,
          nome: userData?.nome || "Utilizador",
          ...userData,
          is_admin: authData.user.email === 'admin@admin.com' ? true : userData?.is_admin
        };

        localStorage.setItem('user', JSON.stringify(userParaGuardar));

        setTimeout(() => {
          if (authData.user.email === 'admin@admin.com' || userData?.is_admin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Erro:", error);
      setErro("Erro ao conectar ao serviço de autenticação.");
    }
  };

  const handleEnviarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal('');

    if (!validarEmail(emailRecuperar)) {
      setErroModal('Introduza um email válido.');
      return;
    }

    setLoadingModal(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar);
      if (error) {
        setErroModal('Não foi possível enviar o código. Verifique o email e tente novamente.');
      } else {
        setPasso('codigo');
      }
    } catch {
      setErroModal('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal('');
    setLoadingModal(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailRecuperar,
        token: codigo,
        type: 'recovery',
      });

      if (error) {
        setErroModal('Código inválido ou expirado. Verifique e tente novamente.');
      } else {
        setPasso('novaPassword');
      }
    } catch {
      setErroModal('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleDefinirPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal('');

    if (novaPassword.length < 6) {
      setErroModal('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaPassword !== confirmarPassword) {
      setErroModal('As palavras-passe não coincidem.');
      return;
    }

    setLoadingModal(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaPassword });
      if (error) {
        setErroModal('Não foi possível atualizar a palavra-passe. Tente novamente.');
      } else {
        setPasso('sucesso');
        setTimeout(() => fecharModal(), 3000);
      }
    } catch {
      setErroModal('Erro inesperado. Tente novamente.');
    } finally {
      setLoadingModal(false);
    }
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setPasso('email');
    setEmailRecuperar('');
    setCodigo('');
    setNovaPassword('');
    setConfirmarPassword('');
    setErroModal('');
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center pt-12 px-6">

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[420px] p-10 relative">

            <button onClick={fecharModal} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors">
              <X size={22} />
            </button>

            {passo === 'email' && (
              <>
                <div className="mb-6 text-center">
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail size={24} className="text-[#0d9488]" />
                  </div>
                  <h2 className="text-[22px] font-bold text-[#0f172a]">Recuperar palavra-passe</h2>
                  <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                    Introduza o seu email e enviaremos um código de recuperação.
                  </p>
                </div>
                {erroModal && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold text-center">
                    {erroModal}
                  </div>
                )}
                <form onSubmit={handleEnviarCodigo} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                    <div className="relative h-12">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Mail size={20} /></span>
                      <input
                        type="email"
                        placeholder="nome@gmail.com"
                        value={emailRecuperar}
                        onChange={(e) => setEmailRecuperar(e.target.value)}
                        required
                        className="w-full h-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loadingModal} className="w-full bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 text-white font-bold py-4 rounded-xl mt-2 transition-all shadow-md active:scale-95">
                    {loadingModal ? 'A enviar...' : 'Enviar código'}
                  </button>
                </form>
              </>
            )}

            {passo === 'codigo' && (
              <>
                <div className="mb-6 text-center">
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <KeyRound size={24} className="text-[#0d9488]" />
                  </div>
                  <h2 className="text-[22px] font-bold text-[#0f172a]">Introduza o código</h2>
                  <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                    Enviámos um código para <span className="text-[#0d9488] font-bold">{emailRecuperar}</span>. Verifique a sua caixa de entrada.
                  </p>
                </div>
                {erroModal && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold text-center">
                    {erroModal}
                  </div>
                )}
                <form onSubmit={handleVerificarCodigo} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Código de recuperação</label>
                    <input
                      type="text"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                      maxLength={8}
                      required
                      className="w-full h-14 bg-[#f8fafc] border border-slate-200 rounded-xl px-4 text-center text-2xl font-black tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all"
                    />
                  </div>
                  <button type="submit" disabled={loadingModal || codigo.length < 6} className="w-full bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 text-white font-bold py-4 rounded-xl mt-2 transition-all shadow-md active:scale-95">
                    {loadingModal ? 'A verificar...' : 'Verificar código'}
                  </button>
                  <button type="button" onClick={() => { setPasso('email'); setErroModal(''); }} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    ← Usar outro email
                  </button>
                </form>
              </>
            )}

            {passo === 'novaPassword' && (
              <>
                <div className="mb-6 text-center">
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={24} className="text-[#0d9488]" />
                  </div>
                  <h2 className="text-[22px] font-bold text-[#0f172a]">Nova palavra-passe</h2>
                  <p className="text-slate-500 text-sm font-medium mt-2">Escolha uma nova palavra-passe para a sua conta.</p>
                </div>
                {erroModal && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold text-center">
                    {erroModal}
                  </div>
                )}
                <form onSubmit={handleDefinirPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Nova palavra-passe</label>
                    <div className="relative h-12">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Lock size={20} /></span>
                      <input type="password" placeholder="Mínimo 6 caracteres" value={novaPassword} onChange={(e) => setNovaPassword(e.target.value)} required className="w-full h-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Confirmar palavra-passe</label>
                    <div className="relative h-12">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Lock size={20} /></span>
                      <input type="password" placeholder="Repita a palavra-passe" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required className="w-full h-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={loadingModal} className="w-full bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 text-white font-bold py-4 rounded-xl mt-2 transition-all shadow-md active:scale-95">
                    {loadingModal ? 'A guardar...' : 'Guardar palavra-passe'}
                  </button>
                </form>
              </>
            )}

            {passo === 'sucesso' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="text-[#0d9488]" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="text-[22px] font-bold text-[#0f172a] mb-3">Palavra-passe atualizada!</h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">A sua palavra-passe foi alterada com sucesso.</p>
              </div>
            )}

          </div>
        </div>
      )}

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
        <h2 className="text-[26px] font-bold text-[#0f172a] text-center mb-6">Aceda à sua conta</h2>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold text-center">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="mb-6 p-4 bg-teal-50 text-teal-600 border border-teal-100 rounded-xl text-sm font-bold text-center">
            {sucesso}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 text-left">
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

          <div className="flex flex-col gap-2 text-left">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700">Palavra-passe</label>
              <button type="button" onClick={() => setMostrarModal(true)} className="text-xs font-bold text-[#14b8a6] hover:underline">
                Esqueceu-se?
              </button>
            </div>
            <div className="relative h-12">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Lock size={20} /></span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErroPassword(''); }}
                className={`w-full h-full bg-[#f8fafc] border rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all ${erroPassword ? 'border-red-400' : 'border-slate-200'}`}
              />
            </div>
            {erroPassword && <p className="text-xs font-bold text-red-500 ml-1">{erroPassword}</p>}
          </div>

          <button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-md active:scale-95">
            Entrar
          </button>
        </form>
      </div>

      <div className="mt-8 text-slate-500 font-medium text-sm">
        Ainda não tem conta? <Link to="/registar" className="text-[#0d9488] font-bold hover:underline">Crie agora</Link>
      </div>

    </div>
  );
}