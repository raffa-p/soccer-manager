import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Trophy, Medal, Target } from 'lucide-react';

export default function Classifica() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classifica, setClassifica] = useState<any[]>([]);

  useEffect(() => {
    caricaClassifica();
  }, []);

  // Gestione caricamento classifica
  const caricaClassifica = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('classifica_marcatori')
      .select('*')
      .order('total_gol', { ascending: false });

    if (data) setClassifica(data);
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Calcolo statistiche...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-10">
      <div className="bg-white p-5 pt-[max(1rem,env(safe-area-inset-top))] shadow-sm flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate('/home')}><ArrowLeft /></button>
        <h1 className="text-lg font-bold">Classifica Marcatori</h1>
      </div>

      <div className="p-4 space-y-3">
        {classifica.map((p, index) => (
          <div key={p.player_id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            {/* Posizione */}
            <div className="w-8 text-center font-black text-gray-300">
              {index === 0 ? <Trophy className="text-amber-400 w-6 h-6 mx-auto" /> : 
               index === 1 ? <Medal className="text-slate-400 w-6 h-6 mx-auto" /> :
               index === 2 ? <Medal className="text-amber-700 w-6 h-6 mx-auto" /> : 
               index + 1}
            </div>

            {/* Giocatore */}
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">{p.nickname}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-bold">{p.presenze} Presenze</p>
            </div>

            {/* Statistiche */}
            <div className="text-right flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Media</span>
                <span className="text-xs font-bold text-gray-600">{p.media_gol}</span>
              </div>
              <div className="bg-blue-50 px-3 py-1 rounded-xl flex flex-col items-center min-w-[50px]">
                <Target className="w-3 h-3 text-blue-500 mb-0.5" />
                <span className="text-lg font-black text-blue-600 leading-none">{p.total_gol}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}