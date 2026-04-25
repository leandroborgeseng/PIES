'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { RiscoBadge } from '@/components/ui/Badges';
import { formatBRL } from '@/lib/utils';

type Item = {
  id: number;
  nome: string;
  risco: string;
  score: number | null;
  catmat: string;
  anvisa: string;
  valor: number;
  cco: number;
  contratoObrigatorio: boolean;
};

export function EquipamentosExplorer({ equipamentos, initialBusca = '' }: { equipamentos: Item[]; initialBusca?: string }) {
  const [busca, setBusca] = useState(initialBusca);
  const [risco, setRisco] = useState('TODOS');
  const [anvisa, setAnvisa] = useState('TODAS');
  const [contrato, setContrato] = useState('TODOS');
  const [ordem, setOrdem] = useState('risco');

  const filtrados = useMemo(() => {
    const orderRank: Record<string, number> = { 'CRÍTICO': 0, ALTO: 1, 'MÉDIO': 2, BAIXO: 3 };
    return equipamentos
      .filter((eq) => eq.nome.toLowerCase().includes(busca.toLowerCase()))
      .filter((eq) => risco === 'TODOS' || eq.risco === risco)
      .filter((eq) => anvisa === 'TODAS' || eq.anvisa === anvisa)
      .filter((eq) => contrato === 'TODOS' || String(eq.contratoObrigatorio) === contrato)
      .sort((a, b) => {
        if (ordem === 'cco') return b.cco - a.cco;
        if (ordem === 'valor') return b.valor - a.valor;
        if (ordem === 'score') return (b.score ?? 0) - (a.score ?? 0);
        return (orderRank[a.risco] ?? 9) - (orderRank[b.risco] ?? 9);
      });
  }, [anvisa, busca, contrato, equipamentos, ordem, risco]);

  return (
    <div className="grid">
      <div className="card card-pad">
        <div className="grid grid-4">
          <input className="input" placeholder="Buscar por nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="select" value={risco} onChange={(e) => setRisco(e.target.value)}>
            <option value="TODOS">Todos os riscos</option><option>CRÍTICO</option><option>ALTO</option><option>MÉDIO</option><option>BAIXO</option>
          </select>
          <select className="select" value={anvisa} onChange={(e) => setAnvisa(e.target.value)}>
            <option value="TODAS">Todas as classes ANVISA</option><option>I</option><option>II</option><option>III</option><option>IV</option>
          </select>
          <select className="select" value={contrato} onChange={(e) => setContrato(e.target.value)}>
            <option value="TODOS">Contrato AT: todos</option><option value="true">Obrigatório</option><option value="false">Não obrigatório</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
          <span className="subtle">{filtrados.length} equipamento(s) encontrados</span>
          <select className="select" style={{ maxWidth: 220 }} value={ordem} onChange={(e) => setOrdem(e.target.value)}>
            <option value="risco">Ordenar por risco</option><option value="score">Ordenar por score</option><option value="cco">Ordenar por CCO</option><option value="valor">Ordenar por valor</option>
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Risco</th><th>Equipamento</th><th>CATMAT</th><th>ANVISA</th><th>CCO/ano</th><th>Score</th><th></th></tr></thead>
          <tbody>
            {filtrados.map((eq) => (
              <tr key={eq.id}>
                <td><RiscoBadge nivel={eq.risco} /></td>
                <td><strong>{eq.nome}</strong>{eq.contratoObrigatorio && <div className="subtle">Contrato AT obrigatório</div>}</td>
                <td className="mono">{eq.catmat}</td>
                <td>{eq.anvisa}</td>
                <td>{formatBRL(eq.cco)}</td>
                <td className="mono">{eq.score ?? 'N/I'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link className="button secondary" href={`/equipamentos/${eq.id}`}>Ver</Link>
                    <Link className="button secondary" href={`/pdf/item/${eq.id}`}>PDF</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
