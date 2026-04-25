import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { ManutencaoBars, RiscoDonut } from '@/components/dashboard/DashboardCharts';
import { KPICard } from '@/components/ui/KPICard';
import { GravidadeBadge } from '@/components/ui/Badges';
import { formatBRL } from '@/lib/utils';
import { getAmbientesPlanejaveis, getResumoDashboard } from '@/lib/kb';

export default function DashboardPage() {
  const data = getResumoDashboard();
  const ambientesPorSetor = getAmbientesPlanejaveis().reduce<Record<string, number>>((acc, ambiente) => {
    acc[ambiente.setorNome] = (acc[ambiente.setorNome] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="grid">
      <section className="card card-pad">
        <h2 className="title">AION Engenharia Clínica</h2>
        <p className="subtle">Indicadores da base de conhecimento usada para dimensionar novos projetos hospitalares.</p>
      </section>
      <section className="grid grid-4">
        <KPICard label="Equipamentos no parque" valor={data.totalEquipamentos} detalhe="Catálogo completo do KB" />
        <KPICard label="Alertas críticos" valor={data.alertasCriticos} detalhe={`${data.alertasAbertos} alertas abertos`} tone="critical" />
        <KPICard label="CCO anual estimado" valor={formatBRL(data.ccoAnual)} detalhe="Soma de peças e consumíveis" tone="high" />
        <KPICard label="Ambientes planejáveis" valor={Object.values(ambientesPorSetor).reduce((sum, value) => sum + value, 0)} detalhe="Localidades com itens de projeto" tone="info" />
      </section>
      <section className="grid grid-2">
        <div className="card card-pad"><h3 className="section-title">Alertas ANVISA abertos</h3><div className="grid">{data.alertasRecentesCriticos.map((a) => <Link href="/alertas" key={`${a.equipamento_nome}-${a.numero_alerta}`} className="card card-pad" style={{ display: 'block' }}><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AlertTriangle size={16} color="var(--high)" /><GravidadeBadge gravidade={a.gravidade} /></div><strong>{a.equipamento_nome}</strong><p className="subtle" style={{ marginBottom: 0 }}>{a.numero_alerta} · {a.acao_recomendada_hospital}</p></Link>)}</div></div>
        <div className="card card-pad"><h3 className="section-title">Equipamentos por score de risco</h3><RiscoDonut data={data.distribuicaoRisco} /></div>
      </section>
      <section className="grid grid-2">
        <div className="card card-pad"><h3 className="section-title">Ambientes planejáveis por setor</h3><ManutencaoBars data={ambientesPorSetor} /></div>
        <div className="card card-pad"><h3 className="section-title">Top 10 CCO por equipamento</h3><div className="table-wrap"><table><thead><tr><th>Equipamento</th><th>CCO/ano</th></tr></thead><tbody>{data.top10CCO.map((eq: any) => <tr key={eq.id}><td>{eq.nome}</td><td>{formatBRL(eq.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0)}</td></tr>)}</tbody></table></div></div>
      </section>
    </div>
  );
}
