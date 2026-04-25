import 'server-only';
import kb from '@/data/hospital_knowledge_base_enriched.json';

export type Equipamento = (typeof kb.equipamentos_catalogo)[number];
export type AlertaANVISA = NonNullable<Equipamento['alertas_anvisa']>[number] & {
  equipamento_id: number;
  equipamento_nome: string;
};

export const knowledgeBase = kb;
export const equipamentos = kb.equipamentos_catalogo as Equipamento[];

const gravidadeRank: Record<string, number> = {
  'CRÍTICA': 0,
  'ALTA': 1,
  'MÉDIA': 2,
  'INDETERMINADA': 3,
  'BAIXA': 4,
  'RESOLVIDO': 5,
};

export function getNivelRisco(item: any): string {
  if (typeof item?.score_risco === 'string') return item.score_risco;
  if (typeof item?.score_risco === 'object') return item.score_risco?.nivel ?? 'MÉDIO';
  return 'MÉDIO';
}

export function getEquipamentoById(id: string | number) {
  const numeric = Number(id);
  return equipamentos.find((eq) => eq.id === numeric);
}

export function getEquipamento(nome: string) {
  return equipamentos.find((eq) => eq.nome === nome);
}

export function getCompatibilidade(nome: string) {
  const item = getEquipamento(nome);
  const dep = item?.depende_de;
  if (!item || !dep) return null;
  return {
    equipamentoNome: item.nome,
    depende_de: dep.depende_de ?? [],
    complementado_por: dep.complementado_por ?? [],
    incompativel_com: dep.incompativel_com ?? [],
    requer_instalacao_conjunta: dep.requer_instalacao_conjunta ?? [],
    obs: dep.obs ?? '',
    temAlertaCritico: Boolean(dep.depende_de?.length || dep.requer_instalacao_conjunta?.length),
    temAlertaInfo: Boolean(dep.complementado_por?.length),
    temIncompativel: Boolean(dep.incompativel_com?.length),
  };
}

export function getAlertas() {
  return equipamentos.flatMap((eq) =>
    (eq.alertas_anvisa ?? []).map((alerta) => ({
      ...alerta,
      equipamento_id: eq.id,
      equipamento_nome: eq.nome,
    }))
  ).sort((a, b) => {
    const statusA = a.status === 'ABERTO' ? 0 : 1;
    const statusB = b.status === 'ABERTO' ? 0 : 1;
    if (statusA !== statusB) return statusA - statusB;
    return (gravidadeRank[a.gravidade] ?? 99) - (gravidadeRank[b.gravidade] ?? 99);
  });
}

export function getResumoDashboard() {
  const alertas = getAlertas();
  const distribuicaoRisco = equipamentos.reduce<Record<string, number>>((acc, eq) => {
    const nivel = getNivelRisco(eq);
    acc[nivel] = (acc[nivel] ?? 0) + 1;
    return acc;
  }, {});

  const distribuicaoManutencao = equipamentos.reduce<Record<string, number>>((acc, eq: any) => {
    const tipo = eq.manutencao_tipo?.responsavel_preferencial ??
      (eq.manutencao_tipo?.contrato_obrigatorio ? 'ASSISTENCIA_AUTORIZADA' : 'EC_INTERNA');
    acc[tipo] = (acc[tipo] ?? 0) + 1;
    return acc;
  }, {});

  const ccoAnual = equipamentos.reduce((sum, eq: any) => sum + (eq.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0), 0);
  const contratosATObrigatorios = equipamentos.filter((eq: any) => eq.manutencao_tipo?.contrato_obrigatorio).length;

  return {
    totalEquipamentos: equipamentos.length,
    alertasCriticos: alertas.filter((a) => a.status === 'ABERTO' && a.gravidade === 'CRÍTICA').length,
    alertasAbertos: alertas.filter((a) => a.status === 'ABERTO').length,
    ccoAnual,
    contratosATObrigatorios,
    distribuicaoRisco,
    distribuicaoManutencao,
    top10CCO: [...equipamentos]
      .sort((a: any, b: any) => (b.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0) - (a.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0))
      .slice(0, 10),
    alertasRecentesCriticos: alertas.filter((a) => a.status === 'ABERTO').slice(0, 5),
  };
}

export function getEquipamentosResumo() {
  return equipamentos.map((eq: any) => ({
    id: eq.id,
    nome: eq.nome,
    risco: getNivelRisco(eq),
    score: typeof eq.score_risco === 'object' ? eq.score_risco?.total : null,
    catmat: eq.catmat?.codigo ?? 'N/I',
    anvisa: eq.anvisa?.classe_risco ?? 'N/I',
    valor: eq.valor_unitario_referencia ?? eq.bps_preco?.preco_medio_brl ?? 0,
    cco: eq.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0,
    contratoObrigatorio: Boolean(eq.manutencao_tipo?.contrato_obrigatorio),
    compatibilidade: getCompatibilidade(eq.nome),
  }));
}


export const setores = kb.setores;
export const localidades = kb.localidades;
export const atribuicoes = kb.atribuicoes;

function inferBaseParametro(localidade: any, itens: any[]) {
  const tpiQtd = localidade?.requisitos_instalacao?.tpi_planilha?.quant_estrutura;
  if (typeof tpiQtd === 'number' && tpiQtd > 0) return tpiQtd;
  const nome = String(localidade?.nome ?? '').toLowerCase();
  const match = nome.match(/(\d+)\s*leito/);
  if (match) return Number(match[1]);
  if (nome.includes('isolamento')) return 1;
  const perBed = itens.filter((item) => item.parametro_dimensionamento === 'leitos' && item.qtd_adquirir > 0);
  if (perBed.length) return Math.max(1, Math.round(Math.min(...perBed.map((item) => item.qtd_adquirir))));
  return 1;
}

function calcularQuantidade(item: any, baseParametro: number, parametroProjeto: number) {
  const original = Number(item.qtd_adquirir ?? 0);
  if (!original) return 0;
  if (item.scaling_type === 'FIXED') return original;
  if (item.scaling_type === 'PER_N_BEDS' && item.scaling_n) {
    const basePorGrupo = original / Math.max(1, Math.ceil(baseParametro / item.scaling_n));
    return Math.max(1, Math.ceil(basePorGrupo * Math.ceil(parametroProjeto / item.scaling_n)));
  }
  const ratio = original / Math.max(1, baseParametro);
  return Math.max(1, Math.ceil(ratio * parametroProjeto));
}

export function getAmbientesPlanejaveis() {
  return localidades
    .map((localidade: any) => {
      const setor = setores.find((s: any) => s.id === localidade.setor_id);
      const itens = atribuicoes.filter((a: any) => a.locality_id === localidade.id);
      const baseParametro = inferBaseParametro(localidade, itens);
      const investimentoBase = itens.reduce((sum: number, item: any) => sum + (item.qtd_adquirir ?? 0) * (item.valor_unitario ?? 0), 0);
      return {
        id: localidade.id,
        nome: localidade.nome,
        setorId: localidade.setor_id,
        setorNome: setor?.nome ?? 'Sem setor',
        pavimento: setor?.pavimento ?? 'N/I',
        baseParametro,
        parametroLabel: localidade.nome.toLowerCase().includes('sala') ? 'salas' : 'leitos',
        totalItens: itens.length,
        investimentoBase,
        rdcReferencia: localidade.requisitos_instalacao?.rdc_referencia ?? null,
        normas: localidade.requisitos_instalacao?.normas_complementares ?? [],
      };
    })
    .filter((localidade) => localidade.totalItens > 0)
    .sort((a, b) => `${a.setorNome} ${a.nome}`.localeCompare(`${b.setorNome} ${b.nome}`));
}

export function gerarProjetoAmbiente(localidadeId: number, parametroProjeto: number) {
  const localidade: any = localidades.find((item: any) => item.id === localidadeId);
  if (!localidade) return null;
  const setor: any = setores.find((item: any) => item.id === localidade.setor_id);
  const itensBase: any[] = atribuicoes.filter((item: any) => item.locality_id === localidadeId);
  const baseParametro = inferBaseParametro(localidade, itensBase);
  const itens = itensBase.map((item: any) => {
    const equipamento: any = equipamentos.find((eq: any) => eq.id === item.equipment_id);
    const quantidade = calcularQuantidade(item, baseParametro, parametroProjeto);
    const valorUnitario = item.valor_unitario ?? equipamento?.valor_unitario_referencia ?? equipamento?.bps_preco?.preco_medio_brl ?? 0;
    return {
      id: item.id,
      equipmentId: item.equipment_id,
      nome: equipamento?.nome ?? `Equipamento ${item.equipment_id}`,
      quantidadeBase: item.qtd_adquirir ?? 0,
      quantidade,
      valorUnitario,
      valorTotal: quantidade * valorUnitario,
      classificacao: item.classificacao ?? 'RECOMENDADO',
      rdcReferencia: item.rdc_referencia ?? null,
      justificativa: item.justificativa ?? null,
      observacao: item.observacao ?? null,
      scalingType: item.scaling_type ?? 'FIXED',
      scalingN: item.scaling_n ?? null,
      parametroDimensionamento: item.parametro_dimensionamento ?? null,
      risco: equipamento ? getNivelRisco(equipamento) : 'N/I',
      anvisa: equipamento?.anvisa?.classe_risco ?? 'N/I',
      compatibilidade: equipamento ? getCompatibilidade(equipamento.nome) : null,
    };
  }).sort((a, b) => {
    const rank: Record<string, number> = { 'OBRIGATÓRIO': 0, OBRIGATORIO: 0, RECOMENDADO: 1, CONDICIONAL: 2, OPCIONAL: 3 };
    return (rank[a.classificacao] ?? 9) - (rank[b.classificacao] ?? 9) || a.nome.localeCompare(b.nome);
  });
  const investimentoTotal = itens.reduce((sum, item) => sum + item.valorTotal, 0);
  return {
    localidade: {
      id: localidade.id,
      nome: localidade.nome,
      setorNome: setor?.nome ?? 'Sem setor',
      pavimento: setor?.pavimento ?? 'N/I',
      requisitosInstalacao: localidade.requisitos_instalacao ?? {},
      rdcReferencia: localidade.requisitos_instalacao?.rdc_referencia ?? null,
      normas: localidade.requisitos_instalacao?.normas_complementares ?? [],
    },
    baseParametro,
    parametroProjeto,
    parametroLabel: localidade.nome.toLowerCase().includes('sala') ? 'salas' : 'leitos',
    itens,
    totalItens: itens.length,
    investimentoTotal,
    obrigatorios: itens.filter((item) => item.classificacao === 'OBRIGATÓRIO' || item.classificacao === 'OBRIGATORIO').length,
    recomendados: itens.filter((item) => item.classificacao === 'RECOMENDADO').length,
  };
}

export function getAreasEditaveis() {
  return getAmbientesPlanejaveis().map((ambiente) => {
    const projeto = gerarProjetoAmbiente(ambiente.id, ambiente.baseParametro);
    return {
      id: ambiente.id,
      nome: ambiente.nome,
      setorNome: ambiente.setorNome,
      pavimento: ambiente.pavimento,
      parametroLabel: ambiente.parametroLabel,
      baseParametro: ambiente.baseParametro,
      source: 'system' as const,
      itens: (projeto?.itens ?? []).map((item) => ({
        id: item.id,
        equipmentId: item.equipmentId,
        nome: item.nome,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        classificacao: item.classificacao,
        justificativa: item.justificativa ?? item.rdcReferencia ?? '',
      })),
    };
  });
}
