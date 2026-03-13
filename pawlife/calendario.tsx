import { useState } from 'react';
import Sidebar from './barraLateral';
import { 
  Plus, X, ChevronLeft, ChevronRight, 
  Clock, MapPin, Calendar as CalendarIcon, 
  Stethoscope, Syringe, Filter, Search,
  CheckCircle2, AlertCircle
} from 'lucide-react';

// Interfaces para Tipagem Rigorosa
interface CalendarioEvento {
  id: number;
  tipo: 'Consulta' | 'Vacina' | 'Tratamento';
  pet: string;
  titulo: string;
  data: Date;
  hora: string;
  local: string;
  descricao: string;
  estado: 'Pendente' | 'Concluído';
}

export default function Calendario() {
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedPet, setSelectedPet] = useState('Todos');

  // Dados Mockados mais detalhados
  const [eventos] = useState<CalendarioEvento[]>([
    {
      id: 1,
      tipo: 'Vacina',
      pet: 'Max',
      titulo: 'Reforço Raiva',
      data: new Date(2026, 2, 7), // 7 Março
      hora: '10:00',
      local: 'PetClinic Coimbra',
      descricao: 'Levar boletim de vacinas atualizado.',
      estado: 'Pendente'
    },
    {
      id: 2,
      tipo: 'Consulta',
      pet: 'Luna',
      titulo: 'Check-up Anual',
      data: new Date(2026, 2, 12), // 12 Março
      hora: '15:30',
      local: 'Hospital Veterinário',
      descricao: 'Exame de sangue de rotina.',
      estado: 'Pendente'
    },
    {
      id: 3,
      tipo: 'Tratamento',
      pet: 'Simba',
      titulo: 'Desparasitação',
      data: new Date(2026, 2, 6), // Hoje (simulado)
      hora: '09:00',
      local: 'Em casa',
      descricao: 'Aplicar pipeta mensal.',
      estado: 'Concluído'
    }
  ]);

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // Cores por tipo
  const getTipoEstilo = (tipo: string) => {
    switch (tipo) {
      case 'Vacina': return 'bg-rose-100 text-rose-600 border-rose-200';
      case 'Consulta': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Tratamento': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        {/* Header com Filtros */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Calendário Clínico</h1>
            <p className="text-slate-500 font-medium">Faça o acompanhamento médico dos seus animais.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all cursor-pointer shadow-sm"
              >
                <option>Todos os Animais</option>
                <option>Max</option>
                <option>Luna</option>
                <option>Simba</option>
              </select>
            </div>
            
            <button 
              onClick={() => setIsScheduling(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#14b8a6] text-white rounded-xl hover:bg-[#0d9488] transition-all font-bold shadow-lg shadow-teal-500/20 active:scale-95 text-sm"
            >
              <Plus size={18} /> Novo Evento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LADO ESQUERDO: CALENDÁRIO MENSAL */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">{meses[2]} 2026</h2>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600"><ChevronLeft size={20} /></button>
                  <button className="px-4 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 uppercase tracking-wider">Hoje</button>
                  <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-600"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-7 mb-4">
                  {diasSemana.map(d => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                  {Array.from({ length: 35 }).map((_, i) => {
                    const dia = i - 1; // Ajuste manual para começar na data certa
                    const temEvento = eventos.find(e => e.data.getDate() === dia && i > 1);
                    const isHoje = dia === 6;

                    return (
                      <div key={i} className="bg-white min-h-[100px] p-2 hover:bg-slate-50 transition-colors relative group cursor-pointer">
                        {dia > 0 && dia <= 31 && (
                          <>
                            <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-bold rounded-lg ${
                              isHoje ? 'bg-[#14b8a6] text-white shadow-md shadow-teal-500/30' : 'text-slate-700'
                            }`}>
                              {dia}
                            </span>
                            
                            {temEvento && (
                              <div className={`mt-2 p-1 text-[9px] font-bold rounded border ${getTipoEstilo(temEvento.tipo)} truncate`}>
                                {temEvento.hora} {temEvento.pet}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats Rápidas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase">Concluídos</p>
                <p className="text-2xl font-black text-emerald-800">12</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-blue-600 uppercase">Agendados</p>
                <p className="text-2xl font-black text-blue-800">03</p>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-rose-600 uppercase">Em falta</p>
                <p className="text-2xl font-black text-rose-800">01</p>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: LISTA DE EVENTOS & DETALHES */}
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-2">
              <Clock size={20} className="text-[#14b8a6]" /> Próximas 48 horas
            </h3>

            <div className="space-y-4">
              {eventos.map(evento => (
                <div key={evento.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-[#14b8a6] transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getTipoEstilo(evento.tipo)}`}>
                      {evento.tipo}
                    </span>
                    {evento.estado === 'Concluído' ? 
                      <CheckCircle2 size={18} className="text-emerald-500" /> : 
                      <AlertCircle size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                    }
                  </div>

                  <h4 className="font-bold text-slate-800 text-lg mb-1">{evento.titulo}</h4>
                  <p className="text-sm text-slate-500 font-medium mb-4">{evento.pet} • {evento.descricao}</p>
                  
                  <div className="flex flex-col gap-2 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Clock size={14} className="text-slate-400" />
                      {evento.hora} — {evento.data.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      {evento.local}
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-100">
                    Editar Detalhes
                  </button>
                </div>
              ))}
            </div>

            {/* Banner de Emergência Rápido */}
            <div className="p-6 bg-[#134e4a] rounded-[2rem] text-white shadow-xl shadow-teal-900/10">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Urgências?
              </h4>
              <p className="text-xs text-teal-100/80 leading-relaxed mb-4">
                Encontre o hospital veterinário 24h mais próximo da sua localização atual.
              </p>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all backdrop-blur-md">
                Ver Mapa de Clínicas
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Agendamento (Mesmo estilo do anterior mas mais completo) */}
        {isScheduling && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800">Agendar Evento</h2>
                <button onClick={() => setIsScheduling(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24} /></button>
              </div>

              <form className="grid grid-cols-2 gap-6">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Animal</label>
                  <select className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#14b8a6]">
                    <option>Max</option>
                    <option>Luna</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
                  <select className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#14b8a6]">
                    <option>Consulta</option>
                    <option>Vacina</option>
                    <option>Tratamento / Medicação</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título do Evento</label>
                  <input type="text" placeholder="Ex: Vacina da Raiva" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#14b8a6]" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data</label>
                  <input type="date" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hora</label>
                  <input type="time" className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none" />
                </div>
                
                <div className="col-span-2 pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsScheduling(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-[#134e4a] text-white font-bold rounded-2xl shadow-lg shadow-teal-900/20 hover:bg-[#0f3d3a] transition-all">Confirmar Agendamento</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}