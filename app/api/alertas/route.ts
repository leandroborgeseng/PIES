import { NextRequest, NextResponse } from 'next/server';
import { getAlertas } from '@/lib/kb';

export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status');
  const gravidade = request.nextUrl.searchParams.get('gravidade');
  const alertas = getAlertas().filter((a) => (!status || a.status === status) && (!gravidade || a.gravidade === gravidade));
  return NextResponse.json({ alertas, total: alertas.length });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ ok: true, mensagem: 'Verificação recebida. Persistência será ativada com Prisma.', body });
}
