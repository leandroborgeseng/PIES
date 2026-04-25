import { AlertasANVISA } from '@/components/alertas/AlertasANVISA';
import { getAlertas } from '@/lib/kb';

export default function AlertasPage() {
  return (
    <div className="grid">
      <div><h2 className="title">Alertas ANVISA</h2><p className="subtle">Tecnovigilância com filtros, contadores e exportação CSV dos dados do KB.</p></div>
      <AlertasANVISA alertas={getAlertas()} />
    </div>
  );
}
