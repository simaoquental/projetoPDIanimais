import { Mail, Lock, HeartPulse } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  // Função que corre quando clicas em "Entrar"
  const handleLogin = (e) => {
    e.preventDefault(); // Impede a página de recarregar
    navigate('/home'); // Leva-te para o Dashboard
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center pt-12 px-6">
      
      <div className="flex flex-col items-center mb-10 text-center">
        <div className="bg-[#14b8a6] p-4 rounded-[1.25rem] shadow-sm mb-4">
          <HeartPulse size={48} className="text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-bold text-[#134e4a] tracking-tight mb-2">PetSaúde</h1>
        <p className="text-slate-500 font-medium max-w-[300px] leading-relaxed">
          A plataforma completa para o bem-estar do seu melhor amigo.
        </p>
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm w-full max-w-[440px] border border-slate-100">
        <h2 className="text-[26px] font-bold text-[#0f172a] text-center mb-10">Aceda à sua conta</h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
            <div className="relative h-12">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Mail size={20} /></span>
              <input type="email" placeholder="ana@exemplo.com" className="w-full h-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700">Palavra-passe</label>
              <a href="#" className="text-xs font-bold text-[#14b8a6]">Esqueceu-se da palavra-passe?</a>
            </div>
            <div className="relative h-12">
              <span className="absolute inset-y-0 left-4 flex items-center text-slate-400"><Lock size={20} /></span>
              <input type="password" placeholder="••••••••" className="w-full h-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-all" />
            </div>
          </div>

          <button type="submit" className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold py-4 rounded-xl mt-4 transition-all shadow-md active:scale-95">
            Entrar
          </button>
        </form>
      </div>

      <div className="mt-8 text-slate-500 font-medium text-sm">
        Ainda não tem conta? <Link to="/registar" className="text-[#0d9488] font-bold hover:underline">Crie agora</Link>
      </div>
    </div>
  );
}