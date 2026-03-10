import Sidebar from './barraLateral';

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <main className="flex-1 p-10">
        <h1 className="text-3xl font-bold text-slate-800">Bem-vinda, Ana! 👋</h1>
        <p className="text-slate-500 mt-2">Este é o painel de controlo do seu Pet.</p>
        
        {/* Aqui podes começar a desenhar os cards do dashboard futuramente */}
        <div className="mt-8 p-6 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 text-center">
          Conteúdo do Dashboard em breve...
        </div>
      </main>
    </div>
  );
}