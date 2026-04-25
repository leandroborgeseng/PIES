import { NextRequest, NextResponse } from 'next/server';
import { gerarProjetoAmbiente } from '@/lib/kb';

export function GET(request: NextRequest) {
  const localidadeId = Number(request.nextUrl.searchParams.get('localidadeId'));
  const quantidade = Number(request.nextUrl.searchParams.get('quantidade') ?? 1);
  if (!localidadeId) return NextResponse.json({ error: 'localidadeId é obrigatório' }, { status: 400 });
  const projeto = gerarProjetoAmbiente(localidadeId, Math.max(1, quantidade || 1));
  if (!projeto) return NextResponse.json({ error: 'Ambiente não encontrado' }, { status: 404 });
  return NextResponse.json({ projeto });
}
