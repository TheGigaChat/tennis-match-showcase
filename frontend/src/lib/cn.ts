import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Build a className string and resolve Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
