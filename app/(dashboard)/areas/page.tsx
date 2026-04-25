import { AreaItemManager } from '@/components/configuracoes/AreaItemManager';
import { getAreasEditaveis, getEquipamentosResumo } from '@/lib/kb';

export default function AreasPage() {
  return <AreaItemManager areasSistema={getAreasEditaveis()} equipamentos={getEquipamentosResumo()} />;
}
