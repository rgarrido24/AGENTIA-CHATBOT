export const dynamic = 'force-dynamic';

export default function SabucanSuspendido() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-2xl font-bold">Servicio suspendido</h1>
      <p className="mt-3 text-white/70">
        El acceso a la caja de lealtad está suspendido. Tus clientes y puntos siguen guardados.
      </p>
      <a className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black" href="/n/sabucan/renovar">
        Reactivar con Mercado Pago, OXXO o SPEI
      </a>
    </div>
  );
}
