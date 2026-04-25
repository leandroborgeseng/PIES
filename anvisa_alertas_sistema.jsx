/**
 * AION — Sistema de Alertas ANVISA Tecnovigilância
 * Fase 2: Painel de monitoramento + scraper semanal
 *
 * ARQUIVOS A CRIAR NO PROJETO NEXT.JS:
 *   components/AlertasANVISA.jsx       ← este arquivo (componente React)
 *   app/api/anvisa/scraper/route.ts    ← rota de scraping (ver bloco API abaixo)
 *   app/api/anvisa/alertas/route.ts    ← rota de consulta ao KB
 */

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE REACT — AlertasANVISA.jsx
// ════════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";

const GRAVIDADE_COR = {
  CRÍTICA:        { bg: "#1a0000", border: "#ff2222", badge: "#ff2222", text: "#fff" },
  ALTA:           { bg: "#1a0800", border: "#ff6600", badge: "#ff6600", text: "#fff" },
  MÉDIA:          { bg: "#1a1000", border: "#ffcc00", badge: "#ffcc00", text: "#000" },
  BAIXA:          { bg: "#001a08", border: "#00cc66", badge: "#00cc66", text: "#fff" },
  INDETERMINADA:  { bg: "#0a0a1a", border: "#6666cc", badge: "#6666cc", text: "#fff" },
};

const STATUS_LABEL = {
  ABERTO:                       "🔴 Aberto",
  RESOLVIDO:                    "✅ Resolvido",
  RESOLVIDO_POR_SOFTWARE:       "🔄 Resolvido (software)",
  INDETERMINADA:                "🟡 Verificar",
};

const TIPO_ACAO_LABEL = {
  CORRECAO_EM_CAMPO:                            "Correção em Campo",
  COMUNICACAO_AOS_CLIENTES:                     "Comunicação aos Clientes",
  ACAO_DE_CAMPO:                                "Ação de Campo",
  COMUNICACAO_AOS_CLIENTES_ATUALIZACAO_SOFTWARE:"Comunicação + Atualização Software",
};

export default function AlertasANVISA() {
  const [alertas, setAlertas]               = useState([]);
  const [filtroStatus, setFiltroStatus]     = useState("TODOS");
  const [filtroGravidade, setFiltroGravidade] = useState("TODAS");
  const [busca, setBusca]                   = useState("");
  const [expandido, setExpandido]           = useState(null);
  const [scrapingStatus, setScrapingStatus] = useState(null);
  const [loading, setLoading]               = useState(true);

  // ── Carregar alertas do KB ─────────────────────────────────
  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch("/api/anvisa/alertas");
        const data = await res.json();
        setAlertas(data.alertas || []);
      } catch (e) {
        console.error("Erro ao carregar alertas:", e);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  // ── Filtros ────────────────────────────────────────────────
  const alertasFiltrados = alertas.filter((a) => {
    const matchStatus =
      filtroStatus === "TODOS" || a.status === filtroStatus;
    const matchGravidade =
      filtroGravidade === "TODAS" || a.gravidade === filtroGravidade;
    const matchBusca =
      busca === "" ||
      a.equipamento_nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.produto_afetado.toLowerCase().includes(busca.toLowerCase()) ||
      a.empresa_notificante.toLowerCase().includes(busca.toLowerCase()) ||
      a.numero_alerta.includes(busca);
    return matchStatus && matchGravidade && matchBusca;
  });

  // ── Contadores ─────────────────────────────────────────────
  const totalAbertos   = alertas.filter((a) => a.status === "ABERTO").length;
  const totalCriticos  = alertas.filter((a) => a.gravidade === "CRÍTICA" && a.status === "ABERTO").length;
  const totalAltos     = alertas.filter((a) => a.gravidade === "ALTA" && a.status === "ABERTO").length;
  const totalPendentes = alertas.filter((a) => a.status === "ABERTO" && !a.data_verificacao_ec).length;

  // ── Disparar scraping manual ───────────────────────────────
  async function rodarScraping() {
    setScrapingStatus("Consultando portal ANVISA...");
    try {
      const res = await fetch("/api/anvisa/scraper", { method: "POST" });
      const data = await res.json();
      setScrapingStatus(
        data.novos_alertas > 0
          ? `✅ ${data.novos_alertas} novo(s) alerta(s) encontrado(s)!`
          : "✅ Nenhum alerta novo. Base atualizada."
      );
      if (data.novos_alertas > 0) {
        const res2 = await fetch("/api/anvisa/alertas");
        const data2 = await res2.json();
        setAlertas(data2.alertas || []);
      }
    } catch {
      setScrapingStatus("❌ Erro ao consultar ANVISA. Tente novamente.");
    }
    setTimeout(() => setScrapingStatus(null), 6000);
  }

  // ── Marcar como verificado ─────────────────────────────────
  async function marcarVerificado(alerta) {
    const responsavel = prompt("Responsável pela verificação (nome do EC):");
    if (!responsavel) return;
    await fetch("/api/anvisa/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        equipamento_id: alerta.equipamento_id,
        numero_alerta:  alerta.numero_alerta,
        responsavel,
        data_verificacao_ec: new Date().toISOString().split("T")[0],
      }),
    });
    const res = await fetch("/api/anvisa/alertas");
    const data = await res.json();
    setAlertas(data.alertas || []);
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={styles.container}>

      {/* ── Cabeçalho ── */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>
            <span style={styles.dot} />
            Alertas ANVISA — Tecnovigilância
          </div>
          <div style={styles.headerSub}>
            Hospital Estadual 3 Colinas · FAEPA · Engenharia Clínica
          </div>
        </div>
        <button style={styles.btnScraper} onClick={rodarScraping}>
          🔄 Consultar ANVISA agora
        </button>
      </div>

      {scrapingStatus && (
        <div style={styles.scrapingBanner}>{scrapingStatus}</div>
      )}

      {/* ── Cards de resumo ── */}
      <div style={styles.cardsRow}>
        {[
          { label: "Alertas Abertos",       valor: totalAbertos,   cor: "#ff6600" },
          { label: "Críticos Abertos",       valor: totalCriticos,  cor: "#ff2222" },
          { label: "Alta Gravidade Abertos", valor: totalAltos,     cor: "#ff6600" },
          { label: "Sem Verificação EC",     valor: totalPendentes, cor: "#ffcc00" },
        ].map((c) => (
          <div key={c.label} style={styles.card}>
            <div style={{ ...styles.cardValor, color: c.cor }}>{c.valor}</div>
            <div style={styles.cardLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={styles.filtrosRow}>
        <input
          style={styles.input}
          placeholder="🔍  Buscar equipamento, produto, empresa ou nº alerta..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          style={styles.select}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="TODOS">Todos os status</option>
          <option value="ABERTO">Abertos</option>
          <option value="RESOLVIDO">Resolvidos</option>
          <option value="RESOLVIDO_POR_SOFTWARE">Resolvidos (software)</option>
        </select>
        <select
          style={styles.select}
          value={filtroGravidade}
          onChange={(e) => setFiltroGravidade(e.target.value)}
        >
          <option value="TODAS">Todas as gravidades</option>
          <option value="CRÍTICA">Crítica</option>
          <option value="ALTA">Alta</option>
          <option value="MÉDIA">Média</option>
          <option value="BAIXA">Baixa</option>
          <option value="INDETERMINADA">Indeterminada</option>
        </select>
      </div>

      {/* ── Lista de alertas ── */}
      {loading ? (
        <div style={styles.loading}>Carregando alertas...</div>
      ) : alertasFiltrados.length === 0 ? (
        <div style={styles.vazio}>Nenhum alerta encontrado com os filtros selecionados.</div>
      ) : (
        <div style={styles.lista}>
          {alertasFiltrados.map((a, i) => {
            const cor    = GRAVIDADE_COR[a.gravidade] || GRAVIDADE_COR.INDETERMINADA;
            const aberto = expandido === i;
            return (
              <div
                key={i}
                style={{
                  ...styles.alertaCard,
                  borderLeft: `4px solid ${cor.border}`,
                  background: aberto ? cor.bg : "#111",
                }}
              >
                {/* Linha principal */}
                <div
                  style={styles.alertaHeader}
                  onClick={() => setExpandido(aberto ? null : i)}
                >
                  <div style={styles.alertaLeft}>
                    <span
                      style={{
                        ...styles.badge,
                        background: cor.badge,
                        color: cor.text,
                      }}
                    >
                      {a.gravidade}
                    </span>
                    <span style={styles.alertaNumero}>
                      Alerta {a.numero_alerta}/{a.ano}
                    </span>
                    <span style={styles.alertaEquip}>{a.equipamento_nome}</span>
                  </div>
                  <div style={styles.alertaRight}>
                    <span style={styles.statusBadge}>
                      {STATUS_LABEL[a.status] || a.status}
                    </span>
                    {!a.data_verificacao_ec && a.status === "ABERTO" && (
                      <span style={styles.semVerif}>⚠ Sem verificação EC</span>
                    )}
                    <span style={styles.chevron}>{aberto ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Detalhe expandido */}
                {aberto && (
                  <div style={styles.alertaDetalhe}>
                    <div style={styles.detalheGrid}>
                      <div style={styles.detalheBloco}>
                        <div style={styles.detalheLabel}>Produto afetado</div>
                        <div style={styles.detalheValor}>{a.produto_afetado}</div>
                      </div>
                      <div style={styles.detalheBloco}>
                        <div style={styles.detalheLabel}>Empresa notificante</div>
                        <div style={styles.detalheValor}>{a.empresa_notificante}</div>
                      </div>
                      <div style={styles.detalheBloco}>
                        <div style={styles.detalheLabel}>Fabricante</div>
                        <div style={styles.detalheValor}>{a.fabricante}</div>
                      </div>
                      <div style={styles.detalheBloco}>
                        <div style={styles.detalheLabel}>Tipo de ação</div>
                        <div style={styles.detalheValor}>
                          {TIPO_ACAO_LABEL[a.tipo_acao] || a.tipo_acao}
                        </div>
                      </div>
                      <div style={styles.detalheBloco}>
                        <div style={styles.detalheLabel}>Registro ANVISA</div>
                        <div style={styles.detalheValor}>{a.registro_anvisa}</div>
                      </div>
                      <div style={styles.detalheBloco}>
                        <div style={styles.detalheLabel}>Modelos afetados</div>
                        <div style={styles.detalheValor}>
                          {(a.modelos_afetados || []).join(", ")}
                        </div>
                      </div>
                    </div>

                    <div style={styles.descricaoBloco}>
                      <div style={styles.detalheLabel}>Descrição do problema</div>
                      <div style={styles.descricaoTexto}>{a.descricao_resumida}</div>
                    </div>

                    <div
                      style={{
                        ...styles.acaoBloco,
                        background:
                          a.gravidade === "CRÍTICA" ? "#2a0000" : "#001a08",
                        border: `1px solid ${cor.border}`,
                      }}
                    >
                      <div style={styles.detalheLabel}>
                        ⚡ Ação recomendada para o Hospital
                      </div>
                      <div style={styles.acaoTexto}>{a.acao_recomendada_hospital}</div>
                    </div>

                    <div style={styles.verificacaoRow}>
                      {a.data_verificacao_ec ? (
                        <div style={styles.verificado}>
                          ✅ Verificado em {a.data_verificacao_ec} por{" "}
                          {a.responsavel_verificacao}
                        </div>
                      ) : (
                        <div style={styles.naoVerificado}>
                          ⚠️ Ainda não verificado pela Engenharia Clínica
                        </div>
                      )}
                      <div style={styles.botoesAcao}>
                        <a
                          href={`https://${a.url_alerta}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.btnLink}
                        >
                          🔗 Ver no portal ANVISA
                        </a>
                        {a.status === "ABERTO" && (
                          <button
                            style={styles.btnVerificar}
                            onClick={() => marcarVerificado(a)}
                          >
                            ✔ Marcar como verificado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Rodapé informativo ── */}
      <div style={styles.footer}>
        <div>
          Fonte:{" "}
          <a
            href="https://antigo.anvisa.gov.br/alertas"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#6699ff" }}
          >
            Portal ANVISA Tecnovigilância
          </a>{" "}
          · RDC 551/2021 · Atualização automática semanal via scraper
        </div>
        <div style={{ color: "#666", fontSize: "11px", marginTop: 4 }}>
          Alertas de equipamentos não adquiridos ainda são exibidos como referência
          para decisão de compra · AION Engenharia Clínica v2.1
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════════════════════
const styles = {
  container: {
    background: "#0a0a0a",
    minHeight: "100vh",
    color: "#e0e0e0",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
    padding: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    borderBottom: "1px solid #222",
    paddingBottom: "16px",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#ff2222",
    boxShadow: "0 0 8px #ff2222",
    animation: "pulse 2s infinite",
    display: "inline-block",
  },
  headerSub: { color: "#666", fontSize: "12px", marginTop: "4px" },
  btnScraper: {
    background: "#0a1a2a",
    border: "1px solid #1a4a7a",
    color: "#4499ff",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "inherit",
  },
  scrapingBanner: {
    background: "#001a2a",
    border: "1px solid #1a4a7a",
    color: "#4499ff",
    padding: "10px 16px",
    borderRadius: "4px",
    marginBottom: "16px",
    fontSize: "13px",
  },
  cardsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "20px",
  },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "6px",
    padding: "16px",
    textAlign: "center",
  },
  cardValor: { fontSize: "32px", fontWeight: "700", lineHeight: "1" },
  cardLabel: { fontSize: "11px", color: "#888", marginTop: "4px" },
  filtrosRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  input: {
    flex: "1",
    minWidth: "280px",
    background: "#111",
    border: "1px solid #333",
    color: "#e0e0e0",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
  },
  select: {
    background: "#111",
    border: "1px solid #333",
    color: "#e0e0e0",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "13px",
    fontFamily: "inherit",
    cursor: "pointer",
    outline: "none",
  },
  loading: { textAlign: "center", color: "#666", padding: "40px" },
  vazio:   { textAlign: "center", color: "#666", padding: "40px" },
  lista:   { display: "flex", flexDirection: "column", gap: "8px" },
  alertaCard: {
    border: "1px solid #222",
    borderRadius: "6px",
    overflow: "hidden",
    transition: "background 0.2s",
  },
  alertaHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    cursor: "pointer",
    gap: "12px",
  },
  alertaLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    flexWrap: "wrap",
  },
  badge: {
    fontSize: "10px",
    fontWeight: "700",
    padding: "2px 8px",
    borderRadius: "3px",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  alertaNumero: { fontSize: "12px", color: "#888", whiteSpace: "nowrap" },
  alertaEquip:  { fontSize: "14px", fontWeight: "600", color: "#fff" },
  alertaRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexShrink: 0,
  },
  statusBadge: { fontSize: "12px", color: "#aaa", whiteSpace: "nowrap" },
  semVerif: {
    fontSize: "11px",
    color: "#ffcc00",
    background: "#2a2000",
    padding: "2px 8px",
    borderRadius: "3px",
    whiteSpace: "nowrap",
  },
  chevron: { color: "#666", fontSize: "12px" },
  alertaDetalhe: { padding: "0 16px 16px", borderTop: "1px solid #222" },
  detalheGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginTop: "16px",
    marginBottom: "16px",
  },
  detalheBloco: {},
  detalheLabel: { fontSize: "10px", color: "#666", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" },
  detalheValor: { fontSize: "13px", color: "#ccc" },
  descricaoBloco: { marginBottom: "12px" },
  descricaoTexto: {
    fontSize: "13px",
    color: "#ddd",
    background: "#0d0d0d",
    border: "1px solid #222",
    borderRadius: "4px",
    padding: "10px 14px",
    lineHeight: "1.6",
  },
  acaoBloco: {
    borderRadius: "4px",
    padding: "10px 14px",
    marginBottom: "12px",
  },
  acaoTexto: { fontSize: "13px", color: "#ddd", lineHeight: "1.6", marginTop: "6px" },
  verificacaoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
  },
  verificado:    { fontSize: "13px", color: "#00cc66" },
  naoVerificado: { fontSize: "13px", color: "#ffcc00" },
  botoesAcao: { display: "flex", gap: "8px" },
  btnLink: {
    background: "#0a1a2a",
    border: "1px solid #1a4a7a",
    color: "#4499ff",
    padding: "6px 12px",
    borderRadius: "4px",
    textDecoration: "none",
    fontSize: "12px",
  },
  btnVerificar: {
    background: "#001a08",
    border: "1px solid #00cc66",
    color: "#00cc66",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontFamily: "inherit",
  },
  footer: {
    marginTop: "32px",
    borderTop: "1px solid #222",
    paddingTop: "16px",
    fontSize: "12px",
    color: "#888",
    lineHeight: "1.8",
  },
};
