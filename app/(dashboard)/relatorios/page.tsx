import { getAlertas, getResumoDashboard } from '@/lib/kb';
import { formatBRL } from '@/lib/utils';

export default function RelatoriosPage() {
  const data = getResumoDashboard();
  const alertas = getAlertas();
  return <div className="grid"><div><h2 className="title">Relatórios</h2><p className="subtle">Resumo executivo pronto para exportações futuras em PDF, DOCX e Excel.</p></div><div className="grid grid-3"><div className="card card-pad"><strong>Parque</strong><p>{data.totalEquipamentos} equipamentos cadastrados.</p></div><div className="card card-pad"><strong>CCO</strong><p>{formatBRL(data.ccoAnual)} ao ano.</p></div><div className="card card-pad"><strong>Tecnovigilância</strong><p>{alertas.length} alertas mapeados, {data.alertasAbertos} abertos.</p></div></div><div className="card card-pad"><h3 className="section-title">Próximos relatórios</h3><p className="subtle">Exportação PIES, descritivos técnicos completos e planilha de valores estimados serão acoplados a partir desta base.</p></div></div>;
}
