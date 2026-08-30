import type { SlotRange } from './availability';

let memoryAppointments: SlotRange[] = [];

export function getBookAppointments(): SlotRange[] {
  return [...memoryAppointments];
}

export function addBookAppointment(start: string, end: string): void {
  memoryAppointments.push({ start, end });
}

export function clearBookAppointments(): void {
  memoryAppointments = [];
}
