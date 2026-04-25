import Link from 'next/link';
import Image from 'next/image';
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
    <aside style={{ width: 280, padding: 18, borderRight: '1px solid var(--border)', background: 'rgba(255,255,255,.86)', backdropFilter: 'blur(18px)', position: 'sticky', top: 0, height: '100vh' }}>
      <Link href="/" style={{ display: 'grid', gap: 10, marginBottom: 28 }}>
        <Image
          src="/brand/bluebeaver-logo.png"
          alt="BlueBeaver"
          width={694}
          height={132}
          priority
          style={{ width: '100%', height: 'auto', borderRadius: 12, boxShadow: '0 14px 36px rgba(0, 102, 178, .16)' }}
        />
        <div className="subtle" style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          AION · Planejamento Hospitalar
        </div>
      </Link>
      <nav style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', border: '1px solid var(--border)', borderRadius: 14, background: '#ffffff', color: 'var(--text)' }}>
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
