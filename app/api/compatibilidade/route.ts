import { NextRequest, NextResponse } from 'next/server';
import { getCompatibilidade } from '@/lib/kb';

export function GET(request: NextRequest) {
  const nome = request.nextUrl.searchParams.get('nome');
  if (!nome) return NextResponse.json({ error: 'Parâmetro nome é obrigatório' }, { status: 400 });
  return NextResponse.json({ compatibilidade: getCompatibilidade(nome) });
}
