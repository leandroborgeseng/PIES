'use client';

import { useMemo, useState } from 'react';
import { AlertaCompatibilidade } from '@/components/alertas/AlertaCompatibilidade';
import { RiscoBadge } from '@/components/ui/Badges';
import { formatBRL } from '@/lib/utils';

type Equip = { id: number; nome: string; risco: string; valor: number; compatibilidade: any };

export function AquisicaoPlanner({ equipamentos }: { equipamentos: Equip[] }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const escolhidos = equipamentos.filter((eq) => selected[eq.id]);
  const faltantes = useMemo(() => {
    const nomes = new Set(escolhidos.map((eq) => eq.nome));
    return escolhidos.flatMap((eq) => (eq.compatibilidade?.requer_instalacao_conjunta ?? []).filter((nome: string) => !nomes.has(nome)).map((nome: string) => ({ origem: eq.nome, nome })));
  }, [escolhidos]);
  const bloqueios = escolhidos.reduce((sum, eq) => sum + (eq.compatibilidade?.depende_de?.length ?? 0), 0);
  const total = escolhidos.reduce((sum, eq) => sum + eq.valor * selected[eq.id], 0);

  function toggle(eq: Equip) {
    setSelected((current) => {
      const next = { ...current };
      if (next[eq.id]) delete next[eq.id]; else next[eq.id] = 1;
      return next;
    });
  }

  function addFaltantes() {
    const byName = new Map(equipamentos.map((eq) => [eq.nome, eq]));
    setSelected((current) => {
      const next = { ...current };
      faltantes.forEach((item) => { const eq = byName.get(item.nome); if (eq) next[eq.id] = next[eq.id] || 1; });
      return next;
    });
  }

  return (
    <div className="grid">
      <div className="card card-pad" style={{ borderColor: faltantes.length || bloqueios ? 'rgba(249,115,22,.7)' : 'var(--border)' }}>
        <h3 className="section-title">Verificação automática de aquisição</h3>
        <p>{escolhidos.length} equipamento(s) selecionados · {faltantes.length} par(es) obrigatório(s) ausentes · {bloqueios} dependência(s) bloqueante(s)</p>
        <strong className="mono" style={{ fontSize: 28 }}>{formatBRL(total)}</strong>
        {faltantes.length > 0 && <div style={{ marginTop: 12 }}><button className="button" onClick={addFaltantes}>Adicionar pares faltantes automaticamente</button><p className="subtle">{faltantes.map((f) => `${f.origem} exige ${f.nome}`).join(' · ')}</p></div>}
      </div>
      <div className="table-wrap"><table><thead><tr><th></th><th>Equipamento</th><th>Risco</th><th>Qtd</th><th>Valor unitário</th><th>Compatibilidade</th></tr></thead><tbody>{equipamentos.map((eq) => <tr key={eq.id}><td><input type="checkbox" checked={Boolean(selected[eq.id])} onChange={() => toggle(eq)} /></td><td><strong>{eq.nome}</strong></td><td><RiscoBadge nivel={eq.risco} /></td><td><input className="input" style={{ width: 80 }} type="number" min={1} value={selected[eq.id] || 1} onChange={(e) => setSelected((current) => ({ ...current, [eq.id]: Number(e.target.value) || 1 }))} disabled={!selected[eq.id]} /></td><td>{formatBRL(eq.valor)}</td><td><AlertaCompatibilidade equipamentoNome={eq.nome} compatibilidade={eq.compatibilidade} contexto="aquisicao" /></td></tr>)}</tbody></table></div>
    </div>
  );
}
