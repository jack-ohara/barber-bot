import { Appointment } from "./types";
import fetch from "node-fetch";
import parse from "node-html-parser";
import formatAppointment from "./utils/appointmentToString";
import { Context } from "@azure/functions";
import { addAppointmentCalendarEvent } from "./google-calendar";

async function getCsrf(authCookie: string): Promise<string> {
  const response = await fetch("https://northwestbarberco.resurva.com/book", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
      "cookie": authCookie
    },
    "method": "GET",
  });

  const root = parse(await response.text());

  return root.querySelector('#csrf').attributes["value"];
}

export default async function bookAppointment(authCookie: string, appointment: Appointment, logger: Context) {
  const csrf = await getCsrf(authCookie);

  const formBody = new URLSearchParams();
  formBody.append("waiver_agree", "1");
  formBody.append("booking[service_multi][0]", appointment.serviceID.toString());
  formBody.append("booking[date][0]", `${appointment.date.getFullYear()}-${appointment.date.getMonth() + 1}-${appointment.date.getDate().toString().padStart(2, "0")}`);
  formBody.append("email_notifications", "1");
  formBody.append("sms_notifications", "1");
  formBody.append("providerPicker", "0");
  formBody.append("booking[room_id][0]", appointment.provider.id.toString());
  formBody.append("booking[start_time][0]", `${appointment.date.getHours().toString().padStart(2, '0')}${appointment.date.getMinutes().toString().padEnd(2, '0')}`);
  formBody.append("name", process.env.FULL_NAME);
  formBody.append("phone", process.env.PHONE_NUMBER);
  formBody.append("email", process.env.EMAIL_ADDRESS);
  formBody.append("csrf", csrf);

  const response = await fetch("https://northwestbarberco.resurva.com/book", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
      "cache-control": "max-age=0",
      "content-type": "application/x-www-form-urlencoded",
      "cookie": authCookie
    },
    "body": formBody,
    "method": "POST",
  });

  const root = parse(await response.text());

  const requestFailed = Boolean(root.querySelector(".booking-errors-feedback"));

  if (requestFailed) {
    logger.log(`Failed to book apoointment ${formatAppointment(appointment)}`);
  } else {
    logger.log(`Successfully booked appointment ${formatAppointment(appointment)}`);

    // try {
    //   await addAppointmentCalendarEvent(appointment, logger);
    // } catch (e) {
    //   console.log("Failed to add appointment to calendar");

    //   console.error(e);
    // }
  }
}