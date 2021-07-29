import dotenv from 'dotenv';
import getAvailableAppointments from './getAvailableAppointments';
import { getUpcomingAppointments } from './getUpcomingAppointments';
import login from './login';
import { Appointment } from './types';

function printAppointments(appointments: Appointment[]) {
    console.log("Appointments");
    console.log("----------------------------------------");
    appointments.forEach(a => {
        console.log(`${a.provider.name.padStart(15)} | ${a.date.toLocaleString()}`);
    });
}

async function getAppointments(dates: Date[], authCookie: string) {
    const requests = dates.map(d => getAvailableAppointments(authCookie, d));

    const results = await Promise.all(requests);

    let allAppointments = results[0];

    results.slice(1).forEach(r => allAppointments = allAppointments.concat(r));

    allAppointments = allAppointments.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    console.log('--------------------------------------');
    console.log(`Available appointments for ${allAppointments[0].provider.name}`);
    console.log('--------------------------------------');
    allAppointments.forEach(app => {
        console.log(`${app.date.toLocaleDateString('en-GB').padStart(10)}, ${app.date.getHours().toString().padStart(2, '0')}:${app.date.getMinutes().toString().padEnd(2, '0')}`);
    })
}

function getPossibleDatesForNextAppointment(latestBookedAppointment: Appointment) {
    return [
        new Date(latestBookedAppointment.date.getTime() + (28 * 24 * 60 * 60 * 1000)),
        new Date(latestBookedAppointment.date.getTime() + (35 * 24 * 60 * 60 * 1000)),
        new Date(latestBookedAppointment.date.getTime() + (42 * 24 * 60 * 60 * 1000)),
        new Date(latestBookedAppointment.date.getTime() + (49 * 24 * 60 * 60 * 1000))
    ]
}

async function getAvailabilityForNextAppointment() {
    const authCookie = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

    const appointments = await getUpcomingAppointments(authCookie);

    const latestBookedAppointment = appointments.find(app => app.date.getTime() === Math.max.apply(null, appointments.map(e => e.date)));

    console.info(`Latest appointment is scheduled for ${latestBookedAppointment.date}\n\n`);

    const possibleDates = getPossibleDatesForNextAppointment(latestBookedAppointment);

    console.info(`Checking these dates for next appointment: ${possibleDates.map(d => d.toLocaleDateString('en-GB')).join(', ')}`)

    await getAppointments(possibleDates, authCookie);
}

dotenv.config();

// getUpcomingAppointmentList();
// getSaturdayAppointments();

getAvailabilityForNextAppointment();
