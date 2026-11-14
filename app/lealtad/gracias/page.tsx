import type { Metadata } from 'next';
import { getMongoDb } from '@/lib/mongodb';
import { SOLICITUDES } from '@/lib/lealtad-provision';
import { AutoRefresh } from './AutoRefresh';
import { SPEI, WA_VENTAS } from '@/lib/lealtad-pago';
import { TRIAL_DIAS } from '@/lib/lealtad-suscripcion';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Gracias · Agentia Lealtad',
  robots: { index: false, follow: false },
};

type Props = { searchParams: { ref?: string } };

export default async function GraciasPage({ searchParams }: Props) {
  const ref = /^[a-f0-9]{24}$/.test(searchParams.ref ?? '') ? searchParams.ref! : '';
  const sol = ref ? await (await getMongoDb()).collection(SOLICITUDES).findOne({ ref }) : null;

  const activa = sol?.estado === 'activada';
  const cred =
    activa && sol?.credTemp && new Date(sol.credTemp.hasta) > new Date() ? (sol.credTemp as { user: string; pass: string; panelUrl: string }) : null;
  const renovacion = sol?.tipo === 'renovacion';
  const trial = sol?.trial === true;
  const finPrueba = sol?.activadaAt
    ? new Date(new Date(sol.activadaAt).getTime() + TRIAL_DIAS * 86400000).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })
    : '';
  const pendienteEfectivo = !activa && sol && ['SPEI', 'OXXO'].includes(String(sol.pago)) && sol.mpStatus !== 'approved';

  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center">
      {!sol && (
        <>
          <h1 className="text-3xl font-bold">No encontramos tu solicitud</h1>
          <p className="mt-3 text-[#5E646B]">Si ya pagaste, escríbenos por WhatsApp y lo revisamos de inmediato.</p>
        </>
      )}
      {sol && activa && (
        <>
          <h1 className="text-3xl font-bold">
            {renovacion ? '¡Pago recibido! Tu tarjeta sigue activa 🎉' : trial ? `¡Tu prueba de ${TRIAL_DIAS} días ya está activa! 🎉` : '¡Tu tarjeta ya está activa! 🎉'}
          </h1>
          {trial && finPrueba && <p className="mt-2 font-semibold">Termina el {finPrueba}. Te avisamos antes para que decidas.</p>}
          {renovacion && (
            <p className="mt-3 text-[#5E646B]">
              Ya puedes volver a tu panel: <a className="underline" href={`/n/${sol.tenantKey}/login`}>entrar a mi caja</a>.
            </p>
          )}
          {!renovacion && <p className="mt-3 text-[#5E646B]">
            {sol.whatsappEnviado
              ? 'Te mandamos tus accesos por WhatsApp. Aquí también los tienes:'
              : 'Estos son tus accesos (guárdalos):'}
          </p>}
          {cred && (
            <div className="mt-6 rounded-2xl border border-[#E8E5DD] bg-[#F6F5F0] p-5 text-left">
              <p><b>Panel:</b> <a className="underline" href={cred.panelUrl}>{cred.panelUrl}</a></p>
              <p className="mt-1"><b>Usuario:</b> {cred.user}</p>
              <p className="mt-1"><b>Contraseña:</b> <code>{cred.pass}</code></p>
            </div>
          )}
          {!renovacion && !sol.logoUrl && <p className="mt-4 text-sm text-[#5E646B]">Mándanos tu logo por WhatsApp para ponerlo en tu tarjeta.</p>}
        </>
      )}
      {sol && !activa && sol.estado === 'pendiente_spei' && (
        <>
          <AutoRefresh ms={15000} />
          <h1 className="text-3xl font-bold">Haz tu transferencia SPEI</h1>
          <p className="mt-3 text-[#5E646B]">En cuanto veamos tu depósito activamos tu tarjeta y te mandamos los accesos.</p>
          <div className="mt-6 rounded-2xl border border-[#E8E5DD] bg-[#F6F5F0] p-5 text-left">
            <p><b>Banco:</b> {SPEI.banco}</p>
            <p className="mt-1"><b>CLABE:</b> <code className="select-all text-lg">{SPEI.clabe}</code></p>
            <p className="mt-1"><b>Beneficiario:</b> {SPEI.beneficiario}</p>
            <p className="mt-1"><b>Monto exacto:</b> ${Number(sol.total).toLocaleString('es-MX')} MXN</p>
            <p className="mt-1"><b>Concepto / referencia:</b> <code className="select-all text-lg">{sol.concepto}</code></p>
          </div>
          <a
            className="mt-6 inline-block rounded-xl bg-[#22C55E] px-6 py-3 font-semibold text-black"
            href={`https://wa.me/${WA_VENTAS}?text=${encodeURIComponent(`Hola, ya hice mi transferencia SPEI de Agentia Lealtad. Negocio: ${sol.negocio}. Monto: $${sol.total}. Concepto: ${sol.concepto}.`)}`}
          >
            Ya pagué — avisar por WhatsApp
          </a>
          <p className="mt-3 text-sm text-[#5E646B]">Guarda esta página: aquí aparecerán tus accesos cuando se confirme el pago.</p>
        </>
      )}
      {sol && !activa && sol.estado !== 'pendiente_spei' && (
        <>
          <AutoRefresh />
          <h1 className="text-3xl font-bold">{pendienteEfectivo ? 'Esperando tu pago' : renovacion ? 'Confirmando tu pago…' : 'Estamos activando tu tarjeta…'}</h1>
          <p className="mt-3 text-[#5E646B]">
            {pendienteEfectivo
              ? 'En cuanto se acredite tu pago por SPEI u OXXO (puede tardar unas horas), activamos tu tarjeta y te mandamos los accesos por WhatsApp. No tienes que hacer nada más.'
              : 'Esto toma unos segundos. Esta página se actualiza sola y también te llegan los accesos por WhatsApp.'}
          </p>
        </>
      )}
      <p className="mt-10 text-sm text-[#5E646B]">¿Dudas? Escríbenos por WhatsApp y te ayudamos.</p>
    </main>
  );
}
