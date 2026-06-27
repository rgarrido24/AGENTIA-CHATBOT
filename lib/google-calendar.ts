import { google } from 'googleapis';

const TIMEZONE = 'America/Mexico_City';
const BIOVELA_ATTENDEE = 'laruedaveladoras@gmail.com';

function getServiceAccountCredentials(): { clientEmail: string; privateKey: string; calendarId: string } {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY?.trim();
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim();

  if (!clientEmail || !privateKeyRaw || !calendarId) {
    throw new Error(
      'Faltan GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY o GOOGLE_CALENDAR_ID para Google Calendar',
    );
  }

  return {
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    calendarId,
  };
}

export function isGoogleCalendarServiceAccountConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL?.trim()
      && process.env.GOOGLE_PRIVATE_KEY?.trim()
      && process.env.GOOGLE_CALENDAR_ID?.trim(),
  );
}

export type CreateCalendarEventParams = {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendeeEmail?: string;
  location?: string;
};

export async function createCalendarEvent(
  params: CreateCalendarEventParams,
): Promise<{ id: string; htmlLink?: string | null }> {
  const { clientEmail, privateKey, calendarId } = getServiceAccountCredentials();

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });
  const attendee = (params.attendeeEmail || BIOVELA_ATTENDEE).trim();

  const res = await calendar.events.insert({
    calendarId,
    sendUpdates: 'all',
    requestBody: {
      summary: params.title,
      description: params.description,
      location: params.location,
      start: { dateTime: params.start.toISOString(), timeZone: TIMEZONE },
      end: { dateTime: params.end.toISOString(), timeZone: TIMEZONE },
      attendees: [{ email: attendee }],
    },
  });

  if (!res.data.id) {
    throw new Error('Google Calendar no devolvió id de evento');
  }

  return { id: res.data.id, htmlLink: res.data.htmlLink };
}

export async function createBiovelaPickupEvent(params: {
  customerName: string;
  whatsapp: string;
  products: string;
  start: Date;
  end: Date;
}): Promise<{ id: string; htmlLink?: string | null }> {
  return createCalendarEvent({
    title: `Cita recolección - ${params.customerName} - ${params.whatsapp}`,
    description: params.products,
    start: params.start,
    end: params.end,
    location: 'Iztacalco, CDMX (almacén Biovela — cita previa)',
    attendeeEmail: BIOVELA_ATTENDEE,
  });
}
