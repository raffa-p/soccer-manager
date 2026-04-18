import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import {
  ArrowLeft,
  Save,
  Target,
  Activity,
  Star,
  Share2,
  Copy,
  Hash,
  LogOut,
  UserMinus,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Trash2,
  Pencil,
} from "lucide-react";

export default function Profilo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Stati per il form
  const [nickname, setNickname] = useState("");
  const [ruolo, setRuolo] = useState("Centrocampista");
  const [piede, setPiede] = useState("Destro");

  // Stati per la Lega
  const [codiceLega, setCodiceLega] = useState("");
  const [nomeLega, setNomeLega] = useState("");
  const [isManager, setIsManager] = useState(false);
  const [idLega, setLegaId] = useState<any>(null);

  // --- STATI PER IL CAMBIO PASSWORD ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    caricaDatiProfilo();
  }, []);

  // --- FUNZIONE CAMBIO PASSWORD ---
  const handleCambioPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Controlli di sicurezza base (Client-side)
    if (newPassword.length < 6) {
      alert("La password deve contenere almeno 6 caratteri.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Le password non coincidono. Riprova.");
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Errore Supabase:", error);
        alert("Errore durante l'aggiornamento: " + error.message);
      } else {
        alert("Password aggiornata con successo!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      alert("Si è verificato un errore imprevisto.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Funzione per caricare i dati del profilo e della lega
  const caricaDatiProfilo = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Carica dati del profilo
    const { data, error } = await supabase
      .from("player")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setNickname(data.nickname || "");
      setRuolo(data.ruolo || "Centrocampista");
      setPiede(data.piede_forte || "Destro");
    }

    // 2. Carica codice lega
    const { data: associazione } = await supabase
      .from("appartenenza_lega")
      .select(
        `
        lega_id,
        lega:lega_id (
          nome_lega,
          codice_accesso
        )
      `
      )
      .eq("player_id", user.id)
      .limit(1)
      .single();

    if (associazione && associazione.lega) {
      // @ts-ignore
      setCodiceLega(associazione.lega.codice_accesso);
      // @ts-ignore
      setNomeLega(associazione.lega.nome_lega);
      setLegaId(associazione.lega_id);
    }

    // 3. Carica manager
    const { data: giocatore } = await supabase
        .from('player')
        .select('*')
        .eq('id', user.id)
        .single();
    
        if (giocatore) {
          if (giocatore.manager) {
            setIsManager(true);
          }
        }
  };


  // Funzione per copiare il codice lega negli appunti
  const copyToClipboard = () => {
    navigator.clipboard.writeText(codiceLega);
    alert("Codice copiato negli appunti!");
  };

  // Funzione per condividere il codice lega
  const shareCode = async () => {
    const text = `Unisciti alla mia lega su Soccer Manager! Nome: ${nomeLega}. Codice: ${codiceLega}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Soccer Manager - Unisciti alla mia Lega!",
          text: text,
        });
      } catch (err) {
        console.log("Errore condivisione", err);
      }
    } else {
      // Fallback se il browser non supporta la condivisione nativa
      copyToClipboard();
    }
  };

  // Funzione per salvare le modifiche al profilo
  const salvaProfilo = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    //  Upsert: se il record esiste, aggiorna; altrimenti, crea un nuovo record
    const { error } = await supabase.from("player").upsert({
      id: user.id,
      nickname: nickname,
      ruolo: ruolo,
      piede_forte: piede,
    });

    if (error) {
      alert("Errore nel salvataggio: " + error.message);
    } else {
      alert("Profilo aggiornato con successo!");
      navigate("/home");
    }
    setLoading(false);
  };

  // Funzione per il logout
  const handleLogout = async () => {
    const conferma = window.confirm("Sei sicuro di voler uscire?");
    if (conferma) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        alert("Errore durante il logout: " + error.message);
      } else {
        navigate("/");
      }
    }
  };

  // Funzione per lasciare la lega
  const handleLeaveLega = async () => {
    const conferma = window.confirm(
      `Sei sicuro di voler uscire dalla lega "${nomeLega}"? Non vedrai più le partite e le convocazioni.`
    );

    if (conferma) {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("appartenenza_lega")
        .delete()
        .eq("player_id", user.id);

      if (error) {
        alert("Errore durante l'uscita: " + error.message);
      } else {
        alert("Sei uscito dalla lega.");

        await supabase
          .from("player")
          .update({ manager: false })
          .eq("id", user.id);

        navigate("/home");
      }
      setLoading(false);
    }
  };

  // Funzione per eliminare l'account
  const handleDeleteAccount = async () => {
    // 1. Chiediamo conferma per evitare click accidentali
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione non può essere annullata e perderai tutti i dati della tua squadra."
    );

    if (!confirmed) return;

    // 2. Chiamiamo la regola speciale che abbiamo creato su Supabase
    const { error } = await supabase.rpc("delete_user");

    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      // 3. Se va a buon fine, facciamo il logout forzato e lo mandiamo via
      await supabase.auth.signOut();
      alert("Account eliminato con successo. Ci dispiace vederti andare via!");
      navigate("/register");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 font-sans pb-10">
      {/* Header */}
      <div className="bg-white p-5 shadow-sm flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate("/home")} className="p-1">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold">Il Tuo Profilo</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Sezione codice lega */}
        {codiceLega && (
          <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
            <Hash className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
            {isManager && (
              <button 
                onClick={() => navigate(`/edit-lega/${idLega}`)}
                className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-400 hover:text-blue-500 rounded-full transition-colors"
              >
                <Pencil className="w-4 h-4" /> {/* Oppure l'icona Edit/Pencil */}
              </button>
            )}
            <div className="relative z-10">
              <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">
                La tua Lega: {nomeLega}
              </p>
              <h2 className="text-3xl font-black mb-4 tracking-tighter">
                {codiceLega}
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
                >
                  <Copy className="w-4 h-4" /> Copia
                </button>
                <button
                  onClick={shareCode}
                  className="flex-1 bg-white text-emerald-600 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm"
                >
                  <Share2 className="w-4 h-4" /> Condividi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sezione Nickname */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-3">
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Esempio: Il Pendolino"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Sezione Ruolo e Piede */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2 mb-3">
              <Target className="w-3 h-3" /> Ruolo
            </label>
            <select
              value={ruolo}
              onChange={(e) => setRuolo(e.target.value)}
              className="w-full bg-transparent font-bold text-gray-800 outline-none"
            >
              <option>Portiere</option>
              <option>Difensore</option>
              <option>Centrocampista</option>
              <option>Attaccante</option>
            </select>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2 mb-3">
              <Activity className="w-3 h-3" /> Piede
            </label>
            <select
              value={piede}
              onChange={(e) => setPiede(e.target.value)}
              className="w-full bg-transparent font-bold text-gray-800 outline-none"
            >
              <option>Destro</option>
              <option>Sinistro</option>
              <option>Ambidestro</option>
            </select>
          </div>
        </div>

        {/* Pulsante Salva */}
        <button
          onClick={salvaProfilo}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all ${
            loading
              ? "bg-gray-400"
              : "bg-emerald-500 hover:bg-emerald-600 active:scale-95 shadow-emerald-100"
          }`}
        >
          <Save className="w-5 h-5" />
          {loading ? "Salvataggio..." : "Salva Profilo"}
        </button>

        {codiceLega && (
          <div className="pt-2">
            <button
              onClick={handleLeaveLega}
              className="w-full py-3 rounded-xl text-sm font-bold text-gray-500 border border-gray-200 hover:bg-gray-100 flex justify-center items-center gap-2 transition-all"
            >
              <UserMinus className="w-4 h-4" />
              Abbandona la lega corrente
            </button>
          </div>
        )}

        <div className="h-0"></div>

        {/* --- SEZIONE SICUREZZA --- */}
        <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-800">Sicurezza</h2>
          </div>

          <form onSubmit={handleCambioPassword} className="space-y-4">
            {/* Nuova Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Nuova Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="Minimo 6 caratteri"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Conferma Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Conferma Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-medium"
                  placeholder="Ripeti la nuova password"
                />
              </div>
            </div>

            {/* Bottone Salva */}
            <button
              type="submit"
              disabled={passwordLoading || !newPassword || !confirmPassword}
              className={`w-full font-bold py-3 rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2
                ${
                  passwordLoading || !newPassword || !confirmPassword
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200"
                }`}
            >
              {passwordLoading ? "Aggiornamento..." : "Aggiorna Password"}
            </button>
          </form>
        </div>
      </div>

      <div className="h-0"></div>

      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 flex justify-center items-center gap-2 transition-all active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Esci dall'account
        </button>
        {/* Bottone Eliminazione Account */}
        <button
          onClick={handleDeleteAccount}
          className="w-full bg-white border-2 border-red-100 text-red-500 font-bold py-3 rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          ELIMINA ACCOUNT
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">
          Soccer Manager v1.0
        </p>
      </div>
    </div>
  );
}
