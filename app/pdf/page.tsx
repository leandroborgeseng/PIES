import Image from 'next/image';
import Link from 'next/link';
import { getAmbientesPlanejaveis, getEquipamentosResumo } from '@/lib/kb';

export default function PdfIndexPage() {
  const area = getAmbientesPlanejaveis().find((item) => item.nome === 'Box UTI - Adulto') ?? getAmbientesPlanejaveis()[0];
  const monitor = getEquipamentosResumo().find((item) => item.nome.toLowerCase().includes('monitor multiparâmetros')) ?? getEquipamentosResumo()[0];

  return (
    <main className="pdf-shell">
      <section className="pdf-page">
        <div className="pdf-header">
          <Image className="pdf-logo" src="/brand/bluebeaver-logo.png" alt="BlueBeaver" width={694} height={132} priority />
          <div style={{ textAlign: 'right' }}>
            <div className="badge" style={{ color: 'var(--primary)' }}>Laboratório de PDFs</div>
            <h1 style={{ margin: '10px 0 0', fontSize: 32 }}>Pré-visualizações de relatório</h1>
          </div>
        </div>
        <div className="pdf-body">
          <Link className="card card-pad" href={`/pdf/area?localidadeId=${area.id}&quantidade=10`}>
            <strong>Relatório por área</strong>
            <p className="subtle">Exemplo: {area.setorNome} · {area.nome} com 10 {area.parametroLabel}.</p>
          </Link>
          <Link className="card card-pad" href={`/pdf/item/${monitor.id}`}>
            <strong>Ficha técnica de item</strong>
            <p className="subtle">Exemplo: {monitor.nome}.</p>
          </Link>
          <Link className="button secondary no-print" href="/">Voltar ao sistema</Link>
        </div>
      </section>
    </main>
  );
}
