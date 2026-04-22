import React, { useEffect, useState } from 'react';
import { Bell, User, Calendar, Shirt, AlertCircle, ChevronRight, PlusCircle, Hash, MapPin, Clock, ClipboardList, Users, Settings, Edit, Pencil, Trophy, TrophyIcon, X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function Home() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  
  // -- STATI UTENTE --
  const [nome, setNome] = useState('Giocatore');
  const [userId, setUserId] = useState('');
  const [profiloIncompleto, setProfiloIncompleto] = useState(false);
  
  // -- STATI LEGA
  const [hasLega, setHasLega] = useState(true); 
  const [codiceLega, setCodiceLega] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [leagues, setLeagues] = useState<any[]>([]); // Tutte le leghe dell'utente
  const [activeLeague, setActiveLeague] = useState<any>(null); // Calcolato sulla lega attiva

  // Dati Partita
  const [actionLoading, setActionLoading] = useState(false); // Per i tasti Ci sono/Salto
  const [prossimaPartita, setProssimaPartita] = useState<any>(null);
  const [confermati, setConfermati] = useState(0);
  const [ioCiSono, setIoCiSono] = useState(false);
  const [ultimaPartita, setUltimaPartita] = useState<any>(null);

  // --- STATI LISTA CONFERMATI ---
  const [confermatiList, setConfermatiList] = useState<any[]>([]);
  const [isConfermatiModalOpen, setIsConfermatiModalOpen] = useState(false);
  
  // CARICAMENTO INIZIALE
  useEffect(() => {
    caricaUtenteELeghe();
  }, [navigate]);
  
  useEffect(() => {
    if (activeLeague && userId) {
      caricaPartiteLega(activeLeague.id);
    }
  }, [activeLeague, userId]);

// --- CARICA UTENTE E LEGHE ---
  const caricaUtenteELeghe = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/');
      return;
    }
    setUserId(user.id);
    if (user.user_metadata?.nome_giocatore) {
      setNome(user.user_metadata.nome_giocatore);
    }

    // Controllo Profilo Completo
    const { data: giocatore } = await supabase
      .from('player')
      .select('*')
      .eq('id', user.id)
      .single();

    if (giocatore) {
      if (!giocatore.ruolo || !giocatore.piede_forte) {
        setProfiloIncompleto(true);
      }
    } else {
      setProfiloIncompleto(true);
    }

    // Recupero TUTTE le leghe (Inner Join per avere nome e manager)
    const { data: legheData } = await supabase
      .from('appartenenza_lega')
      .select(`
        lega_id,
        lega!inner ( id, nome_lega, manager1, manager2, manager3 )
      `)
      .eq('player_id', user.id);

    if (legheData && legheData.length > 0) {
      // Estraiamo l'oggetto "lega" dall'array dei risultati
      const legheFormattate = legheData.map((item: any) => item.lega);
      setLeagues(legheFormattate);
      setActiveLeague(legheFormattate[0]); // Imposta la prima come default
      setHasLega(true);
    } else {
      setHasLega(false);
      setLoading(false); // Finiamo qui se non ha leghe
    }
  };

  // --- FUNZIONE: CARICA DATI SPECIFICI DELLA LEGA ATTIVA ---
  const caricaPartiteLega = async (legaId: string) => {
    // Controllo se in QUESTA lega l'utente è un manager
    if (
      activeLeague.manager1 === userId || 
      activeLeague.manager2 === userId || 
      activeLeague.manager3 === userId
    ) {
      setIsManager(true);
    } else {
      setIsManager(false);
    }

    // Resettiamo gli stati delle partite prima di caricare i nuovi
    setProssimaPartita(null);
    setUltimaPartita(null);
    setConfermati(0);
    setIoCiSono(false);

    // Recupero Prossima Partita
    const { data: partita } = await supabase
      .from('partita')
      .select('*')
      .eq('lega_id', legaId)
      .gte('giorno', new Date().toISOString())
      .order('giorno', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (partita) { 
      setProssimaPartita(partita); 

      // Recupero confermati per QUESTA partita
      const { data: partecipazioni } = await supabase
        .from('partecipazione_partita')
        .select('giocatore, player(*)')
        .eq('id_partita', partita.id);
      
      if(partecipazioni) {
        const listaConfermati = partecipazioni.map((p: any) => p.player).filter(Boolean);
        setConfermatiList(listaConfermati);
        setConfermati(listaConfermati.length);
        console.log("Partecipazioni:", listaConfermati);
      }
      // Controlliamo se IO mi sono già segnato
      const miSonoSegnato = partecipazioni?.some(p => p.giocatore === userId);
      setIoCiSono(miSonoSegnato || false);
    }

    // Recupero Ultima Partita
    const { data: ultima } = await supabase
      .from('partita')
      .select('*')
      .eq('lega_id', legaId)
      .lt('giorno', new Date().toISOString())
      .order('giorno', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultima) {
      setUltimaPartita(ultima);
    }

    setLoading(false);
  };

  // --- FUNZIONE: SELEZIONA LEGA DAL MENU ---
  const handleSelectLeague = (lega: any) => {
    setLoading(true);
    setActiveLeague(lega);
    setIsSidebarOpen(false); // Chiudi il menu
  };

  // --- FUNZIONI DI GESTIONE PRESENZA PARTITA ---
  const handleConferma = async () => {
    if (!prossimaPartita || ioCiSono) return;
    setActionLoading(true);

    const { error } = await supabase
      .from('partecipazione_partita')
      .insert([{ id_partita: prossimaPartita.id, giocatore: userId }]);

    if (error) {
      alert(`Errore Database!\nCodice: ${error.code}\nMessaggio: ${error.message}`);
    } else {
      setIoCiSono(true);
      setConfermatiList(prev => [
        ...prev, 
        { id: userId, nickname: nome, ruolo: 'Giocatore' } 
      ]);
    }
    setActionLoading(false);
  };

  // Funzione per annullare la propria presenza (Salto)
  const handleSalto = async () => {
    if (!prossimaPartita || !ioCiSono) return;
    
    const confermaScelta = window.confirm("Sei sicuro di voler annullare la tua presenza?");
    if (!confermaScelta) return;

    setActionLoading(true);

    const { error } = await supabase
      .from('partecipazione_partita')
      .delete()
      .eq('id_partita', prossimaPartita.id)
      .eq('giocatore', userId); // Elimina solo la riga di questo utente per questa partita

    if (error) {
      console.error("Errore cancellazione:", error);
      alert("Errore durante l'annullamento: " + error.message);
    } else {
      setIoCiSono(false);
      setConfermatiList(prev => prev.filter(p => p.id !== userId));
    }
    
    setActionLoading(false);
  };

  // --- FUNZIONE: UNISCITI A LEGA ESISTENTE ---
  const handleJoinLega = async () => {
    // 1. Controllo che il campo non sia vuoto
    if (!codiceLega.trim()) {
      alert("Per favore, inserisci un codice lega.");
      return;
    }

    setLoading(true);

    try {
      // 2. Controllo se la lega con quell'ID esiste
      const { data: legaEsistente, error: erroreLega } = await supabase
        .from('lega')
        .select('id, nome_lega')
        .eq('codice_accesso', codiceLega.toUpperCase())
        .single();

      if (erroreLega || !legaEsistente) {
        alert("Codice errato: nessuna lega trovata con questo ID.");
        setLoading(false);
        return;
      }

      // 3. Recupero l'ID dell'utente corrente
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: playerEsistente } = await supabase
        .from('player')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!playerEsistente) {
        const { error: errorNewPlayer } = await supabase
          .from('player')
          .insert([{ id: user.id }]);
          
        if (errorNewPlayer) {
          alert("Vai prima sul tuo Profilo (in alto a sinistra) e salva i dati base per continuare!");
          setLoading(false);
          return;
        }
      }

      // 4. Inserisco la riga in appartenenza_lega
      const { error: erroreInserimento } = await supabase
        .from('appartenenza_lega')
        .insert([
          { 
            player_id: user.id, 
            lega_id: legaEsistente.id 
          }
        ]);

      if (erroreInserimento) {
        if (erroreInserimento.code === '23505') {
          alert("Sei già iscritto a questa lega!");
        } else {
          alert("Errore durante l'iscrizione: " + erroreInserimento.message);
        }
      } else {
        alert(`Benvenuto nella lega: ${legaEsistente.nome_lega}!`);
        window.location.reload(); // Ricarica per scaricare le nuove leghe
      }
    } catch (err) {
      alert("Si è verificato un errore inaspettato.");
    } finally {
      setLoading(false);
    }
  };

  // --- FUNZIONE: CREA NUOVA LEGA ---
  const handleCreateLega = async () => {
    const nomeLega = prompt("Inserisci il nome della tua nuova Lega:");
    if (!nomeLega || nomeLega.trim() === "") return alert("Il nome della lega è obbligatorio.");
    setLoading(true);
    try {
      const nuovoCodice = generaCodiceCasuale();
      const { data: nuovaLega, error: erroreLega } = await supabase
        .from('lega')
        .insert([{ nome_lega: nomeLega, manager1: userId, codice_accesso: nuovoCodice }])
        .select()
        .single();

      if (erroreLega) throw erroreLega;

      const { error: erroreAssociazione } = await supabase
        .from('appartenenza_lega')
        .insert([{ player_id: userId, lega_id: nuovaLega.id }]);

      if (erroreAssociazione) throw erroreAssociazione;

      await supabase.from('player').update({ manager: true }).eq('id', userId);

      alert(`Lega "${nomeLega}" creata!\nCodice di accesso: ${nuovoCodice}`);
      window.location.reload(); 
    } catch (error: any) {
      alert("Errore durante la creazione: " + error.message);
    } finally {
      setLoading(false);
    }
  };


  // --- FUNZIONI DI UTILITÀ ---
  // Funzione per formattare la data
  const formattaData = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  // Funzione per formattare l'ora
  const formattaOra = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };
  // Funzione per generare un codice casuale di 5 caratteri (per la lega)
  const generaCodiceCasuale = () => {
    const caratteri = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let risultato = '';
    for (let i = 0; i < 5; i++) {
      risultato += caratteri.charAt(Math.floor(Math.random() * caratteri.length));
    }
    return risultato;
  };

  if (loading && !activeLeague) return <div className="p-10 text-center font-bold text-emerald-600">Caricamento ...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* --- MODALE CONFERMATI --- */}
      {isConfermatiModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 pt-[max(1rem,env(safe-area-inset-top))] border-b border-gray-100 flex items-center justify-between bg-emerald-50">
              <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Giocatori Confermati
              </h3>
              <button onClick={() => setIsConfermatiModalOpen(false)} className="p-2 bg-white text-gray-500 hover:text-red-500 rounded-full shadow-sm transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2 pt-[max(1rem,env(safe-area-inset-top))] overflow-y-auto flex-1">
              {confermatiList.length === 0 ? (
                <div className="text-center p-10 text-gray-400">
                  <p>Nessuno si è ancora segnato.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {confermatiList.map((giocatore, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center text-sm">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{giocatore.nickname || 'Giocatore'}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{giocatore.ruolo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY SCURO SIDEBAR --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MENU LATERALE (SIDEBAR) --- */}
      <aside 
        className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] border-b border-emerald-700 flex items-center justify-between bg-emerald-600 text-white">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5" />
            <span className="font-bold text-lg">Le tue Leghe</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-emerald-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {leagues.map((lega) => (
            <button
              key={lega.id}
              onClick={() => handleSelectLeague(lega)}
              className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all ${
                activeLeague?.id === lega.id 
                  ? 'bg-emerald-50 border-emerald-200 border text-emerald-800 font-bold' 
                  : 'bg-white border-gray-100 border hover:bg-gray-50 text-gray-700 font-medium'
              }`}
            >
              <span className="truncate pr-2">{lega.nome_lega}</span>
              {activeLeague?.id === lega.id && <ChevronRight className="w-5 h-5 text-emerald-600 shrink-0" />}
            </button>
          ))}
          
          <div className="pt-6 mt-6 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Gestione</p>
            <button onClick={() => { setIsSidebarOpen(false); setHasLega(false); }} className="w-full flex items-center gap-2 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded-lg">
              <PlusCircle className="w-4 h-4" /> Unisciti / Crea Nuova Lega
            </button>
          </div>
        </div>
      </aside>
      
      {/* --- HEADER PRINCIPALE --- */}
      <header className="flex justify-between items-center p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Tasto Menu (Hamburger) */}
          {hasLega && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-gray-50 rounded-full hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}
          
          <div onClick={() => navigate('/profilo')} className="flex items-center gap-2 cursor-pointer group">
            <div className="bg-gray-100 rounded-full p-1 group-hover:bg-emerald-50 transition-colors">
              <User className="text-gray-400 w-8 h-8 group-hover:text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 leading-tight">
                Ciao, {nome}!
              </h1>
              {/* Mostriamo il nome della lega sotto il saluto */}
              {activeLeague && hasLega && (
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest truncate max-w-[140px] bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                  {activeLeague.nome_lega}
                </p>
              )}
            </div>
          </div>
        </div>

        {hasLega && (
          <button 
            onClick={() => navigate('/classifica')}
            className="relative p-3 bg-amber-50 text-amber-500 rounded-full hover:bg-amber-100 transition-colors shadow-sm active:scale-95"
          >
            <Trophy className="w-6 h-6" />
          </button>
        )}
      </header>

      <main className="p-4 space-y-6">

        {loading && activeLeague && (
           <div className="absolute inset-0 bg-gray-50/50 z-10 flex items-center justify-center">
             <div className="animate-pulse bg-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">Aggiornamento...</div>
           </div>
        )}
        
        {profiloIncompleto && (
          <div 
            onClick={() => navigate('/profilo')} 
            className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="text-sm font-bold text-orange-800">Profilo Incompleto</h3>
                <p className="text-xs text-orange-600">Mancano alcuni dati tecnici.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-orange-400" />
          </div>
        )}

        {!hasLega ? (
          <div className="pt-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center space-y-6 shadow-sm">
              <div className="bg-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Hash className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-black">Unisciti a una Lega</h3>
                <p className="text-sm text-gray-500 px-4 mt-2">
                  Inserisci il codice ID della lega per visualizzare partite e statistiche.
                </p>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={codiceLega}
                  onChange={(e) => setCodiceLega(e.target.value)}
                  placeholder="Incolla codice qui..." 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono"
                />
                <button 
                  onClick={handleJoinLega}
                  className="w-full bg-emerald-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                >
                  Invia Codice
                </button>
              </div>
            </div>



            {/* Divisore  */}
            <div className="flex items-center gap-4 px-10">
              <div className="h-[1px] bg-gray-200 flex-1"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Oppure</span>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>

            {/* Card Secondaria: Crea Lega */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <PlusCircle className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Sei un organizzatore?</h4>
                  <p className="text-[11px] text-gray-500">Crea la tua lega e invita amici</p>
                </div>
              </div>
              <button 
                onClick={handleCreateLega}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
              >
                Crea ora
              </button>
            </div>
            {leagues.length > 0 && (
              <button onClick={() => setHasLega(true)} className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-gray-600">
                Torna indietro
              </button>
            )}
          </div>
        ) : (
          <>
            {/* --- DASHBOARD DELLA LEGA ATTIVA --- */}
            {isManager && (
              <div 
                onClick={() => navigate('/crea-partita')}
                className="bg-emerald-600 p-5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-95 transition-all"
              >
                <div className="text-white">
                  <h3 className="text-lg font-black tracking-tight">Organizza Match</h3>
                  <p className="text-emerald-100 text-sm opacity-90">Nuova sfida per il gruppo</p>
                </div>
                <PlusCircle className="w-8 h-8 text-white" />
              </div>
            )}

            {/* BLOCCO PROSSIMA PARTITA */}
            {prossimaPartita ? (
              <div className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    {/* Tasto Modifica Rapida per il Manager */}
                    {isManager && (
                      <button 
                        onClick={() => navigate(`/modifica-partita/${prossimaPartita.id}`)}
                        className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 hover:text-blue-500 rounded-full transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">
                      {formattaData(prossimaPartita.giorno)}
                    </span>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" /> {formattaOra(prossimaPartita.giorno)}
                    </h2>
                    <p className="text-gray-500 font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {prossimaPartita.luogo}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <Calendar className="text-emerald-500 w-6 h-6" />
                  </div>
                </div>

                <div className="flex items-center justify-around py-2 border-y border-gray-50">
                   <div className="text-center">
                      <Shirt className="text-blue-500 w-6 h-6 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{prossimaPartita.nome_squadra1}</span>
                   </div>
                   <span className="text-gray-300 font-black italic">VS</span>
                   <div className="text-center">
                      <Shirt className="text-red-500 w-6 h-6 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{prossimaPartita.nome_squadra2}</span>
                   </div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-sm text-gray-500 font-small uppercase tracking-wider">Stato</span>
                  {/* --- BADGE CONFERMATI CLICCABILE --- */}
                  <button 
                    onClick={() => setIsConfermatiModalOpen(true)}
                    className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors active:scale-95 cursor-pointer border border-emerald-100"
                  >
                    <Users className="w-4 h-4" /> {confermatiList.length} Confermati
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  {/* BOTTONE CI SONO */}
                  <button 
                    onClick={handleConferma}
                    disabled={ioCiSono || actionLoading}
                    className={`flex-1 font-bold py-3 rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 
                      ${ioCiSono 
                        ? 'bg-emerald-100 text-emerald-600 cursor-default' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-50'}`}
                  >
                    {ioCiSono ? 'Confermato' : 'Ci sono'}
                  </button>

                  {/* BOTTONE SALTO */}
                  <button 
                    onClick={handleSalto}
                    disabled={!ioCiSono || actionLoading}
                    className={`flex-1 font-bold py-3 rounded-xl transition-all active:scale-95
                      ${!ioCiSono 
                        ? 'bg-gray-100 text-gray-400 cursor-default' 
                        : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                  >
                    Salto
                  </button>
                </div>

                
                {/* SEZIONE FORMAZIONE (Dinamica per Manager e Giocatori) */}
                <div className="pt-2 flex gap-3">
                  {/* Il Manager vede sempre il tasto "Imposta" */}
                  {isManager && (
                    <button 
                      onClick={() => navigate(`/imposta-formazione/${prossimaPartita.id}`)}
                      className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all active:scale-95 flex justify-center items-center gap-2 shadow-sm text-sm"
                    >
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                      Imposta
                    </button>
                  )}

                  {/* Il Manager vede "Visualizza" accanto a "Imposta" */}
                  {/* Il Giocatore lo vede solo se ha confermato la presenza (ioCiSono) */}
                  {(isManager || ioCiSono) && (
                    <button 
                      onClick={() => navigate(`/visualizza-formazione/${prossimaPartita.id}`)}
                      className={`flex-1 font-bold py-3 rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 text-sm
                        ${isManager 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' // Stile secondario per il manager
                          : 'bg-blue-600 text-white shadow-lg shadow-blue-100' // Stile primario per il giocatore
                        }`}
                    >
                      <Users className="w-4 h-4" />
                      Visualizza
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-3xl border border-gray-100 text-center">
                <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Nessuna partita in programma.</p>
              </div>
            )}
            {/* FINE BLOCCO PROSSIMA PARTITA */}

            {/* SEZIONE ULTIMA PARTITA */}
            {ultimaPartita && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Ultima Partita
                  </h3>
                  <button 
                    onClick={() => navigate('/lista-partite')}
                    className="text-[11px] font-black text-blue-500 hover:text-blue-600 flex items-center gap-1 uppercase tracking-tighter"
                  >
                    Vedi tutte
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">
                      {new Date(ultimaPartita.giorno).toLocaleDateString('it-IT', { day: '2-digit', month: 'long' })}
                    </span>
                    <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                      Conclusa
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Squadra 1 */}
                    <div className="flex-1 flex flex-col items-center gap-1 text-center">
                      <div className="w-10 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center text-lg">
                        ⚪
                      </div>
                      <span className="text-xs font-black text-gray-800 truncate w-full">
                        {ultimaPartita.nome_squadra1}
                      </span>
                    </div>

                    {/* Risultato */}
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <span>{ultimaPartita.risultato_squadra1 ?? '-'}</span>
                        <span className="text-gray-300 text-sm">:</span>
                        <span>{ultimaPartita.risultato_squadra2 ?? '-'}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/visualizza-formazione/${ultimaPartita.id}`)}
                        className="text-[10px] font-bold text-blue-500 mt-2 hover:underline"
                      >
                        Vedi Formazioni
                      </button>
                      {isManager && (
                        <button 
                          onClick={() => navigate(`/inserisci-risultato/${ultimaPartita.id}`)}
                          className="text-[10px] font-bold text-amber-600 hover:underline border-l border-gray-200 pl-3"
                        >
                          Modifica Pagelle
                        </button>
                      )}
                    </div>

                    {/* Squadra 2 */}
                    <div className="flex-1 flex flex-col items-center gap-1 text-center">
                      <div className="w-10 h-10 bg-red-50 rounded-full border border-red-100 flex items-center justify-center text-lg">
                        🔴
                      </div>
                      <span className="text-xs font-black text-gray-800 truncate w-full">
                        {ultimaPartita.nome_squadra2}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}