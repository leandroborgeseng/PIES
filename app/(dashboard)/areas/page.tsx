import { AreaItemManager } from '@/components/configuracoes/AreaItemManager';
import { getEquipamentosResumo } from '@/lib/kb';

export default function AreasPage() {
  return <AreaItemManager equipamentos={getEquipamentosResumo()} />;
}
