'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, ClipboardCheck, FileText, SlidersHorizontal, Trash2 } from 'lucide-react';
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
  custom?: boolean;
  itensCustom?: CustomItem[];
};

type EquipamentoCatalogo = {
  id: number;
  nome: string;
  risco: string;
  valor: number;
  compatibilidade: any;
};

type CustomItem = {
  id: number;
  equipmentId: number;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  classificacao: string;
  justificativa?: string;
};

type CustomArea = {
  id: number;
  nome: string;
  setorNome: string;
  pavimento: string;
  parametroLabel: string;
  baseParametro: number;
  itens: CustomItem[];
};

type ItemProjeto = {
  id: number;
  equipmentId: number;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  classificacao: string;
  rdcReferencia?: string | null;
  justificativa?: string | null;
  observacao?: string | null;
  scalingType: string;
  scalingN?: number | null;
  risco: string;
  compatibilidade: any;
};

type ProjetoAmbiente = {
  localidade: { id: number; nome: string; setorNome: string; pavimento: string; rdcReferencia?: string | null; normas: string[] };
  baseParametro: number;
  parametroProjeto: number;
  parametroLabel: string;
  itens: ItemProjeto[];
  investimentoTotal: number;
};

type AreaSelecionada = Record<number, { quantidade: number }>;
type EdicaoItem = { quantidade?: number; valorUnitario?: number; excluido?: boolean; justificativa?: string };
type Edicoes = Record<string, EdicaoItem>;

const CUSTOM_AREAS_STORAGE_KEY = 'aion_custom_areas';

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function itemKey(areaId: number, itemId: number) {
  return `${areaId}:${itemId}`;
}

function classificarObrigatorio(classe: string) {
  return classe === 'OBRIGATÓRIO' || classe === 'OBRIGATORIO';
}

function gerarProjetoCustomizado(area: Ambiente, parametroProjeto: number, equipamentos: EquipamentoCatalogo[]): ProjetoAmbiente {
  const fator = parametroProjeto / Math.max(1, area.baseParametro);
  const itens = (area.itensCustom ?? []).map((item) => {
    const equipamento = equipamentos.find((eq) => eq.id === item.equipmentId);
    const quantidade = Math.max(1, Math.ceil(item.quantidade * fator));
    const valorUnitario = item.valorUnitario ?? equipamento?.valor ?? 0;
    return {
      id: item.id,
      equipmentId: item.equipmentId,
      nome: item.nome,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      classificacao: item.classificacao,
      rdcReferencia: 'Área customizada pelo usuário',
      justificativa: item.justificativa ?? null,
      observacao: item.justificativa ?? null,
      scalingType: 'CUSTOM',
      scalingN: null,
      risco: equipamento?.risco ?? 'N/I',
      compatibilidade: equipamento?.compatibilidade ?? null,
    };
  });
  return {
    localidade: {
      id: area.id,
      nome: area.nome,
      setorNome: area.setorNome,
      pavimento: area.pavimento,
      rdcReferencia: 'Área customizada pelo usuário',
      normas: [],
    },
    baseParametro: area.baseParametro,
    parametroProjeto,
    parametroLabel: area.parametroLabel,
    itens,
    investimentoTotal: itens.reduce((sum, item) => sum + item.valorTotal, 0),
  };
}

export function ProjetoPlanner({ ambientes, equipamentos }: { ambientes: Ambiente[]; equipamentos: EquipamentoCatalogo[] }) {
  const [areasCustomizadas, setAreasCustomizadas] = useState<Ambiente[]>([]);
  const ambientesDisponiveis = useMemo(() => [...areasCustomizadas, ...ambientes], [ambientes, areasCustomizadas]);
  const sugestaoInicial = ambientesDisponiveis.find((item) => item.nome === 'Box UTI - Adulto') ?? ambientesDisponiveis[0];
  const [etapa, setEtapa] = useState(1);
  const [nomeProjeto, setNomeProjeto] = useState('Novo Hospital');
  const [cliente, setCliente] = useState('');
  const [buscaArea, setBuscaArea] = useState('UTI');
  const [setorFiltro, setSetorFiltro] = useState('TODOS');
  const [areasSelecionadas, setAreasSelecionadas] = useState<AreaSelecionada>(() => sugestaoInicial ? { [sugestaoInicial.id]: { quantidade: 10 } } : {});
  const [projetos, setProjetos] = useState<ProjetoAmbiente[]>([]);
  const [edicoes, setEdicoes] = useState<Edicoes>({});
  const [buscaItem, setBuscaItem] = useState('');
  const [classeFiltro, setClasseFiltro] = useState('TODOS');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    function carregarAreasCustomizadas() {
      try {
        const stored = JSON.parse(window.localStorage.getItem(CUSTOM_AREAS_STORAGE_KEY) ?? '[]') as CustomArea[];
        setAreasCustomizadas(stored.map((area) => ({
          id: area.id,
          nome: area.nome,
          setorNome: area.setorNome,
          pavimento: area.pavimento,
          baseParametro: area.baseParametro,
          parametroLabel: area.parametroLabel,
          totalItens: area.itens.length,
          investimentoBase: area.itens.reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0),
          rdcReferencia: 'Área customizada pelo usuário',
          normas: [],
          custom: true,
          itensCustom: area.itens,
        })));
      } catch {
        setAreasCustomizadas([]);
      }
    }
    carregarAreasCustomizadas();
    window.addEventListener('aion-custom-areas-updated', carregarAreasCustomizadas);
    window.addEventListener('storage', carregarAreasCustomizadas);
    return () => {
      window.removeEventListener('aion-custom-areas-updated', carregarAreasCustomizadas);
      window.removeEventListener('storage', carregarAreasCustomizadas);
    };
  }, []);

  const setores = useMemo(() => Array.from(new Set(ambientesDisponiveis.map((item) => item.setorNome))).sort(), [ambientesDisponiveis]);
  const areasFiltradas = ambientesDisponiveis.filter((ambiente) => {
    const texto = normalizar(`${ambiente.setorNome} ${ambiente.nome}`);
    return texto.includes(normalizar(buscaArea)) && (setorFiltro === 'TODOS' || ambiente.setorNome === setorFiltro);
  });

  const itensConsolidados = useMemo(() => projetos.flatMap((projeto) => projeto.itens.map((item) => {
    const key = itemKey(projeto.localidade.id, item.id);
    const edicao = edicoes[key] ?? {};
    const quantidadeFinal = edicao.quantidade ?? item.quantidade;
    const valorFinal = edicao.valorUnitario ?? item.valorUnitario;
    const excluido = Boolean(edicao.excluido);
    return {
      ...item,
      key,
      areaId: projeto.localidade.id,
      areaNome: projeto.localidade.nome,
      setorNome: projeto.localidade.setorNome,
      quantidadeSistema: item.quantidade,
      valorSistema: item.valorUnitario,
      quantidadeFinal,
      valorFinal,
      totalFinal: excluido ? 0 : quantidadeFinal * valorFinal,
      excluido,
      justificativaAlteracao: edicao.justificativa ?? '',
    };
  })), [edicoes, projetos]);

  const itensVisiveis = itensConsolidados.filter((item) => {
    const matchBusca = normalizar(`${item.nome} ${item.areaNome} ${item.setorNome}`).includes(normalizar(buscaItem));
    const matchClasse = classeFiltro === 'TODOS' || item.classificacao === classeFiltro;
    return matchBusca && matchClasse;
  });

  const apontamentos = itensConsolidados.filter((item) => item.excluido || item.quantidadeFinal !== item.quantidadeSistema || item.valorFinal !== item.valorSistema);
  const apontamentosSemJustificativa = apontamentos.filter((item) => !item.justificativaAlteracao.trim());
  const totalSistema = projetos.reduce((sum, projeto) => sum + projeto.investimentoTotal, 0);
  const totalFinal = itensConsolidados.reduce((sum, item) => sum + item.totalFinal, 0);
  const totalAreas = Object.keys(areasSelecionadas).length;

  function toggleArea(ambiente: Ambiente) {
    setAreasSelecionadas((current) => {
      const next = { ...current };
      if (next[ambiente.id]) delete next[ambiente.id];
      else next[ambiente.id] = { quantidade: ambiente.baseParametro || 1 };
      return next;
    });
  }

  function alterarQuantidadeArea(ambienteId: number, quantidade: number) {
    setAreasSelecionadas((current) => ({
      ...current,
      [ambienteId]: { quantidade: Math.max(1, quantidade || 1) },
    }));
  }

  function atualizarEdicao(key: string, patch: EdicaoItem) {
    setEdicoes((current) => ({ ...current, [key]: { ...(current[key] ?? {}), ...patch } }));
  }

  function resetarItem(key: string) {
    setEdicoes((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function popularProjeto() {
    const selecionadas = Object.entries(areasSelecionadas);
    if (!selecionadas.length) return;
    setCarregando(true);
    try {
      const respostas = await Promise.all(selecionadas.map(async ([id, config]) => {
        const area = ambientesDisponiveis.find((ambiente) => ambiente.id === Number(id));
        if (area?.custom) return gerarProjetoCustomizado(area, config.quantidade, equipamentos);
        const res = await fetch(`/api/projetos/ambiente?localidadeId=${id}&quantidade=${config.quantidade}`);
        const data = await res.json();
        return data.projeto as ProjetoAmbiente;
      }));
      setProjetos(respostas.filter(Boolean));
      setEdicoes({});
      setEtapa(3);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="grid">
      <section className="card card-pad" style={{ borderColor: '#0066b240' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div className="badge" style={{ color: 'var(--primary)', marginBottom: 12 }}><Building2 size={14} />Fluxo de projeto hospitalar</div>
            <h2 className="title">Crie o projeto, escolha as áreas e feche os apontamentos</h2>
            <p className="subtle" style={{ maxWidth: 820 }}>O AION popula os equipamentos sugeridos para cada área. Você pode aceitar, alterar quantidade/preço ou excluir itens, sempre registrando a justificativa das mudanças.</p>
          </div>
          <div className="card card-pad" style={{ minWidth: 260 }}>
            <div className="subtle">Total final do projeto</div>
            <strong className="mono" style={{ fontSize: 30, color: 'var(--low)' }}>{formatBRL(totalFinal || totalSistema)}</strong>
            <div className="subtle" style={{ marginTop: 6 }}>{totalAreas} área(s) · {itensConsolidados.length || '—'} item(ns)</div>
          </div>
        </div>
      </section>

      <section className="grid grid-4">
        {[['1', 'Projeto'], ['2', 'Áreas'], ['3', 'Itens'], ['4', 'Fechamento']].map(([numero, label]) => (
          <button key={numero} className={`card card-pad ${etapa === Number(numero) ? '' : ''}`} style={{ textAlign: 'left', borderColor: etapa === Number(numero) ? 'var(--primary)' : 'var(--border)', cursor: 'pointer' }} onClick={() => setEtapa(Number(numero))}>
            <div className="badge" style={{ color: etapa === Number(numero) ? 'var(--primary)' : 'var(--muted)' }}>{numero}</div>
            <strong style={{ display: 'block', marginTop: 8 }}>{label}</strong>
          </button>
        ))}
      </section>

      {etapa === 1 && (
        <section className="card card-pad">
          <h3 className="section-title">1. Criar novo projeto</h3>
          <div className="grid grid-2">
            <label><div className="subtle" style={{ marginBottom: 6 }}>Nome do projeto</div><input className="input" value={nomeProjeto} onChange={(e) => setNomeProjeto(e.target.value)} placeholder="Ex.: Hospital Municipal — Etapa 1" /></label>
            <label><div className="subtle" style={{ marginBottom: 6 }}>Cliente / unidade</div><input className="input" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex.: Prefeitura, OSS, grupo hospitalar" /></label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><button className="button" onClick={() => setEtapa(2)}>Escolher áreas</button></div>
        </section>
      )}

      {etapa === 2 && (
        <section className="card card-pad">
          <h3 className="section-title">2. Escolher áreas que contemplarão o projeto</h3>
          <div className="grid grid-3" style={{ marginBottom: 14 }}>
            <input className="input" placeholder="Buscar área, ex.: UTI adulto" value={buscaArea} onChange={(e) => setBuscaArea(e.target.value)} />
            <select className="select" value={setorFiltro} onChange={(e) => setSetorFiltro(e.target.value)}><option value="TODOS">Todos os setores</option>{setores.map((setor) => <option key={setor}>{setor}</option>)}</select>
            <button className="button" disabled={!totalAreas || carregando} onClick={popularProjeto}>{carregando ? 'Populando...' : `Popular ${totalAreas} área(s)`}</button>
          </div>
          <div className="grid grid-2">
            {areasFiltradas.map((ambiente) => {
              const selected = areasSelecionadas[ambiente.id];
              return <div key={ambiente.id} className="card card-pad" style={{ borderColor: selected ? 'var(--primary)' : 'var(--border)' }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={Boolean(selected)} onChange={() => toggleArea(ambiente)} />
                  <span><strong>{ambiente.setorNome} · {ambiente.nome}</strong><span className="subtle" style={{ display: 'block' }}>{ambiente.totalItens} itens {ambiente.custom ? 'customizados' : 'no KB'} · base {ambiente.baseParametro} {ambiente.parametroLabel}</span></span>
                </label>
                {selected && <label style={{ display: 'block', marginTop: 12 }}><div className="subtle" style={{ marginBottom: 6 }}>Quantidade de {ambiente.parametroLabel}</div><input className="input mono" type="number" min={1} value={selected.quantidade} onChange={(e) => alterarQuantidadeArea(ambiente.id, Number(e.target.value))} /></label>}
              </div>;
            })}
          </div>
        </section>
      )}

      {etapa === 3 && (
        <section className="grid">
          <div className="grid grid-4">
            <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--primary)', fontWeight: 900 }}>{projetos.length}</div><strong>Áreas populadas</strong></div>
            <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--primary)', fontWeight: 900 }}>{itensConsolidados.length}</div><strong>Itens sugeridos</strong></div>
            <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--high)', fontWeight: 900 }}>{apontamentos.length}</div><strong>Alterações</strong></div>
            <div className="card card-pad"><div className="mono" style={{ fontSize: 30, color: 'var(--low)', fontWeight: 900 }}>{formatBRL(totalFinal)}</div><strong>Total final</strong></div>
          </div>

          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                <input className="input" style={{ maxWidth: 360 }} placeholder="Buscar equipamento ou área" value={buscaItem} onChange={(e) => setBuscaItem(e.target.value)} />
                <select className="select" style={{ maxWidth: 220 }} value={classeFiltro} onChange={(e) => setClasseFiltro(e.target.value)}><option value="TODOS">Todas as classes</option><option value="OBRIGATÓRIO">Obrigatório</option><option value="RECOMENDADO">Recomendado</option><option value="CONDICIONAL">Condicional</option><option value="OPCIONAL">Opcional</option></select>
              </div>
              <div className="badge" style={{ color: 'var(--primary)' }}><SlidersHorizontal size={14} />Quantidade, preço, exclusão e justificativa</div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Área / item</th><th>Classe</th><th>Sistema</th><th>Usuário</th><th>Preço usuário</th><th>Total</th><th>Status</th><th>Justificativa</th></tr></thead>
                <tbody>
                  {itensVisiveis.map((item) => {
                    const alterado = item.excluido || item.quantidadeFinal !== item.quantidadeSistema || item.valorFinal !== item.valorSistema;
                    return <tr key={item.key} style={{ opacity: item.excluido ? .55 : 1 }}>
                      <td><strong>{item.nome}</strong><div className="subtle">{item.setorNome} · {item.areaNome}</div>{item.equipmentId && <Link className="subtle" href={`/equipamentos/${item.equipmentId}`}>abrir detalhe técnico</Link>}<div style={{ marginTop: 8 }}><AlertaCompatibilidade equipamentoNome={item.nome} compatibilidade={item.compatibilidade} contexto="aquisicao" /></div></td>
                      <td><span className="badge" style={{ color: classificarObrigatorio(item.classificacao) ? 'var(--critical)' : 'var(--primary)' }}>{item.classificacao}</span><div style={{ marginTop: 8 }}><RiscoBadge nivel={item.risco} /></div></td>
                      <td className="mono">{item.quantidadeSistema} un.<br />{formatBRL(item.valorSistema)}</td>
                      <td><input className="input mono" style={{ width: 86 }} type="number" min={0} value={item.quantidadeFinal} disabled={item.excluido} onChange={(e) => atualizarEdicao(item.key, { quantidade: Number(e.target.value) || 0 })} /></td>
                      <td><input className="input mono" style={{ width: 130 }} type="number" min={0} value={item.valorFinal} disabled={item.excluido} onChange={(e) => atualizarEdicao(item.key, { valorUnitario: Number(e.target.value) || 0 })} /></td>
                      <td><strong>{formatBRL(item.totalFinal)}</strong></td>
                      <td><button className="button secondary" type="button" onClick={() => atualizarEdicao(item.key, { excluido: !item.excluido })}><Trash2 size={14} /> {item.excluido ? 'Reincluir' : 'Excluir'}</button>{alterado && <button className="button secondary" type="button" style={{ marginTop: 8 }} onClick={() => resetarItem(item.key)}>Usar sistema</button>}</td>
                      <td>
                        {alterado ? (
                          <textarea
                            className="textarea"
                            placeholder="Obrigatório: explique a alteração"
                            value={item.justificativaAlteracao}
                            onChange={(e) => atualizarEdicao(item.key, { justificativa: e.target.value })}
                            style={{ minWidth: 220, minHeight: 74, borderColor: !item.justificativaAlteracao.trim() ? 'var(--high)' : undefined }}
                          />
                        ) : (
                          <span className="subtle">—</span>
                        )}
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
              <button className="button secondary" onClick={() => setEtapa(2)}>Voltar para áreas</button>
              <button className="button" onClick={() => setEtapa(4)}>Fechar e revisar apontamentos</button>
            </div>
          </div>
        </section>
      )}

      {etapa === 4 && (
        <section className="grid">
          <div className="card card-pad">
            <div className="badge" style={{ color: apontamentosSemJustificativa.length ? 'var(--high)' : 'var(--low)', marginBottom: 12 }}>{apontamentosSemJustificativa.length ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}{apontamentosSemJustificativa.length ? `${apontamentosSemJustificativa.length} justificativa(s) pendente(s)` : 'Projeto pronto para fechamento'}</div>
            <h3 className="section-title">4. Fechamento do projeto</h3>
            <p><strong>{nomeProjeto}</strong>{cliente ? ` · ${cliente}` : ''}</p>
            <div className="grid grid-3">
              <div className="card card-pad"><div className="subtle">Valor pelo sistema</div><strong className="mono">{formatBRL(totalSistema)}</strong></div>
              <div className="card card-pad"><div className="subtle">Valor final usuário</div><strong className="mono">{formatBRL(totalFinal)}</strong></div>
              <div className="card card-pad"><div className="subtle">Diferença</div><strong className="mono" style={{ color: totalFinal - totalSistema < 0 ? 'var(--high)' : 'var(--low)' }}>{formatBRL(totalFinal - totalSistema)}</strong></div>
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title"><ClipboardCheck size={18} /> Apontamentos de alteração</h3>
            {!apontamentos.length ? <p className="subtle">Nenhuma alteração registrada. O projeto segue exatamente as quantidades e preços sugeridos pelo sistema.</p> : <div className="grid">
              {apontamentos.map((item) => <div key={item.key} className="card card-pad" style={{ borderColor: item.justificativaAlteracao.trim() ? 'var(--border)' : 'var(--high)' }}>
                <strong>{item.nome}</strong>
                <p className="subtle">{item.setorNome} · {item.areaNome}</p>
                <p>{item.excluido ? 'Item excluído pelo usuário.' : `Sistema sugeriu ${item.quantidadeSistema} un. a ${formatBRL(item.valorSistema)}; usuário escolheu ${item.quantidadeFinal} un. a ${formatBRL(item.valorFinal)}.`}</p>
                <textarea className="textarea" placeholder="Justificativa da alteração" value={item.justificativaAlteracao} onChange={(e) => atualizarEdicao(item.key, { justificativa: e.target.value })} style={{ minHeight: 76, borderColor: !item.justificativaAlteracao.trim() ? 'var(--high)' : undefined }} />
              </div>)}
            </div>}
          </div>

          <div className="card card-pad">
            <h3 className="section-title"><FileText size={18} /> Resumo das áreas contempladas</h3>
            <div className="grid grid-2">{projetos.map((projeto) => <div key={projeto.localidade.id} className="card card-pad"><strong>{projeto.localidade.setorNome} · {projeto.localidade.nome}</strong><p className="subtle">{projeto.parametroProjeto} {projeto.parametroLabel} · {projeto.itens.length} itens sugeridos · base {projeto.baseParametro}</p></div>)}</div>
          </div>
        </section>
      )}
    </div>
  );
}
