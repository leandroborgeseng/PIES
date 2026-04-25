'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { AlertaCompatibilidade } from '@/components/alertas/AlertaCompatibilidade';
import { RiscoBadge } from '@/components/ui/Badges';
import { formatBRL } from '@/lib/utils';

type Ambiente = {
  id: number;
  nome: string;
  setorNome: string;
  pavimento: string;
  baseParametro: number;
  parametroLabel: string;
  totalItens: number;
  investimentoBase: number;
  rdcReferencia?: string | null;
  normas: string[];
};

type Projeto = {
  localidade: { nome: string; setorNome: string; pavimento: string; rdcReferencia?: string | null; normas: string[]; requisitosInstalacao: any };
  baseParametro: number;
  parametroProjeto: number;
  parametroLabel: string;
  itens: Array<any>;
  totalItens: number;
  investimentoTotal: number;
  obrigatorios: number;
  recomendados: number;
};

type Quantidades = Record<number, number>;

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function ProjetoPlanner({ ambientes, projetoInicial }: { ambientes: Ambiente[]; projetoInicial: Projeto }) {
  const [ambienteId, setAmbienteId] = useState(projetoInicial.localidade.nome ? ambientes.find((a) => a.nome === projetoInicial.localidade.nome && a.setorNome === projetoInicial.localidade.setorNome)?.id ?? ambientes[0]?.id : ambientes[0]?.id);
  const ambiente = ambientes.find((item) => item.id === Number(ambienteId)) ?? ambientes[0];
  const [parametro, setParametro] = useState(10);
  const [busca, setBusca] = useState('');
  const [classe, setClasse] = useState('TODOS');
  const [quantidades, setQuantidades] = useState<Quantidades>({});
  const [manualProject, setManualProject] = useState<Projeto>(projetoInicial);

  async function carregarProjeto(nextAmbienteId = ambiente.id, nextParametro = parametro) {
    const res = await fetch(`/api/projetos/ambiente?localidadeId=${nextAmbienteId}&quantidade=${nextParametro}`);
    const data = await res.json();
    setManualProject(data.projeto);
    setQuantidades({});
  }

  const projeto = manualProject;
  const itensComEdicao = useMemo(() => projeto.itens.map((item) => {
    const quantidade = quantidades[item.id] ?? item.quantidade;
    return { ...item, quantidade, valorTotal: quantidade * item.valorUnitario };
  }), [projeto.itens, quantidades]);

  const itensFiltrados = itensComEdicao.filter((item) => {
    const matchBusca = normalizar(item.nome).includes(normalizar(busca));
    const matchClasse = classe === 'TODOS' || item.classificacao === classe;
    return matchBusca && matchClasse;
  });

  const total = itensComEdicao.reduce((sum, item) => sum + item.valorTotal, 0);
  const faltantes = itensComEdicao.flatMap((item) => (item.compatibilidade?.requer_instalacao_conjunta ?? []).filter((nome: string) => !itensComEdicao.some((i) => i.nome === nome)).map((nome: string) => ({ origem: item.nome, nome })));
  const obrigatorios = itensComEdicao.filter((item) => item.classificacao === 'OBRIGATÓRIO' || item.classificacao === 'OBRIGATORIO');

  function alterarAmbiente(id: number) {
    setAmbienteId(id);
    const next = ambientes.find((item) => item.id === id);
    const nextParametro = next?.baseParametro ?? parametro;
    setParametro(nextParametro);
    void carregarProjeto(id, nextParametro);
  }

  function alterarParametro(value: number) {
    const next = Math.max(1, value || 1);
    setParametro(next);
    void carregarProjeto(ambiente.id, next);
  }

  return (
    <div className="grid">
      <section className="card card-pad" style={{ borderColor: '#0066b240' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div className="badge" style={{ color: 'var(--primary)', marginBottom: 12 }}><Building2 size={14} />Novo projeto hospitalar</div>
            <h2 className="title">Monte o hospital por ambientes</h2>
            <p className="subtle" style={{ maxWidth: 760 }}>Escolha uma unidade funcional, informe a quantidade de leitos/salas e o AION dimensiona automaticamente equipamentos, valores, requisitos técnicos e dependências regulatórias.</p>
          </div>
          <div className="card card-pad" style={{ minWidth: 240 }}>
            <div className="subtle">Investimento estimado</div>
            <strong className="mono" style={{ fontSize: 30, color: 'var(--low)' }}>{formatBRL(total)}</strong>
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <div className="grid grid-3">
          <label>
            <div className="subtle" style={{ marginBottom: 6 }}>Ambiente / unidade funcional</div>
            <select className="select" value={ambiente.id} onChange={(e) => alterarAmbiente(Number(e.target.value))}>
              {ambientes.map((item) => <option key={item.id} value={item.id}>{item.setorNome} · {item.nome}</option>)}
            </select>
          </label>
          <label>
            <div className="subtle" style={{ marginBottom: 6 }}>Quantidade de {projeto.parametroLabel}</div>
            <input className="input mono" type="number" min={1} value={parametro} onChange={(e) => alterarParametro(Number(e.target.value))} />
          </label>
          <div>
            <div className="subtle" style={{ marginBottom: 6 }}>Base de referência</div>
            <div className="card card-pad" style={{ padding: 11 }}>{projeto.baseParametro} {projeto.parametroLabel} no KB · {projeto.totalItens} itens</div>
          </div>
        </div>
      </section>

      <section className="grid grid-4">
        <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--primary)', fontWeight: 900 }}>{itensComEdicao.length}</div><strong>Itens projetados</strong></div>
        <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--critical)', fontWeight: 900 }}>{obrigatorios.length}</div><strong>Obrigatórios</strong></div>
        <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--high)', fontWeight: 900 }}>{faltantes.length}</div><strong>Pares faltantes</strong></div>
        <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--low)', fontWeight: 900 }}>{formatBRL(total)}</div><strong>Total editável</strong></div>
      </section>

      {faltantes.length > 0 && <section className="card card-pad" style={{ borderColor: '#ff4f00' }}><strong style={{ color: 'var(--high)' }}><AlertTriangle size={16} /> Dependências de aquisição não incluídas</strong><p className="subtle">{faltantes.map((item) => `${item.origem} exige ${item.nome}`).join(' · ')}</p></section>}

      <section className="grid grid-2">
        <div className="card card-pad">
          <h3 className="section-title">Requisitos do ambiente</h3>
          <p><strong>{projeto.localidade.setorNome}</strong> · {projeto.localidade.nome}</p>
          <p className="subtle">{projeto.localidade.rdcReferencia ?? 'Sem referência RDC específica no KB.'}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{projeto.localidade.normas.map((norma) => <span className="badge" style={{ color: 'var(--info)' }} key={norma}>{norma}</span>)}</div>
        </div>
        <div className="card card-pad">
          <h3 className="section-title">Como o cálculo está sendo feito</h3>
          <p className="subtle">Itens `PER_BED` são escalados pela proporção da base do KB. Itens `PER_N_BEDS` usam grupos de leitos. Itens `FIXED` permanecem fixos e podem ser ajustados manualmente na tabela.</p>
          <div className="badge" style={{ color: 'var(--low)' }}><CheckCircle2 size={14} />Você pode alterar qualquer quantidade antes de fechar o projeto</div>
        </div>
      </section>

      <section className="card card-pad">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar equipamento no projeto" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <select className="select" style={{ maxWidth: 220 }} value={classe} onChange={(e) => setClasse(e.target.value)}>
              <option value="TODOS">Todas as classes</option>
              <option value="OBRIGATÓRIO">Obrigatório</option>
              <option value="RECOMENDADO">Recomendado</option>
              <option value="CONDICIONAL">Condicional</option>
              <option value="OPCIONAL">Opcional</option>
            </select>
          </div>
          <div className="badge" style={{ color: 'var(--primary)' }}><SlidersHorizontal size={14} />Tabela editável</div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Equipamento</th><th>Classe</th><th>Qtd</th><th>Valor unit.</th><th>Total</th><th>Risco</th><th>Regra</th><th>Compatibilidade</th></tr></thead>
            <tbody>
              {itensFiltrados.map((item) => <tr key={item.id}>
                <td><strong>{item.nome}</strong><div className="subtle">{item.justificativa ?? item.rdcReferencia ?? 'Sem justificativa no KB'}</div>{item.equipmentId && <Link className="subtle" href={`/equipamentos/${item.equipmentId}`}>abrir detalhe</Link>}</td>
                <td><span className="badge" style={{ color: item.classificacao === 'OBRIGATÓRIO' ? 'var(--critical)' : 'var(--primary)' }}>{item.classificacao}</span></td>
                <td><input className="input mono" style={{ width: 86 }} type="number" min={0} value={item.quantidade} onChange={(e) => setQuantidades((current) => ({ ...current, [item.id]: Number(e.target.value) || 0 }))} /></td>
                <td>{formatBRL(item.valorUnitario)}</td>
                <td><strong>{formatBRL(item.valorTotal)}</strong></td>
                <td><RiscoBadge nivel={item.risco} /></td>
                <td className="subtle">{item.scalingType}{item.scalingN ? ` / ${item.scalingN}` : ''}</td>
                <td><AlertaCompatibilidade equipamentoNome={item.nome} compatibilidade={item.compatibilidade} contexto="aquisicao" /></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
