'use client';

import Link from 'next/link';
import { AlertTriangle, Ban, Link2, Sparkles } from 'lucide-react';
import { useState } from 'react';

type Compatibilidade = {
  equipamentoNome: string;
  depende_de: string[];
  complementado_por: string[];
  incompativel_com: string[];
  requer_instalacao_conjunta: string[];
  obs: string;
  temAlertaCritico: boolean;
  temAlertaInfo: boolean;
  temIncompativel: boolean;
} | null;

type Props = {
  equipamentoNome: string;
  compatibilidade?: Compatibilidade;
  contexto: 'detalhe' | 'aquisicao' | 'pies' | 'os';
  onVerEquipamento?: (nome: string) => void;
};

function Block({ color, icon, title, items, obs, compact, onVerEquipamento }: { color: string; icon: React.ReactNode; title: string; items: string[]; obs?: string; compact?: boolean; onVerEquipamento?: (nome: string) => void }) {
  const [open, setOpen] = useState(false);
  const visible = compact && !open ? items.slice(0, 3) : items;
  if (!items.length) return null;
  return (
    <div style={{ border: `1px solid ${color}`, background: `${color}18`, borderRadius: 16, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color, fontWeight: 900 }}>{icon}{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {visible.map((nome) => onVerEquipamento ? (
          <button key={nome} className="button secondary" type="button" onClick={() => onVerEquipamento(nome)}>{nome}</button>
        ) : (
          <Link key={nome} className="badge" style={{ color }} href={`/equipamentos?busca=${encodeURIComponent(nome)}`}>{nome}</Link>
        ))}
        {compact && items.length > 3 && <button className="button secondary" type="button" onClick={() => setOpen(!open)}>{open ? 'ver menos' : `+ ${items.length - 3} ver mais`}</button>}
      </div>
      {obs && <p className="subtle" style={{ marginBottom: 0 }}>{obs}</p>}
    </div>
  );
}

export function AlertaCompatibilidade({ equipamentoNome, compatibilidade, contexto, onVerEquipamento }: Props) {
  if (!compatibilidade) return <div className="subtle">Sem dependências mapeadas para {equipamentoNome}.</div>;
  const totalCritico = compatibilidade.depende_de.length + compatibilidade.requer_instalacao_conjunta.length;

  if (contexto === 'os') {
    if (!compatibilidade.temAlertaCritico) return null;
    return <div className="badge" style={{ color: 'var(--critical)' }}><AlertTriangle size={14} />Exige validação de dependências antes da OS: {totalCritico} item(ns)</div>;
  }

  if (contexto === 'aquisicao' || contexto === 'pies') {
    return (
      <div className="card card-pad" style={{ borderColor: totalCritico ? '#ff4f00' : 'var(--border)' }}>
        <strong style={{ color: totalCritico ? 'var(--high)' : 'var(--info)' }}>{totalCritico ? `${totalCritico} dependência(s) crítica(s) para aquisição` : 'Compatibilidade sem bloqueios críticos'}</strong>
        <p className="subtle" style={{ marginBottom: 0 }}>{compatibilidade.obs || `Verificação de compatibilidade para ${equipamentoNome}.`}</p>
      </div>
    );
  }

  return (
    <div className="grid">
      <Block color="var(--critical)" icon={<AlertTriangle size={18} />} title="Este equipamento NÃO FUNCIONA sem:" items={compatibilidade.depende_de} obs={compatibilidade.obs} onVerEquipamento={onVerEquipamento} />
      <Block color="var(--high)" icon={<Link2 size={18} />} title="Deve ser licitado/instalado em conjunto com:" items={compatibilidade.requer_instalacao_conjunta} obs={compatibilidade.obs} onVerEquipamento={onVerEquipamento} />
      <Block color="var(--critical)" icon={<Ban size={18} />} title="Incompatível / não usar simultaneamente com:" items={compatibilidade.incompativel_com} onVerEquipamento={onVerEquipamento} />
      <Block color="var(--primary)" icon={<Sparkles size={18} />} title="Funcionalidade ampliada com:" items={compatibilidade.complementado_por} compact onVerEquipamento={onVerEquipamento} />
      {!compatibilidade.temAlertaCritico && !compatibilidade.temAlertaInfo && !compatibilidade.temIncompativel && <p className="subtle">{compatibilidade.obs || 'Equipamento autônomo, sem dependências relevantes.'}</p>}
    </div>
  );
}
