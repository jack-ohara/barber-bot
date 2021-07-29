import dotenv from 'dotenv';
import bookAppointment from './bookAppointment';
import getAvailableAppointments from './getAvailableAppointments';
import { getUpcomingAppointments } from './getUpcomingAppointments';
import login from './login';
import { Appointment } from './types';
import formatDatePretty from './utils/dateTimeFormatter';

async function getAppointments(dates: Date[], authCookie: string): Promise<Appointment[]> {
    const requests = dates.map(d => getAvailableAppointments(authCookie, d));

    const results = await Promise.all(requests);

    let allAppointments = results[0];

    results.slice(1).forEach(r => allAppointments = allAppointments.concat(r));

    allAppointments = allAppointments.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    console.log('--------------------------------------');
    console.log(`Available appointments for ${allAppointments[0].provider.name}`);
    console.log('--------------------------------------');
    allAppointments.forEach(app => {
        console.log(formatDatePretty(app.date));
    });

    return allAppointments;
}

function getPossibleDatesForNextAppointment(latestBookedAppointment: Appointment) {
    return [
        new Date(latestBookedAppointment.date.getTime() + (28 * 24 * 60 * 60 * 1000)),
        new Date(latestBookedAppointment.date.getTime() + (35 * 24 * 60 * 60 * 1000)),
        new Date(latestBookedAppointment.date.getTime() + (42 * 24 * 60 * 60 * 1000)),
        new Date(latestBookedAppointment.date.getTime() + (49 * 24 * 60 * 60 * 1000))
    ]
}

async function getAvailabilityForNextAppointment(authCookie: string): Promise<Appointment[]> {
    const appointments = await getUpcomingAppointments(authCookie);

    const latestBookedAppointment = appointments.find(app => app.date.getTime() === Math.max.apply(null, appointments.map(e => e.date)));

    console.info(`Latest appointment is scheduled for ${latestBookedAppointment.date}\n\n`);

    const possibleDates = getPossibleDatesForNextAppointment(latestBookedAppointment);

    console.info(`Checking these dates for next appointment: ${possibleDates.map(d => d.toLocaleDateString('en-GB')).join(', ')}`)

    return await getAppointments(possibleDates, authCookie);
}

async function bookNextAppointment() {
    const auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

    const availableAppointments = await getAvailabilityForNextAppointment(auth.authCookie);

    const appointmentToBook = availableAppointments[0];

    console.log(`\nBooking an appointment with ${appointmentToBook.provider.name} for ${formatDatePretty(appointmentToBook.date)}\n`);

    await bookAppointment(auth.authCookie, appointmentToBook);
}

dotenv.config();

// getUpcomingAppointmentList();
// getSaturdayAppointments();

bookNextAppointment();
