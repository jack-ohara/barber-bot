export default function formatDatePretty(date: Date): string {
    return `${date.toLocaleDateString('en-GB').padStart(10)}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padEnd(2, '0')}`
}