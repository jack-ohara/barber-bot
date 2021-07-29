import { Appointment, AuthInfo } from "./types";
import fs from 'fs';
import fetch from "node-fetch";
import parse from "node-html-parser";

// Need to call GET /book first and extract the csrf from the html
// See if that gets this working

async function getCsrf(authCookie: string): Promise<string> {
  const response = await fetch("https://northwestbarberco.resurva.com/book", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
      "cookie": authCookie
    },
    "method": "GET",
  });

  const html = await response.text();

  const root = parse(html);

  return root.querySelector('#csrf').attributes["value"];
}

export default async function bookAppointment(authCookie: string, appointment: Appointment) {
  const csrf = await getCsrf(authCookie);

  console.log(csrf);

  const formBody = new URLSearchParams();
  formBody.append("waiver_agree", "1");
  formBody.append("booking[service_multi][0]", appointment.serviceID.toString());
  formBody.append("booking[date][0]", `${appointment.date.getFullYear()}-${appointment.date.getMonth() + 1}-${appointment.date.getDate().toString().padStart(2, "0")}`);
  formBody.append("email_notifications", "1");
  formBody.append("sms_notifications", "1");
  formBody.append("uu", "");
  formBody.append("tpai", "");
  formBody.append("service", "");
  formBody.append("providerPicker", "0");
  formBody.append("booking[room_id][0]", appointment.provider.id.toString());
  formBody.append("booking[start_time][0]", `${appointment.date.getHours().toString().padStart(2, '0')}${appointment.date.getMinutes().toString().padEnd(2, '0')}`);
  formBody.append("booking[end_time][0]", "");
  formBody.append("name", process.env.FULL_NAME);
  formBody.append("phone", process.env.PHONE_NUMBER);
  formBody.append("email", process.env.EMAIL_ADDRESS);
  formBody.append("useSavedCard", "");
  formBody.append("csrf", csrf);

  console.log(formBody);

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

  console.log(response);
  console.log(response.headers.raw());
  const text = await response.text();
  fs.writeFile('./bookAppointmentResponse.html', text, err => { if (err) console.error(err) });
}