import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './barraLateral';
import { supabase } from "./supabaseClient";
import { 
  X, ChevronLeft, ChevronRight, 
  Clock, MapPin, Calendar as CalendarIcon, 
  Stethoscope, Syringe, Filter, Activity,
  Info, Pill
} from 'lucide-react';

interface CalendarioEvento {
  id: string;
  tipo: string;
  pet: string;
  titulo: string;
  data: Date;
  hora: string | null;
  local: string;
  descricao: string;
  estado: string;
}

export default function Calendario() {
  const navigate = useNavigate();
  const [selectedPet, setSelectedPet] = useState('Todos');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventos, setEventos] = useState<CalendarioEvento[]>([]);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarioEvento | null>(null);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const fetchData = async () => {
    setLoading(true);
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr) return navigate('/login');
    
    const user = JSON.parse(sessionStr);
    const userId = user.id_utilizador || user.id;

    try {
      const { data: animaisData, error: petError } = await supabase
        .from('animais')
        .select('id_animal, nome')
        .eq('id_utilizador', userId);

      if (petError) throw petError;
      setPets(animaisData || []);

      if (animaisData && animaisData.length > 0) {
        const idsAnimais = animaisData.map(a => a.id_animal);
        
        const { data: saudeData } = await supabase
          .from('registos_saude')
          .select('*')
          .in('id_animal', idsAnimais);

        const { data: marcacoesData } = await supabase
          .from('eventos_calendario')
          .select('*')
          .in('id_animal', idsAnimais);

        const allEvents: CalendarioEvento[] = [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        saudeData?.forEach(registo => {
          const dataAComparar = registo.proxima_data || registo.data_registo;
          if (!dataAComparar) return;

          const [year, month, day] = dataAComparar.split('-').map(Number);
          const dataEvento = new Date(year, month - 1, day);
          const petRelacionado = animaisData.find(a => a.id_animal === registo.id_animal);

          allEvents.push({
            id: `saude-${registo.id_registo_saude}`,
            tipo: registo.tipo_registo || 'Saúde',
            pet: petRelacionado?.nome || 'Pet',
            titulo: registo.titulo,
            data: dataEvento,
            hora: registo.hora_registo ? registo.hora_registo.slice(0, 5) : null,
            local: registo.local || registo.veterinario || 'Não especificado',
            descricao: registo.descricao || '',
            estado: registo.estado === 'Concluído' ? 'Concluído' : (dataEvento < hoje ? 'Atrasado' : 'Agendado')
          });
        });

        marcacoesData?.forEach(evento => {
          const d = new Date(evento.data_evento);
          const petRelacionado = animaisData.find(a => a.id_animal === evento.id_animal);

          allEvents.push({
            id: `cal-${evento.id_evento}`,
            tipo: evento.tipo_evento || 'Marcação',
            pet: petRelacionado?.nome || 'Pet',
            titulo: evento.titulo,
            data: d,
            hora: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            local: 'Não especificado', 
            descricao: evento.descricao || '',
            estado: evento.concluido ? 'Concluído' : (d < hoje ? 'Atrasado' : 'Agendado')
          });
        });

        allEvents.sort((a, b) => a.data.getTime() - b.data.getTime());
        setEventos(allEvents);
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const getTipoEstilo = (tipo: string, estado: string) => {
    if (estado === 'Concluído') return 'bg-slate-50 text-slate-400 border-slate-200';
    if (estado === 'Atrasado') return 'bg-red-50 text-red-500 border-red-100'; 
    
    switch (tipo) {
      case 'Vacina': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Consulta': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Exame': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Medicamento': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Marcação': return 'bg-teal-50 text-teal-600 border-teal-100';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'Vacina': return <Syringe size={12} className="shrink-0" />;
      case 'Consulta': return <Stethoscope size={12} className="shrink-0" />;
      case 'Exame': return <Activity size={12} className="shrink-0" />;
      case 'Medicamento': return <Pill size={12} className="shrink-0" />;
      default: return <CalendarIcon size={12} className="shrink-0" />;
    }
  };

  const eventosFiltrados = selectedPet === 'Todos' ? eventos : eventos.filter(e => e.pet === selectedPet);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 lg:p-10 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-[32px] font-black text-slate-900 tracking-tight">Calendário</h1>
            <p className="text-slate-500 font-medium">Gestão centralizada de saúde e marcações.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#0d9488] w-full min-w-[200px]"
              >
                <option value="Todos">Todos os Animais</option>
                {pets.map(p => <option key={p.id_animal} value={p.nome}>{p.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-800">{meses[currentMonth]} {currentYear}</h2>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"><ChevronLeft size={20} /></button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 text-sm font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors">Hoje</button>
                  <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-7 mb-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  {diasSemana.map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-inner">
                  {blanks.map(b => <div key={`b-${b}`} className="bg-slate-50/40 min-h-[120px]"></div>)}
                  {days.map(day => {
                    const eventosDia = eventosFiltrados.filter(e => 
                      e.data.getDate() === day && 
                      e.data.getMonth() === currentMonth &&
                      e.data.getFullYear() === currentYear
                    );
                    const isHoje = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                    return (
                      <div key={day} className="bg-white min-h-[120px] p-2 relative group hover:bg-slate-50 transition-colors">
                        <span className={`inline-flex items-center justify-center w-8 h-8 text-xs font-black rounded-xl mb-2 ${isHoje ? 'bg-[#0d9488] text-white shadow-md shadow-teal-100' : 'text-slate-500'}`}>
                          {day}
                        </span>
                        
                        <div className="flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden max-h-[80px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {eventosDia.map(ev => (
                            <div 
                              key={ev.id} 
                              onClick={() => setSelectedEventDetail(ev)}
                              className={`text-[10px] p-2 rounded-xl border cursor-pointer font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02] hover:shadow-sm ${getTipoEstilo(ev.tipo, ev.estado)}`}
                            >
                              {getIcone(ev.tipo)}
                              <span className="truncate">{ev.hora ? `${ev.hora} ` : ''}{ev.pet}: {ev.titulo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Clock size={20} className="text-[#0d9488]"/> Próximos Eventos
            </h3>
            <div className="space-y-4">
              {eventosFiltrados
                .filter(e => e.estado === 'Agendado' || e.estado === 'Atrasado')
                .slice(0, 5)
                .map(ev => (
                <div key={ev.id} onClick={() => setSelectedEventDetail(ev)} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-teal-200 transition-all group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg border uppercase tracking-wider ${getTipoEstilo(ev.tipo, ev.estado)}`}>
                      {ev.tipo}
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <CalendarIcon size={12} /> {ev.data.toLocaleDateString('pt-PT')}
                      </span>
                      {ev.hora && (
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={12} /> {ev.hora}
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="font-black text-slate-800 text-lg group-hover:text-[#0d9488] transition-colors line-clamp-1">{ev.titulo}</h4>
                  <p className="text-sm font-bold text-[#0d9488] mb-3">{ev.pet}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{ev.local}</span>
                  </div>
                </div>
              ))}
              
              {eventosFiltrados.filter(e => e.estado === 'Agendado' || e.estado === 'Atrasado').length === 0 && !loading && (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Info size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 font-bold">Sem eventos agendados.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedEventDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSelectedEventDetail(null)} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${getTipoEstilo(selectedEventDetail.tipo, selectedEventDetail.estado)}`}>
                 {React.cloneElement(getIcone(selectedEventDetail.tipo), { size: 28 })}
              </div>

              <h3 className="text-2xl font-black text-slate-900 mb-1">{selectedEventDetail.titulo}</h3>
              <p className="text-[#0d9488] font-black text-lg mb-6">{selectedEventDetail.pet}</p>
              
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center gap-3">
                  <CalendarIcon size={18} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Data: {selectedEventDetail.data.toLocaleDateString('pt-PT')}</span>
                </div>
                {selectedEventDetail.hora && (
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700">Hora: {selectedEventDetail.hora}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Local: {selectedEventDetail.local}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Estado: {selectedEventDetail.estado}</span>
                </div>
              </div>

              {selectedEventDetail.descricao && (
                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Observações</p>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{selectedEventDetail.descricao}</p>
                </div>
              )}

              <button 
                onClick={() => setSelectedEventDetail(null)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}