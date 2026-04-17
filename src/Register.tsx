import React, { useState } from "react";
import { Mail, Lock, User, UserPlus, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confermaPassword, setConfermaPassword] = useState("");
  const navigate = useNavigate();

  // Funzione per gestire la registrazione
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confermaPassword) {
      alert("Le password non coincidono!");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          nome_giocatore: nome,
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      },
    });

    if (error) {
      alert("Errore: " + error.message);
      return;
    }

    alert(
      "Fantastico! Ti abbiamo inviato un link di conferma. Controlla la tua casella email (anche nello Spam) per attivare l'account."
    );
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col justify-center px-5 font-sans py-10">
      {/* Intestazione */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-emerald-500 p-4 rounded-full mb-4 shadow-lg shadow-emerald-200">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Crea Account</h1>
        <p className="text-gray-500 text-sm mt-2 font-medium">
          Unisciti allo spogliatoio
        </p>
      </div>

      {/* Card del Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Input Nome */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Nome Giocatore
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="Es. Marco Rossi"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Input Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="mario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Input Conferma Password */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Conferma Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="••••••••"
                value={confermaPassword}
                onChange={(e) => setConfermaPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pulsante Registrati */}
          <button
            type="submit"
            className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-colors shadow-lg shadow-emerald-200"
          >
            Completa Registrazione
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Link al Login */}
      <p className="text-center text-sm text-gray-500 mt-8 font-medium">
        Hai già un account?{" "}
        <Link
          to="/"
          className="font-bold text-emerald-600 hover:text-emerald-700"
        >
          Accedi
        </Link>
      </p>
    </div>
  );
}
