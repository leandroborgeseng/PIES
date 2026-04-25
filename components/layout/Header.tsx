import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        <div className="subtle" style={{ fontSize: 13 }}>AION · Base de conhecimento v2.9</div>
        <h1 style={{ margin: 0, fontSize: 22, letterSpacing: '-.03em' }}>Planejamento de projetos hospitalares</h1>
      </div>
      <div className="badge" style={{ color: 'var(--low)' }}>
        <ShieldCheck size={16} /> Dados reais do KB
      </div>
    </header>
  );
}
