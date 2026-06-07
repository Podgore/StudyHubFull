import type { Dayjs } from 'dayjs';

export function pickerDayjsToOffsetIsoString(d: Dayjs): string {
    const date = d.toDate();
    const pad = (n: number) => String(n).padStart(2, '0');
    const Y = date.getFullYear();
    const M = pad(date.getMonth() + 1);
    const D = pad(date.getDate());
    const h = pad(date.getHours());
    const m = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    const ms = date.getMilliseconds();
    const frac = ms ? `.${String(ms).padStart(3, '0')}` : '';
    const tz = -date.getTimezoneOffset();
    const sign = tz >= 0 ? '+' : '-';
    const ah = pad(Math.floor(Math.abs(tz) / 60));
    const am = pad(Math.abs(tz) % 60);
    return `${Y}-${M}-${D}T${h}:${m}:${s}${frac}${sign}${ah}:${am}`;
}

export function parseDurationHhMmSsToMs(duration: string): number | null {
    const m = duration.trim().match(/^(\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return null;
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = parseInt(m[3], 10);
    if (mm > 59 || ss > 59) return null;
    return (hh * 3600 + mm * 60 + ss) * 1000;
}
