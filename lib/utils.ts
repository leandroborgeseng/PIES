import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatBRL = (value?: number | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value ?? 0);

export const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat('pt-BR').format(value ?? 0);

export function slugify(value: string) {
  return encodeURIComponent(value);
}

export function safeUrl(url?: string | null) {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  return `https://${url}`;
}
