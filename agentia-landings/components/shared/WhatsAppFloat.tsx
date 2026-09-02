"use client";

import { useState } from "react";

const AGENTIA_WHATSAPP = "529844927769"; // +52 984 492 7769

export default function WhatsAppFloat({
  productLabel,
  defaultMessage,
}: {
  productLabel: string;
  defaultMessage?: string;
}) {
  const [open, setOpen] = useState(false);

  const message =
    defaultMessage ??
    `Hola, vengo de la página de ${productLabel} y quiero más información.`;

  const waLink = `https://wa.me/${AGENTIA_WHATSAPP}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <div className="ag-wa-float">
      {open && (
        <div className="ag-wa-panel">
          <p style={{ fontSize: 14, color: "var(--text-1)", marginBottom: 12 }}>
            Escríbenos y te respondemos en minutos.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ width: "100%" }}
          >
            Abrir WhatsApp
          </a>
        </div>
      )}
      <button
        className="ag-wa-button"
        aria-label="Abrir chat de WhatsApp"
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l4.93-1.36C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
            fill="#06210f"
          />
          <path
            d="M8.5 8c.2-.4.5-.4.7-.4h.6c.2 0 .4 0 .6.4.2.5.7 1.7.7 1.9s0 .3-.1.5c-.1.2-.2.3-.4.5-.2.2-.4.4-.2.7.2.4.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.7 1.6.4.2.6.1.8-.1.2-.2.8-.9 1-1.2.2-.3.4-.3.7-.2.3.1 1.8.9 2.1 1s.5.2.6.4c.1.2.1.9-.2 1.7-.3.8-1.7 1.6-2.4 1.7-.6.1-1.4.2-4.6-1s-5.3-4.6-5.5-4.9c-.2-.2-1.4-1.9-1.4-3.6 0-1.7.9-2.5 1.2-2.9z"
            fill="#25d366"
          />
        </svg>
      </button>
    </div>
  );
}
