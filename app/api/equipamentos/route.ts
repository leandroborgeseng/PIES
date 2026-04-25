import { NextRequest, NextResponse } from 'next/server';
import { getEquipamentosResumo } from '@/lib/kb';

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const risco = searchParams.get('risco');
  const anvisa = searchParams.get('anvisa');
  const busca = searchParams.get('busca')?.toLowerCase();
  const data = getEquipamentosResumo().filter((eq) =>
    (!risco || eq.risco === risco) &&
    (!anvisa || eq.anvisa === anvisa) &&
    (!busca || eq.nome.toLowerCase().includes(busca))
  );
  return NextResponse.json({ equipamentos: data, total: data.length });
}
