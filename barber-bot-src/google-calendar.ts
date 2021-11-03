import { Context } from "@azure/functions";
import { GaxiosResponse } from "gaxios";
import { calendar_v3, google } from "googleapis";
import { Appointment } from "./types";
import formatDatePretty from "./utils/dateTimeFormatter";

interface CalendarEvent {
    summary: string;
    start: Date;
    end: Date;
}

export async function addAppointmentCalendarEvent(appointment: Appointment, logger: Context): Promise<void> {
    logger.log(`Adding calendar event for appointment on ${formatDatePretty(appointment.date)}`);

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    logger.log(`Inserting calendar event for appointment at ${formatDatePretty(appointment.date)}...`);

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

export async function appointmentHasCalendarEvent(appointment: Appointment, logger: Context): Promise<boolean> {
    logger.log(`Checking if there is a calendar event for Appointment on ${formatDatePretty(appointment.date)}...`);

    const events = await getEventsOnDay(appointment.date);

    if (events.length) {
        const haircutEvents = events.filter(ev => ev.summary === "Haircut")

        if (haircutEvents.length > 1) {
            throw `More than one Haircut event found on ${formatDatePretty(appointment.date)}`;
        }

        const haircutEventDate = haircutEvents[0].start;

        const appointmentHasEvent = haircutEventDate.getUTCHours() === appointment.date.getUTCHours() &&
            haircutEventDate.getUTCMinutes() === appointment.date.getUTCMinutes() &&
            haircutEventDate.getUTCSeconds() === appointment.date.getUTCSeconds();

        logger.log(`Appointment on ${formatDatePretty(appointment.date)} ${appointmentHasEvent ? "already has" : "does not have"} a calendar event`);

        return appointmentHasEvent;
    }

    logger.log(`Appointment on ${formatDatePretty(appointment.date)} does not have a calendar event`);

    return false;
}

export async function RemoveAppointmentsWithConflictingEvents(appointments: Appointment[], logger: Context): Promise<Appointment[]> {
    const validAppointments: Appointment[] = [];

    for (let index = 0; index < appointments.length; index++) {
        const appt = appointments[index];

        const apptStartTimeWithBuffer = new Date(appt.date.getTime() - 30 * 60000); // Must be 30mins before the appt
        const apptEndTimeWithBuffer = new Date(appt.date.getTime() + 74 * 60000); // Must be 30mins after the appt (45 min appt time)

        const eventsOnDay = await getEventsOnDay(appt.date);

        if (!eventsOnDay.length) {
            validAppointments.push(appt);
            continue;
        }

        const apptStartsAfterEventHasEnded = (event: CalendarEvent) => apptStartTimeWithBuffer >= event.end;
        const apptEndsBeforeEventHasStarted = (event: CalendarEvent) => apptEndTimeWithBuffer <= event.start;
    
        if (eventsOnDay.every(event => apptStartsAfterEventHasEnded(event) || apptEndsBeforeEventHasStarted(event))) {
            validAppointments.push(appt);
        }
    }

    return validAppointments;
}

async function getEventsOnDay(day: Date): Promise<CalendarEvent[]> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    let eventsData: GaxiosResponse<calendar_v3.Schema$Events> | undefined;

    eventsData = await calendar.events.list({
        calendarId: 'primary',
        timeMin: getDateAtMidnight(day),
        timeMax: getDateAtMidnight(new Date(day.getTime() + 1 * 24 * 60 * 60000)), // The following day
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    });

    return eventsData?.data.items ? eventsData?.data.items.map((item): CalendarEvent => {
        const eventStart = item.start?.date ?? item.start?.dateTime;
        const eventEnd = item.end?.date ?? item.end?.dateTime;

        return { summary: item.summary ?? "", start: new Date(eventStart), end: new Date(eventEnd) };
    }) : [];
}

function getDateAtMidnight(date: Date): string {
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}T00:00:00Z`
}