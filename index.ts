import dotenv from 'dotenv';
import getAvailableAppointments from './getAvailableAppointments';
import { getUpcomingAppointments } from './getUpcomingAppointments';
import login from './login';
import { Appointment } from './types';

function printAppointments(appointments: Appointment[]) {
    console.log("Appointments");
    console.log("----------------------------------------");
    appointments.forEach(a => {
        console.log(`${a.barber.padStart(15)} | ${a.date.toLocaleString()}`);
    });
}

async function getAppointmentList() {
    const authCookie = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

    const appointments = await getUpcomingAppointments(authCookie);

    printAppointments(appointments);
}

async function getAvailableAppointmentsWrapper() {
    const authCookie = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

    const appointments = await getAvailableAppointments(authCookie, new Date("2021-08-17"));

    printAppointments(appointments);
}

dotenv.config();

// getAppointmentList();
getAvailableAppointmentsWrapper();