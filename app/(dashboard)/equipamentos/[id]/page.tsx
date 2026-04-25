import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EquipamentoDetalhe } from '@/components/equipamentos/EquipamentoDetalhe';
import { getCompatibilidade, getEquipamentoById } from '@/lib/kb';

export default function EquipamentoDetalhePage({ params }: { params: { id: string } }) {
  const equipamento = getEquipamentoById(params.id);
  if (!equipamento) notFound();
  return (
    <div className="grid">
      <Link href="/equipamentos" className="button secondary" style={{ width: 'fit-content' }}>Voltar ao catálogo</Link>
      <EquipamentoDetalhe equipamento={equipamento} compatibilidade={getCompatibilidade(equipamento.nome)} />
    </div>
  );
}
