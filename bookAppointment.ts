import { Appointment } from "./types";

export default async function bookAppointment(authCookie:string, crsf: string, appointment: Appointment) {
    // Added the new properties to Appointment type, now need to map them in the 
    // functions that get appointments etc.
    const formBody = new URLSearchParams();
    formBody.append("waiver_agree", "1");
    formBody.append("booking[service_multi][0]", appointment.serviceID.toString());
    formBody.append("booking[date][0]", `${appointment.date.getFullYear()}-${appointment.date.getMonth() + 1}-${appointment.date.getDate()}`);
    formBody.append("email_notifications", "1");
    formBody.append("sms_notifications", "1");
    formBody.append("providerPicker", "0");
    formBody.append("booking[room_id][0]", appointment.provider.id.toString());
    formBody.append("booking[start_time][0]", `${appointment.date.getHours().toString().padStart(2, '0')}${appointment.date.getMinutes().toString().padEnd(2, '0')}`);
    formBody.append("name", process.env.FULL_NAME);
    formBody.append("phone", process.env.PHONE_NUMBER);
    formBody.append("email", process.env.EMAIL_ADDRESS);
    formBody.append("csrf", crsf);

    const response = await fetch("https://northwestbarberco.resurva.com/book", {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          "cookie":authCookie
        },
        "body": "waiver_agree=1&booking%5Bservice_multi%5D%5B0%5D=66369&booking%5Bdate%5D%5B0%5D=2021-09-11&email_notifications=1&sms_notifications=1&uu=&tpai=&service=&providerPicker=0&booking%5Broom_id%5D%5B0%5D=5064&booking%5Bstart_time%5D%5B0%5D=1130&booking%5Bend_time%5D%5B0%5D=&name=Jack+O%27Hara&phone=07932888628&email=signups%40jackohara.io&useSavedCard=&csrf=6c9638ada761088afbc901068acd6893",
        "method": "POST"
      }); 
}