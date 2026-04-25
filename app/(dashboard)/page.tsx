import { ProjetoPlanner } from '@/components/projetos/ProjetoPlanner';
import { getAmbientesPlanejaveis, getEquipamentosResumo } from '@/lib/kb';

export default function HomePage() {
  const ambientes = getAmbientesPlanejaveis();

  if (!ambientes.length) {
    return <div className="card card-pad">Nenhum ambiente planejável encontrado no KB.</div>;
  }

  return <ProjetoPlanner ambientes={ambientes} equipamentos={getEquipamentosResumo()} />;
}
