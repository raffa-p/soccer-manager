import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Home from './Home';
import Profilo from './Profilo';
import CreaPartita from './CreaPartita';
import ImpostaFormazione from './ImpostaFormazione';
import VisualizzaFormazione from './VisualizzaFormazione';
import InserisciRisultato from './InserisciRisultato';
import ListaPartite from './ListaPartite';
import ModificaPartita from './ModificaPartita';
import Classifica from './Classifica';
import ResetPassword from './ResetPassword';
import ProtectedRoute from './ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- ROTTE PUBBLICHE --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />

        {/* --- ROTTE PRIVATE --- */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profilo" element={<Profilo />} />
          <Route path="/crea-partita" element={<CreaPartita />} />
          <Route path="/imposta-formazione/:id" element={<ImpostaFormazione />} />
          <Route path="/visualizza-formazione/:id" element={<VisualizzaFormazione />} />
          <Route path="/inserisci-risultato/:id" element={<InserisciRisultato />} />
          <Route path="/lista-partite" element={<ListaPartite />} />
          <Route path="/modifica-partita/:id" element={<ModificaPartita />} />
          <Route path="/classifica" element={<Classifica />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}