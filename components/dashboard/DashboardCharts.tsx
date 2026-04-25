'use client';

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const colors: Record<string, string> = {
  'CRÍTICO': '#ef4444',
  'ALTO': '#f97316',
  'MÉDIO': '#eab308',
  'BAIXO': '#22c55e',
  EC_INTERNA: '#22c55e',
  ASSISTENCIA_AUTORIZADA: '#f97316',
  LABORATORIO_RBC: '#8b5cf6',
};

export function RiscoDonut({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={items} innerRadius={62} outerRadius={96} paddingAngle={4} dataKey="value" nameKey="name">
            {items.map((item) => <Cell key={item.name} fill={colors[item.name] ?? '#3b82f6'} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item) => <span key={item.name} className="badge" style={{ color: colors[item.name] ?? '#3b82f6' }}>{item.name}: {item.value}</span>)}
      </div>
    </div>
  );
}

export function ManutencaoBars({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <div style={{ height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={items} margin={{ left: 0, right: 16, top: 16, bottom: 24 }}>
          <XAxis dataKey="name" stroke="#8b93a7" fontSize={11} />
          <YAxis stroke="#8b93a7" />
          <Tooltip contentStyle={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: 12 }} />
          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
            {items.map((item) => <Cell key={item.name} fill={colors[item.name] ?? '#3b82f6'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
