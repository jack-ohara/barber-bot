export default function addTimeToDate(existingDate: Date, timeString: string): Date {
    const newDate = new Date(existingDate);

    const isPm = timeString.toLowerCase().includes('pm');

    timeString = timeString.replace('am', '');
    timeString = timeString.replace('pm', '');

    const [hours, mins] = timeString.split(':').map(x => parseInt(x));

    newDate.setHours(isPm ? hours + 12 : hours, mins);

    return newDate;
}