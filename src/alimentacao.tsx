import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './barraLateral';
import { 
  Search, Plus, ShoppingBag, Edit2, X, Utensils, 
  ShoppingCart, Loader2, Trash2, Camera, AlertTriangle, RefreshCcw, CheckCircle2 
} from 'lucide-react';
import { supabase } from "./supabaseClient";

interface Pet {
  id: string;
  nome: string;
  fotografia_url: string | null;
}

interface StockItem {
  id: string; 
  pet_id: string;
  pet_nome: string | null;
  nome_racao: string;
  stock_atual: number;
  stock_total: number;
  porcao_diaria: number;
  link_compra: string | null;
  foto_url: string | null;
}

export default function StockAlimentacao() {
  const navigate = useNavigate();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPetFilter, setSelectedPetFilter] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    id_animal: '',
    nome_racao: '',
    stock_atual: '',
    stock_total: '',
    porcao_diaria: '',
    link_compra: ''
  });

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ id_animal: '', nome_racao: '', stock_atual: '', stock_total: '', porcao_diaria: '', link_compra: '' });
    setFotoFile(null);
    setPreviewUrl(null);
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
      if (petsData) {
        setPets(petsData.map(p => ({ id: p.id_animal, nome: p.nome, fotografia_url: p.fotografia_url })));
        
        const { data: alimentacaoData, error } = await supabase
          .from('alimentacao')
          .select(`*, animais!inner(nome, id_utilizador)`)
          .eq('animais.id_utilizador', userId)
          .order('data_criacao', { ascending: true });

        if (error) throw error;
        setStock((alimentacaoData || []).map((item: any) => ({
          id: item.id_alimentacao,
          pet_id: item.id_animal,
          pet_nome: item.animais?.nome || 'Desconhecido',
          nome_racao: item.nome_racao,
          stock_atual: Number(item.stock_atual),
          stock_total: Number(item.stock_total),
          porcao_diaria: Number(item.porcao_diaria),
          link_compra: item.link_compra,
          foto_url: item.foto_url
        })));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setErrorMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      let publicUrl = null;
      if (fotoFile) {
        const fileExt = fotoFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('food-images').upload(fileName, fotoFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('food-images').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const stockFinal = parseFloat(form.stock_atual);
      const doseFinal = parseFloat(form.porcao_diaria);
      if (isNaN(stockFinal) || stockFinal <= 0) throw new Error('O stock deve ser um valor positivo.');
      if (isNaN(doseFinal) || doseFinal <= 0) throw new Error('A dose diária deve ser um valor positivo.');

      const { error } = await supabase.from('alimentacao').insert([{
        id_animal: form.id_animal,
        nome_racao: form.nome_racao,
        stock_atual: stockFinal,
        stock_total: stockFinal,
        porcao_diaria: doseFinal,
        link_compra: form.link_compra || null,
        foto_url: publicUrl
      }]);

      if (error) throw error;
      setSuccessMessage("Guardado com sucesso!");
      fetchData();
      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
      }, 1000);
    } catch (error: any) { setErrorMessage(error.message); } finally { setUploading(false); }
  };

  const handleUpdateStockValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setUploading(true);
    setErrorMessage("");

    try {
      let publicUrl = selectedItem.foto_url; 

      if (fotoFile) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const fileExt = fotoFile.name.split('.').pop();
          const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('food-images').upload(fileName, fotoFile);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('food-images').getPublicUrl(fileName);
          publicUrl = data.publicUrl;
        }
      }

      const stockAtualFinal = parseFloat(parseFloat(form.stock_atual).toFixed(2));
      const stockTotalFinal = parseFloat(parseFloat(form.stock_total).toFixed(2));
      const doseFinal = parseFloat(form.porcao_diaria);
      if (isNaN(stockAtualFinal) || stockAtualFinal <= 0) throw new Error('O stock atual deve ser um valor positivo.');
      if (isNaN(stockTotalFinal) || stockTotalFinal <= 0) throw new Error('O stock total deve ser um valor positivo.');
      if (stockAtualFinal > stockTotalFinal) throw new Error('O stock atual não pode ser superior ao stock total.');
      if (isNaN(doseFinal) || doseFinal <= 0) throw new Error('A dose diária deve ser um valor positivo.');

      const { error } = await supabase.from('alimentacao').update({ 
        id_animal: form.id_animal,
        nome_racao: form.nome_racao,
        stock_atual: stockAtualFinal,
        stock_total: stockTotalFinal,
        porcao_diaria: doseFinal,
        link_compra: form.link_compra || null,
        foto_url: publicUrl
      }).eq('id_alimentacao', selectedItem.id);

      if (error) throw error;
      
      setSuccessMessage("Registo atualizado com sucesso!");
      fetchData();
      setTimeout(() => {
        setIsUpdateModalOpen(false);
        resetForm();
      }, 1000);
    } catch (error: any) { setErrorMessage(error.message); } finally { setUploading(false); }
  };

  const handleFeedQuickly = async (item: StockItem) => {
    const dose = item.porcao_diaria / 1000; 
    const novoStock = Math.max(0, item.stock_atual - dose);
    const stockArredondado = parseFloat(novoStock.toFixed(2));

    const { error } = await supabase.from('alimentacao').update({ stock_atual: stockArredondado }).eq('id_alimentacao', item.id);
    if (!error) setStock(prev => prev.map(s => s.id === item.id ? { ...s, stock_atual: stockArredondado } : s));
  };

  const handleResetStock = async (item: StockItem) => {
    const { error } = await supabase.from('alimentacao').update({ stock_atual: item.stock_total }).eq('id_alimentacao', item.id);
    if (!error) fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('alimentacao').delete().eq('id_alimentacao', id);
    if (!error) fetchData();
  };

  const openEditModal = (item: StockItem) => {
    resetForm();
    setSelectedItem(item);
    setForm({
      id_animal: item.pet_id,
      nome_racao: item.nome_racao,
      stock_atual: parseFloat(item.stock_atual.toFixed(2)).toString(),
      stock_total: parseFloat(item.stock_total.toFixed(2)).toString(),
      porcao_diaria: item.porcao_diaria.toString(),
      link_compra: item.link_compra || ''
    });
    setPreviewUrl(item.foto_url);
    setIsUpdateModalOpen(true);
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = item.nome_racao.toLowerCase().includes(searchTerm.toLowerCase()) || item.pet_nome?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPet = selectedPetFilter ? item.pet_id === selectedPetFilter : true;
    return matchesSearch && matchesPet;
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-10 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-[32px] font-black text-[#0f172a] tracking-tight">Stock de Alimentação</h1>
          </div>
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-[#0d9488] text-white rounded-full font-bold hover:bg-[#0f766e] transition-all shadow-lg active:scale-95">
            <Plus size={18} /> Novo Registo
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedPetFilter(null)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
              selectedPetFilter === null ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Todos os Animais
          </button>
          
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => setSelectedPetFilter(pet.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                selectedPetFilter === pet.id ? 'bg-[#1e293b] text-white' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {pet.fotografia_url ? (
                <img src={pet.fotografia_url} alt={pet.nome} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">{pet.nome.charAt(0)}</div>
              )}
              {pet.nome}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#0d9488]" size={40} /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredStock.map(item => {
              const doseEmKg = item.porcao_diaria / 1000;
              const daysLeft = doseEmKg > 0 ? Math.floor(Number((item.stock_atual / doseEmKg).toFixed(2))) : 0;
              const percentagem = Math.min((item.stock_atual / item.stock_total) * 100, 100);
              const isCritico = daysLeft <= 7;

              return (
                <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
                        {item.foto_url ? <img src={item.foto_url} className="w-full h-full object-cover" /> : <ShoppingBag size={24} className="text-[#0d9488]" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.pet_nome}</p>
                        <h3 className="text-xl font-black text-slate-800 mt-0.5 leading-tight">{item.nome_racao}</h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(item)} className="p-2.5 bg-[#0d9488] text-white rounded-xl hover:bg-[#0f766e] transition-all hover:scale-110"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all hover:scale-110"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-4 rounded-2xl ${isCritico ? 'bg-rose-50 border border-rose-100' : 'bg-slate-50'}`}>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Duração</p>
                      <p className={`text-2xl font-black ${isCritico ? 'text-rose-600' : 'text-slate-800'}`}>~{daysLeft} dias</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Dose Diária</p>
                      <p className="text-2xl font-black text-slate-800">{item.porcao_diaria}g</p>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-2xl mb-6 border transition-all ${isCritico ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                    <div className="flex items-center gap-2 text-[13px] font-bold">
                      {isCritico ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                      {isCritico ? "Stock insuficiente." : "Stock suficiente."}
                    </div>
                    {isCritico && (
                      <button onClick={() => handleResetStock(item)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 hover:scale-105 active:scale-95 transition-all text-[11px] font-black uppercase tracking-wider">
                        <RefreshCcw size={12} /> Repor
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-600">{item.stock_atual.toFixed(2)} kg</span>
                    <span className="text-slate-400">Total: {item.stock_total} kg</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full mb-6">
                    <div className={`h-full rounded-full transition-all duration-700 ${isCritico ? 'bg-rose-500' : 'bg-[#0d9488]'}`} style={{ width: `${percentagem}%` }} />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => handleFeedQuickly(item)} className="flex-1 flex items-center justify-center gap-2 bg-[#0d9488] text-white py-4 rounded-2xl font-black text-[12px] uppercase tracking-wider hover:bg-[#0f766e] active:scale-95 transition-all">
                      <Utensils size={18} /> Registar Dose
                    </button>
                    {item.link_compra && (
                      <a href={item.link_compra} target="_blank" rel="noreferrer" className="px-5 flex items-center justify-center bg-teal-50 text-[#0d9488] rounded-2xl hover:bg-[#0d9488] hover:text-white transition-all shadow-sm">
                        <ShoppingCart size={20} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-400"><X size={24} /></button>
              <h2 className="text-2xl font-black mb-6 text-slate-800">Novo Registo</h2>
              {errorMessage && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm text-center border border-rose-100">{errorMessage}</div>}
              {successMessage && <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm text-center border border-emerald-100">{successMessage}</div>}
              <form onSubmit={handleAddStock} className="flex flex-col gap-4">
                <div className="relative w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer group overflow-hidden">
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain p-2" /> : <><Camera className="text-slate-300 group-hover:text-[#0d9488]" size={28} /><span className="text-[10px] font-black text-slate-400 uppercase mt-2">Foto da Ração</span></>}
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <select required value={form.id_animal} onChange={e => setForm({...form, id_animal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold focus:border-[#0d9488] outline-none">
                  <option value="">Selecionar Animal</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <input required placeholder="Marca da Ração" value={form.nome_racao} onChange={e => setForm({...form, nome_racao: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold focus:border-[#0d9488] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" min="0.1" step="0.1" placeholder="Stock (kg)" value={form.stock_atual} onChange={e => setForm({...form, stock_atual: e.target.value, stock_total: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none" />
                  <input required type="number" min="1" step="1" placeholder="Dose (g)" value={form.porcao_diaria} onChange={e => setForm({...form, porcao_diaria: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none" />
                </div>
                <input placeholder="Link de Compra (Opcional)" value={form.link_compra} onChange={e => setForm({...form, link_compra: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none" />
                <button type="submit" disabled={uploading} className="w-full bg-[#0d9488] text-white font-black py-5 rounded-2xl hover:bg-[#0f766e] transition-all flex justify-center items-center shadow-lg mt-2">
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : "Guardar Registo"}
                </button>
              </form>
            </div>
          </div>
        )}
        {isUpdateModalOpen && selectedItem && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsUpdateModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              <h2 className="text-2xl font-black mb-6 text-slate-800">Editar Registo</h2>
              {errorMessage && <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm text-center border border-rose-100">{errorMessage}</div>}
              {successMessage && <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm text-center border border-emerald-100">{successMessage}</div>}
              <form onSubmit={handleUpdateStockValue} className="flex flex-col gap-4">
                <div className="relative w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer group overflow-hidden">
                  {previewUrl ? <img src={previewUrl} className="w-full h-full object-contain p-2" /> : <><Camera className="text-slate-300 group-hover:text-[#0d9488]" size={28} /><span className="text-[10px] font-black text-slate-400 uppercase mt-2">Alterar Foto</span></>}
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <select required value={form.id_animal} onChange={e => setForm({...form, id_animal: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold focus:border-[#0d9488] outline-none">
                  <option value="">Selecionar Animal</option>
                  {pets.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <input required placeholder="Marca da Ração" value={form.nome_racao} onChange={e => setForm({...form, nome_racao: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold focus:border-[#0d9488] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Stock Atual (kg)</span>
                     <input required type="number" min="0.1" step="0.1" value={form.stock_atual} onChange={e => setForm({...form, stock_atual: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Stock Total (kg)</span>
                     <input required type="number" min="0.1" step="0.1" value={form.stock_total} onChange={e => setForm({...form, stock_total: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase ml-2">Dose Diária (g)</span>
                    <input required type="number" min="1" step="1" placeholder="Dose (g)" value={form.porcao_diaria} onChange={e => setForm({...form, porcao_diaria: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                </div>
                <input placeholder="Link de Compra (Opcional)" value={form.link_compra} onChange={e => setForm({...form, link_compra: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl font-bold outline-none focus:border-[#0d9488]" />
                <button type="submit" disabled={uploading} className="w-full bg-[#0d9488] text-white font-black py-5 rounded-2xl hover:bg-[#0f766e] transition-all flex justify-center items-center shadow-lg mt-2">
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : "Guardar Alterações"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}