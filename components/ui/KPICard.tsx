import { formatNumber } from '@/lib/utils';

type Props = {
  label: string;
  valor: number | string;
  unidade?: string;
  detalhe?: string;
  tone?: 'primary' | 'critical' | 'high' | 'low' | 'info';
};

const toneMap = {
  primary: 'var(--primary)',
  critical: 'var(--critical)',
  high: 'var(--high)',
  low: 'var(--low)',
  info: 'var(--info)',
};

export function KPICard({ label, valor, unidade, detalhe, tone = 'primary' }: Props) {
  const printable = typeof valor === 'number' ? formatNumber(valor) : valor;
  return (
    <div className="card card-pad">
      <div className="mono" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.06em', color: toneMap[tone] }}>{printable}{unidade}</div>
      <div style={{ fontWeight: 800 }}>{label}</div>
      {detalhe && <div className="subtle" style={{ marginTop: 6, fontSize: 13 }}>{detalhe}</div>}
    </div>
  );
}
