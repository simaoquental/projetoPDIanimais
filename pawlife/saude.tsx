import { useState } from 'react';
import Sidebar from './barraLateral';
import { 
  Plus, Search, Syringe, Pill, FileText, 
  ChevronRight, Download, Calendar, Activity,
  Stethoscope, Thermometer, ShieldCheck
} from 'lucide-react';

interface HealthRecord {
  id: number;
  type: 'Vacina' | 'Consulta' | 'Exame' | 'Desparasitação';
  pet: string;
  title: string;
  date: string;
  vet: string;
  notes: string;
  hasFile: boolean;
  isUpcoming: boolean;
}

export default function Saude() {
  const [activeTab, setActiveTab] = useState<'todos' | 'max' | 'luna'>('todos');

  const records: HealthRecord[] = [
    {
      id: 1,
      type: 'Vacina',
      pet: 'Max',
      title: 'Polivalente (Reforço Anual)',
      date: '15 Março 2026',
      vet: 'Dr. Ricardo Silva',
      notes: 'Animal reagiu bem, sem febre.',
      hasFile: true,
      isUpcoming: true
    },
    {
      id: 2,
      type: 'Exame',
      pet: 'Luna',
      title: 'Ecografia Abdominal',
      date: '10 Fevereiro 2026',
      vet: 'Hospital VetCentral',
      notes: 'Tudo normal, repetir dentro de 6 meses.',
      hasFile: true,
      isUpcoming: false
    },
    {
      id: 3,
      type: 'Desparasitação',
      pet: 'Max',
      title: 'Desparasitação Interna',
      date: '05 Janeiro 2026',
      vet: 'Em casa',
      notes: 'Administrado Drontal.',
      hasFile: false,
      isUpcoming: false
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        
        {/* Topo Dinâmico */}
        <div className="flex flex-col lg:flex-row justify-between items-end mb-10 gap-6">
          <div className="w-full lg:w-auto">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Saúde</h1>
            <div className="flex gap-2">
              {['todos', 'max', 'luna'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                    ? 'bg-[#14b8a6] text-white shadow-lg shadow-teal-500/30' 
                    : 'bg-white text-slate-400 border border-slate-100 hover:border-teal-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <button className="flex items-center gap-2 px-8 py-4 bg-[#134e4a] text-white rounded-2xl font-black shadow-xl shadow-teal-900/10 hover:scale-105 transition-all">
            <Plus size={20} strokeWidth={3} /> NOVO REGISTO
          </button>
        </div>

        {/* Resumo de Estado de Saúde */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <HealthStat icon={ShieldCheck} label="Vacinas" value="Em dia" color="text-emerald-500" bg="bg-emerald-50" />
          <HealthStat icon={Thermometer} label="Peso Médio" value="16.4 kg" color="text-blue-500" bg="bg-blue-50" />
          <HealthStat icon={Stethoscope} label="Consultas" value="2 Pendentes" color="text-amber-500" bg="bg-amber-50" />
          <HealthStat icon={Activity} label="Atividade" value="Excelente" color="text-rose-500" bg="bg-rose-50" />
        </div>

        {/* Timeline de Saúde */}
        <div className="relative">
          {/* Linha vertical da Timeline */}
          <div className="absolute left-0 md:left-8 top-0 bottom-0 w-1 bg-slate-100 rounded-full"></div>

          <div className="space-y-12">
            {records.map((record) => (
              <div key={record.id} className="relative pl-8 md:pl-20">
                {/* Círculo da Timeline */}
                <div className={`absolute left-[-6px] md:left-[26px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${
                  record.isUpcoming ? 'bg-amber-500 scale-125' : 'bg-slate-300'
                }`}></div>

                <div className={`group bg-white p-6 md:p-8 rounded-[2.5rem] border ${
                  record.isUpcoming ? 'border-amber-200 shadow-xl shadow-amber-900/5' : 'border-slate-100 shadow-sm'
                } hover:border-[#14b8a6] transition-all`}>
                  
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-2xl ${
                        record.type === 'Vacina' ? 'bg-rose-50 text-rose-500' :
                        record.type === 'Exame' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                        {record.type === 'Vacina' ? <Syringe size={24} /> : 
                         record.type === 'Exame' ? <FileText size={24} /> : <Pill size={24} />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                            record.isUpcoming ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {record.isUpcoming ? 'Próximo Evento' : 'Concluído'}
                          </span>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-xs font-bold text-[#14b8a6]">{record.pet}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800">{record.title}</h3>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1 mt-1">
                          <Calendar size={14} /> {record.date} — {record.vet}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.hasFile && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100">
                          <Download size={14} /> EXAME.PDF
                        </button>
                      )}
                      <button className="p-3 text-slate-400 hover:text-[#14b8a6] transition-all">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Notas detalhadas (estilo diário médico) */}
                  <div className="mt-6 pt-6 border-t border-slate-50">
                    <p className="text-slate-400 text-sm italic font-medium">
                      "{record.notes}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente auxiliar para as estatísticas
function HealthStat({ icon: Icon, label, value, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className={`${bg} ${color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}