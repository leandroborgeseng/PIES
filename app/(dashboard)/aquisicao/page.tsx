import { AquisicaoPlanner } from '@/components/aquisicao/AquisicaoPlanner';
import { getEquipamentosResumo } from '@/lib/kb';

export default function AquisicaoPage() {
  const equipamentos = getEquipamentosResumo().map((eq) => ({ id: eq.id, nome: eq.nome, risco: eq.risco, valor: eq.valor, compatibilidade: eq.compatibilidade }));
  return <div className="grid"><div><h2 className="title">Planejamento de aquisição</h2><p className="subtle">Seleção de equipamentos com verificação automática de dependências e pares obrigatórios.</p></div><AquisicaoPlanner equipamentos={equipamentos} /></div>;
}
