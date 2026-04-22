import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white text-gray-800 font-sans pb-10">
      <header className="p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b flex items-center gap-4 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Norme sulla Privacy</h1>
      </header>

      <main className="p-6 space-y-8">
        <section className="text-center space-y-2">
          <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-500">Ultimo aggiornamento: Aprile 2026</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-500" /> 1. Dati Raccolti
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            L'app <strong>Soccer Manager</strong> raccoglie i seguenti dati:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Indirizzo Email (per l'autenticazione tramite Supabase).</li>
            <li>Nickname e dati tecnici (ruolo, piede forte).</li>
            <li>Dati di partecipazione alle partite (presenze/assenze).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" /> 2. Finalità del trattamento
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            I dati vengono utilizzati esclusivamente per il corretto funzionamento dell'app, 
            ovvero l'organizzazione delle partite, la gestione delle leghe e la visualizzazione 
            delle formazioni tra i membri della stessa lega.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> 3. Terze Parti
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Utilizziamo <strong>Supabase</strong> (una piattaforma di backend) per memorizzare in modo 
            sicuro i tuoi dati e gestire l'accesso. I tuoi dati non vengono venduti a terzi né utilizzati 
            per scopi pubblicitari.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" /> 4. Eliminazione dei dati
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Puoi eliminare il tuo account direttamente dall'interno dell'app (Profilo &gt; Elimina Account).
            Se hai già disinstallato l'app e desideri eliminare il tuo account e tutti i dati associati (email, nickname, statistiche delle partite), puoi inviare un'email a <a href="mailto:deleteaccount@protadev.com" className="text-blue-500 hover:underline">deleteaccount@protadev.com</a> con oggetto "Richiesta Eliminazione Account". I tuoi dati verranno cancellati definitivamente dai nostri server entro 60 giorni.
          </p>
        </section>

        <footer className="pt-10 border-t text-center">
          <p className="text-xs text-gray-400">
            Titolare del trattamento: <strong>ProtaDev</strong>
          </p>
        </footer>
      </main>
    </div>
  );
}