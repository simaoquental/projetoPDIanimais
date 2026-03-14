import { Plus, Edit2, Cake, Scale, Camera, X, Search, HeartPulse, History, Filter, Dog, Cat } from "lucide-react";
import { useState } from "react";
import Sidebar from "./barraLateral";

// Interface reforçada
interface Pet {
  id: number;
  name: string;
  species: 'Cão' | 'Gato' | 'Outro';
  breed: string;
  age: string;
  weight: string;
  gender: 'Macho' | 'Fêmea';
  image: string;
  status: 'Saudável' | 'Em Tratamento' | 'Check-up em breve';
  stats: {
    vaccines: 'Em dia' | 'Pendente' | 'Atrasada';
  };
}

export default function Animais() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [filter, setFilter] = useState<'Todos' | 'Cão' | 'Gato'>('Todos');
  const [searchTerm, setSearchTerm] = useState("");

  const [pets] = useState<Pet[]>([
    {
      id: 1,
      name: "Max",
      species: "Cão",
      breed: "Golden Retriever",
      age: "3a",
      weight: "28kg",
      gender: "Macho",
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=500",
      status: "Saudável",
      stats: { vaccines: "Em dia" }
    },
    {
      id: 2,
      name: "Luna",
      species: "Gato",
      breed: "Siamês",
      age: "1a 4m",
      weight: "4.2kg",
      gender: "Fêmea",
      image: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?q=80&w=500",
      status: "Check-up em breve",
      stats: { vaccines: "Pendente" }
    },
    {
      id: 3,
      name: "Simba",
      species: "Gato",
      breed: "Persa",
      age: "5a",
      weight: "6kg",
      gender: "Macho",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500",
      status: "Saudável",
      stats: { vaccines: "Em dia" }
    }
  ]);

  const filteredPets = pets.filter(pet => 
    (filter === 'Todos' || pet.species === filter) &&
    pet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
        
        {/* Header e Ações */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Os Meus Animais</h1>
            <p className="text-slate-500 font-medium">Faça a gestão dos perfis e registos clínicos.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#14b8a6] w-full"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsRegistering(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#14b8a6] text-white rounded-xl hover:bg-[#0d9488] transition-all font-bold shadow-lg shadow-teal-500/20 active:scale-95 text-sm"
            >
              <Plus size={18} /> Adicionar Animal
            </button>
          </div>
        </div>

        {/* Barra de Filtros Rápidos */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {['Todos', 'Cão', 'Gato'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all border ${
                filter === type 
                ? 'bg-[#134e4a] text-white border-[#134e4a]' 
                : 'bg-white text-slate-400 border-slate-200 hover:border-[#14b8a6] hover:text-[#14b8a6]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Grelha Melhorada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredPets.map((pet) => (
            <div key={pet.id} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col">
              
              {/* Topo: Imagem e Badges */}
              <div className="relative h-48 overflow-hidden">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                
                {/* Badge de Status */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md border ${
                    pet.status === 'Saudável' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 'bg-amber-500/20 text-amber-100 border-amber-400/30'
                  }`}>
                    {pet.status}
                  </span>
                </div>

                <div className="absolute bottom-4 left-5">
                  <h2 className="text-2xl font-black text-white tracking-tight">{pet.name}</h2>
                  <p className="text-teal-200 text-xs font-bold">{pet.breed}</p>
                </div>

                <button className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-xl text-white border border-white/30 transition-all opacity-0 group-hover:opacity-100">
                  <Edit2 size={16} />
                </button>
              </div>

              {/* Corpo: Info e Ações */}
              <div className="p-6 space-y-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Cake size={18} className="text-amber-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Idade</p>
                      <p className="text-sm font-bold text-slate-700">{pet.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Scale size={18} className="text-blue-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Peso</p>
                      <p className="text-sm font-bold text-slate-700">{pet.weight}</p>
                    </div>
                  </div>
                </div>

                {/* Info Vacinas Rápida */}
                <div className="flex items-center justify-between px-2">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Vacinação</span>
                      <span className={`text-xs font-bold ${pet.stats.vaccines === 'Em dia' ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {pet.stats.vaccines}
                      </span>
                   </div>
                   {pet.species === 'Cão' ? <Dog className="text-slate-200" size={24} /> : <Cat className="text-slate-200" size={24} />}
                </div>

                {/* Botões de Ação na Base do Card */}
                <div className="grid grid-cols-3 gap-2 pt-2 mt-auto">
                  <button title="Saúde" className="flex items-center justify-center p-3 bg-slate-50 hover:bg-teal-50 text-slate-400 hover:text-[#14b8a6] rounded-xl transition-colors border border-slate-100">
                    <HeartPulse size={20} />
                  </button>
                  <button title="Histórico" className="flex items-center justify-center p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-colors border border-slate-100">
                    <History size={20} />
                  </button>
                  <button className="flex items-center justify-center p-3 bg-[#134e4a] text-white rounded-xl hover:bg-[#0f3d3a] transition-all font-bold text-xs col-span-1">
                    Perfil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder se não houver resultados */}
        {filteredPets.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Nenhum animal encontrado</h3>
            <p className="text-slate-500">Tente ajustar os seus filtros ou pesquisa.</p>
          </div>
        )}
      </main>
    </div>
  );
}