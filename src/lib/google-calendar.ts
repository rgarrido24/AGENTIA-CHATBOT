// @ts-expect-error - googleapis no tiene tipos en @types
import { google } from 'googleapis';
import { getMongoDb } from '../../lib/mongodb';

type CalendarTokens = {
  clientId: string;
  refreshToken: string;
  calendarId?: string;
  updatedAt?: Date;
};

async function getCalendarAuth(clientId: string): Promise<{ auth: import('google-auth-library').OAuth2Client; calendarId: string } | null> {
  const refreshToken = process.env[`GOOGLE_REFRESH_TOKEN_${clientId.toUpperCase().replace(/-/g, '_')}`];
  const clientIdEnv = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const calendarId = process.env[`GOOGLE_CALENDAR_ID_${clientId.toUpperCase().replace(/-/g, '_')}`] || process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (!refreshToken || !clientIdEnv || !clientSecret) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientIdEnv,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return { auth: oauth2Client, calendarId };
}

async function getCalendarAuthFromDb(clientId: string): Promise<{ auth: import('google-auth-library').OAuth2Client; calendarId: string } | null> {
  const clientIdEnv = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientIdEnv || !clientSecret) return null;

  const db = await getMongoDb();
  const doc = await db.collection<CalendarTokens>('calendar_tokens').findOne({
    clientId: clientId.trim().toLowerCase(),
  });
  if (!doc?.refreshToken) return null;

  const oauth2Client = new google.auth.OAuth2(
    clientIdEnv,
    clientSecret,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: doc.refreshToken });

  return { auth: oauth2Client, calendarId: doc.calendarId || 'primary' };
}

export async function createGoogleCalendarEvent(params: {
  clientId: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}): Promise<{ id: string } | null> {
  const cfg = await getCalendarAuthFromDb(params.clientId) ?? await getCalendarAuth(params.clientId);
  if (!cfg) return null;

  const calendar = google.calendar({ version: 'v3', auth: cfg.auth });
  const res = await calendar.events.insert({
    calendarId: cfg.calendarId,
    requestBody: {
      summary: params.title,
      description: params.description,
      start: { dateTime: params.start.toISOString(), timeZone: 'America/Mexico_City' },
      end: { dateTime: params.end.toISOString(), timeZone: 'America/Mexico_City' },
    },
  });
  return res.data.id ? { id: res.data.id } : null;
}

export async function deleteGoogleCalendarEvent(clientId: string, eventId: string): Promise<void> {
  const cfg = await getCalendarAuthFromDb(clientId) ?? await getCalendarAuth(clientId);
  if (!cfg) return;

  const calendar = google.calendar({ version: 'v3', auth: cfg.auth });
  await calendar.events.delete({
    calendarId: cfg.calendarId,
    eventId,
  });
}
