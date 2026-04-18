import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, UserMinus, ShieldCheck, Users, AlertTriangle, ShieldOff } from 'lucide-react';

interface Membro {
  id: string;
  username: string;
  isManager: boolean;
  managerSlot: string | null; // 'manager1', 'manager2', o 'manager3'
}

export default function EditLega() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nomeLega, setNomeLega] = useState('');
  const [codiceAccesso, setCodiceAccesso] = useState('');
  const [membri, setMembri] = useState<Membro[]>([]);
  const [managerData, setManagerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    caricaDatiLega();
  }, [id]);

  async function caricaDatiLega() {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;

      // 1. Recupera i dati della lega dalla tabella 'lega'
      const { data: lega, error: errLega } = await supabase
        .from('lega')
        .select('*')
        .eq('id', id)
        .single();

      if (errLega) throw errLega;
      setManagerData(lega);
      setNomeLega(lega.nome_lega);
      setCodiceAccesso(lega.codice_accesso);

      // Sicurezza: solo il manager1 (proprietario) può gestire queste impostazioni
      if (lega.manager1 !== user.id) {
        alert("Solo il proprietario della lega può accedere a questa pagina.");
        navigate('/profilo');
        return;
      }

      // 2. Recupera i partecipanti dalla tabella 'appartenenza_lega'
      const { data: appartenenze, error: errApp } = await supabase
        .from('appartenenza_lega')
        .select(`
          player_id,
          players:player_id ( nickname )
        `)
        .eq('lega_id', id);

      if (errApp) throw errApp;

      // 3. Mappiamo i membri e verifichiamo se sono manager
      const listaMembri: Membro[] = appartenenze.map((m: any) => {
        const uid = m.player_id;
        let slot = null;
        if (uid === lega.manager1) slot = 'manager1';
        else if (uid === lega.manager2) slot = 'manager2';
        else if (uid === lega.manager3) slot = 'manager3';

        return {
          id: uid,
          username: m.players?.nickname || 'Utente sconosciuto',
          isManager: slot !== null,
          managerSlot: slot
        };
      });

      setMembri(listaMembri);
    } catch (error: any) {
      console.error("Errore:", error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- AZIONI ---

  const handlePromuovi = async (idUtente: string) => {
    // Cerchiamo uno slot libero (manager2 o manager3, manager1 è occupato dal proprietario)
    let slotLibero = '';
    if (!managerData.manager2) slotLibero = 'manager2';
    else if (!managerData.manager3) slotLibero = 'manager3';

    if (!slotLibero) {
      alert("Hai già raggiunto il limite massimo di 3 manager.");
      return;
    }

    const { error } = await supabase
      .from('lega')
      .update({ [slotLibero]: idUtente })
      .eq('id', id);

    if (error) alert(error.message);
    else caricaDatiLega();
  };

  const handleEspelli = async (membro: Membro) => {
    if (membro.id === managerData.manager1) {
      alert("Non puoi espellere te stesso!");
      return;
    }

    if (!window.confirm(`Vuoi davvero espellere ${membro.username}?`)) return;

    // 1. Rimuovi dalla tabella appartenenza_lega
    const { error: err1 } = await supabase
      .from('appartenenza_lega')
      .delete()
      .eq('lega_id', id)
      .eq('player_id', membro.id);

    // 2. Se era un manager, libera il campo nella tabella lega
    if (membro.managerSlot) {
      await supabase
        .from('lega')
        .update({ [membro.managerSlot]: null })
        .eq('id', id);
    }

    if (err1) alert(err1.message);
    else caricaDatiLega();
  };

  const handleDeclassa = async (membro: Membro) => {
    if (!membro.managerSlot || membro.managerSlot === 'manager1') return;

    if (!window.confirm(`Vuoi rimuovere i poteri da manager a ${membro.username}?`)) return;

    // Impostiamo a null la colonna specifica (manager2 o manager3)
    const { error } = await supabase
        .from('lega')
        .update({ [membro.managerSlot]: null })
        .eq('id', id);

    if (error) {
        alert("Errore durante il declassamento: " + error.message);
    } else {
        alert(`${membro.username} non è più un manager.`);
        caricaDatiLega(); // Rinfresca la lista
    }
  };

  if (loading) return <div className="p-10 text-center">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-emerald-600 text-white p-4 flex items-center gap-4">
        <button onClick={() => navigate('/profilo')}><ArrowLeft /></button>
        <h1 className="text-xl font-bold">Impostazioni {nomeLega}</h1>
      </header>

      <main className="max-w-xl mx-auto mt-6 px-4 space-y-6">
        
        {/* Card Gestione Partecipanti */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
            <Users className="text-emerald-600 w-5 h-5" />
            <h2 className="font-bold text-gray-800">Partecipanti alla Lega</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {membri.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{m.username}</span>
                    {m.isManager && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">
                        {m.managerSlot === 'manager1' ? 'Proprietario' : 'Manager'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">ID: {m.id.substring(0, 8)}...</p>
                </div>

                <div className="flex gap-1">
                    {/* TASTO PROMUOVI: visibile solo se è un player semplice e c'è posto */}
                    {!m.isManager && (managerData.manager2 === null || managerData.manager3 === null) && (
                        <button
                        onClick={() => handlePromuovi(m.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Promuovi a Manager"
                        >
                        <ShieldCheck size={20} />
                        </button>
                    )}

                    {/* TASTO DECLASSA: visibile solo se è manager2 o manager3 */}
                    {m.isManager && m.managerSlot !== 'manager1' && (
                        <button
                        onClick={() => handleDeclassa(m)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Rimuovi poteri Manager"
                        >
                        <ShieldOff size={20} />
                        </button>
                    )}

                    {/* TASTO ESPELLI: non visibile per il proprietario */}
                    {m.managerSlot !== 'manager1' && (
                        <button
                        onClick={() => handleEspelli(m)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Espelli dalla lega"
                        >
                        <UserMinus size={20} />
                        </button>
                    )}
                    </div>
              </div>
            ))}
          </div>
          
          {membri.length === 0 && (
            <div className="p-8 text-center text-gray-400 italic">
              Nessun partecipante trovato.
            </div>
          )}
        </section>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
          <AlertTriangle className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            <b>Attenzione:</b> L'espulsione di un utente è immediata. Se l'utente era un Manager, perderà i permessi di creazione partite e gestione risultati.
          </p>
        </div>
      </main>
    </div>
  );
}