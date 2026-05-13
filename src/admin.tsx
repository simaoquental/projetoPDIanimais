import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import {
  ShieldAlert, Users, Building2,
  Trash2, Loader2, Plus, X, LogOut, Shield, ShieldOff,
  LayoutDashboard, Edit3, MapPin, Phone,
  PawPrint, TrendingUp, Clock
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'assoc'>('stats');

  const [stats, setStats] = useState({ totalUsers: 0, totalAssoc: 0, totalAnimais: 0 });
  const [listaUsers, setListaUsers] = useState<any[]>([]);
  const [listaAssoc, setListaAssoc] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '', descricao: '', morada: '', cidade: '',
    distrito: '', codigo_postal: '', telefone: '', email: '', website: ''
  });

  useEffect(() => {
    verificarAcesso();
  }, []);

  const verificarAcesso = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { data: perfil } = await supabase
        .from('utilizadores')
        .select('is_admin')
        .eq('id_utilizador', user.id)
        .single();

      if (user.email === 'admin@admin.com' || perfil?.is_admin) {
        setIsAdmin(true);
        if (user.email === 'admin@admin.com') setIsMasterAdmin(true);
        carregarDados();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      navigate('/login');
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [uRes, aRes, animRes] = await Promise.all([
        supabase.from('utilizadores').select('*').order('data_registo', { ascending: false }),
        supabase.from('associacoes_adocao').select('*').order('data_criacao', { ascending: false }),
        supabase.from('animais').select('id_animal, id_utilizador')
      ]);

      const users = uRes.data || [];
      const animais = animRes.data || [];
      const usersComAnimais = users.map(u => ({
        ...u,
        totalAnimais: animais.filter((a: any) => a.id_utilizador === u.id_utilizador).length
      }));
      setListaUsers(usersComAnimais);
      setRecentUsers(usersComAnimais.slice(0, 5));
      setListaAssoc(aRes.data || []);

      setStats({
        totalUsers: users.length,
        totalAssoc: aRes.data?.length || 0,
        totalAnimais: animRes.data?.length || 0
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (u: any) => {
    if (u.email === 'admin@admin.com') return;
    const novoValor = !u.is_admin;
    const { error } = await supabase.from('utilizadores').update({ is_admin: novoValor }).eq('id_utilizador', u.id_utilizador);
    if (error) console.error('Erro ao atualizar permissões:', error.message);
    else carregarDados();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  };

  const eliminarEntidade = async (tabela: string, idCampo: string, id: string) => {
    const msg = tabela === 'utilizadores'
      ? "Atenção: Isto apagará a conta de login e o perfil permanentemente. Continuar?"
      : "Deseja eliminar este registo permanentemente?";

    const { error } = await supabase.from(tabela).delete().eq(idCampo, id);
    if (!error) carregarDados();
  };

  const handleGuardarAssoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await supabase.from('associacoes_adocao').update(form).eq('id_associacao', editingId);
      } else {
        await supabase.from('associacoes_adocao').insert([{ ...form, aprovado: true }]);
      }
      fecharModal();
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao guardar:", error.message);
    }
  };

  const abrirEditar = (assoc: any) => {
    setEditingId(assoc.id_associacao);
    setForm({
      nome: assoc.nome || '',
      descricao: assoc.descricao || '',
      morada: assoc.morada || '',
      cidade: assoc.cidade || '',
      distrito: assoc.distrito || '',
      codigo_postal: assoc.codigo_postal || '',
      telefone: assoc.telefone || '',
      email: assoc.email || '',
      website: assoc.website || ''
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ nome: '', descricao: '', morada: '', cidade: '', distrito: '', codigo_postal: '', telefone: '', email: '', website: '' });
  };

  if (!isAdmin || loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
      <div className="text-center">
        <Loader2 className="animate-spin text-teal-400 mb-4 mx-auto" size={48} />
        <p className="text-white/50 text-xs font-black uppercase tracking-[0.2em]">Autenticando Administrador...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-slate-900">
      <nav className="bg-[#0f172a] text-white px-8 py-6 shadow-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={handleLogout} className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 transition-all border border-rose-500/20">
              <LogOut size={14} /> Sair
            </button>
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <ShieldAlert className="text-teal-400" size={24} />
              <h1 className="text-lg font-black uppercase tracking-tighter">PawLife <span className="text-teal-400">Admin</span></h1>
            </div>
          </div>

          {activeTab === 'assoc' && (
            <button onClick={() => setShowModal(true)} className="bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg active:scale-95 uppercase text-[10px]">
              <Plus size={18} /> Nova Associação
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 mt-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <button onClick={() => setActiveTab('stats')} className={`p-6 rounded-[2.5rem] border transition-all text-left group ${activeTab === 'stats' ? 'bg-[#0f172a] text-white border-transparent shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
            <LayoutDashboard className={activeTab === 'stats' ? 'text-teal-400' : 'text-slate-300'} size={24} />
            <p className={`text-[9px] font-black uppercase tracking-widest mt-4 ${activeTab === 'stats' ? 'text-white/40' : 'text-slate-400'}`}>Geral</p>
            <h3 className="text-xl font-black mt-1">Dashboard</h3>
          </button>

          <button onClick={() => setActiveTab('users')} className={`p-6 rounded-[2.5rem] border transition-all text-left group ${activeTab === 'users' ? 'bg-blue-600 text-white border-transparent shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
            <Users className={activeTab === 'users' ? 'text-white' : 'text-blue-400'} size={24} />
            <p className={`text-[9px] font-black uppercase tracking-widest mt-4 ${activeTab === 'users' ? 'text-white/40' : 'text-slate-400'}`}>Comunidade</p>
            <h3 className="text-xl font-black mt-1">{stats.totalUsers} Utilizadores</h3>
          </button>

          <button onClick={() => setActiveTab('assoc')} className={`p-6 rounded-[2.5rem] border transition-all text-left group ${activeTab === 'assoc' ? 'bg-emerald-600 text-white border-transparent shadow-2xl' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
            <Building2 className={activeTab === 'assoc' ? 'text-white' : 'text-emerald-400'} size={24} />
            <p className={`text-[9px] font-black uppercase tracking-widest mt-4 ${activeTab === 'assoc' ? 'text-white/40' : 'text-slate-400'}`}>Parceiros</p>
            <h3 className="text-xl font-black mt-1">{stats.totalAssoc} Associações</h3>
          </button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10 min-h-[500px]">

          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase tracking-tighter">Visão Geral da Plataforma</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-blue-50 rounded-[2rem] p-7 flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Users size={26} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Utilizadores</p>
                    <p className="text-3xl font-black text-blue-700 mt-1">{stats.totalUsers}</p>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-[2rem] p-7 flex items-center gap-5">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Building2 size={26} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Associações</p>
                    <p className="text-3xl font-black text-emerald-700 mt-1">{stats.totalAssoc}</p>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-[2rem] p-7 flex items-center gap-5">
                  <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0">
                    <PawPrint size={26} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Animais Registados</p>
                    <p className="text-3xl font-black text-orange-700 mt-1">{stats.totalAnimais}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Clock size={14} /> Últimos Utilizadores Registados
                </h3>
                <div className="space-y-3">
                  {recentUsers.length === 0 && (
                    <p className="text-slate-300 font-black uppercase text-xs text-center py-10">Sem utilizadores</p>
                  )}
                  {recentUsers.map(u => (
                    <div key={u.id_utilizador} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-black text-blue-500 text-sm">
                          {u.nome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-sm">{u.nome || 'Sem nome'}</p>
                          <p className="text-xs font-bold text-slate-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-orange-50 text-orange-500 px-4 py-2 rounded-xl min-w-[60px] justify-center">
                          <PawPrint size={13} />
                          <span className="text-sm font-black">{u.totalAnimais ?? 0}</span>
                        </div>
                        {u.data_registo && (
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {new Date(u.data_registo).toLocaleDateString('pt-PT')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b-2 border-slate-50">
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Utilizador</th>
                    <th className="pb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Email</th>
                    <th className="pb-6 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Admin</th>
                    <th className="pb-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listaUsers.map(u => (
                    <tr key={u.id_utilizador} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-6 font-black text-slate-700 uppercase text-sm">{u.nome || 'N/A'}</td>
                      <td className="py-6 text-slate-400 font-bold text-xs">{u.email}</td>
                      <td className="py-6 text-center">
                        {isMasterAdmin && u.email !== 'admin@admin.com' && (
                          <button
                            onClick={() => toggleAdmin(u)}
                            title={u.is_admin ? 'Remover permissão admin' : 'Dar permissão admin'}
                            className={`p-3 rounded-2xl transition-all ${u.is_admin ? 'text-teal-600 bg-teal-50 hover:bg-rose-50 hover:text-rose-500' : 'text-slate-400 hover:bg-teal-50 hover:text-teal-500'}`}
                          >
                            {u.is_admin ? <Shield size={18} /> : <ShieldOff size={18} />}
                          </button>
                        )}
                      </td>
                      <td className="py-6 text-right">
                        <button onClick={() => eliminarEntidade('utilizadores', 'id_utilizador', u.id_utilizador)} className="p-3 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {listaUsers.length === 0 && <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase text-xs">Sem utilizadores</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'assoc' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listaAssoc.map(a => (
                <div key={a.id_associacao} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm font-black text-2xl text-emerald-500">{a.nome?.[0]}</div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{a.nome}</h4>
                      <div className="flex gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase"><MapPin size={12} /> {a.cidade}</span>
                        <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase"><Phone size={12} /> {a.telefone || '---'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => abrirEditar(a)} className="p-3 text-blue-500 bg-white hover:bg-blue-500 hover:text-white rounded-2xl shadow-sm transition-all"><Edit3 size={20} /></button>
                    <button onClick={() => eliminarEntidade('associacoes_adocao', 'id_associacao', a.id_associacao)} className="p-3 text-rose-500 bg-white hover:bg-rose-500 hover:text-white rounded-2xl shadow-sm transition-all"><Trash2 size={20} /></button>
                  </div>
                </div>
              ))}
              {listaAssoc.length === 0 && <div className="col-span-2 py-20 text-center text-slate-300 font-black uppercase text-xs">Nenhuma associação</div>}
            </div>
          )}

        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <button onClick={fecharModal} className="absolute top-10 right-10 text-slate-300 hover:text-slate-900 transition-colors"><X size={32} /></button>
            <h2 className="text-3xl font-black text-slate-800 mb-8 uppercase tracking-tighter">{editingId ? 'Editar' : 'Registar'} Associação</h2>

            <form onSubmit={handleGuardarAssoc} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome Institucional</label>
                <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-teal-500/20 outline-none" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição Breve</label>
                <textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Cidade</label>
                <input required value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Distrito</label>
                <input value={form.distrito} onChange={e => setForm({ ...form, distrito: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Telefone</label>
                <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Website</label>
                <input type="url" placeholder="https://..." value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="w-full mt-2 bg-slate-50 border-none rounded-2xl p-4 font-bold outline-none" />
              </div>

              <div className="md:col-span-2 pt-6">
                <button type="submit" className="w-full bg-[#0f172a] text-white font-black py-5 rounded-2xl hover:bg-teal-500 transition-all shadow-xl uppercase tracking-widest text-xs">
                  {editingId ? 'Confirmar Alterações' : 'Finalizar Registo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}