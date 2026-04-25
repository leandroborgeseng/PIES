import { EquipamentosExplorer } from '@/components/equipamentos/EquipamentosExplorer';
import { getEquipamentosResumo } from '@/lib/kb';

export default function EquipamentosPage({ searchParams }: { searchParams?: { busca?: string } }) {
  return (
    <div className="grid">
      <div><h2 className="title">Catálogo de equipamentos</h2><p className="subtle">Busca, filtros e priorização por risco, ANVISA, contrato e CCO.</p></div>
      <EquipamentosExplorer equipamentos={getEquipamentosResumo()} initialBusca={searchParams?.busca ?? ''} />
    </div>
  );
}
