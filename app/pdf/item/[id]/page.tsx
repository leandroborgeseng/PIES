import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PrintButton } from '@/components/pdf/PrintButton';
import { getCompatibilidade, getEquipamentoById, getNivelRisco } from '@/lib/kb';
import { formatBRL, safeUrl } from '@/lib/utils';

function asList(value: unknown) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default function PdfItemPage({ params }: { params: { id: string } }) {
  const equipamento: any = getEquipamentoById(params.id);
  if (!equipamento) notFound();

  const risco = getNivelRisco(equipamento);
  const compatibilidade = getCompatibilidade(equipamento.nome);
  const kpis = equipamento.kpis_referencia ?? {};
  const fabricantes = equipamento.fabricantes_referencia?.fabricantes ?? [];
  const valor = equipamento.valor_unitario_referencia ?? equipamento.bps_preco?.preco_medio_brl ?? 0;
  const cco = equipamento.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0;
  const alertas = equipamento.alertas_anvisa ?? [];

  return (
    <main className="pdf-shell">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <Link className="button secondary" href={`/equipamentos/${equipamento.id}`}>Voltar</Link>
        <PrintButton />
      </div>
      <article className="pdf-page">
        <section className="pdf-header">
          <Image className="pdf-logo" src="/brand/bluebeaver-logo.png" alt="BlueBeaver" width={694} height={132} priority />
          <div style={{ textAlign: 'right' }}>
            <div className="badge" style={{ color: 'var(--primary)' }}>Ficha técnica do item</div>
            <h1 style={{ margin: '10px 0 0', fontSize: 30 }}>{equipamento.nome}</h1>
            <p className="subtle" style={{ margin: '6px 0 0' }}>CATMAT {equipamento.catmat?.codigo ?? 'N/I'} · ANVISA Classe {equipamento.anvisa?.classe_risco ?? 'N/I'}</p>
          </div>
        </section>

        <section className="pdf-body">
          <div className="pdf-kpis">
            <div className="pdf-kpi"><div className="subtle">Risco</div><strong className="mono">{risco}</strong></div>
            <div className="pdf-kpi"><div className="subtle">Preço referência</div><strong className="mono">{formatBRL(valor)}</strong></div>
            <div className="pdf-kpi"><div className="subtle">CCO anual</div><strong className="mono">{formatBRL(cco)}</strong></div>
            <div className="pdf-kpi"><div className="subtle">Vida útil</div><strong className="mono">{equipamento.vida_util?.anos_estimados ?? 'N/I'} anos</strong></div>
          </div>

          <section className="pdf-section">
            <h2 className="section-title">Identificação regulatória e técnica</h2>
            <div className="grid grid-2">
              <p><strong>Descrição CATMAT:</strong><br />{equipamento.catmat?.descricao_catmat ?? 'N/I'}</p>
              <p><strong>Nota ANVISA:</strong><br />{equipamento.anvisa?.nota_regulatoria ?? 'N/I'}</p>
              <p><strong>Classe de risco ANVISA:</strong><br />{equipamento.anvisa?.classe_risco ?? 'N/I'}</p>
              <p><strong>Registro ANVISA:</strong><br />{equipamento.anvisa?.requer_registro_anvisa ? 'Requer registro' : 'Dispensado / N/I'}</p>
            </div>
          </section>

          <section className="pdf-section">
            <h2 className="section-title">Descritivo técnico</h2>
            <pre className="mono" style={{ maxHeight: 'none' }}>{equipamento.descritivo_tecnico?.conteudo ?? 'N/I'}</pre>
          </section>

          <section className="pdf-section">
            <h2 className="section-title">Normas e requisitos de instalação</h2>
            <div className="grid grid-2">
              <div><strong>Normas ABNT/IEC</strong><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{asList(equipamento.normas_tecnicas?.abnt_iec).map((norma) => <span key={String(norma)} className="badge" style={{ color: 'var(--info)' }}>{String(norma)}</span>)}</div></div>
              <div><strong>RDCs ANVISA</strong><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{asList(equipamento.normas_tecnicas?.anvisa_rdc).map((norma) => <span key={String(norma)} className="badge" style={{ color: 'var(--info)' }}>{String(norma)}</span>)}</div></div>
              <p><strong>Conexões gases:</strong><br />{asList(equipamento.conexoes_instalacao?.gases).join(', ') || 'N/I'}</p>
              <p><strong>Conexões elétricas:</strong><br />{asList(equipamento.conexoes_instalacao?.eletrica).join(', ') || 'N/I'}</p>
            </div>
          </section>

          <section className="pdf-section">
            <h2 className="section-title">Fabricantes de referência</h2>
            {fabricantes.length === 0 ? <p className="subtle">N/I</p> : <table>
              <thead><tr><th>Fabricante</th><th>País</th><th>Site</th><th>Representante</th></tr></thead>
              <tbody>{fabricantes.map((fabricante: any) => <tr key={fabricante.nome}><td>{fabricante.nome}</td><td>{fabricante.pais_origem ?? 'N/I'}</td><td>{fabricante.site ? <a href={safeUrl(fabricante.site)}>{fabricante.site}</a> : 'N/I'}</td><td>{fabricante.representante_brasil ?? 'N/I'}</td></tr>)}</tbody>
            </table>}
          </section>

          <section className="pdf-section">
            <h2 className="section-title">KPIs e compatibilidade</h2>
            <div className="grid grid-2">
              <p><strong>Disponibilidade esperada:</strong><br />{kpis.disponibilidade_esperada_pct ?? 'N/I'}%</p>
              <p><strong>MTBF / MTTR:</strong><br />{kpis.mtbf_horas ?? 'N/I'} h / {kpis.mttr_horas ?? 'N/I'} h</p>
              <p><strong>Compatibilidade:</strong><br />{compatibilidade?.obs ?? 'Sem dependências mapeadas.'}</p>
              <p><strong>Alertas ANVISA:</strong><br />{alertas.length} alerta(s) mapeado(s)</p>
            </div>
          </section>
        </section>

        <footer className="pdf-footer">AION · Ficha técnica de equipamento · Documento gerado para validação de layout PDF.</footer>
      </article>
    </main>
  );
}
