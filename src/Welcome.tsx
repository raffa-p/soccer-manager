// Welcome.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    // Aspetta 3 secondi e poi manda l'utente alla Home
    const timer = setTimeout(() => {
      navigate("/home");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center text-white p-6 text-center">
      <Trophy className="w-20 h-20 mb-6 animate-bounce" />
      <h1 className="text-4xl font-black mb-2">CONTRATTO FIRMATO!</h1>
      <p className="text-xl opacity-90">
        La tua email è stata verificata correttamente.
      </p>
      <p className="mt-8 text-sm bg-emerald-700 px-4 py-2 rounded-full">
        Preparazione spogliatoi in corso...
      </p>
    </div>
  );
}
