import { Context } from "@azure/functions";
import fetch from "node-fetch";
import { parse } from "node-html-parser";
import parseAppointments from "./utils/existingBookingsParser";

export async function getPastAppointments(authCookieKeyValue: string, logger: Context) {
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
    logger.log(response);
    throw new Error(
      `Failed to get past appointments: ${JSON.stringify(response)}`
    );
  }

  const appointmentsPage = await response.text();

  const root = parse(appointmentsPage);

  const appointments = parseAppointments(
    root.querySelectorAll("#pastBookings ul li")
  );

  return appointments;
}
