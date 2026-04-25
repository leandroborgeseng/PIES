import { AlertCircle, CheckCircle2, FlaskConical, ShieldAlert, Wrench } from 'lucide-react';

const riscoColor: Record<string, string> = {
  'CRÍTICO': 'var(--critical)',
  'ALTO': 'var(--high)',
  'MÉDIO': 'var(--medium)',
  'BAIXO': 'var(--low)',
};

export function RiscoBadge({ nivel }: { nivel?: string | null }) {
  const label = nivel || 'N/I';
  return <span className="badge" style={{ color: riscoColor[label] ?? 'var(--muted)' }}>{label}</span>;
}

export function GravidadeBadge({ gravidade }: { gravidade?: string | null }) {
  const label = gravidade || 'INDETERMINADA';
  return <span className="badge" style={{ color: riscoColor[label.replace('CRÍTICA', 'CRÍTICO')] ?? 'var(--info)' }}><AlertCircle size={14} />{label}</span>;
}

export function ManutencaoTipoBadge({ tipo }: { tipo?: string | null }) {
  const label = tipo || 'EC_INTERNA';
  const Icon = label.includes('LAB') ? FlaskConical : label.includes('ASSIST') || label.includes('AT') ? ShieldAlert : Wrench;
  return <span className="badge" style={{ color: label.includes('LAB') ? 'var(--info)' : label.includes('ASSIST') ? 'var(--high)' : 'var(--low)' }}><Icon size={14} />{label}</span>;
}

export function StatusBadge({ status }: { status?: string | null }) {
  const closed = status?.includes('RESOLVIDO') || status === 'CONCLUIDA';
  return <span className="badge" style={{ color: closed ? 'var(--low)' : 'var(--medium)' }}><CheckCircle2 size={14} />{status ?? 'N/I'}</span>;
}
