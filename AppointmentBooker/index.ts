import { AzureFunction, Context } from "@azure/functions";
import bookAppointment from "../barber-bot-src/bookAppointment";
import getAvailableAppointments from "../barber-bot-src/getAvailableAppointments";
import { getUpcomingAppointments } from "../barber-bot-src/getUpcomingAppointments";
import { RemoveAppointmentsWithConflictingEvents } from "../barber-bot-src/google-calendar";
import login from "../barber-bot-src/login";
import { Appointment } from "../barber-bot-src/types";

async function getAppointments(
  dates: Date[],
  authCookie: string,
  logger: Context
): Promise<Appointment[]> {
  const requests = dates.map((d) => getAvailableAppointments(authCookie, d));

  const results = await Promise.all(requests);

  let allAppointments = results[0];

  results
    .slice(1)
    .forEach((r) => (allAppointments = allAppointments.concat(r)));

  allAppointments = allAppointments.sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // try {

  //   const appointmentsWhenIAmNotBusy = RemoveAppointmentsWithConflictingEvents(allAppointments, logger);

  //   return appointmentsWhenIAmNotBusy;
  // } catch (e) {
  //   console.log("Failed to retrieve calendar");
  //   console.error(e);

  //   return allAppointments;
  // }
  return allAppointments;
}

function getPossibleDatesForNextAppointment(
  latestBookedAppointment: Appointment
) {
  return [
    new Date(latestBookedAppointment.date.getTime() + 28 * 24 * 60 * 60 * 1000),
    new Date(latestBookedAppointment.date.getTime() + 35 * 24 * 60 * 60 * 1000),
    new Date(latestBookedAppointment.date.getTime() + 42 * 24 * 60 * 60 * 1000),
    new Date(latestBookedAppointment.date.getTime() + 49 * 24 * 60 * 60 * 1000),
  ];
}

async function getAvailabilityForNextAppointment(
  authCookie: string,
  appointments: Appointment[],
  logger: Context
): Promise<Appointment[]> {
  const latestBookedAppointment = appointments.find(
    (app) =>
      app.date.getTime() ===
      Math.max.apply(
        null,
        appointments.map((e) => e.date)
      )
  );

  const possibleDates = getPossibleDatesForNextAppointment(
    latestBookedAppointment
  );

  return await getAppointments(possibleDates, authCookie, logger);
}

function getAppointmentToBook(possibleAppointments: Appointment[]): Appointment {
  possibleAppointments.sort((apt1, apt2) => apt1.date < apt2.date ? -1 : 1)

  const earliestDayDate = possibleAppointments[0].date.getUTCDate()
  const earliestDayMonth = possibleAppointments[0].date.getUTCMonth()
  const earliestDayYear = possibleAppointments[0].date.getUTCFullYear()

  const allAppointmentsOnEarliestDay = possibleAppointments.filter(apt =>
    apt.date.getUTCDate() === earliestDayDate &&
    apt.date.getUTCMonth() === earliestDayMonth &&
    apt.date.getUTCFullYear() === earliestDayYear
  )

  const bestApt = allAppointmentsOnEarliestDay.find(apt => apt.date.getHours() >= 11)

  return bestApt ? bestApt : possibleAppointments[0]
}

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  context.log("Starting barber-bot ???...");

  const auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

  const upcomingAppointments = await getUpcomingAppointments(auth.authCookie, context);

  const minNumberOfBookedAppointments = Number(
    process.env.MIN_NUMBER_OF_BOOKED_APPOINTMENTS
  );

  if (upcomingAppointments.length === minNumberOfBookedAppointments) {
    context.log("No appointments to book... goodbye");
    return;
  }

  const nextAppointmentAvailability = await getAvailabilityForNextAppointment(
    auth.authCookie,
    upcomingAppointments,
    context
  );

  if (nextAppointmentAvailability.length === 0) {
    context.log("Couldn't find any available appointments to book :(");
    return;
  }

  context.log(
    `Found availability for next appointment: ${JSON.stringify(
      nextAppointmentAvailability
    )}`
  );

  const aptToBook = getAppointmentToBook(nextAppointmentAvailability);

  context.log(`Attempting to book appointment: ${JSON.stringify(aptToBook)}`);

  await bookAppointment(auth.authCookie, aptToBook, context);

  context.log(`Booked appointment`);
};

export default timerTrigger;
