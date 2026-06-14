import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './barraLateral';
import { supabase } from "./supabaseClient";
import { 
  LogOut, Calendar, Dog, Mail, ArrowLeft, Camera, Loader2, CheckCircle
} from 'lucide-react';

interface Utilizador {
  id_utilizador: string;
  nome: string;
  email: string;
  foto_perfil_url?: string;
  data_registo: string;
}

export default function Perfil() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null); 
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); 
  const [user, setUser] = useState<Utilizador | null>(null);
  const [totalAnimais, setTotalAnimais] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchDadosPerfil();
  }, []);

  const fetchDadosPerfil = async () => {
    setLoading(true);
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr || sessionStr === "undefined") return navigate('/login');

    const sessionUser = JSON.parse(sessionStr);
    const userId = sessionUser.id_utilizador || sessionUser.id;

    try {
      const { data: userData, error: userError } = await supabase
        .from('utilizadores')
        .select('*')
        .eq('id_utilizador', userId)
        .maybeSingle();

      if (userError) throw userError;

      if (userData) {
        setUser(userData);
        if (userData.foto_perfil_url) {
          if (userData.foto_perfil_url.startsWith('http')) {
            setImageUrl(userData.foto_perfil_url);
          } else {
            descarregarImagem(userData.foto_perfil_url);
          }
        }
      }
      
      const { count } = await supabase
        .from('animais')
        .select('*', { count: 'exact', head: true })
        .eq('id_utilizador', userId);

      setTotalAnimais(count || 0);
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const descarregarImagem = (path: string) => {
    const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
    if (data?.publicUrl) setImageUrl(data.publicUrl);
  };

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setSuccessMessage("");
      setErrorMessage("");

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Deves selecionar uma imagem para carregar.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id_utilizador}-${Math.random()}.${fileExt}`;
      const filePath = `${user?.id_utilizador}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('utilizadores')
        .update({ foto_perfil_url: publicUrl })
        .eq('id_utilizador', user?.id_utilizador);

      if (updateError) throw updateError;

      const sessionStr = localStorage.getItem('user');
      if (sessionStr) {
        const sessionUser = JSON.parse(sessionStr);
        sessionUser.foto_perfil_url = publicUrl;
        localStorage.setItem('user', JSON.stringify(sessionUser));
        window.dispatchEvent(new Event('storage'));
      }

      setImageUrl(publicUrl);
      

      setSuccessMessage('Foto de perfil atualizada com sucesso!');
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (error: any) {

      setErrorMessage(error.message);
      setTimeout(() => setErrorMessage(""), 4000);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#14b8a6]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      
      <main className="flex-1 p-6 pt-16 lg:pt-6 lg:p-10 flex justify-center">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-50 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">O meu Perfil</h1>
            <div className="w-10"></div>
          </div>

          <div className="flex flex-col items-center text-center">
            {successMessage && (
              <div className="mb-6 w-full p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center justify-center gap-2 font-bold animate-in fade-in zoom-in duration-300">
                <CheckCircle size={20} /> {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="mb-6 w-full p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center font-bold text-sm animate-in fade-in">
                {errorMessage}
              </div>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUploadFoto}
              disabled={uploading}
            />

            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-32 h-32 mb-4 shrink-0 relative overflow-hidden rounded-full border-4 border-white shadow-xl shadow-teal-900/10 bg-slate-100 flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="animate-spin text-teal-500" size={32} />
                ) : imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Perfil" 
                    className="w-full h-full rounded-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-[#14b8a6] flex items-center justify-center text-white text-4xl font-black">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera className="text-white" size={24} />
                </div>
              </div>
              
              <div className="absolute bottom-4 right-0 bg-teal-500 p-2 rounded-full shadow-md text-white border-2 border-white group-hover:scale-110 transition-transform">
                <Camera size={16} />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{user?.nome}</h2>
            <div className="flex items-center gap-2 text-slate-400 font-medium mt-1">
              <Mail size={14} />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <div className="w-10 h-10 bg-teal-50 text-[#14b8a6] rounded-full flex items-center justify-center mx-auto mb-3">
                <Dog size={20} />
              </div>
              <span className="block text-2xl font-black text-slate-800">{totalAnimais}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pets Registados</span>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar size={20} />
              </div>
              <span className="block text-sm font-black text-slate-800 leading-tight">
                {user?.data_registo ? new Date(user.data_registo).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) : '---'}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro desde</span>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-6 py-4 bg-white rounded-[2rem] shadow-sm border border-rose-50 text-rose-500 font-bold hover:bg-rose-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-rose-50 rounded-xl group-hover:bg-rose-100 transition-colors">
                  <LogOut size={20} />
                </div>
                <span>Terminar Sessão</span>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}