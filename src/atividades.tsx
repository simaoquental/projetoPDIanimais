import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './barraLateral';
import { 
  Activity, Footprints, Clock, 
  MapPin, Loader2, Trash2, Calendar, ChevronRight, Plus, Minus
} from 'lucide-react';
import { supabase } from "./supabaseClient";
import { MapContainer, TileLayer, Polyline, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
const iconInicio = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const iconFim = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});


interface Pet {
  id_animal: string;
  nome: string;
}

interface Atividade {
  id_atividade: string;
  id_animal: string;
  pet_nome: string;
  tipo: string;
  titulo: string;
  distancia_km: number;
  duracao_min: number;
  local: string;
  data_inicio: string;
  rota: any;
}

function ChangeView({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 18 });
    }
  }, [bounds, map]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button 
        onClick={() => map.zoomIn()}
        className="p-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-teal-600 transition-all"
      >
        <Plus size={18} />
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="p-2.5 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 text-slate-600 hover:text-teal-600 transition-all"
      >
        <Minus size={18} />
      </button>
    </div>
  );
}

export default function Atividades() {
  const navigate = useNavigate();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const sessionStr = localStorage.getItem('user');
    if (!sessionStr || sessionStr === "undefined") return navigate('/login');
    
    const user = JSON.parse(sessionStr);
    const userId = user.id_utilizador || user.id;

    try {
      const { data: ativData, error } = await supabase
        .from('atividades')
        .select(`
          *,
          animais (nome)
        `)
        .eq('id_utilizador', userId)
        .order('data_inicio', { ascending: false });

      if (error) throw error;

      const formatted = (ativData || []).map((a: any) => ({
        id_atividade: a.id_atividade,
        id_animal: a.id_animal,
        pet_nome: a.animais?.nome || 'Animal',
        tipo: a.tipo,
        titulo: a.titulo,
        distancia_km: Number(a.distancia_km) || 0,
        duracao_min: a.duracao_min || 0,
        local: a.local || 'Local não definido',
        data_inicio: a.data_inicio,
        rota: a.rota
      }));

      setAtividades(formatted);
      if (formatted.length > 0 && !selectedAtividade) {
        setSelectedAtividade(formatted[0]);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const eliminarAtividade = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('atividades').delete().eq('id_atividade', id);
      if (error) throw error;
      if (selectedAtividade?.id_atividade === id) setSelectedAtividade(null);
      fetchData();
    } catch (error: any) {
      console.error("Erro ao eliminar:", error.message);
    }
  };

  const getRoutePositions = (rota: any): [number, number][] => {
    try {
      if (!rota) return [];
      const parsed = typeof rota === 'string' ? JSON.parse(rota) : rota;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(p => p && p.latitude !== undefined && p.longitude !== undefined)
        .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]);
    } catch { return []; }
  };

  const totalKm = atividades.reduce((acc, curr) => acc + curr.distancia_km, 0);
  const totalMin = atividades.reduce((acc, curr) => acc + curr.duracao_min, 0);
  
  const selectedPositions = selectedAtividade ? getRoutePositions(selectedAtividade.rota) : [];
  const bounds = selectedPositions.length > 0 ? L.latLngBounds(selectedPositions) : null;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-6 pt-16 lg:pt-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registos das Atividades</h1>
          <p className="text-xs font-bold text-slate-400">Consulta o histórico de exercício físico dos teus animais.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-[300px] md:h-[400px] relative isolate">
            {selectedPositions.length > 1 ? (
              <MapContainer style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} zoomControl={false}>
                <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" />
                <Polyline positions={selectedPositions} color="#0d9488" weight={7} opacity={1} />
                <Marker position={selectedPositions[0]} icon={iconInicio} />
                <Marker position={selectedPositions[selectedPositions.length - 1]} icon={iconFim} />
                <ChangeView bounds={bounds} />
                <ZoomControls />
              </MapContainer>
            ) : (
              <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-3">
                <MapPin size={48} className="text-slate-200" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Seleciona um percurso no histórico</p>
              </div>
            )}
            
            {selectedAtividade && (
              <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-4 rounded-[1.5rem] shadow-xl border border-white max-w-[240px] animate-in fade-in slide-in-from-left-4 duration-300">
                 <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1">Rota Ativa</p>
                 <h3 className="text-base font-black text-slate-800 leading-tight mb-0.5">{selectedAtividade.titulo}</h3>
                 <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                   {selectedAtividade.pet_nome}
                 </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <Clock className="text-indigo-500 mb-3" size={24} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo Total Ativo</p>
              <p className="text-xl font-black text-slate-800 mt-1">
                {Math.floor(totalMin / 60)}h {totalMin % 60}m
              </p>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <Activity className="text-teal-500 mb-3" size={24} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atividades</p>
              <p className="text-xl font-black text-slate-800 mt-1">{atividades.length} percursos</p>
            </div>
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm">
              <Footprints className="text-rose-500 mb-3" size={24} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distância Total</p>
              <p className="text-xl font-black text-slate-800 mt-1">{totalKm.toFixed(2)} km</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-teal-500" /> Histórico de Passeios
            </h2>
            
            {loading ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p className="font-bold">A carregar atividades...</p>
              </div>
            ) : atividades.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
                <p className="text-slate-400 font-bold text-lg">Ainda não existem atividades registadas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {atividades.map((ativ) => (
                  <div 
                    key={ativ.id_atividade} 
                    onClick={() => setSelectedAtividade(ativ)}
                    className={`group bg-white p-5 rounded-[1.5rem] border transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between gap-4 ${selectedAtividade?.id_atividade === ativ.id_atividade ? 'border-teal-500 ring-2 ring-teal-50 shadow-md' : 'border-slate-200 hover:border-teal-200 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${selectedAtividade?.id_atividade === ativ.id_atividade ? 'bg-teal-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-black text-slate-800 text-base">{ativ.titulo}</h3>
                          <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">{ativ.pet_nome}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(ativ.data_inicio).toLocaleDateString('pt-PT')}</span>
                          <span className="flex items-center gap-1 uppercase tracking-tighter"><MapPin size={12}/> {ativ.rota ? 'GPS Ativo' : ativ.local}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-800">{ativ.distancia_km.toFixed(2)} km</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Distância</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-800">{ativ.duracao_min} min</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Duração</p>
                      </div>
                      <div className="flex items-center gap-1">
                         <button onClick={(e) => eliminarAtividade(e, ativ.id_atividade)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={20} className={selectedAtividade?.id_atividade === ativ.id_atividade ? 'text-teal-600' : 'text-slate-300'} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}