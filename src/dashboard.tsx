import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './barraLateral';
import { supabase } from './supabaseClient'; 
import { 
  Package, Calendar, Activity, Footprints, 
  Stethoscope, Clock, ShieldCheck, AlertCircle, 
  MapPin, ChevronRight, Loader2, Syringe, Pill, Dog, ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

interface Pet {
  id_animal: string;
  nome: string;
  fotografia_url: string;
}

interface Aviso {
  id: string;
  tipo: 'Alimentacao' | 'Saude';
  status: 'Critico' | 'Seguro';
  titulo: string;
  descricao: string;
  icone: any;
}

export default function Home() {
  const navigate = useNavigate();
  const [nomeUtilizador, setNomeUtilizador] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetPeso, setSelectedPetPeso] = useState<string | null>(null);
  
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [pesoDataTotal, setPesoDataTotal] = useState<any[]>([]);
  const [ultimoPeso, setUltimoPeso] = useState<number | null>(null);
  
  const [totalStock, setTotalStock] = useState(0);
  const [consultasAno, setConsultasAno] = useState(0);
  const [proximoEvento, setProximoEvento] = useState<{titulo: string, data: string} | null>(null);
  const [historicoRecente, setHistoricoRecente] = useState<any[]>([]);
  
  const [distanciaTotal, setDistanciaTotal] = useState(0);
  const [ultimoPasseio, setUltimoPasseio] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const utilizadorGuardado = localStorage.getItem('user');
      if (!utilizadorGuardado || utilizadorGuardado === "undefined") return navigate('/login');

      try {
        const user = JSON.parse(utilizadorGuardado);
        const userId = user.id_utilizador || user.id; 
        if (user.nome) setNomeUtilizador(user.nome.split(' ')[0]);

        const { data: petsData } = await supabase.from('animais').select('*').eq('id_utilizador', userId).order('nome', { ascending: true });
        const petsList = petsData || [];
        setPets(petsList);
        
        if (petsList.length > 0) {
          setSelectedPetPeso(petsList[0].id_animal);
        }
        
        const petIds = petsList.map(p => p.id_animal);
        
        if (petIds.length > 0) {
          const hojeDate = new Date();
          const hojeIso = hojeDate.toISOString().split('T')[0];
          const anoAtual = hojeDate.getFullYear();
          
          const umMesDate = new Date();
          umMesDate.setMonth(hojeDate.getMonth() + 1);
          const umMesIso = umMesDate.toISOString().split('T')[0];

          const { data: ativData } = await supabase.from('atividades').select('*').in('id_animal', petIds).order('data_inicio', { ascending: false });
          if (ativData && ativData.length > 0) {
            const totalKm = ativData.reduce((acc, curr) => acc + (Number(curr.distancia_km) || 0), 0);
            setDistanciaTotal(totalKm);
            setUltimoPasseio({
              ...ativData[0],
              petNome: petsList.find(p => p.id_animal === ativData[0].id_animal)?.nome
            });
          }

          const { data: pesoData } = await supabase.from('peso_animais').select('*').in('id_animal', petIds).order('data_registo', { ascending: true });
          setPesoDataTotal(pesoData || []);

          const { data: alimentacaoData } = await supabase.from('alimentacao').select('*').in('id_animal', petIds);
          let tStock = 0;
          let avisosAlim: Aviso[] = [];
          
          if (alimentacaoData) {
            alimentacaoData.forEach(item => {
              tStock += Number(item.stock_atual) || 0;
              const doseDiariaKg = Number(item.porcao_diaria) / 1000;
              if (doseDiariaKg > 0) {
                const diasRestantes = Math.floor(Number(item.stock_atual) / doseDiariaKg);
                if (diasRestantes <= 7) {
                  avisosAlim.push({
                    id: `alim-${item.id_alimentacao}`,
                    tipo: 'Alimentacao',
                    status: 'Critico',
                    titulo: `Stock em Baixo: ${petsList.find(p => p.id_animal === item.id_animal)?.nome}`,
                    descricao: diasRestantes <= 0 ? 'Ração esgotada!' : `Ração estimada para ${diasRestantes} dias.`,
                    icone: Package
                  });
                }
              }
            });
          }
          setTotalStock(tStock);
          

          avisosAlim = avisosAlim.slice(0, 2);
          
          if (avisosAlim.length === 0) {
            avisosAlim.push({
              id: 'alim-ok', tipo: 'Alimentacao', status: 'Seguro',
              titulo: 'Alimentação Controlada', descricao: 'O stock de ração de todos os animais é suficiente para mais de 7 dias.', icone: Package
            });
          }

          const { data: saudeData } = await supabase.from('registos_saude').select('*').in('id_animal', petIds).order('data_registo', { ascending: false });
          let avisosSaude: Aviso[] = [];
          
          if (saudeData) {
            let consultasAnoAtual = 0;
            const eventosFuturos: any[] = []; 

            saudeData.forEach(s => {
              if (s.tipo_registo === 'Consulta' && new Date(s.data_registo).getFullYear() === anoAtual) {
                consultasAnoAtual++;
              }
              const dataEvento = s.proxima_data || s.data_registo;
              if (s.estado !== 'Concluído' && dataEvento >= hojeIso) {
                eventosFuturos.push({...s, dataEvento});
              }
            });

            setConsultasAno(consultasAnoAtual);

            if (eventosFuturos.length > 0) {
              eventosFuturos.sort((a, b) => new Date(a.dataEvento).getTime() - new Date(b.dataEvento).getTime());
              setProximoEvento({ titulo: eventosFuturos[0].titulo, data: eventosFuturos[0].dataEvento });
            }

            const saudeProximoMes = eventosFuturos.filter(s => s.dataEvento <= umMesIso);
            
            const saudeFormatada = saudeData.slice(0, 2).map(s => ({
              ...s, petNome: petsList.find(p => p.id_animal === s.id_animal)?.nome
            }));
            setHistoricoRecente(saudeFormatada);

            if (saudeProximoMes.length > 0) {
              saudeProximoMes.forEach(s => {
                const petN = petsList.find(p => p.id_animal === s.id_animal)?.nome;
                avisosSaude.push({
                  id: `saude-${s.id_registo_saude}`, tipo: 'Saude', status: 'Critico',
                  titulo: `Marcação: ${s.titulo}`, descricao: `${petN} • Marcado para ${new Date(s.dataEvento).toLocaleDateString('pt-PT')}`, icone: Calendar
                });
              });
            }
          }
          

          avisosSaude = avisosSaude.slice(0, 2);
          
          if (avisosSaude.length === 0) {
            avisosSaude.push({
              id: 'saude-ok', tipo: 'Saude', status: 'Seguro',
              titulo: 'Saúde em Dia', descricao: 'Não existem vacinas ou consultas agendadas para os próximos 30 dias.', icone: ShieldCheck
            });
          }
          
          setAvisos([...avisosAlim, ...avisosSaude]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (selectedPetPeso && pesoDataTotal.length > 0) {
      const pData = pesoDataTotal.filter(p => p.id_animal === selectedPetPeso);
      if (pData.length > 0) {
        setUltimoPeso(pData[pData.length - 1].peso);
      } else {
        setUltimoPeso(null);
      }
    }
  }, [selectedPetPeso, pesoDataTotal]);

  const chartData = pesoDataTotal.filter(p => p.id_animal === selectedPetPeso);

  const getTipoEstilo = (tipo: string) => {
    switch (tipo) {
      case 'Vacina': return { icon: <Syringe size={16} />, cor: 'text-emerald-500 bg-emerald-50' };
      case 'Consulta': return { icon: <Stethoscope size={16} />, cor: 'text-teal-500 bg-teal-50' };
      case 'Medicamento': return { icon: <Pill size={16} />, cor: 'text-amber-500 bg-amber-50' };
      default: return { icon: <Activity size={16} />, cor: 'text-purple-500 bg-purple-50' };
    }
  };

  const handleAvisoClick = (tipo: string) => {
    if (tipo === 'Alimentacao') {
      navigate('/alimentacao');
    } else {
      navigate('/calendario');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-10 max-w-7xl mx-auto w-full">
        
        <header className="mb-8">
          <h1 className="text-[32px] font-black text-[#0f172a] tracking-tight">Olá, {nomeUtilizador}! 👋</h1>
          <p className="text-slate-500 font-medium mt-1">Aqui está o ponto de situação atual dos teus animais.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#0d9488]" size={40} /></div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div onClick={() => navigate('/animais')} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Dog size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meus Animais</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{pets.length}</p>
                </div>
              </div>

              <div onClick={() => navigate('/alimentacao')} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Package size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Total</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{totalStock.toFixed(2)} <span className="text-sm text-slate-400">kg</span></p>
                </div>
              </div>

              <div onClick={() => navigate('/calendario')} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-rose-200 hover:bg-rose-50/30 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
                  <Calendar size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximo Evento</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5 truncate leading-tight" title={proximoEvento?.titulo}>
                    {proximoEvento ? proximoEvento.titulo : '--'}
                  </p>
                  {proximoEvento && <p className="text-xs font-bold text-rose-500 mt-0.5">{new Date(proximoEvento.data).toLocaleDateString('pt-PT')}</p>}
                </div>
              </div>

              <div onClick={() => navigate('/saude')} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultas Anuais</p>
                  <p className="text-2xl font-black text-slate-800 mt-0.5 leading-none">{consultasAno}</p>
                </div>
              </div>
            </div>

            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <AlertCircle className="text-[#0d9488]" /> Avisos Importantes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {avisos.map(aviso => (
                  <div 
                    key={aviso.id} 
                    onClick={() => handleAvisoClick(aviso.tipo)}
                    className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between gap-4 cursor-pointer group ${aviso.status === 'Critico' ? 'bg-rose-50 border-rose-200 hover:bg-rose-100 hover:shadow-md' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:shadow-sm'}`}
                  >
                    <div className="flex items-start gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${aviso.status === 'Critico' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <aviso.icone size={24} />
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${aviso.status === 'Critico' ? 'text-rose-500' : 'text-slate-400'}`}>
                          {aviso.tipo === 'Alimentacao' ? 'Alimentação' : 'Saúde'}
                        </span>
                        <h3 className="text-lg font-black text-slate-800 leading-tight mt-0.5">{aviso.titulo}</h3>
                        <p className={`text-sm font-medium mt-1 ${aviso.status === 'Critico' ? 'text-rose-700' : 'text-slate-500'}`}>{aviso.descricao}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className={`shrink-0 transition-transform group-hover:translate-x-1 ${aviso.status === 'Critico' ? 'text-rose-300' : 'text-slate-300'}`} />
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <section className="lg:col-span-2 space-y-8">
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Activity className="text-blue-500" /> Evolução de Peso
                      </h2>
                      {ultimoPeso && <p className="text-sm font-bold text-slate-400 mt-2">Último registo: <span className="text-blue-500">{ultimoPeso} kg</span></p>}
                    </div>
                    <div className="relative shrink-0">
                      <select 
                        value={selectedPetPeso || ''} 
                        onChange={(e) => setSelectedPetPeso(e.target.value)}
                        className="appearance-none pl-5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-700 cursor-pointer shadow-sm transition-all"
                      >
                        {pets.map(pet => (
                          <option key={pet.id_animal} value={pet.id_animal}>{pet.nome}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    {chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="data_registo" hide />
                          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`${value} kg`, 'Peso']}
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-PT')}
                          />
                          <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">
                        Registos insuficientes para desenhar gráfico.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
                    <Stethoscope className="text-emerald-500" /> Histórico Clínico Recente
                  </h2>
                  <div className="space-y-3 flex-1">
                    {historicoRecente.length === 0 ? (
                      <p className="text-center text-slate-400 font-bold py-6">Sem histórico clínico.</p>
                    ) : (
                      historicoRecente.map(item => {
                        const style = getTipoEstilo(item.tipo_registo);
                        return (
                          <div key={item.id_registo_saude} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.cor}`}>
                                {style.icon}
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm leading-tight">{item.titulo}</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{item.tipo_registo} • {item.petNome}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${item.estado === 'Concluído' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                {item.estado}
                              </span>
                              <p className="text-[10px] font-bold text-slate-400 mt-1.5">{new Date(item.proxima_data || item.data_registo).toLocaleDateString('pt-PT')}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <button onClick={() => navigate('/saude')} className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 font-black rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all uppercase tracking-widest text-[10px]">
                    Ver todo o histórico <ChevronRight size={14} />
                  </button>
                </div>

              </section>

              <section className="space-y-8">
                
                <div className="bg-[#0d9488] p-8 rounded-[2.5rem] shadow-lg shadow-teal-900/20 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <h2 className="text-lg font-black text-teal-100 mb-2 uppercase tracking-widest">Atividade Total</h2>
                  <p className="text-5xl font-black mb-1">{distanciaTotal.toFixed(2)}</p>
                  <p className="text-teal-200 font-bold">quilómetros percorridos</p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[calc(100%-200px)]">
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
                    <Footprints className="text-[#0d9488]" /> Último Passeio
                  </h2>
                  
                  {ultimoPasseio ? (
                    <div className="flex-1 flex flex-col">
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-6 relative overflow-hidden">
                        <MapPin size={80} className="absolute -right-4 -bottom-4 text-slate-200 rotate-12" />
                        <h3 className="text-lg font-black text-slate-800 relative z-10">{ultimoPasseio.titulo}</h3>
                        <p className="text-xs font-bold text-[#0d9488] uppercase tracking-widest mt-1 relative z-10">{ultimoPasseio.petNome}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-auto">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distância</p>
                          <p className="text-xl font-black text-slate-800">{Number(ultimoPasseio.distancia_km).toFixed(2)} <span className="text-sm text-slate-400 font-bold">km</span></p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tempo</p>
                          <p className="text-xl font-black text-slate-800">{ultimoPasseio.duracao_min} <span className="text-sm text-slate-400 font-bold">min</span></p>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-slate-100 mt-2 flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Clock size={14} /> Realizado a {new Date(ultimoPasseio.data_inicio).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold">Ainda não há passeios registados.</p>
                    </div>
                  )}
                  
                  <button onClick={() => navigate('/atividades')} className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 font-black rounded-2xl hover:bg-teal-50 hover:text-[#0d9488] transition-all uppercase tracking-widest text-[10px]">
                    Ver todo o histórico <ChevronRight size={14} />
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}