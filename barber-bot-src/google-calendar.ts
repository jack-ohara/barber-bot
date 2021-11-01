import { google } from "googleapis";
import { Appointment } from "./types";
import formatDatePretty from "./utils/dateTimeFormatter";

export async function addAppointmentCalendarEvent(appointment: Appointment): Promise<void> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    await calendar.events.insert({
        sendUpdates: "all",
        calendarId: "primary",
        requestBody: {
            summary: "Haircut",
            colorId: "9",
            reminders: {
                useDefault: false,
                overrides: [
                    { method: "popup", minutes: 60 }
                ]
            },
            start: { dateTime: appointment.date.toISOString() },
            end: { dateTime: new Date(appointment.date.getTime() + 45 * 60000).toISOString() }
        }
    });
}

export async function appointmentHasCalendarEvent(appointment: Appointment): Promise<boolean> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const eventsData = await calendar.events.list({
        calendarId: 'primary',
        timeMin: getDateAtMidnight(appointment.date),
        timeMax: getDateAtMidnight(new Date(appointment.date.getTime() + 1 * 24 * 60 * 60000)), // The following day
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    });

    const events = eventsData?.data.items;

    if (events?.length) {
        const haircutEvents = events.filter(ev => ev.summary === "Haircut")

        if (haircutEvents.length > 1) {
            throw `More than one Haircut event found on ${formatDatePretty(appointment.date)}`;
        }

        const haircutEventDate = new Date(haircutEvents[0].start.dateTime);

        const appointmentHasEvent = haircutEventDate.getUTCHours() === appointment.date.getUTCHours() &&
            haircutEventDate.getUTCMinutes() === appointment.date.getUTCMinutes() &&
            haircutEventDate.getUTCSeconds() === appointment.date.getUTCSeconds();

        console.log(`Appointment on ${formatDatePretty(appointment.date)} ${appointmentHasEvent ? "already has" : "does not have"} a calendar event`);

        return appointmentHasEvent;
    }

    return false;
}

function getDateAtMidnight(date: Date): string {
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDay()}T:00:00:00Z`
}