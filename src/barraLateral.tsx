import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Dog, HeartPulse, Calendar,
  Activity, Package, LogOut, Heart, Menu, X
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const [nomeExibicao, setNomeExibicao] = useState('');
  const [iniciais, setIniciais] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [aberta, setAberta] = useState(false);

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Dog, label: 'Os Meus Animais', path: '/animais' },
    { icon: HeartPulse, label: 'Saúde', path: '/saude' },
    { icon: Calendar, label: 'Calendário', path: '/calendario' },
    { icon: Activity, label: 'Atividades', path: '/atividades' },
    { icon: Package, label: 'Stock de Alimentação', path: '/alimentacao' },
    { icon: Heart, label: 'Associações de Adoção', path: '/adocao' },
  ];

  useEffect(() => {
    const carregarDados = () => {
      const utilizadorGuardado = localStorage.getItem('user');
      if (utilizadorGuardado) {
        try {
          const utilizador = JSON.parse(utilizadorGuardado);
          if (utilizador && utilizador.nome) {
            const partesDoNome = utilizador.nome.trim().split(' ');
            const primeiroNome = partesDoNome[0];
            const ultimoNome = partesDoNome.length > 1 ? partesDoNome[partesDoNome.length - 1] : '';
            setNomeExibicao(ultimoNome ? `${primeiroNome} ${ultimoNome}` : primeiroNome);
            const inicial1 = primeiroNome.charAt(0).toUpperCase();
            const inicial2 = ultimoNome ? ultimoNome.charAt(0).toUpperCase() : '';
            setIniciais(`${inicial1}${inicial2}`);
          }

          if (utilizador && utilizador.foto_perfil_url) {
            if (utilizador.foto_perfil_url.startsWith('http')) {
              setFotoPerfil(utilizador.foto_perfil_url);
            } else {
              const { data } = supabase.storage.from('profile-images').getPublicUrl(utilizador.foto_perfil_url);
              setFotoPerfil(data.publicUrl);
            }
          } else {
            setFotoPerfil(null);
          }
        } catch (e) {
          console.error('Erro ao ler utilizador', e);
        }
      }
    };

    carregarDados();
    window.addEventListener('storage', carregarDados);
    return () => window.removeEventListener('storage', carregarDados);
  }, []);

  useEffect(() => {
    setAberta(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const conteudoSidebar = (
    <>
      <div className="p-8 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#14b8a6] rounded-xl flex items-center justify-center shadow-lg shadow-teal-100">
            <img src="/pawlife_logo.png" alt="PawLife Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl text-black mb-2" style={{ fontFamily: "'Pacifico', cursive" }}>PawLife</h1>
        </div>
        <button onClick={() => setAberta(false)} className="lg:hidden text-slate-400 hover:text-slate-600 transition-colors">
          <X size={22} />
        </button>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-[#f0fdfa] text-[#14b8a6]'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <Icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-50 mt-auto">
        <Link to="/perfil" className="flex items-center gap-4 mb-6 px-2 hover:opacity-80 transition-opacity">
          <div className="w-11 h-11 bg-[#14b8a6] rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              iniciais || '👤'
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">
              {nomeExibicao || 'A carregar...'}
            </span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 w-full text-slate-400 font-medium hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
        >
          <LogOut size={22} />
          <span>Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setAberta(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md text-slate-600 hover:text-[#14b8a6] transition-colors"
      >
        <Menu size={22} />
      </button>
      {aberta && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setAberta(false)}
        />
      )}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col h-screen sticky top-0 shrink-0">
        {conteudoSidebar}
      </aside>
      <aside className={`lg:hidden fixed top-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col h-screen transition-transform duration-300 ${aberta ? 'translate-x-0' : '-translate-x-full'}`}>
        {conteudoSidebar}
      </aside>
    </>
  );
}