export interface Provider {
    id: number;
    name: string;
}

export interface Appointment {
    provider: Provider;
    serviceID: number;
    date: Date;
}

export interface AuthInfo {
    csrf: string;
    authCookie: string;
}