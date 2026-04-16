import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { ArrowLeft, Save, Trash2, Calendar, MapPin, Clock } from 'lucide-react';

export default function ModificaPartita() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Stati del form
  const [data, setData] = useState('');
  const [ora, setOra] = useState('');
  const [luogo, setLuogo] = useState('');

  useEffect(() => {
    caricaDati();
  }, [id]);

  // Funzione per caricare i dati della partita
  const caricaDati = async () => {
    const { data: p, error } = await supabase.from('partita').select('*').eq('id', id).single();
    if (p) {
      // Split della data ISO in YYYY-MM-DD e HH:mm
      const d = new Date(p.giorno);
      setData(d.toISOString().split('T')[0]);
      setOra(d.toTimeString().split(' ')[0].substring(0, 5));
      setLuogo(p.luogo || '');
    }
    setLoading(false);
  };

  // Funzione per salvare le modifiche
  const handleSalva = async () => {
    setSaving(true);
    const giornoISO = new Date(`${data}T${ora}`).toISOString();
    
    const { error } = await supabase
      .from('partita')
      .update({ giorno: giornoISO, luogo: luogo })
      .eq('id', id);

    if (error) alert("Errore: " + error.message);
    else navigate('/home');
    setSaving(false);
  };

  // Funzione per eliminare la partita
  const handleElimina = async () => {
    const conferma = window.confirm("SEI SICURO? Questa azione cancellerà la partita e tutte le iscrizioni dei giocatori.");
    if (!conferma) return;

    const confermaFinale = window.confirm("Azione irreversibile. Confermi di voler ELIMINARE la partita?");
    if (!confermaFinale) return;

    const { error } = await supabase.from('partita').delete().eq('id', id);
    if (error) alert("Errore: " + error.message);
    else navigate('/home');
  };

  if (loading) return <div className="p-10 text-center">Caricamento...</div>;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50">
      <div className="bg-white p-5 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')}><ArrowLeft /></button>
          <h1 className="font-bold">Modifica Partita</h1>
        </div>
        <button onClick={handleElimina} className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Data del match</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ora d'inizio</label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="time" value={ora} onChange={e => setOra(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Luogo / Centro Sportivo</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input type="text" value={luogo} onChange={e => setLuogo(e.target.value)} placeholder="Esempio: Centro Sportivo San Siro" className="w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSalva} disabled={saving}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Save className="w-5 h-5" /> {saving ? 'Salvataggio...' : 'SALVA MODIFICHE'}
        </button>
      </div>
    </div>
  );
}