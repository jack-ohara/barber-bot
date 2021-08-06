import fetch from "node-fetch";
import { HTMLElement, parse } from "node-html-parser";
import { Appointment } from "./types";
import addTimeToDate from "./utils/timeParser";
import fs from "fs";

export async function getUpcomingAppointments(authCookieKeyValue: string) {
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
      `Failed to get the appointments: ${JSON.stringify(response)}`
    );
  }

  const appointmentsPage = await response.text();

  fs.writeFile("getUpcoming.html", appointmentsPage, () => {});

  const root = parse(appointmentsPage);

  const appointments = parseAppointments(
    root.querySelectorAll("#upcomingBookings ul li")
  );

  return appointments;
}

function parseAppointments(htmlAppointments: HTMLElement[]): Appointment[] {
  return htmlAppointments.map((appointment) => {
    const barber = appointment.querySelector(".title h3").text.trim();

    let [dateString, timeString] = appointment
      .querySelectorAll(".title h4 strong")
      .map((str) => str.text.trim());

    let date = new Date(dateString);

    date = addTimeToDate(date, timeString);

    return {
      provider: { name: barber, id: NaN },
      date: date,
      serviceID: NaN,
    };
  });
}
