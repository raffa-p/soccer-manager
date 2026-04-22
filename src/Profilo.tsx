import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import {
  ArrowLeft, Save, Target, Activity, Share2, Copy, Hash,
  LogOut, UserMinus, Lock, Eye, EyeOff, KeyRound, Trash2, Pencil, Trophy,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export default function Profilo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  // Stati per il form profilo
  const [nickname, setNickname] = useState("");
  const [ruolo, setRuolo] = useState("Centrocampista");
  const [piede, setPiede] = useState("Destro");

  // Stato per le Leghe (Array invece di singole variabili)
  const [leagues, setLeagues] = useState<any[]>([]);

  // Stati per il cambio password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    caricaDatiProfilo();
  }, []);

  // --- CARICAMENTO DATI ---
  const caricaDatiProfilo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // 1. Carica dati base del profilo
    const { data: player } = await supabase
      .from("player")
      .select("*")
      .eq("id", user.id)
      .single();

    if (player) {
      setNickname(player.nickname || "");
      setRuolo(player.ruolo || "Centrocampista");
      setPiede(player.piede_forte || "Destro");
    }

    // 2. Carica TUTTE le leghe a cui l'utente partecipa
    const { data: legheData } = await supabase
      .from("appartenenza_lega")
      .select(`
        lega_id,
        lega!inner ( id, nome_lega, codice_accesso, manager1, manager2, manager3 )
      `)
      .eq("player_id", user.id);

    if (legheData) {
      // Formattiamo l'array e calcoliamo se l'utente è manager per ogni singola lega
      const formattedLeagues = legheData.map((item: any) => {
        const isManager = (
          item.lega.manager1 === user.id || 
          item.lega.manager2 === user.id || 
          item.lega.manager3 === user.id
        );
        return {
          ...item.lega,
          isManager
        };
      });
      setLeagues(formattedLeagues);
    }
  };

  // --- AZIONI SULLA LEGA ---
  const copyToClipboard = (codice: string) => {
    navigator.clipboard.writeText(codice);
    alert("Codice copiato negli appunti!");
  };

  const shareCode = async (nomeLega: string, codice: string) => {
    const text = `Unisciti alla mia lega su Soccer Manager! Nome: ${nomeLega}. Codice: ${codice}`;
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
      copyToClipboard(codice);
    }
  };

  const handleLeaveLega = async (legaId: string, nomeLega: string) => {
    const conferma = window.confirm(
      `Sei sicuro di voler uscire dalla lega "${nomeLega}"? Non vedrai più le sue partite e le convocazioni.`
    );

    if (conferma) {
      setLoading(true);
      
      const { error } = await supabase
        .from("appartenenza_lega")
        .delete()
        .eq("player_id", userId)
        .eq("lega_id", legaId);

      if (error) {
        alert("Errore durante l'uscita: " + error.message);
      } else {
        alert(`Sei uscito dalla lega ${nomeLega}.`);
        setLeagues(prevLeagues => prevLeagues.filter(lega => lega.id !== legaId));
      }
      setLoading(false);
    }
  };

  // --- PROFILO E SICUREZZA ---
  const salvaProfilo = async () => {
    setLoading(true);
    const { error } = await supabase.from("player").upsert({
      id: userId,
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

  const handleCambioPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("La password deve contenere almeno 6 caratteri.");
    if (newPassword !== confirmPassword) return alert("Le password non coincidono. Riprova.");

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      alert("Password aggiornata con successo!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      alert("Errore durante l'aggiornamento: " + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Sei sicuro di voler uscire?")) {
      await supabase.auth.signOut();
      navigate("/");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione non può essere annullata."
    );
    if (!confirmed) return;

    const { error } = await supabase.rpc("delete_user");
    if (error) {
      alert("Errore durante l'eliminazione: " + error.message);
    } else {
      await supabase.auth.signOut();
      alert("Account eliminato con successo. Ci dispiace vederti andare via!");
      navigate("/register");
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 font-sans pb-10">
      
      {/* Header */}
      <div className="bg-white p-5 pt-[max(1rem,env(safe-area-inset-top))] shadow-sm flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/home")} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold">Il Tuo Profilo</h1>
      </div>

      <div className="p-5 space-y-6">
        
        {/* --- SEZIONE LEGA (LISTA) --- */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Le tue Leghe ({leagues.length})
          </h2>
          
          {leagues.length === 0 ? (
            <div className="bg-white p-5 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
              Non partecipi ancora a nessuna lega. Vai in Home per unirti a una!
            </div>
          ) : (
            leagues.map((lega) => (
              <div key={lega.id} className="bg-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-100 relative overflow-hidden">
                <Hash className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
                
                {lega.isManager && (
                  <button 
                    onClick={() => navigate(`/edit-lega/${lega.id}`)}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-all"
                    title="Impostazioni Lega"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest truncate max-w-[200px]">
                      {lega.nome_lega}
                    </p>
                    {lega.isManager && (
                      <span className="bg-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold">MANAGER</span>
                    )}
                  </div>
                  
                  <h2 className="text-3xl font-black mb-4 tracking-tighter">
                    {lega.codice_accesso}
                  </h2>

                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(lega.codice_accesso)}
                      className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
                    >
                      <Copy className="w-4 h-4" /> Copia
                    </button>
                    <button
                      onClick={() => shareCode(lega.nome_lega, lega.codice_accesso)}
                      className="flex-1 bg-white text-emerald-600 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-sm"
                    >
                      <Share2 className="w-4 h-4" /> Condividi
                    </button>
                  </div>

                  <button
                    onClick={() => handleLeaveLega(lega.id, lega.nome_lega)}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-emerald-100 bg-emerald-700/50 hover:bg-red-500/80 flex justify-center items-center gap-2 transition-colors"
                  >
                    <UserMinus className="w-3 h-3" /> Abbandona Lega
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* --- SEZIONE INFORMAZIONI GIOCATORE --- */}
        <div className="pt-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-3">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Esempio: Il Pendolino"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

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
        </div>

        <button
          onClick={salvaProfilo}
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all ${
            loading ? "bg-gray-400" : "bg-emerald-500 hover:bg-emerald-600 active:scale-95 shadow-emerald-100"
          }`}
        >
          <Save className="w-5 h-5" />
          {loading ? "Salvataggio..." : "Salva Profilo"}
        </button>

        {/* --- SEZIONE SICUREZZA --- */}
        <div className="mt-10 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-800">Sicurezza</h2>
          </div>

          <form onSubmit={handleCambioPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nuova Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound className="h-5 w-5 text-gray-400" /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Minimo 6 caratteri"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Conferma Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><KeyRound className="h-5 w-5 text-gray-400" /></div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Ripeti la nuova password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading || !newPassword || !confirmPassword}
              className={`w-full font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 ${
                passwordLoading || !newPassword || !confirmPassword ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-200"
              }`}
            >
              {passwordLoading ? "Aggiornamento..." : "Aggiorna Password"}
            </button>
          </form>
        </div>
      </div>

      {/* --- CARD PRIVACY --- */}
      <div 
        onClick={() => navigate('/privacy-policy')} 
        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4 cursor-pointer active:scale-95 transition-all mt-4"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800">Privacy & Termini</h4>
            <p className="text-[11px] text-gray-500 italic">Consulta come proteggiamo i tuoi dati</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
      </div>

      <div className="pt-4 mt-6 border-t border-gray-200 px-5 space-y-4">
        <button onClick={handleLogout} className="w-full py-4 rounded-2xl font-bold text-red-500 bg-red-50 hover:bg-red-100 flex justify-center items-center gap-2 transition-all active:scale-95">
          <LogOut className="w-5 h-5" /> Esci dall'account
        </button>
        <button onClick={handleDeleteAccount} className="w-full bg-white border-2 border-red-100 text-red-500 font-bold py-3 rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-2">
          <Trash2 className="w-5 h-5" /> ELIMINA ACCOUNT
        </button>
        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest font-bold">Soccer Manager v1.1</p>
      </div>
    </div>
  );
}