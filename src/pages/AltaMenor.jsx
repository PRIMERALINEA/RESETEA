import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
const VERSION_POLITICA = 'v1-2026-06';

export default function AltaMenor() {
  const [form, setForm] = useState({
    email: '', password: '',
    adultoNombre: '', adultoDni: '', relacion: 'padre', adultoEmail: '',
    menorNombre: '', menorFechaNac: '',
  });
  const [checks, setChecks] = useState({ privacidad: false, tratamiento: false, salud: false });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggle = (k) => () => setChecks({ ...checks, [k]: !checks[k] });

  const todoOk =
    form.email && form.password && form.adultoNombre && form.adultoDni &&
    form.relacion && form.menorNombre && form.menorFechaNac &&
    checks.privacidad && checks.tratamiento && checks.salud;

  const handleSubmit = async () => {
    setError('');
    if (!todoOk) { setError('Completa todos los campos y marca las tres autorizaciones.'); return; }
    setCargando(true);
    try {
      // 1. Crear la cuenta del menor
      const { data, error: e1 } = await supabase.auth.signUp({
        email: form.email, password: form.password,
      });
      if (e1) throw e1;
      const userId = data.user?.id;
      if (!userId) throw new Error('No se pudo crear la cuenta.');

      // 2. Guardar el consentimiento (prueba documental)
      const { error: e2 } = await supabase.from('consentimientos').insert({
        user_id: userId,
        adulto_nombre: form.adultoNombre,
        adulto_dni: form.adultoDni,
        relacion: form.relacion,
        adulto_email: form.adultoEmail || null,
        menor_nombre: form.menorNombre,
        menor_fecha_nac: form.menorFechaNac,
        acepta_privacidad: checks.privacidad,
        autoriza_tratamiento: checks.tratamiento,
        consiente_salud: checks.salud,
        version_politica: VERSION_POLITICA,
      });
      if (e2) throw e2;

      // 3. Siguiente paso: redirigir al pago de Stripe
      // window.location.href = '/pago';
      alert('Alta y consentimiento registrados.');
    } catch (e) {
      setError(e.message || 'Error al procesar el alta.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-3">
      <h2 className="text-xl font-bold">Alta de cuenta (menor)</h2>

      <p className="font-semibold pt-2">Datos de acceso del menor</p>
      <input className="w-full border rounded p-2" placeholder="Email de la cuenta" value={form.email} onChange={set('email')} />
      <input className="w-full border rounded p-2" type="password" placeholder="Contraseña" value={form.password} onChange={set('password')} />

      <p className="font-semibold pt-2">Datos del adulto responsable</p>
      <input className="w-full border rounded p-2" placeholder="Nombre y apellidos" value={form.adultoNombre} onChange={set('adultoNombre')} />
      <input className="w-full border rounded p-2" placeholder="DNI/NIE" value={form.adultoDni} onChange={set('adultoDni')} />
      <select className="w-full border rounded p-2" value={form.relacion} onChange={set('relacion')}>
        <option value="padre">Padre</option>
        <option value="madre">Madre</option>
        <option value="tutor">Tutor/a legal</option>
      </select>
      <input className="w-full border rounded p-2" placeholder="Email del adulto" value={form.adultoEmail} onChange={set('adultoEmail')} />

      <p className="font-semibold pt-2">Datos del menor</p>
      <input className="w-full border rounded p-2" placeholder="Nombre del menor" value={form.menorNombre} onChange={set('menorNombre')} />
      <input className="w-full border rounded p-2" type="date" value={form.menorFechaNac} onChange={set('menorFechaNac')} />

      <div className="space-y-2 pt-3">
        <label className="flex gap-2 items-start">
          <input type="checkbox" checked={checks.privacidad} onChange={toggle('privacidad')} />
          <span>He leído y acepto la Política de Privacidad y los Términos y Condiciones.</span>
        </label>
        <label className="flex gap-2 items-start">
          <input type="checkbox" checked={checks.tratamiento} onChange={toggle('tratamiento')} />
          <span>Autorizo, como titular de la patria potestad o tutela, el tratamiento de los datos del menor.</span>
        </label>
        <label className="flex gap-2 items-start">
          <input type="checkbox" checked={checks.salud} onChange={toggle('salud')} />
          <span>Consiento expresamente el tratamiento de sus datos de salud / bienestar emocional.</span>
        </label>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        className="w-full bg-green-700 text-white rounded p-2 disabled:opacity-50"
        disabled={!todoOk || cargando}
        onClick={handleSubmit}
      >
        {cargando ? 'Procesando...' : 'Crear cuenta'}
      </button>
    </div>
  );
}
