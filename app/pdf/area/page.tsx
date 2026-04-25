import Image from 'next/image';
import Link from 'next/link';
import { PrintButton } from '@/components/pdf/PrintButton';
import { gerarProjetoAmbiente, getAmbientesPlanejaveis } from '@/lib/kb';
import { formatBRL } from '@/lib/utils';

export default function PdfAreaPage({ searchParams }: { searchParams?: { localidadeId?: string; quantidade?: string } }) {
  const ambientes = getAmbientesPlanejaveis();
  const fallback = ambientes.find((item) => item.nome === 'Box UTI - Adulto') ?? ambientes[0];
  const localidadeId = Number(searchParams?.localidadeId ?? fallback?.id);
  const quantidade = Number(searchParams?.quantidade ?? 10);
  const projeto = gerarProjetoAmbiente(localidadeId, quantidade) ?? gerarProjetoAmbiente(fallback.id, quantidade);

  if (!projeto) return <div className="pdf-shell">Não foi possível gerar relatório da área.</div>;

  const obrigatorios = projeto.itens.filter((item) => item.classificacao === 'OBRIGATÓRIO' || item.classificacao === 'OBRIGATORIO');
  const alertas = projeto.itens.filter((item) => item.compatibilidade?.temAlertaCritico || item.compatibilidade?.temIncompativel);
  const total = projeto.itens.reduce((sum, item) => sum + item.valorTotal, 0);

  return (
    <main className="pdf-shell">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <Link className="button secondary" href="/">Voltar</Link>
        <PrintButton />
      </div>
      <article className="pdf-page">
        <section className="pdf-header">
          <Image className="pdf-logo" src="/brand/bluebeaver-logo.png" alt="BlueBeaver" width={694} height={132} priority />
          <div style={{ textAlign: 'right' }}>
            <div className="badge" style={{ color: 'var(--primary)' }}>Relatório de área</div>
            <h1 style={{ margin: '10px 0 0', fontSize: 32 }}>{projeto.localidade.nome}</h1>
            <p className="subtle" style={{ margin: '6px 0 0' }}>{projeto.localidade.setorNome} · {projeto.localidade.pavimento}</p>
          </div>
        </section>

        <section className="pdf-body">
          <div className="pdf-kpis">
            <div className="pdf-kpi"><div className="subtle">Dimensionamento</div><strong className="mono">{projeto.parametroProjeto} {projeto.parametroLabel}</strong></div>
            <div className="pdf-kpi"><div className="subtle">Itens</div><strong className="mono">{projeto.itens.length}</strong></div>
            <div className="pdf-kpi"><div className="subtle">Obrigatórios</div><strong className="mono">{obrigatorios.length}</strong></div>
            <div className="pdf-kpi"><div className="subtle">Investimento</div><strong className="mono">{formatBRL(total)}</strong></div>
          </div>

          <section className="pdf-section">
            <h2 className="section-title">Resumo técnico da área</h2>
            <p><strong>Referência normativa:</strong> {projeto.localidade.rdcReferencia ?? 'N/I'}</p>
            <p><strong>Base do KB:</strong> {projeto.baseParametro} {projeto.parametroLabel}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{projeto.localidade.normas.map((norma: string) => <span key={norma} className="badge" style={{ color: 'var(--info)' }}>{norma}</span>)}</div>
          </section>

          <section className="pdf-section">
            <h2 className="section-title">Lista de equipamentos dimensionados</h2>
            <table>
              <thead><tr><th>Equipamento</th><th>Classe</th><th>Qtd</th><th>Valor unit.</th><th>Total</th><th>Justificativa</th></tr></thead>
              <tbody>
                {projeto.itens.map((item) => <tr key={item.id}>
                  <td><strong>{item.nome}</strong></td>
                  <td>{item.classificacao}</td>
                  <td className="mono">{item.quantidade}</td>
                  <td>{formatBRL(item.valorUnitario)}</td>
                  <td><strong>{formatBRL(item.valorTotal)}</strong></td>
                  <td>{item.justificativa ?? item.rdcReferencia ?? 'N/I'}</td>
                </tr>)}
              </tbody>
            </table>
          </section>

          <section className="pdf-section">
            <h2 className="section-title">Alertas de compatibilidade</h2>
            {alertas.length === 0 ? <p className="subtle">Nenhum alerta crítico de compatibilidade identificado para esta área.</p> : <div className="grid">
              {alertas.map((item) => <div key={item.id}>
                <strong>{item.nome}</strong>
                <p className="subtle">{item.compatibilidade?.obs ?? 'Verificar dependências do equipamento.'}</p>
              </div>)}
            </div>}
          </section>
        </section>

        <footer className="pdf-footer">AION · Planejamento Hospitalar · Documento gerado para validação de layout PDF.</footer>
      </article>
    </main>
  );
}
