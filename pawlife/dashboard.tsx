import Sidebar from './barraLateral';
import { 
  Bell, Dog, Calendar, Package, 
  TrendingUp, Clock, AlertCircle, LucideIcon 
} from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface Alerta {
  id: number;
  type: 'Vacina' | 'Consulta' | 'Stock';
  pet: string;
  title: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export default function Home() {
  const stats: StatItem[] = [
    { label: 'Meus Animais', value: '3', icon: Dog, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Stock Ração', value: '12kg', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Caminhadas (Semana)', value: '18km', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Consultas Pendentes', value: '2', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const alertas: Alerta[] = [
    { id: 1, type: 'Vacina', pet: 'Max', title: 'Reforço Raiva', date: 'Amanhã', priority: 'high' },
    { id: 2, type: 'Consulta', pet: 'Luna', title: 'Check-up Anual', date: '15 Março', priority: 'medium' },
    { id: 3, type: 'Stock', pet: 'Geral', title: 'Comprar Ração Senior', date: 'Restam 2 dias', priority: 'low' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      
      <main className="flex-1 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Bom dia, Matilde Coimbra! 👋</h1>
            <p className="text-slate-500 mt-1 font-medium">Aqui está o que se passa com os seus amigos hoje.</p>
          </div>
          <button className="relative p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-[#14b8a6] transition-all shadow-sm">
            <Bell size={24} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((item, index) => (
            <div key={index} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`${item.bg} ${item.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                <item.icon size={24} />
              </div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <AlertCircle className="text-[#14b8a6]" /> Próximos Alertas
                </h3>
                <button className="text-sm font-bold text-[#14b8a6] hover:underline">Ver todos</button>
              </div>

              <div className="flex flex-col gap-4">
                {alertas.map((alerta) => (
                  <div key={alerta.id} className="flex items-center justify-between p-5 bg-[#f8fafc] rounded-[1.5rem] border border-slate-50 group hover:border-[#14b8a6]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${
                        alerta.priority === 'high' ? 'bg-red-400' : 
                        alerta.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                      }`} />
                      <div>
                        <p className="text-xs font-bold text-[#14b8a6] uppercase">{alerta.type} • {alerta.pet}</p>
                        <h4 className="font-bold text-slate-800">{alerta.title}</h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                      <Clock size={16} />
                      {alerta.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-[#134e4a] p-8 rounded-[2.5rem] text-white shadow-xl shadow-teal-900/20 relative overflow-hidden h-full">
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-4">Dica do Dia 🐾</h3>
                <p className="text-teal-100 leading-relaxed font-medium">
                  "O exercício regular ajuda a prevenir a obesidade e melhora a saúde mental do seu cão."
                </p>
                <button className="mt-8 bg-white text-[#134e4a] px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-50 transition-colors">
                  Ler mais dicas
                </button>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}