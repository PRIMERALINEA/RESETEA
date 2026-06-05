import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { motion } from "framer-motion";

const LOGO_URL = 'https://zbusdixrxedfhbkquafh.supabase.co/storage/v1/object/public/logo/WhatsApp%20Image%202026-04-06%20at%2015.58.04.jpeg'

export default function AccesoIndividual() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    // Escuchar cambios de sesión (por si acaba de registrarse)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCheckingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePago = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentSession = session || (await supabase.auth.getSession()).data.session;

      if (!currentSession) {
        navigate('/registro-individual');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        }
      );

      if (fnError || !data?.url) {
        throw new Error(fnError?.message || "No se pudo iniciar el pago");
      }

      window.location.href = data.url;

    } catch (err) {
      setError(err.message || "Error al procesar el pago. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 50%, #1a9090 100%)' }}>
        <div className="w-8 h-8 border-4 border-teal-200 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d3d3d 0%, #0f6b6b 50%, #1a9090 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={LOGO_URL} alt="Resetea"
              className="w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-white/20" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Resetea</h1>
          <p className="text-teal-200 text-sm mt-1">Acceso individual</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-4">
          <h2 className="text-lg font-bold" style={{ color: '#0d3d3d' }}>Tu acceso al curso completo</h2>

          {/* Qué incluye */}
          <div className="bg-teal-50 rounded-2xl p-4 space-y-2">
            {['12 módulos con base clínica', 'SOS Examen y Kit de emergencia', 'Diario emocional clínico', 'Técnicas guiadas de regulación', 'Acceso hasta junio 2027'].map(item => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-teal-600 font-bold">✓</span>
                <span className="text-sm text-teal-800">{item}</span>
              </div>
            ))}
          </div>

          {/* Precio */}
          <div className="text-center py-2">
            <span className="text-4xl font-black" style={{ color: '#0d3d3d' }}>29,99 €</span>
            <span className="text-slate-400 text-sm ml-2">+ IVA / curso escolar</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {!session ? (
            <div className="space-y-3">
              <button onClick={() => navigate('/registro-individual')}
                className="w-full py-3 rounded-xl text-white font-bold"
                style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
                Crear cuenta y pagar
              </button>
              <button onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-semibold border-2 text-sm"
                style={{ borderColor: '#0f6b6b', color: '#0f6b6b' }}>
                Ya tengo cuenta — entrar
              </button>
            </div>
          ) : (
            <button onClick={handlePago} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #0d3d3d, #0f6b6b)' }}>
              {loading ? "Redirigiendo al pago..." : "Pagar ahora — 29,99 €"}
            </button>
          )}

          <p className="text-center text-xs text-slate-400">
            Pago seguro · Sin renovación automática · Acceso hasta junio 2027
          </p>
        </div>
      </motion.div>
    </div>
  );
}
