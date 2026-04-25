import { ProjetoPlanner } from '@/components/projetos/ProjetoPlanner';
import { gerarProjetoAmbiente, getAmbientesPlanejaveis } from '@/lib/kb';

export default function HomePage() {
  const ambientes = getAmbientesPlanejaveis();
  const utiAdulto = ambientes.find((item) => item.nome === 'Box UTI - Adulto') ?? ambientes[0];
  const projetoInicial = gerarProjetoAmbiente(utiAdulto.id, 10);

  if (!projetoInicial) {
    return <div className="card card-pad">Nenhum ambiente planejável encontrado no KB.</div>;
  }

  return <ProjetoPlanner ambientes={ambientes} projetoInicial={projetoInicial} />;
}
