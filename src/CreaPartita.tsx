import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle2, Clock } from 'lucide-react';

export default function CreaPartita() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Stati del form
  const [legaId, setLegaId] = useState('');
  const [legheGestite, setLegheGestite] = useState<any[]>([]);
  const [data, setData] = useState('');
  const [ora, setOra] = useState('21:00');
  const [luogo, setLuogo] = useState('');
  const [squadra1, setSquadra1] = useState('Scapoli');
  const [squadra2, setSquadra2] = useState('Ammogliati');

  useEffect(() => {
    caricaLegheManager();
  }, []);

  const caricaLegheManager = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Recupero lega dove l'utente è manager (manager1, manager2 o manager3)
    const { data: leghe } = await supabase
      .from('lega')
      .select('id, nome_lega')
      .or(`manager1.eq.${user.id},manager2.eq.${user.id},manager3.eq.${user.id}`);

    if (leghe && leghe.length > 0) {
      setLegheGestite(leghe);
      setLegaId(leghe[0].id);
    }
  };

  // Funzione di submit del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !luogo || !legaId) {
      alert("Compila tutti i campi obbligatori!");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Formattazione data e ora per il database (es: "2024-06-30T21:00:00")
    const giornoCompleto = `${data}T${ora}:00`;

    // Inserimento nuova partita nel database
    const { error } = await supabase
      .from('partita')
      .insert([
        {
          lega_id: legaId,
          giorno: giornoCompleto,
          luogo: luogo,
          nome_squadra1: squadra1,
          nome_squadra2: squadra2,
          creata_da: user?.id
        }
      ]);

    if (error) {
      alert("Errore nella creazione: " + error.message);
    } else {
      alert("Partita creata con successo! Ora i giocatori possono segnarsi.");
      navigate('/home');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white p-5 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">Organizza Match</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        
        {/* Selezione Lega */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Lega</label>
          <select 
            value={legaId}
            onChange={(e) => setLegaId(e.target.value)}
            className="w-full bg-transparent font-bold text-gray-800 outline-none"
          >
            {legheGestite.map(l => (
              <option key={l.id} value={l.id}>{l.nome_lega}</option>
            ))}
          </select>
        </div>

        {/* Data e Ora */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
              <Calendar className="w-3 h-3" /> Giorno
            </label>
            <input 
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-transparent font-bold text-gray-800 outline-none text-sm"
            />
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
              <Clock className="w-3 h-3" /> Ora
            </label>
            <input 
              type="time"
              value={ora}
              onChange={(e) => setOra(e.target.value)}
              className="w-full bg-transparent font-bold text-gray-800 outline-none"
            />
          </div>
        </div>

        {/* Luogo */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-2">
            <MapPin className="w-3 h-3" /> Dove si gioca?
          </label>
          <input 
            type="text"
            value={luogo}
            onChange={(e) => setLuogo(e.target.value)}
            placeholder="Es: Centro Sportivo San Siro"
            className="w-full bg-transparent font-bold text-gray-800 outline-none placeholder:font-normal placeholder:text-gray-300"
          />
        </div>

        {/* Nomi Squadre */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase mb-4">
            <Users className="w-3 h-3" /> Nomi Squadre (Opzionale)
          </label>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">1</div>
              <input 
                type="text"
                value={squadra1}
                onChange={(e) => setSquadra1(e.target.value)}
                className="flex-1 bg-gray-50 p-2 rounded-lg outline-none font-semibold text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">2</div>
              <input 
                type="text"
                value={squadra2}
                onChange={(e) => setSquadra2(e.target.value)}
                className="flex-1 bg-gray-50 p-2 rounded-lg outline-none font-semibold text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bottone Invio */}
        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "Creazione in corso..." : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Conferma e Pubblica
            </>
          )}
        </button>

      </form>
    </div>
  );
}