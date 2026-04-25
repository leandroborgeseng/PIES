import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AION Engenharia Clínica',
  description: 'Sistema de gestão de Engenharia Clínica Hospitalar para o Hospital Estadual 3 Colinas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
