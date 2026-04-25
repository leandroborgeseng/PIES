// ============================================================
// AION Engenharia — Seed Script v2.0
// Popula o banco com o KB Enriched completo
// Cole em: prisma/seed.ts
// Rode com: npx prisma db seed
// ============================================================

import { PrismaClient, Classificacao, ScalingType } from '@prisma/client';
import knowledgeBase from './hospital_knowledge_base_enriched.json';

const prisma = new PrismaClient();
const kb = knowledgeBase as any;

// ── Helpers ───────────────────────────────────────────────────
function toClassificacao(val: string): Classificacao {
  const map: Record<string, Classificacao> = {
    'OBRIGATÓRIO': Classificacao.OBRIGATORIO,
    'RECOMENDADO':  Classificacao.RECOMENDADO,
    'CONDICIONAL':  Classificacao.CONDICIONAL,
    'OPCIONAL':     Classificacao.OPCIONAL,
  };
  return map[val] ?? Classificacao.RECOMENDADO;
}

function toScalingType(val: string): ScalingType {
  const map: Record<string, ScalingType> = {
    'PER_BED':    ScalingType.PER_BED,
    'PER_N_BEDS': ScalingType.PER_N_BEDS,
    'PER_SALA':   ScalingType.PER_SALA,
    'FIXED':      ScalingType.FIXED,
  };
  return map[val] ?? ScalingType.FIXED;
}

function j(val: any): string | null {
  if (val === null || val === undefined) return null;
  return JSON.stringify(val);
}

function safe(val: any): string | null {
  if (val === null || val === undefined) return null;
  return String(val);
}

async function main() {
  console.log('🌱 AION — Seed v2.0 iniciado\n');
  console.log(`   KB versão:   ${kb.meta?.revisao ?? 'N/I'}`);
  console.log(`   Equipamentos: ${kb.equipamentos_catalogo?.length}`);
  console.log(`   Setores:      ${kb.setores?.length}`);
  console.log(`   Localidades:  ${kb.localidades?.length}`);
  console.log(`   Atribuições:  ${kb.atribuicoes?.length}`);
  console.log(`   POPs:         ${kb.pops_manutencao?.length}`);

  // ── 1. POPs ──────────────────────────────────────────────
  console.log('\n[1/8] POPs de manutenção...');
  for (const p of kb.pops_manutencao ?? []) {
    const r = p.manutencao_resumo ?? {};
    await prisma.equipmentPOP.upsert({
      where: { id: p.pop_id },
      update: {},
      create: {
        id:      p.pop_id,
        nomePop: p.nome_pop,
        preventivaPeriodicidadeMeses:  p.preventiva?.periodicidade_meses   ?? null,
        preventivaCodigo:              p.preventiva?.pop_codigo             ?? null,
        calibracaoPeriodicidadeMeses:  p.calibracao?.periodicidade_meses   ?? null,
        calibracaoParametros:          p.calibracao?.parametros             ?? null,
        calibracaoTolerâncias:         p.calibracao?.tolerancias            ?? null,
        calibracaoCodigo:              p.calibracao?.pop_codigo             ?? null,
        segurancaEletricaMeses:        p.seguranca_eletrica?.periodicidade_meses ?? null,
        segurancaEletricaClasse:       p.seguranca_eletrica?.classe         ?? null,
        segurancaEletricaTipo:         p.seguranca_eletrica?.tipo           ?? null,
        segurancaEletricaPontos:       p.seguranca_eletrica?.pontos_aplicacao ?? null,
        segurancaEletricaCodigo:       p.seguranca_eletrica?.pop_codigo     ?? null,
        qualificacaoMeses:             p.qualificacao?.periodicidade_meses  ?? null,
        qualificacaoCodigo:            p.qualificacao?.pop_codigo           ?? null,
        temCalibracao:         (p.calibracao?.periodicidade_meses ?? null) !== null,
        temSegurancaEletrica:  (p.seguranca_eletrica?.periodicidade_meses ?? null) !== null,
        temQualificacao:       (p.qualificacao?.periodicidade_meses ?? null) !== null,
        proximaAcao:    r.proxima_acao          ?? null,
        cicloDescricao: r.ciclo_total_descricao ?? null,
      },
    });
  }

  // ── 2. Catálogo de equipamentos ───────────────────────────
  console.log(`[2/8] Catálogo de equipamentos (${kb.equipamentos_catalogo.length})...`);
  for (const eq of kb.equipamentos_catalogo) {
    const cat   = eq.catmat           ?? {};
    const anv   = eq.anvisa           ?? {};
    const vu    = eq.vida_util        ?? {};
    const pf    = eq.planejamento_financeiro ?? {};
    const crit  = eq.criticidade_clinica ?? {};
    const score = eq.score_risco      ?? {};
    const con   = eq.conexoes_instalacao ?? {};
    const tce   = eq.tce_eletrica     ?? {};
    const norm  = eq.normas_tecnicas  ?? {};
    const dt    = eq.descritivo_tecnico ?? {};
    const bps   = eq.bps_preco        ?? {};
    const pc    = eq.pecas_consumiveis ?? {};
    const dep   = vu.depreciacao      ?? {};

    const data = {
      valorUnitarioReferencia: eq.valor_unitario_referencia ?? 0,
      popId:                   eq.pop_id ?? null,

      // CATMAT
      catmatCodigo:         safe(cat.codigo),
      catmatDescricao:      safe(cat.descricao_catmat),
      catmatGrupo:          safe(cat.grupo_catmat),
      catmatFonte:          safe(cat.fonte),
      catmatConfiabilidade: safe(cat.confiabilidade),

      // ANVISA
      anvisaClasse:            safe(anv.classe_risco),
      anvisaBaseClassificacao: safe(anv.base_classificacao),
      anvisaTipoProduto:       safe(anv.tipo_produto),
      anvisaRequerRegistro:    anv.requer_registro_anvisa ?? false,
      anvisaRequerBpf:         anv.requer_certificado_bpf ?? false,
      anvisaNotaRegulatoria:   safe(anv.nota_regulatoria),

      // Vida útil
      vidaUtilAnos:               vu.anos_estimados ?? null,
      vidaUtilCategoriaEcri:      safe(vu.categoria_ecri),
      vidaUtilAlertaAnos:         vu.alerta_planejamento_anos ?? null,
      vidaUtilRiscoObsolescencia: safe(vu.risco_obsolescencia),
      vidaUtilSubstituicaoAcel:   vu.substituicao_acelerada ?? false,
      vidaUtilDepreciacaoAnualPct: dep.taxa_anual_pct ?? null,

      // Planejamento financeiro
      planejValorReposicao:        pf.valor_reposicao_referencia_brl ?? null,
      planejCustoManutencaoLimite: pf.custo_manutencao_limite_substituicao_brl ?? null,
      planejDepreciacaoAnual:      pf.depreciacao_anual_brl ?? null,

      // Criticidade
      criticidadeImpactoFalha:       safe(crit.impacto_falha),
      criticidadeIndice:             safe(crit.indice_criticidade),
      criticidadePrioridadeReposicao: safe(crit.prioridade_reposicao),
      criticidadeEstoqueRecomendado:  safe(crit.estoque_recomendado),
      criticidadeJustificativa:       safe(crit.justificativa),

      // Score de risco
      scoreRiscoTotal:       score.total ?? null,
      scoreRiscoNivel:       safe(score.nivel),
      scoreRiscoPrioridade:  safe(score.prioridade_gestao),
      scoreDimCriticidade:   score.dimensoes?.criticidade_clinica ?? null,
      scoreDimAnvisa:        score.dimensoes?.classe_anvisa ?? null,
      scoreDimObsolescencia: score.dimensoes?.obsolescencia_vida_util ?? null,
      scoreDimCco:           score.dimensoes?.custo_operacional_cco ?? null,

      // Instalação
      conexaoGases:      j(con.gases),
      conexaoEletrica:   j(con.eletrica),
      conexaoHidraulica: j(con.hidraulica),
      conexaoRedeTi:     j(con.rede_ti),
      conexaoNotas:      safe(con.notas),

      // TCE elétrica
      tceTensaoV:   j(tce.tensao_v),
      tcePotenciaW: tce.potencia_total_w ?? null,
      tcePotenciaKw: tce.potencia_total_kw ?? null,
      tceTomada:    j(tce.tipo_tomada_recomendada),

      // Normas
      normasAbntIec:      j(norm.abnt_iec),
      normasAnvisaRdc:    j(norm.anvisa_rdc),
      normasOutras:       j(norm.outras),
      normasCategoriaIec: safe(norm.categoria_iec),
      normasEnsaios:      j(norm.ensaios_aceitacao),

      // Garantia
      garantiaMinimaM: eq.garantia_minima_meses ?? null,

      // CCO
      pecasConsumiveisJson: j(pc),
      ccoAnualBrl: pc.custo_total_cco_anual_brl ?? null,

      // BPS
      bpsStatus:       safe(bps.status),
      bpsPrecoMedio:   bps.preco_medio_brl ?? null,
      bpsPrecoMin:     bps.preco_min_brl ?? null,
      bpsPrecoMax:     bps.preco_max_brl ?? null,
      bpsNCompras:     bps.n_compras_registradas ?? null,
      bpsCatmatCodigo: safe(bps.catmat_codigo),

      // Descritivo
      descritivoVersao:   safe(dt.versao),
      descritivoStatus:   safe(dt.status),
      descritivoConteudo: safe(dt.conteudo),
      descritivoData:     safe(dt.data_geracao),

      // Fabricantes (JSON compacto)
      fabricantesJson: j(eq.fabricantes_referencia?.fabricantes),
    };

    await prisma.equipmentCatalog.upsert({
      where:  { nome: eq.nome },
      update: data,
      create: { id: eq.id, nome: eq.nome, ...data },
    });
  }

  // ── 3. Fabricantes (tabela dedicada) ──────────────────────
  console.log(`[3/8] Fabricantes de referência...`);
  for (const eq of kb.equipamentos_catalogo) {
    const fabs = eq.fabricantes_referencia?.fabricantes ?? [];
    // Limpar os existentes e reinserir
    await prisma.equipmentFabricante.deleteMany({ where: { equipmentId: eq.id } });
    for (let i = 0; i < fabs.length; i++) {
      const f = fabs[i];
      await prisma.equipmentFabricante.create({
        data: {
          equipmentId:         eq.id,
          nome:                f.nome,
          paisOrigem:          f.pais_origem ?? null,
          site:                f.site ?? null,
          representanteBrasil: f.representante_brasil ?? null,
          observacao:          f.observacao ?? null,
          ordem:               i + 1,
        }
      });
    }
  }

  // ── 4. Setores (com CCO agregado) ─────────────────────────
  console.log(`[4/8] Setores hospitalares (${kb.setores.length})...`);
  const ccoSetorMap: Record<number, any> = {};
  for (const cs of kb.cco_por_setor ?? []) {
    ccoSetorMap[cs.id] = cs;
  }
  for (const setor of kb.setores) {
    const ccoData = ccoSetorMap[setor.id];
    await prisma.hospitalSector.upsert({
      where:  { nome: setor.nome },
      update: {
        pavimento:         setor.pavimento,
        investimentoTotal: ccoData?.investimento_total ?? null,
        ccoAnualTotal:     ccoData?.cco_anual_total ?? null,
        ratioCcoInvest:    ccoData?.ratio_cco_invest ?? null,
      },
      create: {
        id:                setor.id,
        nome:              setor.nome,
        pavimento:         setor.pavimento,
        investimentoTotal: ccoData?.investimento_total ?? null,
        ccoAnualTotal:     ccoData?.cco_anual_total ?? null,
        ratioCcoInvest:    ccoData?.ratio_cco_invest ?? null,
      },
    });
  }

  // ── 5. Localidades (com CCO) ──────────────────────────────
  console.log(`[5/8] Localidades (${kb.localidades.length})...`);
  // Montar índice de CCO por localidade
  const ccoLocMap: Record<number, { invest: number; cco: number }> = {};
  for (const cs of kb.cco_por_setor ?? []) {
    for (const loc of cs.localidades ?? []) {
      ccoLocMap[loc.id] = { invest: loc.investimento, cco: loc.cco_anual };
    }
  }
  for (const loc of kb.localidades) {
    const cd = ccoLocMap[loc.id];
    await prisma.sectorLocality.upsert({
      where:  { setorId_nome: { setorId: loc.setor_id, nome: loc.nome } },
      update: {
        investimentoTotal: cd?.invest ?? null,
        ccoAnualTotal:     cd?.cco ?? null,
      },
      create: {
        id:                loc.id,
        nome:              loc.nome,
        setorId:           loc.setor_id,
        investimentoTotal: cd?.invest ?? null,
        ccoAnualTotal:     cd?.cco ?? null,
      },
    });
  }

  // ── 6. Atribuições ────────────────────────────────────────
  console.log(`[6/8] Atribuições PIES (${kb.atribuicoes.length})...`);
  const eqMap: Record<number, any> = {};
  for (const eq of kb.equipamentos_catalogo) eqMap[eq.id] = eq;

  for (const a of kb.atribuicoes) {
    const classificacao = toClassificacao(a.classificacao ?? 'RECOMENDADO');
    const scalingType   = toScalingType(a.scaling_type ?? 'FIXED');
    const eq = eqMap[a.equipment_id];
    const ccoU = eq?.pecas_consumiveis?.custo_total_cco_anual_brl ?? 0;

    const data = {
      localityId:              a.locality_id,
      equipmentId:             a.equipment_id,
      qtdAdquirir:             a.qtd_adquirir,
      qtdFase1:                a.qtd_fase1,
      qtdFase2:                a.qtd_fase2,
      valorUnitario:           a.valor_unitario,
      observacao:              a.observacao ?? null,
      classificacao,
      rdcReferencia:           a.rdc_referencia ?? null,
      justificativa:           a.justificativa ?? null,
      condicao:                a.condicao ?? null,
      scalingType,
      scalingN:                a.scaling_n ?? null,
      parametroDimensionamento: a.parametro_dimensionamento ?? null,
      ccoAnualAtribuicao:      ccoU * a.qtd_adquirir,
    };
    await prisma.templateAssignment.upsert({
      where:  { id: a.id },
      update: data,
      create: { id: a.id, ...data },
    });
  }

  // ── 7. Hospital de referência ─────────────────────────────
  console.log(`[7/8] Hospital de referência...`);
  const hospital = await prisma.hospital.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      id: 1, nome: 'Hospital Estadual 3 Colinas',
      cidade: 'Franca', estado: 'SP', gestora: 'FAEPA',
      leitos: 221, status: 'ATIVO',
    },
  });

  // ── 8. Resumo ─────────────────────────────────────────────
  console.log(`[8/8] Concluído!\n`);

  const meta = kb.regulatorio_meta;
  const ccoInfo = meta?.cco_setor_info ?? {};
  const scoreInfo = meta?.score_risco_info ?? {};

  console.log(`✅ Seed v2.0 concluído com sucesso!`);
  console.log(`\n   Hospital:        ${hospital.nome}`);
  console.log(`   POPs:            ${kb.pops_manutencao?.length}`);
  console.log(`   Equipamentos:    ${kb.equipamentos_catalogo?.length}`);
  console.log(`   Setores:         ${kb.setores?.length}`);
  console.log(`   Localidades:     ${kb.localidades?.length}`);
  console.log(`   Atribuições:     ${kb.atribuicoes?.length}`);
  console.log(`\n   Investimento total hospital:  R$ ${(ccoInfo.investimento_total_hospital ?? 0).toLocaleString('pt-BR')}`);
  console.log(`   CCO anual total hospital:     R$ ${(ccoInfo.cco_anual_total_hospital ?? 0).toLocaleString('pt-BR')}`);
  console.log(`   Ratio CCO/Investimento:       ${ccoInfo.ratio_cco_invest_pct ?? 0}%`);
  console.log(`\n   Score de Risco (distribuição):`);
  console.log(`     CRÍTICO: ${scoreInfo.distribuicao?.CRÍTICO ?? 0}`);
  console.log(`     ALTO:    ${scoreInfo.distribuicao?.ALTO ?? 0}`);
  console.log(`     MÉDIO:   ${scoreInfo.distribuicao?.MÉDIO ?? 0}`);
  console.log(`     BAIXO:   ${scoreInfo.distribuicao?.BAIXO ?? 0}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
