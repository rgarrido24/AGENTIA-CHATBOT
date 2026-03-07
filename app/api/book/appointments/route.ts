import { NextRequest, NextResponse } from 'next/server';
import { addBookAppointment, getBookAppointments } from '@/src/lib/book-store';

export async function GET() {
  const appointments = getBookAppointments().map(({ start, end }) => ({ start, end }));
  return NextResponse.json({ appointments });
}
