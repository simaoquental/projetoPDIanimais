import { 
  LayoutDashboard, Dog, HeartPulse, Calendar, 
  Activity, Package, PhoneCall, LogOut 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  // Função para verificar se a rota está ativa
  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/home' },
    { icon: Dog, label: 'Os Meus Animais', path: '/pets' },
    { icon: HeartPulse, label: 'Saúde', path: '/health' },
    { icon: Calendar, label: 'Calendário', path: '/calendar' },
    { icon: Activity, label: 'Atividades (Aplicação)', path: '/activities' },
    { icon: Package, label: 'Stock de Alimentação', path: '/food' },
    { icon: PhoneCall, label: 'Emergência', path: '/emergency' },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      
      <div className="p-8 flex items-center gap-3">
        <div className="bg-[#14b8a6] p-2 rounded-xl">
          <HeartPulse size={28} className="text-white" />
        </div>
        <span className="text-2xl font-bold text-[#14b8a6]">PetSaúde</span>
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-2">
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

      <div className="p-6 border-t border-slate-50">
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="w-11 h-11 bg-[#14b8a6] rounded-full flex items-center justify-center text-white font-bold text-lg">
            AS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-800">Ana Silva</span>
            <span className="text-xs text-slate-400 font-medium">Plano Premium</span>
          </div>
        </div>
        
        <Link 
          to="/login" 
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
        >
          <LogOut size={20} />
          Terminar Sessão
        </Link>
      </div>
    </aside>
  );
}