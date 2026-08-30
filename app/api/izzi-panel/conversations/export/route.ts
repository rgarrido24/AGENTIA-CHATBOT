import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { isIzziPanelAuthenticated } from '@/lib/izzi-panel-auth';
import { listIzziConversationsForExport } from '@/lib/izzi-conversations';
import {
  etapaLabel,
  isIzziTipo,
  phoneFromSenderId,
  tipoLabel,
  type IzziConversationTipo,
} from '@/lib/izzi-panel';

export const dynamic = 'force-dynamic';

function parseDay(raw: unknown, endOfDay: boolean): Date | undefined {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  return new Date(`${raw}T${endOfDay ? '23:59:59.999' : '00:00:00'}-06:00`);
}

function fmtDate(d: Date): string {
  if (!d || Number.isNaN(d.getTime()) || d.getTime() === 0) return '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  });
}

function fmtTime(d: Date): string {
  if (!d || Number.isNaN(d.getTime()) || d.getTime() === 0) return '';
  return d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Mexico_City',
  });
}

function fmtDateTime(d: Date): string {
  if (!d || Number.isNaN(d.getTime()) || d.getTime() === 0) return '';
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  });
}

export async function POST(req: NextRequest) {
  if (!isIzziPanelAuthenticated(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tipoRaw = body?.tipo;
  const tipo: IzziConversationTipo | 'all' = isIzziTipo(tipoRaw) ? tipoRaw : 'all';
  const etapa = typeof body?.etapa === 'string' ? body.etapa.trim() : '';

  const rows = await listIzziConversationsForExport({
    from: parseDay(body?.from, false),
    to: parseDay(body?.to, true),
    tipo,
    etapa: etapa && etapa !== 'all' ? etapa : undefined,
  });

  const sheetRows = rows.map((c) => ({
    'Fecha de contacto': fmtDate(c.createdAt),
    'Hora de contacto': fmtTime(c.createdAt),
    'Nombre completo': c.senderName || '',
    Teléfono: phoneFromSenderId(c.senderId),
    Tipo: tipoLabel(c.tipo).replace(/^[^\wÁÉÍÓÚáéíóúñÑ]+\s*/, ''),
    'Estado del embudo': etapaLabel(c.tipo, c.etapa).replace(/^[✅❌]\s*/, ''),
    Notas: c.notas || '',
    'Última actividad': fmtDateTime(c.lastMessageAt),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  ws['!cols'] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 40 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Conversaciones');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="izzi-conversaciones-${stamp}.xlsx"`,
    },
  });
}
