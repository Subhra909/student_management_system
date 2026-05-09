import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const IST_TIMEZONE = "Asia/Kolkata";

export function formatIST(date: Date | string | number, formatStr: string = "yyyy-MM-dd HH:mm:ss") {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}

export function getCurrentIST() {
  return formatIST(new Date());
}

export function getISTDate() {
  return formatIST(new Date(), "yyyy-MM-dd");
}
