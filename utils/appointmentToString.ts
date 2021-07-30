import { Appointment } from "../types";
import formatDatePretty from "./dateTimeFormatter";

export default function formatAppointment(appointment: Appointment) {
    return `${appointment.provider.name} for ${formatDatePretty(appointment.date)}`
}