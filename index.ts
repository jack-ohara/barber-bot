import dotenv from "dotenv";
import bookAppointment from "./bookAppointment";
import getAvailableAppointments from "./getAvailableAppointments";
import { getUpcomingAppointments } from "./getUpcomingAppointments";
import login from "./login";
import { Appointment, AuthInfo } from "./types";
import express from "express";

const app = express();
app.use(express.json());
const port = 3000;

async function getAppointments(
  dates: Date[],
  authCookie: string
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
  authCookie: string
): Promise<Appointment[]> {
  const appointments = await getUpcomingAppointments(authCookie);

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

  return await getAppointments(possibleDates, authCookie);
}

async function getAppointmentsForDay(day: Date) {
  const auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

  await getAppointments([day], auth.authCookie);
}

dotenv.config();

type AppointmentType = "upcoming" | "available";

app.get("/appointments", async (req, res) => {
  const appointmentType = (req.query.type || "upcoming") as AppointmentType;

  let auth: AuthInfo;
  let appointments: Appointment[];

  switch (appointmentType) {
    case "upcoming":
      auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);
      appointments = await getUpcomingAppointments(auth.authCookie);
      break;

    case "available":
      auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);
      appointments = await getAvailabilityForNextAppointment(auth.authCookie);
      break;

    default:
      res
        .status(400)
        .send(`${appointmentType} is not a valid appointment type`);
      return;
  }

  res.json(appointments).end();
});

app.post("/appointments", async (req, res) => {
  const appointmentToBook = req.body as Appointment;

  if (
    !appointmentToBook?.provider?.id ||
    !appointmentToBook.provider.name ||
    !appointmentToBook.date ||
    !appointmentToBook.serviceID
  ) {
    res.status(400).send("invalid appointment");
    return;
  }

  const auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

  await bookAppointment(auth.authCookie, appointmentToBook);

  res.end();
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
