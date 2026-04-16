import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Users, ShieldAlert, User } from 'lucide-react';

export default function VisualizzaFormazione() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [partita, setPartita] = useState<any>(null);
  const [giocatori, setGiocatori] = useState<any[]>([]);
  const [tabAttiva, setTabAttiva] = useState<1 | 2>(1);

  useEffect(() => {
    caricaDati();
  }, [id]);

  // --- FUNZIONE PER CARICARE I DATI DELLA PARTITA E DEI GIOCATORI ---
  const caricaDati = async () => {
    if (!id) return;

    const { data: partitaData } = await supabase.from('partita').select('*').eq('id', id).single();
    if (partitaData) setPartita(partitaData);

    const { data: partecipazioni } = await supabase
      .from('partecipazione_partita')
      .select(`id, squadra_giocatore, player (id, nickname, ruolo, livello), voto, gol_fatti`)
      .eq('id_partita', id);

    if (partecipazioni) {
      const formattati = partecipazioni.map((p: any) => ({
        player_id: p.player?.id,
        nickname: p.player?.nickname || 'Sconosciuto',
        ruolo: p.player?.ruolo || 'Non definito',
        livello: p.player?.livello || 0,
        squadra_giocatore: p.squadra_giocatore || 'Da Assegnare',
        voto: p.voto || '-',
        gol_fatti: p.gol_fatti || '-'
      }));
      setGiocatori(formattati);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Caricamento...</div>;
  if (!partita) return <div className="p-10 text-center text-red-500">Partita non trovata.</div>;

  // Filtro giocatori per squadra
  const squadra1 = giocatori.filter(g => g.squadra_giocatore === partita.nome_squadra1);
  const squadra2 = giocatori.filter(g => g.squadra_giocatore === partita.nome_squadra2);
  const daAssegnare = giocatori.filter(g => g.squadra_giocatore === 'Da Assegnare');
  const formazioniVuote = squadra1.length === 0 && squadra2.length === 0;

  // --- FUNZIONE PER ORGANIZZARE I GIOCATORI IN REPARTI ---
  const organizzaReparti = (squadra: any[]) => {
    return {
      attaccanti: squadra.filter(g => g.ruolo?.toUpperCase().startsWith('A')),
      centrocampisti: squadra.filter(g => g.ruolo?.toUpperCase().startsWith('C') || !g.ruolo),
      difensori: squadra.filter(g => g.ruolo?.toUpperCase().startsWith('D')),
      portieri: squadra.filter(g => g.ruolo?.toUpperCase().startsWith('P')),
    };
  };

  // --- COMPONENTE AVATAR ---
  const PlayerPin = ({ g, isColorata }: { g: any, isColorata: boolean }) => (
  <div className="flex flex-col items-center justify-center w-16 z-10 relative">
    
    {/* BADGE DEL VOTO */}
    {g.voto && (
      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-black shadow-sm z-20
        ${g.voto >= 7 ? 'bg-amber-400 text-amber-900' : 'bg-gray-800 text-white'}`}>
        {g.voto}
      </div>
    )}

    {/* AVATAR */}
    <div className={`w-10 h-10 rounded-full border-2 shadow-lg flex items-center justify-center overflow-hidden
      ${isColorata 
        ? 'bg-red-600 border-red-800 text-white' 
        : 'bg-white border-gray-300 text-gray-800'
      }`}>
      <User className="w-6 h-6" />
    </div>
    
    {/* NOME E GOL */}
    <div className="mt-1 bg-gray-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm w-full text-center truncate flex items-center justify-center gap-1">
      {g.nickname}
      {/* Icona pallone se ha segnato */}
      {g.gol_fatti > 0 && (
        <span className="text-[10px]">⚽<span className="text-[8px] ml-0.5">{g.gol_fatti > 1 ? g.gol_fatti : ''}</span></span>
      )}
    </div>
  </div>
);

  const RigaCampo = ({ giocatori, isColorata, justify = "justify-evenly" }: { giocatori: any[], isColorata: boolean, justify?: string }) => {
    if (giocatori.length === 0) return <div className="h-14" />;
    return (
      <div className={`flex ${justify} w-full px-2 my-1 z-10`}>
        {giocatori.map(g => <PlayerPin key={g.player_id} g={g} isColorata={isColorata} />)}
      </div>
    );
  };

  const SvgPitchLines = () => (
    <svg viewBox="0 0 100 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
      <rect x="5" y="5" width="90" height="140" fill="none" stroke="white" strokeWidth="0.5" />
      <line x1="5" y1="75" x2="95" y2="75" stroke="white" strokeWidth="0.5" />
      <circle cx="50" cy="75" r="12" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="22" y="5" width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="22" y="123" width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" />
      <circle cx="50" cy="75" r="0.8" fill="white" />
    </svg>
  );

  const Pitch = ({ squadra, nomeSquadra, isColorata }: { squadra: any[], nomeSquadra: string, isColorata: boolean }) => {
    const reparti = organizzaReparti(squadra);
    const modulo = `${reparti.difensori.length}-${reparti.centrocampisti.length}-${reparti.attaccanti.length}`;

    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-3 px-2">
          <h2 className={`text-xl font-black uppercase ${isColorata ? 'text-red-600' : 'text-gray-500'}`}>
            {nomeSquadra}
          </h2>
          <span className="text-xs font-bold text-gray-500 bg-gray-200 px-3 py-1 rounded-full border border-gray-300">
            {modulo !== '0-0-0' ? modulo : 'Modulo ?'}
          </span>
        </div>

        <div className="relative bg-[#2e8b57] rounded-2xl h-[530px] shadow-2xl overflow-hidden flex flex-col justify-between py-6 border-[6px] border-[#1f633d]">
          <SvgPitchLines />
          <div className="relative z-10 flex flex-col h-full justify-between pb-4">
            <RigaCampo giocatori={reparti.attaccanti} isColorata={isColorata} />
            <RigaCampo giocatori={reparti.centrocampisti} isColorata={isColorata} />
            <RigaCampo giocatori={reparti.difensori} isColorata={isColorata} />
            <RigaCampo giocatori={reparti.portieri} isColorata={isColorata} justify="justify-center" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-10 font-sans">
      <div className="bg-white p-5 shadow-sm flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="p-1 active:scale-95 transition-transform">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Formazioni</h1>
        </div>
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
          <Users className="w-3 h-3" /> {giocatori.length}
        </div>
      </div>

      <div className="p-4">
        {formazioniVuote ? (
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 font-bold">In attesa delle scelte del manager...</p>
          </div>
        ) : (
          <>
            {/* TABS PER CAMBIARE SQUADRA */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 sticky top-[72px] z-20">
              <button 
                onClick={() => setTabAttiva(1)}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tabAttiva === 1 ? 'bg-gray-100 text-gray-800 border-2 border-gray-300' : 'text-gray-400'}`}
              >
                {partita.nome_squadra1} (Bianchi)
              </button>
              <button 
                onClick={() => setTabAttiva(2)}
                className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${tabAttiva === 2 ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}
              >
                {partita.nome_squadra2} (Colorati)
              </button>
            </div>

            {tabAttiva === 1 ? (
              <Pitch squadra={squadra1} nomeSquadra={partita.nome_squadra1} isColorata={false} />
            ) : (
              <Pitch squadra={squadra2} nomeSquadra={partita.nome_squadra2} isColorata={true} />
            )}
          </>
        )}

        {/* PANCHINA */}
        {!formazioniVuote && daAssegnare.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Da assegnare ({daAssegnare.length})</h4>
            <div className="flex flex-wrap gap-2 px-2">
              {daAssegnare.map(g => (
                <span key={g.player_id} className="bg-white border border-gray-200 text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                   {g.nickname}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}