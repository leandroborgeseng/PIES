'use client';

import { useState } from 'react';
import { AlertaCompatibilidade } from '@/components/alertas/AlertaCompatibilidade';
import { GravidadeBadge, ManutencaoTipoBadge, RiscoBadge, StatusBadge } from '@/components/ui/Badges';
import { KPICard } from '@/components/ui/KPICard';
import { formatBRL, safeUrl } from '@/lib/utils';

type Props = { equipamento: any; compatibilidade: any };

const tabs = ['Técnico', 'Financeiro', 'Manutenção', 'Alertas ANVISA', 'KPIs', 'Dependências'];

function JsonList({ value }: { value: unknown }) {
  const items = Array.isArray(value) ? value : value ? [String(value)] : [];
  if (!items.length) return <span className="subtle">N/I</span>;
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{items.map((item) => <span key={String(item)} className="badge" style={{ color: 'var(--primary)' }}>{String(item)}</span>)}</div>;
}

export function EquipamentoDetalhe({ equipamento, compatibilidade }: Props) {
  const [active, setActive] = useState(tabs[0]);
  const risco = typeof equipamento.score_risco === 'object' ? equipamento.score_risco?.nivel : equipamento.score_risco;
  const manutencao = equipamento.manutencao_tipo ?? {};
  const kpis = equipamento.kpis_referencia ?? {};
  const cco = equipamento.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0;
  const ccoBreakdown = equipamento.pecas_consumiveis?.breakdown_cco_anual_brl ?? equipamento.pecas_consumiveis ?? {};
  const fabricantes = equipamento.fabricantes_referencia?.fabricantes ?? [];

  const content = (() => {
    if (active === 'Técnico') return (
      <div className="grid grid-2">
        <div className="card card-pad"><h3 className="section-title">Descritivo técnico</h3><pre className="mono">{equipamento.descritivo_tecnico?.conteudo ?? 'N/I'}</pre></div>
        <div className="grid">
          <div className="card card-pad"><h3 className="section-title">Normas aplicáveis</h3><JsonList value={equipamento.normas_tecnicas?.abnt_iec} /><JsonList value={equipamento.normas_tecnicas?.anvisa_rdc} /></div>
          <div className="card card-pad"><h3 className="section-title">Instalação</h3><p>Gases</p><JsonList value={equipamento.conexoes_instalacao?.gases} /><p>Elétrica</p><JsonList value={equipamento.conexoes_instalacao?.eletrica} /><p>TCE</p><JsonList value={equipamento.tce_eletrica?.tipo_tomada_recomendada} /></div>
          <div className="card card-pad"><h3 className="section-title">Fabricantes de referência</h3>{fabricantes.length ? fabricantes.map((f: any) => <p key={f.nome}><strong>{f.nome}</strong> · {f.pais_origem ?? 'N/I'} · <a href={safeUrl(f.site)} target="_blank">site</a></p>) : <p className="subtle">N/I</p>}</div>
        </div>
      </div>
    );
    if (active === 'Financeiro') return (
      <div className="grid grid-3">
        <KPICard label="Valor unitário BPS" valor={formatBRL(equipamento.valor_unitario_referencia ?? equipamento.bps_preco?.preco_medio_brl ?? 0)} tone="primary" />
        <KPICard label="CCO anual estimado" valor={formatBRL(cco)} tone="high" />
        <KPICard label="Vida útil" valor={equipamento.vida_util?.anos_estimados ?? 'N/I'} unidade=" anos" tone="info" />
        <div className="card card-pad" style={{ gridColumn: '1 / -1' }}><h3 className="section-title">Breakdown CCO</h3><pre className="mono">{JSON.stringify(ccoBreakdown, null, 2)}</pre></div>
      </div>
    );
    if (active === 'Manutenção') return (
      <div className="grid grid-2">
        <div className="card card-pad"><h3 className="section-title">Responsabilidade</h3><p><ManutencaoTipoBadge tipo={manutencao.responsavel_preferencial} /></p>{manutencao.contrato_obrigatorio && <p><span className="badge" style={{ color: 'var(--high)' }}>Contrato AT obrigatório</span></p>}<pre className="mono">{JSON.stringify(manutencao, null, 2)}</pre></div>
        <div className="card card-pad"><h3 className="section-title">POP associado</h3><p className="subtle">POP ID: {equipamento.pop_id ?? 'N/I'}</p><p>{equipamento.pop_observacao ?? 'Sem observação de POP.'}</p></div>
      </div>
    );
    if (active === 'Alertas ANVISA') return (
      <div className="grid">
        {(equipamento.alertas_anvisa ?? []).length ? equipamento.alertas_anvisa.map((a: any) => <div className="card card-pad" key={a.numero_alerta}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><GravidadeBadge gravidade={a.gravidade} /><StatusBadge status={a.status} /></div><h3>{a.numero_alerta} · {a.produto_afetado}</h3><p>{a.descricao_resumida}</p><p className="subtle">Ação recomendada: {a.acao_recomendada_hospital}</p><a className="button secondary" href={safeUrl(a.url_alerta)} target="_blank">Abrir ANVISA</a></div>) : <div className="card card-pad subtle">Nenhum alerta ANVISA mapeado para este equipamento.</div>}
      </div>
    );
    if (active === 'KPIs') return (
      <div className="grid grid-4">
        <KPICard label="Disponibilidade esperada" valor={kpis.disponibilidade_esperada_pct ?? 0} unidade="%" tone="low" />
        <KPICard label="MTBF" valor={kpis.mtbf_horas ?? 0} unidade=" h" tone="primary" />
        <KPICard label="MTTR" valor={kpis.mttr_horas ?? 0} unidade=" h" tone="high" />
        <KPICard label="Alerta vermelho" valor={kpis.alerta_vermelho_pct ?? 0} unidade="%" tone="critical" />
        <div className="card card-pad" style={{ gridColumn: '1 / -1' }}><strong>Fonte</strong><p className="subtle">{kpis.fonte ?? 'N/I'}</p><p>{kpis.obs ?? ''}</p></div>
      </div>
    );
    return <AlertaCompatibilidade equipamentoNome={equipamento.nome} compatibilidade={compatibilidade} contexto="detalhe" />;
  })();

  return (
    <div>
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div><h2 className="title">{equipamento.nome}</h2><p className="subtle">CATMAT {equipamento.catmat?.codigo ?? 'N/I'} · ANVISA Classe {equipamento.anvisa?.classe_risco ?? 'N/I'}</p></div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}><RiscoBadge nivel={risco} /><span className="mono">Score {equipamento.score_risco?.total ?? 'N/I'}/100</span></div>
        </div>
      </div>
      <div className="tabs">{tabs.map((tab) => <button key={tab} className={`tab ${active === tab ? 'active' : ''}`} onClick={() => setActive(tab)}>{tab}</button>)}</div>
      {content}
    </div>
  );
}
