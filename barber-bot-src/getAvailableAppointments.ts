import fetch from "node-fetch";
import { Appointment, Provider } from "./types";
import addTimeToDate from "./utils/timeParser";

interface Service {
  service: {
    id: number;
    name: string;
  };
}

interface GetProvidersResponse {
  providers: [
    {
      provider: Provider;
      status: "available" | "booked";
    }
  ];
}

interface GetAvailabilityResponse {
  startTimes: {
    [providerID: string]: {
      startTime: {
        [militaryStartTime: string]: {
          time: string;
          military: string;
          date: string;
          dateFormat: string;
        };
      };
    };
  };
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

async function getServicesOffered(authCookie: string): Promise<Service[]> {
  const response = await fetch(
    "https://northwestbarberco.resurva.com/services?format=json",
    {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
        cookie: authCookie,
      },
      method: "GET",
    }
  );

  const jsonResult: any = await response.json();

  return jsonResult.services;
}

async function getProvidersOnDay(
  authCookie: string,
  targetDate: Date,
  serviceID: number
): Promise<GetProvidersResponse> {
  const response = await fetch(
    `https://northwestbarberco.resurva.com/services/items?serviceId[]=${serviceID}&format=json&date=${getDateString(
      targetDate
    )}&offset=0&limit=50`,
    {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
        cookie: authCookie,
      },
      method: "GET",
    }
  );

  const providers: any = await response.json();

  return providers;
}

async function getProviderAvailability(
  authCookie: string,
  targetDate: Date,
  serviceID: number,
  provider: Provider
): Promise<GetAvailabilityResponse> {
  const response = await fetch(
    `https://northwestbarberco.resurva.com/index/availability?roomId=${
      provider.id
    }&date=${getDateString(
      targetDate
    )}&serviceId=${serviceID}&allServices=${encodeURIComponent(
      JSON.stringify([serviceID.toString()])
    )}&format=json`,
    {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
        cookie: authCookie,
      },
      method: "GET",
    }
  );

  const availability: any = await response.json();

  return availability;
}

async function getAppointmentsOnDay(
  authCookie: string,
  targetDate: Date,
  serviceID: number
): Promise<Appointment[]> {
  const providers = await getProvidersOnDay(authCookie, targetDate, serviceID);

  const provider = providers.providers.find(
    (p) => p.provider.name.toLowerCase() === process.env.BARBER_NAME
  );

  if (provider.status === "booked") {
    return [];
  }

  const joshAvailability = await getProviderAvailability(
    authCookie,
    targetDate,
    serviceID,
    provider.provider
  );

  if (Object.keys(joshAvailability.startTimes).length === 0) {
    return [];
  }

  const availableTimes =
    joshAvailability.startTimes[provider.provider.id].startTime;

  return Object.keys(availableTimes).map((e) => {
    const availableTime = availableTimes[e];
    let appDate = new Date(availableTime.date);

    appDate = addTimeToDate(appDate, availableTimes[e].time);

    return {
      provider: provider.provider,
      date: appDate,
      serviceID: serviceID,
    };
  });
}

const func = (): string => {
  return "";
};

export default async function getAvailableAppointments(
  authCookie: string,
  targetDate: Date
): Promise<Appointment[]> {
  const services = await getServicesOffered(authCookie);

  const haircutService = services.find(
    (s) => s.service.name.toLowerCase() === "haircut"
  );

  const results = await getAppointmentsOnDay(
    authCookie,
    targetDate,
    haircutService.service.id
  );

  return results.map((r): Appointment => {
    return {
      provider: { name: r.provider.name, id: r.provider.id },
      serviceID: r.serviceID,
      date: r.date,
    };
  });
}
