import { NextResponse } from 'next/server';
import { getCompatibilidade, getEquipamentoById } from '@/lib/kb';

export function GET(_: Request, { params }: { params: { id: string } }) {
  const equipamento = getEquipamentoById(params.id);
  if (!equipamento) return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 });
  return NextResponse.json({ equipamento, compatibilidade: getCompatibilidade(equipamento.nome) });
}
