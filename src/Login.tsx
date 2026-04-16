import React, { useState } from 'react';
import { supabase } from './supabase';
import { Mail, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false); // NUOVO STATO

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  // --- LOGIN / REGISTRAZIONE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/home')
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Controlla la tua email per confermare la registrazione!");
      }
    } catch (error: any) {
      alert("Errore: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RECUPERO PASSWORD ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert("Per favore, inserisci la tua email.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`, 
      });

      if (error) throw error;
      
      alert("Ti abbiamo inviato un'email con il link per reimpostare la password!");
      setIsResetting(false);
      setPassword(''); 
      
    } catch (error: any) {
      alert("Errore durante l'invio: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
        
        {/* HEADER FORM */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isResetting ? <KeyRound className="w-8 h-8 text-blue-600" /> : <Lock className="w-8 h-8 text-blue-600" />}
          </div>
          <h1 className="text-2xl font-black text-gray-800">
            {isResetting ? 'Recupera Password' : isLogin ? 'Bentornato' : 'Crea Account'}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-2">
            {isResetting 
              ? 'Inserisci la tua email e ti invieremo un link per accedere.' 
              : 'Inserisci i tuoi dati per continuare.'}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={isResetting ? handleResetPassword : handleAuth} className="space-y-4">
          
          {/* Input Email  */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="email@email.com"
              />
            </div>
          </div>

          {/* Input Password */}
          {!isResetting && (
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                {/* TASTO "Password Dimenticata" */}
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => setIsResetting(true)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600"
                  >
                    Dimenticata?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {/* Pulsante Accedi/Registrati */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all mt-4"
          >
            {loading 
              ? 'Caricamento...' 
              : isResetting 
                ? 'Invia link di recupero' 
                : isLogin 
                  ? 'Accedi' 
                  : 'Registrati'}
          </button>
        </form>

        {/* Footer del form  */}
        <div className="mt-6 text-center">
          {isResetting ? (
            <button 
              onClick={() => setIsResetting(false)}
              className="text-sm font-bold text-gray-500 flex items-center justify-center gap-1 mx-auto hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" /> Torna al Login
            </button>
          ) : (
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-gray-500 hover:text-gray-800"
            >
              {isLogin ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}