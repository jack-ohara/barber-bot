import { AzureFunction, Context } from "@azure/functions";
import { getPastAppointments } from "../barber-bot-src/getPastAppointments";
import login from "../barber-bot-src/login";

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  context.log("Starting barber-bot ✂...");

  const auth = await login(process.env.EMAIL_ADDRESS, process.env.PASSWORD);

  const pastAppointments = await getPastAppointments(auth.authCookie);

  context.log(JSON.stringify(pastAppointments, null, 2));
  context.log("Exiting barber-bot ✂...");
};

export default timerTrigger;
