import { NextResponse } from 'next/server';
import { getResumoDashboard } from '@/lib/kb';

export function GET() {
  return NextResponse.json(getResumoDashboard());
}
