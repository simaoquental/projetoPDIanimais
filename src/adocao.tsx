import React, { useState, useEffect } from 'react';
import Sidebar from './barraLateral';
import { Search, MapPin, Phone, Globe, Mail, ExternalLink, Info } from 'lucide-react';
import { supabase } from "./supabaseClient";

interface Associacao {
  id_associacao: string;
  nome: string;
  descricao: string;
  morada: string;
  cidade: string;
  distrito: string;
  telefone: string;
  email: string;
  website: string;
  aprovado: boolean;
}

export default function PortalAdocao() {
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('associacoes_adocao')
        .select('*')
        .eq('aprovado', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setAssociacoes(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtradas = associacoes.filter(a => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-10 max-w-7xl mx-auto w-full">
        
        <div className="mb-10">
          <h1 className="text-[32px] font-black text-[#0f172a] tracking-tight">Associações de Adoção</h1>
          <p className="text-slate-500 font-medium">Lista oficial de abrigos e associações parceiras.</p>
        </div>

        <div className="relative mb-10">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome ou cidade..." 
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtradas.length === 0 ? (
               <div className="col-span-full text-center p-20 bg-white rounded-3xl border border-dashed border-slate-300">
                  <p className="text-slate-400 font-bold">Nenhuma associação encontrada para a sua pesquisa.</p>
               </div>
            ) : (
              filtradas.map(assoc => (
                <div key={assoc.id_associacao} className="bg-white rounded-[2rem] border border-slate-200 p-8 hover:shadow-xl transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center transition-colors group-hover:bg-teal-600 group-hover:text-white">
                      <Info size={28} />
                    </div>
                    <div className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {assoc.cidade}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">
                    {assoc.nome}
                  </h3>
                  
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 font-medium">
                    {assoc.descricao || "Sem descrição disponível."}
                  </p>
                  
                  <div className="space-y-3 mt-auto border-t border-slate-50 pt-6 text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-teal-500" /> {assoc.morada || assoc.cidade}
                    </div>
                    {assoc.telefone && (
                      <div className="flex items-center gap-3">
                        <Phone size={16} className="text-teal-500" /> {assoc.telefone}
                      </div>
                    )}
                    {assoc.email && (
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-teal-500" /> <span className="truncate">{assoc.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {assoc.website && (
                    <a 
                      href={assoc.website.startsWith('http') ? assoc.website : `https://${assoc.website}`}                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-teal-600 text-white font-black rounded-2xl hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 uppercase tracking-widest text-[10px]"
                    >
                      <Globe size={16} />Website <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}