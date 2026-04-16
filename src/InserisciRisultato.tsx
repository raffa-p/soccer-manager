import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Save} from 'lucide-react';

export default function InserisciRisultato() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [partita, setPartita] = useState<any>(null);
  const [giocatori, setGiocatori] = useState<any[]>([]);

  useEffect(() => {
    caricaDati();
  }, [id]);

  // Funzione per caricare dati partita e giocatori
  const caricaDati = async () => {
    // 1. Carica dati partita
    const { data: p } = await supabase.from('partita').select('*').eq('id', id).single();
    if (p) setPartita(p);

    // 2. Carica giocatori partecipanti
    const { data: part } = await supabase
      .from('partecipazione_partita')
      .select(`id, squadra_giocatore, voto, gol_fatti, player(nickname)`)
      .eq('id_partita', id);

    // Mappa dati giocatori in un formato più comodo
    if (part) {
      setGiocatori(part.map((item: any) => ({
        id: item.id,
        nickname: item.player.nickname,
        squadra: item.squadra_giocatore,
        voto: item.voto || '',
        gol_fatti: item.gol_fatti || 0
      })));
    }
    setLoading(false);
  };

  // Funzione per salvare tutti i dati (punteggio partita + voti/gol giocatori)
  const salvaTutto = async () => {
    setSaving(true);
    // 1. Aggiorna punteggio partita
    await supabase.from('partita').update({
      risultato_squadra1: partita.risultato_squadra1,
      risultato_squadra2: partita.risultato_squadra2
    }).eq('id', id);

    // 2. Aggiorna voti e gol giocatori
    const updates = giocatori.map(g => 
      supabase.from('partecipazione_partita').update({
        voto: g.voto === '' ? null : parseFloat(g.voto),
        gol_fatti: parseInt(g.gol_fatti)
      }).eq('id', g.id)
    );

    await Promise.all(updates);
    alert("Dati salvati con successo!");
    navigate('/home');
  };

  if (loading) return <div className="p-10 text-center">Caricamento...</div>;

  // Componente per visualizzare giocatori di una squadra
  const SquadraSection = ({ nome, colore }: { nome: string, colore: string }) => (
    <div className="mb-8">
      <h3 className={`font-black uppercase mb-3 px-2 ${colore}`}>{nome}</h3>
      <div className="space-y-3">
        {giocatori.filter(g => g.squadra === nome).map((g, idx) => (
          <div key={g.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-700 flex-1">{g.nickname}</span>
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Voto</span>
                <input 
                  type="number" step="0.5" value={g.voto} 
                  onChange={e => {
                    const newG = [...giocatori];
                    newG.find(p => p.id === g.id).voto = e.target.value;
                    setGiocatori(newG);
                  }}
                  className="w-12 p-1 bg-gray-50 border rounded text-center font-bold"
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Gol</span>
                <input 
                  type="number" value={g.gol_fatti} 
                  onChange={e => {
                    const newG = [...giocatori];
                    newG.find(p => p.id === g.id).gol_fatti = e.target.value;
                    setGiocatori(newG);
                  }}
                  className="w-12 p-1 bg-gray-50 border rounded text-center font-bold"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-5 shadow-sm flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => navigate('/home')}><ArrowLeft /></button>
        <h1 className="font-bold">Pagelle e Risultato</h1>
      </div>

      <div className="p-4">
        {/* Input Risultato Finale */}
        <div className="bg-gray-900 text-white p-6 rounded-3xl mb-8 shadow-xl">
          <div className="text-center text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest">Risultato Finale</div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold truncate w-20 text-center">{partita.nome_squadra1}</span>
              <input 
                type="number" value={partita.risultato_squadra1} 
                onChange={e => setPartita({...partita, risultato_squadra1: e.target.value})}
                className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl text-3xl font-black text-center outline-none focus:bg-white/20"
              />
            </div>
            <div className="text-2xl font-black text-gray-600">:</div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold truncate w-20 text-center">{partita.nome_squadra2}</span>
              <input 
                type="number" value={partita.risultato_squadra2} 
                onChange={e => setPartita({...partita, risultato_squadra2: e.target.value})}
                className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl text-3xl font-black text-center outline-none focus:bg-white/20"
              />
            </div>
          </div>
        </div>

        <SquadraSection nome={partita.nome_squadra1} colore="text-gray-500" />
        <SquadraSection nome={partita.nome_squadra2} colore="text-red-500" />
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xs px-4">
        <button 
          onClick={salvaTutto} disabled={saving}
          className="w-full bg-green-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5" /> {saving ? 'Salvataggio...' : 'CONFERMA RISULTATI'}
        </button>
      </div>
    </div>
  );
}