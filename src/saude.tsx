import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './barraLateral';
import { 
  Search, Plus, Stethoscope, Syringe, Activity, Pill, 
  Calendar, Trash2, Edit2, X, AlertCircle, Clock, ChevronDown, Loader2, MapPin, FileText, Camera, Check
} from 'lucide-react';
import { supabase } from "./supabaseClient";

interface Pet {
  id: string;
  nome: string;
  fotografia_url: string | null;
}

interface RegistoSaude {
  id: string;
  pet_id: string;
  pet_nome: string | null;
  tipo_registo: 'Consulta' | 'Vacina' | 'Exame' | 'Medicamento';
  titulo: string;
  data_registo: string;
  proxima_data: string | null;
  hora_registo: string | null;
  estado: 'Concluído' | 'Agendado';
  descricao: string | null;
  veterinario: string | null;
  local: string | null;
  ficheiro_url: string | null;
}

export default function HistoricoSaude() {
  const navigate = useNavigate();
  const [registos, setRegistos] = useState<RegistoSaude[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPetFilter, setSelectedPetFilter] = useState<string | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); 
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<RegistoSaude | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hojeIso = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    id_animal: '', tipo_registo: 'Consulta', titulo: '', data_registo: hojeIso, 
    proxima_data: '', hora_registo: '', estado: 'Concluído', descricao: '', 
    veterinario: '', local: '' 
  });

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  useEffect(() => {
    if (form.proxima_data > hojeIso && form.estado === 'Concluído') {
      setForm(prev => ({ ...prev, estado: 'Agendado' }));
    }
  }, [form.proxima_data, form.estado]);

  const resetForm = () => {
    setForm({ 
      id_animal: '', tipo_registo: 'Consulta', titulo: '', data_registo: hojeIso, 
      proxima_data: '', hora_registo: '', estado: 'Concluído', descricao: '', 
      veterinario: '', local: '' 
    });
    setFileToUpload(null);
    setFilePreview(null);
    setSelectedItem(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/login');
    const userId = session.user.id;

    try {
      const { data: petsData } = await supabase.from('animais').select('id_animal, nome, fotografia_url').eq('id_utilizador', userId);
      if (petsData) setPets(petsData.map(p => ({ id: p.id_animal, nome: p.nome, fotografia_url: p.fotografia_url })));
      
      const { data: saudeData, error } = await supabase
        .from('registos_saude')
        .select(`*, animais!inner(nome, id_utilizador)`)
        .eq('animais.id_utilizador', userId);

      if (!error && saudeData) {
        setRegistos(saudeData.map((item: any) => ({
          id: item.id_registo_saude,
          pet_id: item.id_animal,
          pet_nome: item.animais?.nome,
          tipo_registo: item.tipo_registo,
          titulo: item.titulo,
          data_registo: item.data_registo,
          proxima_data: item.proxima_data,
          hora_registo: item.hora_registo,
          estado: item.estado,
          descricao: item.descricao,
          veterinario: item.veterinario,
          local: item.local,
          ficheiro_url: item.ficheiro_url
        })));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      if (file.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setErrorMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      let publicUrl = selectedItem?.ficheiro_url || null;

      if (fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`; 
        const { error: uploadError } = await supabase.storage.from('health-files').upload(fileName, fileToUpload);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('health-files').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const payload = {
        id_animal: form.id_animal,
        tipo_registo: form.tipo_registo,
        titulo: form.titulo,
        data_registo: form.data_registo,
        proxima_data: form.proxima_data || null,
        hora_registo: form.hora_registo || null,
        estado: form.estado,
        descricao: form.descricao || null,
        veterinario: form.veterinario || null,
        local: form.local || null,
        ficheiro_url: publicUrl
      };

      let error;
      if (selectedItem) {
        const res = await supabase.from('registos_saude').update(payload).eq('id_registo_saude', selectedItem.id);
        error = res.error;
      } else {
        const res = await supabase.from('registos_saude').insert([payload]);
        error = res.error;
      }

      if (error) throw error;
      setSuccessMessage("Guardado com sucesso!");
      fetchData();
      setTimeout(() => { setIsModalOpen(false); resetForm(); }, 1000);
    } catch (error: any) { setErrorMessage(error.message); } finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('registos_saude').delete().eq('id_registo_saude', id);
    if (!error) fetchData();
  };

  const handleMarkAsCompleted = async (id: string) => {
    const { error } = await supabase.from('registos_saude').update({ estado: 'Concluído' }).eq('id_registo_saude', id);
    if (!error) fetchData();
  };

  const consultasPassadas = registos
    .filter(r => r.tipo_registo === 'Consulta' && r.estado === 'Concluído')
    .sort((a, b) => new Date(b.proxima_data || b.data_registo).getTime() - new Date(a.proxima_data || a.data_registo).getTime());
  const ultimaConsulta = consultasPassadas.length > 0 ? consultasPassadas[0] : null;
  
  const eventosFuturos = registos
    .filter(r => (r.proxima_data || r.data_registo) > hojeIso && r.estado === 'Agendado')
    .sort((a, b) => new Date(a.proxima_data || a.data_registo).getTime() - new Date(b.proxima_data || b.data_registo).getTime());
  const proximoVencimento = eventosFuturos.length > 0 ? eventosFuturos[0] : null;

  const vacinasTotal = registos.filter(r => r.tipo_registo === 'Vacina').length;
  const vacinasConcluidas = registos.filter(r => r.tipo_registo === 'Vacina' && r.estado === 'Concluído').length;
  const percentagemVacinas = vacinasTotal > 0 ? Math.round((vacinasConcluidas / vacinasTotal) * 100) : 100;

  const filteredRecords = registos
    .filter(item => {
      const matchesSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || item.pet_nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPet = selectedPetFilter ? item.pet_id === selectedPetFilter : true;
      const matchesType = selectedTypeFilter ? item.tipo_registo === selectedTypeFilter : true;
      return matchesSearch && matchesPet && matchesType;
    })
    .sort((a, b) => {
      const dateA = new Date(a.proxima_data || a.data_registo).getTime();
      const dateB = new Date(b.proxima_data || b.data_registo).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'Vacina': return <Syringe size={20} className="text-emerald-600" />;
      case 'Exame': return <Activity size={20} className="text-purple-600" />;
      case 'Medicamento': return <Pill size={20} className="text-amber-600" />;
      default: return <Stethoscope size={20} className="text-blue-600" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'Concluído': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Agendado': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-[32px] font-black text-[#0f172a] tracking-tight">Histórico de Saúde</h1>
            <p className="text-slate-500 font-medium">Acompanhe vacinas, consultas, exames e medicamentos.</p>
          </div>
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Pesquisar histórico..." onChange={(e) => setSearchTerm(e.target.value)} className="w-full lg:w-[250px] pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-full text-sm font-bold outline-none focus:ring-2 focus:ring-[#0d9488] shadow-sm transition-all" />
            </div>
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0d9488] text-white rounded-full font-bold shadow-lg shadow-teal-900/20 hover:bg-[#0f766e] active:scale-95 transition-all whitespace-nowrap">
              <Plus size={18} /> Novo Registo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-10">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setSelectedPetFilter(null)} className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${selectedPetFilter === null ? 'bg-[#1e293b] text-white border-transparent' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Todos os Animais</button>
            {pets.map(pet => (
              <button key={pet.id} onClick={() => setSelectedPetFilter(pet.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm ${selectedPetFilter === pet.id ? 'bg-[#1e293b] text-white border-transparent' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                {pet.fotografia_url ? <img src={pet.fotografia_url} alt={pet.nome} className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500">{pet.nome.charAt(0)}</div>}
                {pet.nome}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {['Todos', 'Consultas', 'Exames', 'Medicamentos', 'Vacinas'].map(tipo => {
              const dbType = tipo === 'Todos' ? null : tipo === 'Consultas' ? 'Consulta' : tipo === 'Exames' ? 'Exame' : tipo === 'Medicamentos' ? 'Medicamento' : 'Vacina';
              const isActive = selectedTypeFilter === dbType;
              return <button key={tipo} onClick={() => setSelectedTypeFilter(dbType)} className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all shadow-sm border ${isActive ? 'bg-[#1e293b] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{tipo}</button>
            })}
          </div>
        </div>

        {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#0d9488]" size={40} /></div> : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Syringe size={28} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Vacinas em Dia</p>
                  <p className={`text-2xl font-black mt-0.5 ${percentagemVacinas < 100 ? 'text-rose-600' : 'text-slate-800'}`}>{percentagemVacinas}%</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle size={28} className="text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Próximo Vencimento</p>
                  <p className={`text-xl font-black mt-0.5 leading-tight line-clamp-2 break-all ${proximoVencimento ? 'text-rose-600' : 'text-slate-800'}`} title={proximoVencimento?.titulo}>
                    {proximoVencimento ? proximoVencimento.titulo : '--'}
                  </p>
                  {proximoVencimento && <p className="text-xs font-bold text-rose-400 mt-1">{new Date(proximoVencimento.proxima_data || proximoVencimento.data_registo).toLocaleDateString('pt-PT')}</p>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Calendar size={28} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Última Consulta</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5 leading-tight line-clamp-2 break-words" title={ultimaConsulta?.pet_nome || ''}>
                    {ultimaConsulta ? ultimaConsulta.pet_nome : '--'}
                  </p>
                  {ultimaConsulta && <p className="text-xs font-bold text-blue-500 mt-1">{new Date(ultimaConsulta.proxima_data || ultimaConsulta.data_registo).toLocaleDateString('pt-PT')}</p>}
                </div>
              </div>
            </div>

            <div className="relative min-w-[160px] mb-6 flex justify-end">
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')} className="appearance-none pl-5 pr-10 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold outline-none focus:border-[#0d9488] cursor-pointer shadow-sm transition-all">
                <option value="desc">Mais Recente</option>
                <option value="asc">Mais Antigo</option>
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredRecords.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-400 font-bold">Nenhum registo de saúde encontrado.</div>
              ) : (
                filteredRecords.map(item => {
                  const dataDoEvento = item.proxima_data || item.data_registo;
                  
                  return (
                    <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-4 group hover:shadow-md transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                            {getIcon(item.tipo_registo)}
                          </div>
                          <div>
                            <span className={`inline-block mb-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border ${getEstadoColor(item.estado)}`}>
                              {item.estado}
                            </span>
                            <h3 className="text-lg font-black text-slate-800 line-clamp-2 break-all leading-tight" title={item.titulo}>{item.titulo}</h3>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => {
                            resetForm(); setSelectedItem(item);
                            setForm({
                              id_animal: item.pet_id, tipo_registo: item.tipo_registo, titulo: item.titulo,
                              data_registo: item.data_registo, proxima_data: item.proxima_data || '',
                              hora_registo: item.hora_registo || '', estado: item.estado,
                              descricao: item.descricao || '', veterinario: item.veterinario || '', local: item.local || ''
                            });
                            setIsModalOpen(true);
                          }} className="w-10 h-10 flex items-center justify-center bg-[#0d9488] text-white rounded-full hover:bg-[#0f766e] hover:shadow-md transition-all shadow-sm" title="Editar"><Edit2 size={16} /></button>
                          
                          <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-full hover:bg-rose-600 hover:shadow-md transition-all shadow-sm" title="Eliminar"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      <div className="pl-[72px]">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          {new Date(dataDoEvento).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric'})}
                          <span className="text-slate-300">•</span>
                          <span className="truncate">{item.pet_nome}</span>
                        </div>

                        {item.hora_registo && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1">
                            <Clock size={14} className="shrink-0" />
                            <span>{item.hora_registo.slice(0, 5)}</span>
                          </div>
                        )}

                        {(item.veterinario || item.local) && (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1">
                            <MapPin size={14} className="shrink-0" /> 
                            <span className="truncate">{item.veterinario}{item.veterinario && item.local ? ' • ' : ''}{item.local}</span>
                          </div>
                        )}
                        
                        {item.descricao && <p className="text-sm text-slate-500 mt-3 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">{item.descricao}</p>}
                      </div>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-auto">
                        <button onClick={() => {
                          setSelectedItem(item);
                          setIsDetailsModalOpen(true);
                        }} className="flex-1 py-3 bg-[#0d9488] text-white rounded-full text-sm font-bold hover:bg-[#0f766e] hover:shadow-md transition-all shadow-sm">
                          Ver Detalhes
                        </button>
                        
                        {item.estado !== 'Concluído' && dataDoEvento <= hojeIso && (
                          <button onClick={() => handleMarkAsCompleted(item.id)} className="flex-1 py-3 flex items-center justify-center gap-2 bg-emerald-500 text-white rounded-full text-sm font-bold hover:bg-emerald-600 hover:shadow-md transition-all shadow-sm" title="Marcar como Concluído">
                            <Check size={18} /> Concluir
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              <h2 className="text-2xl font-black mb-6 text-slate-800">{selectedItem ? "Editar Registo" : "Novo Registo"}</h2>
              {errorMessage && <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm text-center border border-rose-100">{errorMessage}</div>}
              {successMessage && <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm text-center border border-emerald-100">{successMessage}</div>}
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="relative w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer group overflow-hidden">
                  {filePreview ? <img src={filePreview} className="w-full h-full object-contain p-2" /> : <><Camera className="text-slate-300 group-hover:text-[#0d9488]" size={28} /><span className="text-[10px] font-black text-slate-400 uppercase mt-2">{fileToUpload ? fileToUpload.name : "Anexar PDF / Foto"}</span></>}
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select required value={form.id_animal} onChange={e => setForm({...form, id_animal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]">
                    <option value="">Animal</option>
                    {pets.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  <select required value={form.tipo_registo} onChange={e => setForm({...form, tipo_registo: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]">
                    <option value="Consulta">Consulta</option><option value="Vacina">Vacina</option><option value="Exame">Exame</option><option value="Medicamento">Medicamento</option>
                  </select>
                </div>
                <input required placeholder="Título" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Data do Registo</span>
                    <input required type="date" value={form.data_registo} onChange={e => setForm({...form, data_registo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none text-slate-600 focus:border-[#0d9488]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Data da Marcação</span>
                    <input required type="date" value={form.proxima_data} onChange={e => setForm({...form, proxima_data: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none text-slate-600 focus:border-[#0d9488]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Hora" type="time" value={form.hora_registo} onChange={e => setForm({...form, hora_registo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                  <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]">
                    {!(form.proxima_data || form.data_registo) || (form.proxima_data || form.data_registo) <= hojeIso ? <option value="Concluído">Concluído</option> : null}
                    <option value="Agendado">Agendado</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Veterinário" value={form.veterinario} onChange={e => setForm({...form, veterinario: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                  <input placeholder="Local" value={form.local} onChange={e => setForm({...form, local: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                </div>
                <textarea placeholder="Observações..." value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488] min-h-[100px] resize-none" />
                <button type="submit" disabled={uploading} className="w-full bg-[#0d9488] text-white font-black py-5 rounded-2xl hover:bg-[#0f766e] transition-all flex justify-center items-center shadow-lg mt-2">
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : (selectedItem ? "Guardar Alterações" : "Guardar Registo")}
                </button>
              </form>
            </div>
          </div>
        )}

        {isDetailsModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              
              <div className="flex items-center gap-4 mb-6 pr-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  {getIcon(selectedItem.tipo_registo)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight break-all">{selectedItem.titulo}</h2>
                  <p className="text-sm font-bold text-slate-500 mt-1">{selectedItem.tipo_registo} • {selectedItem.pet_nome}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Data do Registo</p>
                    <p className="text-sm font-bold text-slate-700">{new Date(selectedItem.data_registo).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Hora</p>
                    <p className="text-sm font-bold text-slate-700">{selectedItem.hora_registo ? selectedItem.hora_registo.slice(0,5) : '--:--'}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Data da Marcação</p>
                    <p className="text-sm font-bold text-[#0d9488]">{selectedItem.proxima_data ? new Date(selectedItem.proxima_data).toLocaleDateString('pt-PT') : 'Não aplicável'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Estado</p>
                    <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${getEstadoColor(selectedItem.estado)}`}>{selectedItem.estado}</span>
                  </div>
                </div>

                {(selectedItem.veterinario || selectedItem.local) && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Veterinário / Local</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <MapPin size={16} className="text-[#0d9488] shrink-0" /> 
                      <span className="break-all">{selectedItem.veterinario}{selectedItem.veterinario && selectedItem.local ? ' • ' : ''}{selectedItem.local}</span>
                    </p>
                  </div>
                )}

                {selectedItem.descricao && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Observações</p>
                    <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap break-all">{selectedItem.descricao}</p>
                  </div>
                )}

                {selectedItem.ficheiro_url && (
                  <div className="mt-6">
                    <a href={selectedItem.ficheiro_url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-4 bg-[#0d9488] text-white rounded-2xl text-sm font-bold hover:bg-[#0f766e] transition-all shadow-sm border border-teal-100">
                      <FileText size={18} /> Ver Documento
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}