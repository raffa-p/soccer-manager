import React, { useEffect, useState } from 'react';
import { Bell, User, Calendar, Shirt, AlertCircle, ChevronRight, PlusCircle, Hash, MapPin, Clock, ClipboardList, Users, Settings, Edit, Pencil, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function Home() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('Giocatore');
  const [isManager, setIsManager] = useState(false);
  const [profiloIncompleto, setProfiloIncompleto] = useState(false);
  const [hasLega, setHasLega] = useState(true); 
  const [loading, setLoading] = useState(true);
  const [codiceLega, setCodiceLega] = useState('');
  const [userId, setUserId] = useState('');
  // Dati Partita
  const [actionLoading, setActionLoading] = useState(false); // Per i tasti Ci sono/Salto
  const [prossimaPartita, setProssimaPartita] = useState<any>(null);
  const [confermati, setConfermati] = useState(0);
  const [ioCiSono, setIoCiSono] = useState(false);

  const [ultimaPartita, setUltimaPartita] = useState<any>(null);

  
const controllaStato = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    navigate('/');
    return;
  }
  setUserId(user.id);
  if (user.user_metadata?.nome_giocatore) {
    setNome(user.user_metadata.nome_giocatore);
  }

  // 1. Dati Player
  const { data: giocatore } = await supabase
    .from('player')
    .select('*')
    .eq('id', user.id)
    .single();

  if (giocatore) {
    setIsManager(giocatore.manager);
    if (!giocatore.ruolo || !giocatore.piede_forte) {
      setProfiloIncompleto(true);
    }
  } else {
    setProfiloIncompleto(true);
  }

  // 2. Controllo Leghe
  const { data: leghe } = await supabase
    .from('appartenenza_lega')
    .select('lega_id')
    .eq('player_id', user.id);

  setHasLega((leghe?.length ?? 0) > 0);
  
  let legaId: any;
  if (leghe && leghe.length > 0) {
    legaId = leghe[0].lega_id;
  }

  // 3. Recupero la partita più vicina nel futuro
  if (legaId) {
    const { data: partita } = await supabase
      .from('partita')
      .select('*')
      .eq('lega_id', legaId)
      .gte('giorno', new Date().toISOString()) // Solo partite da oggi in poi
      .order('giorno', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (partita) { setProssimaPartita(partita); }

    // 4. Calcoliamo i confermati per questa partita
      const { count, data: partecipazioni } = await supabase
        .from('partecipazione_partita')
        .select('giocatore', { count: 'exact' })
        .eq('id_partita', partita.id);
        
      if (count !== null) setConfermati(count);

      // 5. Controlliamo se IO mi sono già segnato
      const miSonoSegnato = partecipazioni?.some(p => p.giocatore === user.id);
      setIoCiSono(miSonoSegnato || false);


      const { data: ultima } = await supabase
        .from('partita')
        .select('*')
        .eq('lega_id', legaId)
        .lt('giorno', new Date().toISOString()) // Data < Oggi
        .order('giorno', { ascending: false })   // La più recente per prima
        .limit(1)
        .maybeSingle();

      if (ultima) {
        setUltimaPartita(ultima);
      }
  }


  setLoading(false);
};

useEffect(() => {
  controllaStato();
}, [navigate]);

const handleConferma = async () => {
    if (!prossimaPartita || ioCiSono) return;
    setActionLoading(true);

    // Stampiamo in console i dati che stiamo per inviare
    console.log("Provo a inserire:", { id_partita: prossimaPartita.id, giocatore: userId });

    const { error } = await supabase
      .from('partecipazione_partita')
      .insert([{ id_partita: prossimaPartita.id, giocatore: userId }]);

    if (error) {
      // 🚨 ECCO LA MAGIA: Ora vediamo ESATTAMENTE perché Postgres si arrabbia
      console.error("ERRORE DATABASE COMPLETO:", error);
      alert(`Errore Database!\nCodice: ${error.code}\nMessaggio: ${error.message}`);
    } else {
      setIoCiSono(true);
      setConfermati(prev => prev + 1);
    }
    setActionLoading(false);
  };

  const handleSalto = async () => {
  // Se non c'è una partita o se l'utente non è già tra i confermati, non fare nulla
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
    // Aggiornamento ottimistico della UI
    setIoCiSono(false);
    setConfermati(prev => Math.max(0, prev - 1)); // Evitiamo numeri negativi per sicurezza
  }
  
  setActionLoading(false);
};
  // Funzione per formattare la data (es: "Giovedì 23 Maggio")
  const formattaData = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Funzione per l'ora (es: "21:00")
  const formattaOra = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

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
      // Se è nuovo di zecca, gli creiamo una riga "vuota" in player
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
      setHasLega(true); // Aggiorna la UI e mostra il contenuto della home
    }

  } catch (err) {
    alert("Si è verificato un errore inaspettato.");
  } finally {
    setLoading(false);
  }
};

const generaCodiceCasuale = () => {
  const caratteri = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let risultato = '';
  for (let i = 0; i < 5; i++) {
    risultato += caratteri.charAt(Math.floor(Math.random() * caratteri.length));
  }
  return risultato;
};
const handleCreateLega = async () => {
  const nomeLega = prompt("Inserisci il nome della tua nuova Lega:");
  
  if (!nomeLega || nomeLega.trim() === "") {
    alert("Il nome della lega è obbligatorio.");
    return;
  }

  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generiamo un codice e proviamo a inserire
    const nuovoCodice = generaCodiceCasuale();

    // 1. Inseriamo la nuova lega
    const { data: nuovaLega, error: erroreLega } = await supabase
      .from('lega')
      .insert([
        { 
          nome_lega: nomeLega, 
          manager1: user.id,
          codice_accesso: nuovoCodice 
        }
      ])
      .select()
      .single();

    if (erroreLega) throw erroreLega;

    // 2. Associamo automaticamente il creatore alla lega appena creata
    const { error: erroreAssociazione } = await supabase
      .from('appartenenza_lega')
      .insert([
        { 
          player_id: user.id, 
          lega_id: nuovaLega.id 
        }
      ]);

    if (erroreAssociazione) throw erroreAssociazione;

    // 3. Aggiorniamo il player per farlo diventare manager (se non lo è già)
    await supabase
      .from('player')
      .update({ manager: true })
      .eq('id', user.id);

    alert(`Lega "${nomeLega}" creata con successo!\nIl tuo codice di accesso è: ${nuovoCodice}`);
    
    // Ricarichiamo la pagina per mostrare la home attiva
    window.location.reload(); 

  } catch (error: any) {
    // Se il codice casuale dovesse già esistere (raro), chiediamo di riprovare
    if (error.code === '23505') {
      alert("Errore di generazione codice univoco. Riprova.");
    } else {
      alert("Errore durante la creazione: " + error.message);
    }
  } finally {
    setLoading(false);
  }
};

  if (loading) return <div className="p-10 text-center font-bold text-gray-400">Caricamento...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      <header className="flex justify-between items-center p-5 bg-white shadow-sm sticky top-0 z-10">
        <div onClick={() => navigate('/profilo')} className="flex items-center gap-3 cursor-pointer group">
          <div className="bg-gray-100 rounded-full p-1 group-hover:bg-emerald-50 transition-colors">
            <User className="text-gray-400 w-8 h-8 group-hover:text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 group-hover:text-emerald-600">
            Ciao, {nome}!
          </h1>
        </div>
        {/* TASTO CLASSIFICA */}
        <button 
          onClick={() => navigate('/classifica')}
          className="relative p-3 bg-amber-50 text-amber-500 rounded-full hover:bg-amber-100 transition-colors shadow-sm active:scale-95"
        >
          <Trophy className="w-6 h-6" />
        </button>
        {/* <Bell className="text-emerald-500 w-6 h-6 cursor-pointer" /> */}
      </header>

      <main className="p-4 space-y-6">
        
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
          </div>
        ) : (
          <>
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
                        <Pencil className="w-4 h-4" /> {/* Oppure l'icona Edit/Pencil */}
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
                  {/* CONTEGGIO DINAMICO CONVOCATI */}
                  <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {confermati} Confermati
                  </span>
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
                    Vedi tutte le partite
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