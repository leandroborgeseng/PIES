import Link from 'next/link';
import { Activity, AlertTriangle, BarChart3, ClipboardList, FileText, PackagePlus } from 'lucide-react';

const items = [
  { href: '/', label: 'Novo Projeto', icon: ClipboardList },
  { href: '/dashboard', label: 'Indicadores KB', icon: BarChart3 },
  { href: '/aquisicao', label: 'Aquisição', icon: PackagePlus },
  { href: '/equipamentos', label: 'Catálogo Técnico', icon: Activity },
  { href: '/alertas', label: 'Alertas ANVISA', icon: AlertTriangle },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
];

export function Sidebar() {
  return (
    <aside style={{ width: 280, padding: 18, borderRight: '1px solid var(--border)', background: 'rgba(10,10,15,.82)', position: 'sticky', top: 0, height: '100vh' }}>
      <Link href="/" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28 }}>
        <div style={{ width: 42, height: 42, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <ClipboardList size={22} />
        </div>
        <div>
          <strong style={{ fontSize: 20, letterSpacing: '-.04em' }}>AION</strong>
          <div className="subtle" style={{ fontSize: 12 }}>Planejamento Hospitalar</div>
        </div>
      </Link>
      <nav style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 14, background: '#101018', color: '#dbe3f4' }}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="card card-pad" style={{ marginTop: 24 }}>
        <div className="subtle" style={{ fontSize: 12 }}>Objetivo</div>
        <strong>Projetar novos hospitais</strong>
        <p className="subtle" style={{ marginBottom: 0, fontSize: 13 }}>Ambientes, leitos, equipamentos e orçamento</p>
      </div>
    </aside>
  );
}
