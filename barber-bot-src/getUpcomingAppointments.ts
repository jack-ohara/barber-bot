import { Context } from "@azure/functions";
import fetch from "node-fetch";
import { parse } from "node-html-parser";
import { addAppointmentCalendarEvent, appointmentHasCalendarEvent } from "./google-calendar";
import parseAppointments from "./utils/existingBookingsParser";

export async function getUpcomingAppointments(authCookieKeyValue: string, logger: Context) {
  const response = await fetch(
    "https://northwestbarberco.resurva.com/appointments",
    {
      headers: {
        accept: "text/html",
        "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
        "cache-control": "max-age=0",
        "upgrade-insecure-requests": "1",
        cookie: authCookieKeyValue,
      },
      method: "GET",
    }
  );

  if (!response.ok) {
    console.error(response);
    throw new Error(
      `Failed to get upcoming appointments: ${JSON.stringify(response)}`
    );
  }

  const appointmentsPage = await response.text();

  const root = parse(appointmentsPage);

  const appointments = parseAppointments(
    root.querySelectorAll("#upcomingBookings ul li")
  );

  await Promise.all(appointments.map(async appt => {
    if (!await appointmentHasCalendarEvent(appt, logger)) {
      await addAppointmentCalendarEvent(appt)
    }
  }));

  return appointments;
}
