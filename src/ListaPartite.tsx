import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function ListaPartite() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partite, setPartite] = useState<any[]>([]);

  useEffect(() => {
    caricaTutteLePartite();
  }, []);

  // Carica tutte le partite della lega dell'utente
  const caricaTutteLePartite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Individuazione della lega dell'utente
    const { data: leghe } = await supabase
      .from('appartenenza_lega')
      .select('lega_id')
      .eq('player_id', user.id);

    if (leghe && leghe.length > 0) {
      const legaId = leghe[0].lega_id;

      // 2. Recupero di tutte le partite della lega, ordinate dalla più recente alla più vecchia
      const { data: tutte } = await supabase
        .from('partita')
        .select('*')
        .eq('lega_id', legaId)
        .order('giorno', { ascending: false }); // Dalla più recente

      if (tutte) setPartite(tutte);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Caricamento storico...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-10 font-sans">
      <div className="bg-white p-5 shadow-sm flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate('/home')} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Storico Partite</h1>
      </div>

      <div className="p-4 space-y-4">
        {partite.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Nessuna partita registrata.</div>
        ) : (
          partite.map((p) => {
            const isFutura = new Date(p.giorno) > new Date();
            return (
              <div 
                key={p.id} 
                onClick={() => navigate(isFutura ? `/visualizza-formazione/${p.id}` : `/visualizza-formazione/${p.id}`)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                    <Calendar className="w-3 h-3" />
                    {new Date(p.giorno).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isFutura ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-600'}`}>
                    {isFutura ? 'In programma' : 'Conclusa'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex-1 text-sm font-bold text-gray-700 truncate">{p.nome_squadra1}</span>
                  <div className="px-4 flex items-center gap-2">
                    <span className="text-lg font-black text-gray-900">{p.risultato_squadra1 ?? 0}</span>
                    <span className="text-gray-300">-</span>
                    <span className="text-lg font-black text-gray-900">{p.risultato_squadra2 ?? 0}</span>
                  </div>
                  <span className="flex-1 text-sm font-bold text-gray-700 text-right truncate">{p.nome_squadra2}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}