import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Save, Users, Shirt, UserPlus, ShieldAlert, ArrowRightLeft } from 'lucide-react';

export default function ImpostaFormazione() {
  const { id } = useParams(); // Prende l'ID della partita dall'URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [partita, setPartita] = useState<any>(null);
  const [giocatori, setGiocatori] = useState<any[]>([]);

  useEffect(() => {
    caricaDati();
  }, [id]);

const caricaDati = async () => {
    if (!id) return;

    // 1. Carica i dettagli della partita
    const { data: partitaData } = await supabase
      .from('partita')
      .select('*')
      .eq('id', id)
      .single();

    if (partitaData) setPartita(partitaData);

    // 2. Carica i giocatori partecipanti alla partita con i loro dettagli
    const { data: partecipazioni, error } = await supabase
      .from('partecipazione_partita')
      .select(`
        id,
        squadra_giocatore,
        player (
          id,
          nickname,
          ruolo,
          livello
        )
      `)
      .eq('id_partita', id);

    if (error) {
      console.error("Errore caricamento giocatori:", error);
      alert("Errore nel caricamento: " + error.message);
    }

    if (partecipazioni) {
      // 3. MAPPATURA DEI DATI
      const formattati = partecipazioni.map((p: any) => ({
        partecipazione_id: p.id,
        player_id: p.player?.id,
        nickname: p.player?.nickname || 'Sconosciuto',
        ruolo: p.player?.ruolo || 'Non definito',
        livello: p.player?.livello || 0,
        squadra_giocatore: p.squadra_giocatore || 'Da Assegnare'
      }));
      setGiocatori(formattati);
    }
    setLoading(false);
  };

  // Funzione per spostare un giocatore
  const spostaGiocatore = (partecipazione_id: string, nuovaSquadra: string) => {
    setGiocatori(prev => 
      prev.map(g => 
        g.partecipazione_id === partecipazione_id 
          ? { ...g, squadra_giocatore: nuovaSquadra } 
          : g
      )
    );
  };

  // Funzione per salvare sul database
const salvaFormazioni = async () => {
  setSaving(true);
  
  try {
    // Unico batch di aggiornamenti per tutti i giocatori
    const aggiornamenti = giocatori.map(g => {
      const nomeSquadraDb = g.squadra_giocatore === 'Da Assegnare' ? null : g.squadra_giocatore;
      
      return supabase
        .from('partecipazione_partita')
        .update({ squadra_giocatore: nomeSquadraDb })
        .eq('id', g.partecipazione_id); 
    });

    // Esegue tutti gli aggiornamenti in parallelo
    const risultati = await Promise.all(aggiornamenti);

    const errore = risultati.find(r => r.error);
    
    if (errore) {
      console.error("Errore Supabase:", errore.error);
      alert("Errore durante il salvataggio: " + (errore.error?.message || "Errore sconosciuto"));
    } else {
      alert("Formazioni salvate con successo!");
      navigate('/home');
    }
  } catch (err) {
    console.error("Errore imprevisto:", err);
    alert("Si è verificato un errore di rete o di connessione.");
  } finally {
    setSaving(false);
  }
};

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Caricamento formazioni...</div>;
  if (!partita) return <div className="p-10 text-center text-red-500">Partita non trovata.</div>;

  // Divisione dei giocatori in base alla squadra
  const daAssegnare = giocatori.filter(g => g.squadra_giocatore === 'Da Assegnare');
  const squadra1 = giocatori.filter(g => g.squadra_giocatore === partita.nome_squadra1);
  const squadra2 = giocatori.filter(g => g.squadra_giocatore === partita.nome_squadra2);

  // Componente interno per renderizzare la singola riga del giocatore
  const PlayerRow = ({ g, tipo }: { g: any, tipo: 'da_assegnare' | 'sq1' | 'sq2' }) => (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between mb-2">
      <div>
        <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
          {g.nickname} 
          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">{g.ruolo}</span>
        </div>
        <div className="text-[10px] text-gray-400 mt-1">Livello: {g.livello}/100</div>
      </div>
      
      <div className="flex gap-1">
        {tipo !== 'sq1' && (
          <button 
            onClick={() => spostaGiocatore(g.partecipazione_id, partita.nome_squadra1)}
            className="bg-blue-50 text-blue-600 p-2 rounded-lg text-xs font-bold active:scale-95"
          >
            Sq. 1
          </button>
        )}
        {tipo !== 'da_assegnare' && (
          <button 
            onClick={() => spostaGiocatore(g.partecipazione_id, 'Da Assegnare')}
            className="bg-gray-50 text-gray-400 p-2 rounded-lg active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        )}
        {tipo !== 'sq2' && (
          <button 
            onClick={() => spostaGiocatore(g.partecipazione_id, partita.nome_squadra2)}
            className="bg-red-50 text-red-600 p-2 rounded-lg text-xs font-bold active:scale-95"
          >
            Sq. 2
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-24 font-sans">
      
      {/* Header */}
      <div className="bg-white p-5 pt-[max(1rem,env(safe-area-inset-top))] shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="p-1">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Crea Formazioni</h1>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Users className="w-3 h-3" /> {giocatori.length} Presenti
        </div>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Da Assegnare */}
        {daAssegnare.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
            <h3 className="text-sm font-bold text-orange-800 flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4" /> Da assegnare ({daAssegnare.length})
            </h3>
            {daAssegnare.map(g => <PlayerRow key={g.partecipazione_id} g={g} tipo="da_assegnare" />)}
          </div>
        )}

        {/* Squadra 1 */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-2">
            <Shirt className="w-5 h-5 text-blue-500" />
            <h3 className="font-black text-gray-800 uppercase">{partita.nome_squadra1} <span className="text-gray-400 text-sm">({squadra1.length})</span></h3>
          </div>
          <div className="space-y-2">
            {squadra1.length === 0 ? (
              <div className="text-center p-5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400">Nessun giocatore</div>
            ) : (
              squadra1.map(g => <PlayerRow key={g.partecipazione_id} g={g} tipo="sq1" />)
            )}
          </div>
        </div>

        {/* Squadra 2 */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-2">
            <Shirt className="w-5 h-5 text-red-500" />
            <h3 className="font-black text-gray-800 uppercase">{partita.nome_squadra2} <span className="text-gray-400 text-sm">({squadra2.length})</span></h3>
          </div>
          <div className="space-y-2">
            {squadra2.length === 0 ? (
              <div className="text-center p-5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400">Nessun giocatore</div>
            ) : (
              squadra2.map(g => <PlayerRow key={g.partecipazione_id} g={g} tipo="sq2" />)
            )}
          </div>
        </div>

      </div>

      {/* Button per Salvare */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent max-w-md mx-auto">
        <button 
          onClick={salvaFormazioni}
          disabled={saving || daAssegnare.length > 0}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
            daAssegnare.length > 0 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-900 text-white hover:bg-black active:scale-95 shadow-gray-300'
          }`}
        >
          {saving ? 'Salvataggio...' : (
            <>
              {daAssegnare.length > 0 ? <ShieldAlert className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {daAssegnare.length > 0 ? 'Assegna tutti prima di salvare' : 'Salva Formazioni'}
            </>
          )}
        </button>
      </div>

    </div>
  );
}