import { Plus, Cake, Scale, X, Camera, Trash2, Mars, Venus, CheckCircle, Edit2, Droplet, History, ArrowUp, ArrowDown, Minus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./barraLateral";
import { supabase } from "./supabaseClient";
import { racasCaes, racasGatos } from "./racas";

const TIPOS_SANGUE_OPCOES = {
  "Cão": ["DEA 1.1 +", "DEA 1.1 -", "DEA 1.2", "DEA 3", "DEA 4", "DEA 5", "DEA 7", "DEA 8"],
  "Gato": ["Tipo A", "Tipo B", "Tipo AB"],
};

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  weight: string;
  gender: string;
  image: string;
  bloodType?: string;
}

export default function Animais() {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); 
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [weightHistory, setWeightHistory] = useState<any[]>([]);

  const [novoNome, setNovoNome] = useState('');
  const [novaEspecie, setNovaEspecie] = useState('Cão');
  const [novaRaca, setNovaRaca] = useState('');
  const [novoSexo, setNovoSexo] = useState('Macho');
  const [novaFoto, setNovaFoto] = useState(''); 
  const [fotoFile, setFotoFile] = useState<File | null>(null); 
  const [novoPesoValor, setNovoPesoValor] = useState(""); 
  const [novaIdade, setNovaIdade] = useState(""); 
  const [novoTipoSangue, setNovoTipoSangue] = useState(""); 
  
  const [novoPesoRapido, setNovoPesoRapido] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [sugestoesRaca, setSugestoesRaca] = useState<string[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUserId(session.user.id);
      fetchAnimais(session.user.id);
    };
    initializeAuth();
  }, [navigate]);

  const getImagemPet = (path: string | null) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('pet-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const fetchAnimais = async (currentUserId: string) => {
    setLoading(true);
    try {
      const { data: animaisData, error } = await supabase
        .from('animais')
        .select('*')
        .eq('id_utilizador', currentUserId)
        .order('data_criacao', { ascending: true });

      if (error) throw error;

      const animaisFormatados = (animaisData || []).map((p: any) => ({
        id: p.id_animal,
        name: p.nome,
        species: p.especie,
        breed: p.raca || 'SRD',
        age: p.idade ? `${p.idade} anos` : "N/D", 
        weight: `${p.peso || 0} kg`,
        gender: p.genero,
        bloodType: p.tipo_sangue,
        image: getImagemPet(p.fotografia_url) 
      }));

      setPets(animaisFormatados);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillFormWithPet = (pet: Pet) => {
    setSelectedPet(pet);
    setNovoNome(pet.name);
    setNovaEspecie(pet.species);
    setNovaRaca(pet.breed === 'SRD' ? '' : pet.breed);
    setNovoSexo(pet.gender);
    setNovoPesoValor(pet.weight.replace(' kg', ''));
    setNovaIdade(pet.age.replace(' anos', '').replace('N/D', ''));
    setNovoTipoSangue(pet.bloodType || '');
    setNovaFoto(pet.image);
    setFotoFile(null);
    setErrorMessage("");
    setSuccessMessage("");
    setIsRegistering(true);
  };

  const handleSavePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setErrorMessage(""); 

    try {
      let storagePath = null;

      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('pet-images').upload(filePath, fotoFile);
        if (uploadError) throw new Error(`Erro ao enviar foto: ${uploadError.message}`); 
        
        const { data } = supabase.storage.from('pet-images').getPublicUrl(filePath);
        storagePath = data.publicUrl; 
      }

      const payload: any = {
        nome: novoNome,
        especie: novaEspecie,
        raca: novaRaca,
        genero: novoSexo,
        peso: parseFloat(novoPesoValor) || 0,
        idade: parseInt(novaIdade) || null,
        tipo_sangue: novoTipoSangue || null,
      };

      if (storagePath) {
        payload.fotografia_url = storagePath;
      }

      const dataHoje = new Date().toISOString().split('T')[0];

      if (selectedPet) {
        const { error: updateError } = await supabase.from('animais').update(payload).eq('id_animal', selectedPet.id);
        if (updateError) throw new Error(`Erro ao atualizar dados: ${updateError.message}`); 
        
        if (parseFloat(novoPesoValor) !== parseFloat(selectedPet.weight)) {
          await supabase.from('peso_animais').insert([{
            id_animal: selectedPet.id,
            peso: parseFloat(novoPesoValor),
            data_registo: dataHoje
          }]);
        }

        setSuccessMessage("Animal atualizado com sucesso!");
      } else {
        payload.id_utilizador = userId;
        const { data: insertedData, error: insertError } = await supabase.from('animais').insert([payload]).select();
        if (insertError) throw new Error(`Erro ao guardar dados: ${insertError.message}`); 
        
        if (insertedData && insertedData.length > 0 && payload.peso > 0) {
          await supabase.from('peso_animais').insert([{
            id_animal: insertedData[0].id_animal,
            peso: payload.peso,
            data_registo: dataHoje
          }]);
        }

        setSuccessMessage("Animal guardado com sucesso!");
      }

      fetchAnimais(userId);
      setTimeout(() => {
        setIsRegistering(false);
        resetForm();
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleQuickWeightSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet || !userId) return;
    try {
      const pesoNumerico = parseFloat(novoPesoRapido);
      
      const { error: updateError } = await supabase.from('animais').update({ peso: pesoNumerico }).eq('id_animal', selectedPet.id);
      if (updateError) throw updateError;

      const { error: historyError } = await supabase.from('peso_animais').insert([{
        id_animal: selectedPet.id,
        peso: pesoNumerico,
        data_registo: new Date().toISOString().split('T')[0]
      }]);
      if (historyError) throw historyError;

      setIsWeightModalOpen(false);
      setNovoPesoRapido("");
      fetchAnimais(userId);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleOpenHistory = async (pet: Pet) => {
    setSelectedPet(pet);
    setIsHistoryModalOpen(true);
    setWeightHistory([]);
    try {
      const { data, error } = await supabase
        .from('peso_animais')
        .select('*')
        .eq('id_animal', pet.id)
        .order('data_registo', { ascending: false })
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      setWeightHistory(data || []);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setNovaFoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNovoNome(''); setNovaRaca(''); setNovaFoto(''); setNovoPesoValor(''); 
    setFotoFile(null); setNovoSexo('Macho'); setNovaEspecie('Cão'); 
    setMostrarSugestoes(false); setNovaIdade(''); setNovoTipoSangue(''); 
    setSelectedPet(null); setSuccessMessage(''); setErrorMessage('');
  };

  const handleEspecieChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNovaEspecie(e.target.value);
    setNovaRaca('');
    setNovoTipoSangue('');
  };

  const handleRacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setNovaRaca(valor);
    const listaFiltro = novaEspecie === 'Cão' ? racasCaes : novaEspecie === 'Gato' ? racasGatos : [];
    if (valor.trim().length > 0) {
      setSugestoesRaca(listaFiltro.filter(r => r.toLowerCase().startsWith(valor.toLowerCase())));
      setMostrarSugestoes(true);
    } else {
      setMostrarSugestoes(false);
    }
  };

  const confirmDelete = async (petId?: string) => {
    const idToDelete = petId || selectedPet?.id;
    if (!idToDelete || !userId) return;
    try {
      const { error } = await supabase.from('animais').delete().eq('id_animal', idToDelete);
      if (error) throw error;
      setIsDeleting(false);
      fetchAnimais(userId);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-[32px] font-black text-slate-800 tracking-tight">Os Meus Animais</h1>
            <p className="text-slate-500 font-medium">Faça a gestão dos seus animais de estimação</p>
          </div>
          <button onClick={() => { resetForm(); setIsRegistering(true); }} className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 font-bold shadow-lg transition-all">
            <Plus size={18} /> Novo Animal
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-slate-400 font-bold">A carregar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {pets.map(pet => (
              <div key={pet.id} className="bg-white rounded-[28px] border border-slate-200 overflow-hidden hover:shadow-xl transition-all flex flex-col group">
                <div className="relative h-56 overflow-hidden bg-slate-100">
                  {pet.image && (
                    <img src={pet.image} className="w-full h-full object-cover" alt={pet.name} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                  
                  <div className="absolute bottom-5 left-6 text-white">
                    <h2 className="text-3xl font-black">{pet.name}</h2>
                    <p className="text-slate-200 text-sm">{pet.breed} • {pet.species}</p>
                  </div>
                  <div className="absolute top-5 right-6 flex gap-2">
                    <button onClick={() => fillFormWithPet(pet)} className="w-10 h-10 bg-white/20 hover:bg-sky-500 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/30 transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => { setSelectedPet(pet); confirmDelete(pet.id); }} className="w-10 h-10 bg-white/20 hover:bg-rose-500 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/30 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl">
                    <Cake size={20} className="text-amber-500 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Idade</span>
                    <p className="text-sm font-bold text-slate-700">{pet.age}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl">
                    <Scale size={20} className="text-blue-500 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Peso</span>
                    <p className="text-sm font-bold text-slate-700">{pet.weight}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl">
                    {pet.gender === 'Macho' ? <Mars size={20} className="text-blue-600 mb-2" /> : <Venus size={20} className="text-fuchsia-500 mb-2" />}
                    <span className="text-[10px] font-black text-slate-400 uppercase">Sexo</span>
                    <p className="text-sm font-bold text-slate-700">{pet.gender}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl">
                    <Droplet size={20} className="text-rose-500 mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">Sangue</span>
                    <p className="text-sm font-bold text-slate-700">{pet.bloodType || "N/D"}</p>
                  </div>
                </div>

                <div className="px-8 pb-4 flex gap-3">
                  <button onClick={() => { setSelectedPet(pet); setNovoPesoRapido(""); setIsWeightModalOpen(true); }} className="flex-1 py-3.5 bg-teal-50 text-teal-600 font-bold rounded-2xl hover:bg-teal-100 transition-all flex items-center justify-center gap-2 text-sm">
                    <Plus size={16} /> Novo Peso
                  </button>
                  <button onClick={() => handleOpenHistory(pet)} className="flex-1 py-3.5 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-teal-100 hover:text-teal-700 transition-all flex items-center justify-center gap-2 text-sm">
                    <History size={16} /> Histórico
                  </button>
                </div>

                <div className="px-8 pb-8">
                   <button onClick={() => navigate(`/perfil/${pet.id}`)} className="w-full py-4 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 transition-all">Ver Perfil Completo</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isRegistering && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsRegistering(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
              <h2 className="text-2xl font-black mb-6 text-center text-slate-800">{selectedPet ? "Editar Animal" : "Novo Animal"}</h2>
              
              {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in fade-in zoom-in duration-300">
                  <CheckCircle size={20} /> {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center font-bold text-sm animate-in fade-in">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSavePet} className="space-y-4">
                <div className="relative w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer group overflow-hidden hover:border-[#0d9488] hover:bg-teal-50 transition-all shadow-sm">
                  {novaFoto ? (
                    <img src={novaFoto} className="w-full h-full object-contain p-2" alt="Preview do Animal" />
                  ) : (
                    <>
                      <Camera className="text-slate-300 group-hover:text-[#0d9488] mb-2" size={32} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#0d9488]">Adicionar Foto</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                
                <input required placeholder="Nome do Animal" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500" />
                
                <div className="grid grid-cols-2 gap-4">
                  <select value={novaEspecie} onChange={handleEspecieChange} className="bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="Cão">Cão</option>
                    <option value="Gato">Gato</option>
                  </select>
                  <select value={novoSexo} onChange={e => setNovoSexo(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="Macho">Macho</option>
                    <option value="Fêmea">Fêmea</option>
                  </select>
                </div>

                <div className="relative">
                  <input required placeholder="Raça" value={novaRaca} onChange={handleRacaChange} onBlur={() => setTimeout(() => setMostrarSugestoes(false), 200)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500" />
                  {mostrarSugestoes && sugestoesRaca.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-xl">
                      {sugestoesRaca.map((r, i) => (
                        <li key={i} onClick={() => { setNovaRaca(r); setMostrarSugestoes(false); }} className="p-3 hover:bg-teal-50 cursor-pointer text-slate-700 border-b border-slate-100">{r}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" placeholder="Idade (anos)" value={novaIdade} onChange={e => setNovaIdade(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500" />
                  <input required type="number" step="0.1" placeholder="Peso (kg)" value={novoPesoValor} onChange={e => setNovoPesoValor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500" />
                </div>

                <select value={novoTipoSangue} onChange={e => setNovoTipoSangue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Tipo Sanguíneo (Opcional)</option>
                  {novaEspecie === 'Cão' && TIPOS_SANGUE_OPCOES["Cão"].map(t => <option key={t} value={t}>{t}</option>)}
                  {novaEspecie === 'Gato' && TIPOS_SANGUE_OPCOES["Gato"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                
                <button type="submit" className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl hover:bg-teal-700 transition-all mt-2">
                  {selectedPet ? "Guardar Alterações" : "Guardar Animal"}
                </button>
              </form>
            </div>
          </div>
        )}

        {isWeightModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative shadow-2xl">
              <button onClick={() => setIsWeightModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scale size={30} />
              </div>
              <h3 className="text-xl font-black text-slate-800 text-center mb-6">Registar Novo Peso</h3>
              <form onSubmit={handleQuickWeightSave} className="space-y-4">
                <input required type="number" step="0.1" placeholder="Novo Peso em kg" value={novoPesoRapido} onChange={e => setNovoPesoRapido(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-lg font-bold outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="submit" className="w-full py-4 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all">Atualizar Peso</button>
              </form>
            </div>
          </div>
        )}

        {isHistoryModalOpen && selectedPet && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl relative max-h-[90vh] flex flex-col shadow-2xl">
              <button onClick={() => setIsHistoryModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
              
              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-800">Histórico de Peso</h3>
                <p className="text-teal-600 font-bold text-lg">{selectedPet.name}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                {weightHistory.length > 0 && (
                  <div className="bg-white p-6 rounded-3xl mb-8 border border-slate-200 shadow-sm h-48">
                    <div className="flex items-end justify-center gap-6 h-full w-full overflow-x-auto scrollbar-hide">
                      {[...weightHistory].reverse().map((registo) => {
                        const maxWeight = Math.max(...weightHistory.map(w => w.peso), 1);
                        const heightPercent = Math.max((registo.peso / maxWeight) * 100, 10);
                        return (
                          <div key={`chart-${registo.id_peso}`} className="flex flex-col items-center justify-end h-full min-w-[40px] gap-2">
                            <span className="text-xs font-black text-slate-600">{registo.peso.toFixed(1)}</span>
                            <div className="flex-1 w-full flex items-end justify-center">
                              <div 
                                className="w-8 bg-[#0d9488] rounded-full transition-all duration-500" 
                                style={{ height: `${heightPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {new Date(registo.data_registo).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4 px-2">
                  <h4 className="text-lg font-black text-slate-800">Registos</h4>
                  <span className="text-xs font-bold text-slate-400">Mais recente primeiro</span>
                </div>

                <div className="space-y-3 pb-4">
                  {weightHistory.length === 0 ? (
                    <p className="text-center text-slate-500 font-medium py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Ainda não existem registos de peso.</p>
                  ) : (
                    weightHistory.map((registo, index) => {
                      const prevRegisto = weightHistory[index + 1]; 
                      let diff = 0;
                      if (prevRegisto) {
                        diff = registo.peso - prevRegisto.peso;
                      }

                      return (
                        <div key={registo.id_peso} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 w-1/3">
                            <Calendar size={18} className="text-[#0d9488]" />
                            <span className="text-sm font-bold text-slate-600">
                              {new Date(registo.data_registo).toLocaleDateString('pt-PT')}
                            </span>
                          </div>

                          <div className="flex flex-col items-center justify-center w-1/3">
                            <span className="text-lg font-black text-slate-800">
                              {registo.peso.toFixed(1)} kg
                            </span>
                            {index === 0 && (
                              <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-2.5 py-0.5 rounded-full mt-1">Atual</span>
                            )}
                          </div>

                          <div className="w-1/3 flex justify-end">
                            {prevRegisto ? (
                              <span className={`text-sm font-bold flex items-center gap-1.5 ${diff > 0 ? 'text-rose-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                                {diff > 0 ? <ArrowUp size={16} /> : diff < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-slate-400 flex items-center gap-1.5"><Minus size={16} /></span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}