import { Appointment } from "../types";
import { HTMLElement } from "node-html-parser";
import addTimeToDate from "./timeParser";

export default function parseAppointments(
  htmlAppointments: HTMLElement[]
): Appointment[] {
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
