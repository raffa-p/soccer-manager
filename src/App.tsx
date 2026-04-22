import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import Profilo from "./Profilo";
import CreaPartita from "./CreaPartita";
import ImpostaFormazione from "./ImpostaFormazione";
import VisualizzaFormazione from "./VisualizzaFormazione";
import InserisciRisultato from "./InserisciRisultato";
import ListaPartite from "./ListaPartite";
import ModificaPartita from "./ModificaPartita";
import Classifica from "./Classifica";
import ResetPassword from "./ResetPassword";
import ProtectedRoute from "./ProtectedRoute";
import Welcome from "./Welcome";
import EditLega from "./EditLega";
import PrivacyPolicy from "./PrivacyPolicy";
import { supabase } from "./supabase";
//import { inject } from "@vercel/analytics";

//inject();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // 1. Appena l'app si apre, controlla se c'è già una sessione salvata nel telefono
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitializing(false); // Fine del caricamento iniziale
    });

    // 2. Ascolta automaticamente ogni volta che l'utente fa login o logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Pulizia
    return () => subscription.unsubscribe();
  }, []);

  // Finché controlla il gettone, mostra una schermata vuota o un logo
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-500">
        <h1 className="text-white text-2xl font-bold animate-pulse">Soccer Manager</h1>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
        {/* --- ROTTE PUBBLICHE --- */}
        <Route path="/login" element={session ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />

        {/* --- ROTTE PRIVATE --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profilo" element={<Profilo />} />
          <Route path="/crea-partita" element={<CreaPartita />} />
          <Route
            path="/imposta-formazione/:id"
            element={<ImpostaFormazione />}
          />
          <Route
            path="/visualizza-formazione/:id"
            element={<VisualizzaFormazione />}
          />
          <Route
            path="/inserisci-risultato/:id"
            element={<InserisciRisultato />}
          />
          <Route path="/lista-partite" element={<ListaPartite />} />
          <Route path="/modifica-partita/:id" element={<ModificaPartita />} />
          <Route path="/classifica" element={<Classifica />} />
          <Route path="/edit-lega/:id" element={<EditLega />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
