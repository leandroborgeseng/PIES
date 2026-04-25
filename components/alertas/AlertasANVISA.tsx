'use client';

import { useMemo, useState } from 'react';
import { GravidadeBadge, StatusBadge } from '@/components/ui/Badges';
import { safeUrl } from '@/lib/utils';

type Alerta = any;

export function AlertasANVISA({ alertas }: { alertas: Alerta[] }) {
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [gravidade, setGravidade] = useState('TODAS');
  const [fabricante, setFabricante] = useState('TODOS');
  const [open, setOpen] = useState<string | null>(null);

  const fabricantes = useMemo(() => Array.from(new Set(alertas.map((a) => a.fabricante).filter(Boolean))).sort(), [alertas]);
  const filtered = useMemo(() => alertas.filter((a) => {
    const text = `${a.equipamento_nome} ${a.produto_afetado} ${a.empresa_notificante} ${a.numero_alerta}`.toLowerCase();
    return text.includes(busca.toLowerCase()) && (status === 'TODOS' || a.status === status) && (gravidade === 'TODAS' || a.gravidade === gravidade) && (fabricante === 'TODOS' || a.fabricante === fabricante);
  }), [alertas, busca, fabricante, gravidade, status]);

  const csv = () => {
    const rows = [['equipamento','numero','gravidade','status','fabricante','acao'], ...filtered.map((a) => [a.equipamento_nome, a.numero_alerta, a.gravidade, a.status, a.fabricante, a.acao_recomendada_hospital])];
    const blob = new Blob([rows.map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alertas-anvisa-aion.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid">
      <div className="grid grid-4">
        <div className="card card-pad"><div className="mono" style={{ fontSize: 32, color: 'var(--high)', fontWeight: 900 }}>{alertas.filter((a) => a.status === 'ABERTO').length}</div><strong>Alertas abertos</strong></div>
        <div className="card card-pad"><div className="mono" style={{ fontSize: 32, color: 'var(--critical)', fontWeight: 900 }}>{alertas.filter((a) => a.status === 'ABERTO' && a.gravidade === 'CRÍTICA').length}</div><strong>Críticos</strong></div>
        <div className="card card-pad"><div className="mono" style={{ fontSize: 32, color: 'var(--medium)', fontWeight: 900 }}>{alertas.filter((a) => !a.data_verificacao_ec).length}</div><strong>Sem verificação EC</strong></div>
        <div className="card card-pad"><button className="button" onClick={csv}>Exportar CSV</button><p className="subtle">Exporta a lista filtrada.</p></div>
      </div>
      <div className="card card-pad"><div className="grid grid-4"><input className="input" placeholder="Buscar alerta" value={busca} onChange={(e) => setBusca(e.target.value)} /><select className="select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="TODOS">Todos os status</option><option>ABERTO</option><option>RESOLVIDO</option><option>RESOLVIDO_POR_SOFTWARE</option></select><select className="select" value={gravidade} onChange={(e) => setGravidade(e.target.value)}><option value="TODAS">Todas as gravidades</option><option>CRÍTICA</option><option>ALTA</option><option>MÉDIA</option><option>BAIXA</option><option>INDETERMINADA</option></select><select className="select" value={fabricante} onChange={(e) => setFabricante(e.target.value)}><option value="TODOS">Todos os fabricantes</option>{fabricantes.map((f) => <option key={f}>{f}</option>)}</select></div></div>
      <div className="grid">
        {filtered.map((a) => {
          const key = `${a.equipamento_nome}-${a.numero_alerta}`;
          const expanded = open === key;
          return <div key={key} className="card card-pad" style={{ borderLeft: `4px solid ${a.gravidade === 'CRÍTICA' ? 'var(--critical)' : a.gravidade === 'ALTA' ? 'var(--high)' : 'var(--info)'}` }}><button type="button" onClick={() => setOpen(expanded ? null : key)} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><GravidadeBadge gravidade={a.gravidade} /><StatusBadge status={a.status} /></div><h3>{a.equipamento_nome}</h3><p className="subtle">{a.numero_alerta} · {a.produto_afetado}</p></div><strong>{a.empresa_notificante}</strong></div></button>{expanded && <div><p>{a.descricao_resumida}</p><p><strong>Ação hospital:</strong> {a.acao_recomendada_hospital}</p><p className="subtle">Modelos: {(a.modelos_afetados ?? []).join(', ') || 'N/I'}</p><a className="button secondary" target="_blank" href={safeUrl(a.url_alerta)}>Abrir portal ANVISA</a></div>}</div>;
        })}
      </div>
    </div>
  );
}
