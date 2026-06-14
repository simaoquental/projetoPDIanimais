import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Activity, ClipboardList, Mars, Venus, 
  Syringe, Pill, Calendar, Stethoscope, Footprints, 
  Cake, Scale, Droplet, Clock, AlertCircle
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import Sidebar from "./barraLateral";
import { supabase } from "./supabaseClient"; 

interface Pet {
  id_animal: string;
  nome: string;
  especie: string;
  raca: string;
  idade: number;
  peso: number;
  genero: string;
  fotografia_url: string;
  tipo_sangue: string;
  created_at?: string;
  data_criacao?: string;
}

interface RegistoSaude {
  id_registo_saude: string;
  tipo_registo: string;
  titulo: string;
  veterinario: string;
  data_registo: string;
  proxima_data: string | null;
  estado: string;
}

export default function PerfilAnimal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [historicoClinico, setHistoricoClinico] = useState<RegistoSaude[]>([]);
  const [historicoPeso, setHistoricoPeso] = useState<any[]>([]);
  const [statsAtividade, setStatsAtividade] = useState({ total: 0, km: 0, min: 0 });
  const [saudeStatus, setSaudeStatus] = useState({ vacinas: 'Em dia', cor: 'text-emerald-600' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);

        const { data: petData } = await supabase.from('animais').select('*').eq('id_animal', id).single();
        
        const { data: saudeData } = await supabase.from('registos_saude').select('*').eq('id_animal', id).order('data_registo', { ascending: false });

        const { data: pesoData } = await supabase.from('peso_animais').select('peso, data_registo').eq('id_animal', id).order('data_registo', { ascending: true });

        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0,0,0,0);

        const { data: ativData } = await supabase.from('atividades').select('distancia_km, duracao_min').eq('id_animal', id).gte('data_inicio', inicioMes.toISOString());

        const hoje = new Date().toISOString().split('T')[0];
        const vacinas = saudeData?.filter(s => s.tipo_registo === 'Vacina') || [];
        
        const vacinasAtrasadas = vacinas.some(s => {
          const dataDoEvento = s.proxima_data || s.data_registo;
          return s.estado !== 'Concluído' && dataDoEvento < hoje;
        });
        
        const vacinasPendentes = vacinas.some(s => s.estado !== 'Concluído');

        setPet(petData);
        setHistoricoClinico(saudeData || []);

        const dataRegistoInicial = petData?.created_at || petData?.data_criacao || new Date(0).toISOString();
        const historicoPesoCompleto = [
          { peso: petData.peso, data_registo: dataRegistoInicial },
          ...(pesoData || [])
        ].sort((a, b) => new Date(a.data_registo).getTime() - new Date(b.data_registo).getTime());

        setHistoricoPeso(historicoPesoCompleto);
        
        setSaudeStatus({
          vacinas: vacinasAtrasadas ? 'Atrasadas' : (vacinasPendentes ? 'Agendadas' : 'Em dia'),
          cor: vacinasAtrasadas ? 'text-rose-500' : (vacinasPendentes ? 'text-amber-500' : 'text-emerald-600')
        });
        
        const totalKm = ativData?.reduce((acc, curr) => acc + (Number(curr.distancia_km) || 0), 0) || 0;
        const totalMin = ativData?.reduce((acc, curr) => acc + (curr.duracao_min || 0), 0) || 0;
        setStatsAtividade({ total: ativData?.length || 0, km: totalKm, min: totalMin });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getTipoEstilo = (tipo: string) => {
    switch (tipo) {
      case 'Vacina': return { icon: <Syringe size={20} />, cor: 'text-rose-500', bg: 'bg-rose-50' };
      case 'Consulta': return { icon: <Stethoscope size={20} />, cor: 'text-teal-500', bg: 'bg-teal-50' };
      case 'Medicamento': return { icon: <Pill size={20} />, cor: 'text-blue-500', bg: 'bg-blue-50' };
      case 'Exame': return { icon: <Activity size={20} />, cor: 'text-amber-500', bg: 'bg-amber-50' };
      default: return { icon: <ClipboardList size={20} />, cor: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!pet) return <div className="p-10 text-center font-bold text-slate-400">Animal não encontrado.</div>;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-10 max-w-6xl mx-auto w-full">
        <button onClick={() => navigate('/animais')} className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-bold mb-8 transition-all group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar aos animais
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative h-80 bg-slate-100">
                <img src={pet.fotografia_url || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80"} alt={pet.nome} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                <div className="absolute bottom-8 left-10 text-white">
                  <span className="bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-lg">Perfil Verificado</span>
                  <h1 className="text-5xl font-black mb-1">{pet.nome}</h1>
                  <p className="text-lg font-medium opacity-80">{pet.raca} • {pet.especie}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-8 bg-white border-b border-slate-100 text-center">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Idade</p>
                   <div className="flex items-center justify-center gap-2 font-black text-slate-700"><Cake size={18} className="text-amber-500" /> {pet.idade} anos</div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Peso Atual</p>
                   <div className="flex items-center justify-center gap-2 font-black text-slate-700"><Scale size={18} className="text-blue-500" /> {pet.peso} kg</div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Género</p>
                   <div className="flex items-center justify-center gap-2 font-black text-slate-700">
                     {pet.genero === 'Macho' ? <Mars size={18} className="text-blue-500" /> : <Venus size={18} className="text-fuchsia-500" />} {pet.genero}
                   </div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sangue</p>
                   <div className="flex items-center justify-center gap-2 font-black text-slate-700"><Droplet size={18} className="text-rose-500" /> {pet.tipo_sangue || 'N/D'}</div>
                </div>
              </div>

              <div className="flex justify-around items-center py-8 bg-slate-50/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                    <Footprints size={16} /> <span className="text-[11px] font-black uppercase tracking-wider">Atividade Mensal</span>
                  </div>
                  <span className="text-xl font-black text-slate-800">{statsAtividade.total} passeios</span>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-1">
                    <Syringe size={16} /> <span className="text-[11px] font-black uppercase tracking-wider">Plano Vacinação</span>
                  </div>
                  <span className={`text-xl font-black ${saudeStatus.cor} flex items-center gap-2 justify-center`}>
                    {saudeStatus.vacinas === 'Atrasadas' && <AlertCircle size={18} />} 
                    {saudeStatus.vacinas === 'Agendadas' && <Clock size={18} />} 
                    {saudeStatus.vacinas}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <Activity className="text-blue-500" /> Evolução do Peso
                </h3>
                <span className="text-xs font-bold text-slate-400">Últimos registos</span>
              </div>
              
              <div className="h-64 w-full">
                {historicoPeso.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicoPeso}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="data_registo" hide />
                      <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value} kg`, 'Peso']}
                        labelFormatter={(label) => {
                          const d = new Date(label);
                          return isNaN(d.getTime()) || d.getFullYear() === 1970 ? 'Data de Registo' : d.toLocaleDateString('pt-PT');
                        }}
                      />
                      <Line type="monotone" dataKey="peso" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                    Dados insuficientes para gerar gráfico.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-6">Resumo Mensal</h3>
              <div className="space-y-4">
                <div className="p-4 bg-teal-50 rounded-2xl flex items-center gap-4">
                   <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center"><Footprints size={20} /></div>
                   <div>
                     <p className="text-[10px] font-black text-teal-600 uppercase">Distância</p>
                     <p className="text-lg font-black text-slate-800">{statsAtividade.km.toFixed(2)} km</p>
                   </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                   <div>
                     <p className="text-[10px] font-black text-indigo-600 uppercase">Tempo Ativo</p>
                     <p className="text-lg font-black text-slate-800">{Math.floor(statsAtividade.min / 60)}h {statsAtividade.min % 60}m</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 ml-2">
                <ClipboardList className="text-[#0d9488]" /> Histórico Clínico
              </h2>
              
              <div className="space-y-3">
                {historicoClinico.length === 0 ? (
                  <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-400 font-bold">
                    Sem registos.
                  </div>
                ) : (
                  historicoClinico.slice(0, 5).map(registo => {
                    const estilo = getTipoEstilo(registo.tipo_registo);
                    const dataDoEvento = registo.proxima_data || registo.data_registo;
                    
                    return (
                      <div key={registo.id_registo_saude} className="bg-white rounded-[2rem] border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
                        <div className={`p-3 rounded-xl ${estilo.bg} ${estilo.cor} shrink-0`}>
                          {estilo.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-black text-slate-800 text-sm truncate">{registo.titulo}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(dataDoEvento).toLocaleDateString('pt-PT')}</span>
                            <span className="uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{registo.estado}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}