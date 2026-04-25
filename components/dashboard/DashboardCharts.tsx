'use client';

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const colors: Record<string, string> = {
  'CRÍTICO': '#c53030',
  'ALTO': '#ff4f00',
  'MÉDIO': '#953d00',
  'BAIXO': '#28b400',
  EC_INTERNA: '#28b400',
  ASSISTENCIA_AUTORIZADA: '#ff4f00',
  LABORATORIO_RBC: '#0066b2',
};

export function RiscoDonut({ data }: { data: Record<string, number> }) {
  const items = Object.entries(data).map(([name, value]) => ({ name, value }));
  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={items} innerRadius={62} outerRadius={96} paddingAngle={4} dataKey="value" nameKey="name">
            {items.map((item) => <Cell key={item.name} fill={colors[item.name] ?? '#0066b2'} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d4e0ed', borderRadius: 12, color: '#0a1220' }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item) => <span key={item.name} className="badge" style={{ color: colors[item.name] ?? '#0066b2' }}>{item.name}: {item.value}</span>)}
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
          <XAxis dataKey="name" stroke="#4a5b73" fontSize={11} />
          <YAxis stroke="#4a5b73" />
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #d4e0ed', borderRadius: 12, color: '#0a1220' }} />
          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
            {items.map((item) => <Cell key={item.name} fill={colors[item.name] ?? '#0066b2'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
