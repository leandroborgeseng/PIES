# AION — Sistema de Gestão de Engenharia Clínica Hospitalar
## Prompt Completo para Cursor — v1.0

---

## CONTEXTO DO PROJETO

Você vai construir o **AION**, um sistema web moderno de gestão de Engenharia Clínica para o **Hospital Estadual 3 Colinas** (FAEPA — Franca/SP). O sistema gerencia o ciclo de vida completo de 201 equipamentos médico-hospitalares: planejamento, aquisição, manutenção, alertas regulatórios e indicadores de desempenho.

A base de conhecimento foi pré-construída e está no arquivo `hospital_knowledge_base_enriched.json` (3,6 MB). Ela contém 20 campos por equipamento, incluindo dados técnicos, financeiros, regulatórios, alertas ANVISA, KPIs de referência, dependências entre equipamentos e classificação de manutenção. **Não invente dados — tudo está no JSON.**

---

## STACK TECNOLÓGICA

```
Framework:     Next.js 14 (App Router)
Linguagem:     TypeScript
Banco:         PostgreSQL via Supabase (ou SQLite em dev com Prisma)
ORM:           Prisma
Auth:          Clerk (ou NextAuth com credentials)
UI:            shadcn/ui + Tailwind CSS
Ícones:        Lucide React
Gráficos:      Recharts
Tabelas:       TanStack Table v8
Formulários:   React Hook Form + Zod
Estado:        Zustand (global) + TanStack Query (server state)
Notificações:  Sonner
Animações:     Framer Motion
Deploy:        Vercel
```

---

## IDENTIDADE VISUAL

**Tema:** Dark industrial — sistema profissional para ambiente hospitalar técnico.

```
Cores:
  background:  #0a0a0f  (quase preto com tom azul)
  surface:     #111118  (cards e painéis)
  border:      #1e1e2e  (separadores)
  primary:     #3b82f6  (azul — ações principais)
  secondary:   #6366f1  (índigo — destaques)

  Semáforo de gravidade:
  crítico:     #ef4444  (vermelho)
  alto:        #f97316  (laranja)
  médio:       #eab308  (amarelo)
  baixo:       #22c55e  (verde)
  info:        #8b5cf6  (roxo)

Tipografia:
  display:  'JetBrains Mono' (números e códigos — muito usado em EC)
  body:     'Inter' ou 'DM Sans'

Linguagem visual:
  - Cards com bordas sutis e backdrop-blur
  - Números grandes e legíveis nos KPIs
  - Status badges com cores do semáforo
  - Tabelas densas mas respiradas
  - Sidebar colapsável à esquerda
```

---

## ESTRUTURA DE ARQUIVOS

```
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                  ← sidebar + header
│   │   ├── page.tsx                    ← dashboard principal
│   │   ├── equipamentos/
│   │   │   ├── page.tsx               ← lista com filtros
│   │   │   └── [id]/page.tsx          ← detalhe do equipamento
│   │   ├── manutencao/
│   │   │   ├── page.tsx               ← ordens de serviço
│   │   │   └── nova/page.tsx          ← criar OS
│   │   ├── alertas/
│   │   │   └── page.tsx               ← alertas ANVISA
│   │   ├── aquisicao/
│   │   │   └── page.tsx               ← planejamento de compras
│   │   └── relatorios/
│   │       └── page.tsx               ← relatórios e exportação
│   └── api/
│       ├── equipamentos/route.ts
│       ├── equipamentos/[id]/route.ts
│       ├── manutencao/route.ts
│       ├── alertas/route.ts
│       ├── compatibilidade/route.ts
│       └── dashboard/route.ts
├── components/
│   ├── ui/                            ← shadcn components
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── equipamentos/
│   │   ├── EquipamentoCard.tsx
│   │   ├── EquipamentoDetalhe.tsx
│   │   └── EquipamentoTabela.tsx
│   ├── alertas/
│   │   ├── AlertaANVISA.tsx
│   │   └── AlertaCompatibilidade.tsx  ← ⭐ componente crítico
│   ├── manutencao/
│   │   ├── OrdemServico.tsx
│   │   └── KPIGauge.tsx
│   └── dashboard/
│       ├── ResumoFinanceiro.tsx
│       ├── AlertasCriticos.tsx
│       └── DisponibilidadeGrafico.tsx
├── hooks/
│   ├── useCompatibilidade.ts          ← ⭐ hook crítico
│   ├── useEquipamentos.ts
│   └── useAlertas.ts
├── lib/
│   ├── kb.ts                          ← carrega e indexa o JSON
│   ├── prisma.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma                  ← usar o schema_v2.prisma fornecido
│   └── seed.ts                        ← usar o seed_v2.ts fornecido
└── data/
    └── hospital_knowledge_base_enriched.json  ← COPIAR AQUI
```

---

## MÓDULOS DO SISTEMA — ESPECIFICAÇÃO DETALHADA

---

### MÓDULO 1 — DASHBOARD PRINCIPAL (`/`)

**Objetivo:** Visão executiva em tempo real do parque de equipamentos.

**Cards de KPI (linha superior):**
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  201             │ │  4               │ │  R$ 2,67M        │ │  35              │
│  Equipamentos    │ │  Alertas         │ │  CCO Anual       │ │  Contratos AT    │
│  no parque       │ │  CRÍTICOS        │ │  Estimado        │ │  Obrigatórios    │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Seção central — dois painéis lado a lado:**
- **Alertas ANVISA abertos** (lista dos 5 mais críticos com link para módulo de alertas)
- **Equipamentos por score de risco** (gráfico donut: CRÍTICO / ALTO / MÉDIO / BAIXO)

**Seção inferior:**
- **Distribuição de manutenção** — gráfico de barras: EC Interna vs AT Autorizada vs Laboratório RBC
- **Top 10 CCO por equipamento** — tabela com barra de progresso

**Dados do KB a usar:**
```typescript
// lib/kb.ts
import kb from '@/data/hospital_knowledge_base_enriched.json'

export const equipamentos = kb.equipamentos_catalogo
export const getEquipamento = (nome: string) =>
  equipamentos.find(e => e.nome === nome)

// score_risco pode ser string ou {nivel: string} — tratar os dois:
export const getNivelRisco = (item: any): string => {
  if (typeof item.score_risco === 'string') return item.score_risco
  if (typeof item.score_risco === 'object') return item.score_risco?.nivel ?? 'MÉDIO'
  return 'MÉDIO'
}
```

---

### MÓDULO 2 — EQUIPAMENTOS (`/equipamentos`)

**Lista com filtros:**
- Busca por nome
- Filtro por score de risco (CRÍTICO / ALTO / MÉDIO / BAIXO)
- Filtro por classe ANVISA (I / II / III / IV)
- Filtro por contrato AT obrigatório (sim/não)
- Ordenação por CCO, valor, score

**Cada linha da tabela:**
```
[Badge risco] Nome do Equipamento    CATMAT   ANVISA   CCO/ano    Score   [Ver →]
```

**Detalhe do equipamento (`/equipamentos/[id]`):**

Layout em abas:
```
[Técnico] [Financeiro] [Manutenção] [Alertas ANVISA] [KPIs] [Dependências]
```

**Aba Técnico:**
- Descritivo técnico completo (campo `descritivo_tecnico.conteudo`)
- Normas técnicas aplicáveis
- Conexões de instalação
- TCE elétrica
- Fabricantes de referência (3 por equipamento com país e site)

**Aba Financeiro:**
- Valor unitário de referência (BPS)
- CCO anual estimado
- Breakdown CCO: mão de obra / peças / consumíveis
- Vida útil e depreciação
- Planejamento financeiro por fase

**Aba Manutenção:**
- Tabela de responsabilidade por nível:

```
Tipo                    Nível 1      Nível 2      Nível 3
Preventiva              EC_INTERNA   AT_AUTOR.    AT_AUTOR.
Corretiva               EC_INTERNA   EC_INTERNA   AT_AUTOR.
Calibração              EC_INTERNA   —            —
Qualificação            —            AT_AUTOR.    —
```
- Badge "Contrato AT Obrigatório" se `contrato_obrigatorio: true`
- Prazo de resposta AT em horas

**Aba Alertas ANVISA:**
- Lista de todos os alertas do equipamento
- Badge de gravidade colorido (CRÍTICA=vermelho, ALTA=laranja, etc.)
- Status (ABERTO / RESOLVIDO / RESOLVIDO_POR_SOFTWARE)
- Ação recomendada para o hospital
- Botão "Marcar como verificado" (chama PATCH /api/alertas)
- Link para portal ANVISA

**Aba KPIs:**
- Disponibilidade esperada com gauge visual (%)
- MTBF em horas e dias
- MTTR em horas
- Limites amarelo e vermelho com linha de referência
- Fonte dos dados (ECRI Institute / AAMI HTM)

**Aba Dependências:**
- **⭐ Componente AlertaCompatibilidade** (ver especificação abaixo)

---

### MÓDULO 3 — ALERTA DE COMPATIBILIDADE (`AlertaCompatibilidade.tsx`)

**Este é o componente mais importante do sistema. Deve aparecer em 4 lugares:**
1. Aba Dependências do detalhe do equipamento
2. Modal/sidebar de criação de OS de aquisição
3. Página de planejamento de aquisição
4. Gerador de PIES (futuro)

**Lógica:**

```typescript
// hooks/useCompatibilidade.ts
import { useMemo } from 'react'
import { equipamentos, getNivelRisco } from '@/lib/kb'

export function useCompatibilidade(nomeEquipamento: string) {
  return useMemo(() => {
    const item = equipamentos.find(e => e.nome === nomeEquipamento)
    if (!item?.depende_de) return null

    const dep = item.depende_de

    return {
      depende_de:                dep.depende_de ?? [],
      complementado_por:         dep.complementado_por ?? [],
      incompativel_com:          dep.incompativel_com ?? [],
      requer_instalacao_conjunta: dep.requer_instalacao_conjunta ?? [],
      obs:                       dep.obs ?? '',
      temAlertaCritico: !!(dep.depende_de?.length || dep.requer_instalacao_conjunta?.length),
      temAlertaInfo:    !!(dep.complementado_por?.length),
      temIncompativel:  !!(dep.incompativel_com?.length),
    }
  }, [nomeEquipamento])
}
```

**Componente visual (`AlertaCompatibilidade.tsx`):**

```tsx
// Renderizar 4 blocos distintos conforme o que existe:

// 1. BLOCO CRÍTICO — depende_de (não funciona sem)
// Fundo vermelho escuro, ícone AlertTriangle
// "⚠️ Este equipamento NÃO FUNCIONA sem:"
// Lista com link para cada equipamento dependente

// 2. BLOCO OBRIGATÓRIO — requer_instalacao_conjunta
// Fundo laranja escuro, ícone Link2
// "🔗 Deve ser licitado/instalado em conjunto com:"
// Lista com badges de cada par + observação

// 3. BLOCO INCOMPATÍVEL — incompativel_com
// Fundo vermelho, ícone Ban
// "🚫 Incompatível / não usar simultaneamente com:"

// 4. BLOCO INFORMATIVO — complementado_por
// Fundo azul escuro, ícone Sparkles
// "✨ Funcionalidade ampliada com:"
// Lista colapsável (mostrar 3, "+ ver mais")
```

**Comportamento contextual por `contexto` prop:**

```tsx
interface Props {
  equipamentoNome: string
  contexto: 'detalhe' | 'aquisicao' | 'pies' | 'os'
  onVerEquipamento?: (nome: string) => void  // callback para navegar
}

// contexto 'aquisicao': mostrar banner no topo da página/modal com contagem
// "⚠️ 3 equipamentos desta lista exigem aquisição conjunta — verifique antes de publicar o edital"

// contexto 'detalhe': mostrar blocos completos em abas

// contexto 'os': mostrar apenas alerta inline simples (1 linha) se temAlertaCritico
```

---

### MÓDULO 4 — ALERTAS ANVISA (`/alertas`)

**Reutilizar** o componente `anvisa_alertas_sistema.jsx` já desenvolvido, adaptando para o design system do projeto.

**Adicionar:**
- Filtro por fabricante (Philips, GE Healthcare, Getinge, Dräger, Mindray, B. Braun, Stryker)
- Contador de alertas por equipamento
- Export CSV dos alertas abertos
- Integração com módulo de Manutenção (criar OS a partir de um alerta)

**API route (`/api/alertas`):**
```typescript
// GET — lista todos os alertas achatados com paginação e filtros
// PATCH — marca alerta como verificado
// POST /api/alertas/sync — re-lê o JSON e atualiza o banco
```

---

### MÓDULO 5 — MANUTENÇÃO / ORDENS DE SERVIÇO (`/manutencao`)

**Lista de OS com:**
- Status (Aberta / Em andamento / Concluída / Cancelada)
- Tipo (Preventiva / Corretiva / Calibração / Qualificação)
- Equipamento (link para detalhe)
- Responsável (EC_INTERNA / AT_AUTORIZADA / LAB_RBC)
- Data de abertura / prazo / conclusão
- SLA (semáforo: dentro do prazo / atrasada / crítica)

**Criar nova OS:**
- Selecionar equipamento (autocomplete buscando no KB)
- Sistema preenche automaticamente:
  - Tipo de responsável para o nível de manutenção selecionado
  - Prazo esperado (MTTR do equipamento)
  - Contrato AT obrigatório ou não
- **AlertaCompatibilidade** aparece inline se `depende_de` não vazio
- Campo de descrição livre
- Upload de foto (opcional — Supabase Storage)

**Painel de KPIs da manutenção:**
```
Disponibilidade real vs esperada (por equipamento)
MTBF real vs referência (ECRI Institute)
MTTR real vs referência
% OS por responsável (EC / AT / Lab)
Custo mensal de manutenção
```

---

### MÓDULO 6 — AQUISIÇÃO / PLANEJAMENTO (`/aquisicao`)

**Lista de equipamentos planejados para aquisição com:**
- Checkbox de seleção múltipla
- Valor unitário (BPS)
- Quantidade
- Valor total
- Alerta de compatibilidade inline

**Ao selecionar equipamentos:**
- Sistema verifica automaticamente todos os `requer_instalacao_conjunta`
- Exibe banner: "⚠️ Você selecionou X equipamentos que exigem Y pares obrigatórios não incluídos na lista"
- Botão "Adicionar pares faltantes automaticamente"

**Exportar:**
- Lista de equipamentos para PIES (PDF ou DOCX)
- Descritivo técnico completo (campo `descritivo_tecnico.conteudo`)
- Planilha de valores estimados (Excel)

---

## BANCO DE DADOS — SCHEMA PRISMA

**Usar o arquivo `schema_v2.prisma` fornecido como base.**

Adicionar as seguintes tabelas para dados operacionais (o KB fica em JSON, não no banco):

```prisma
model OrdemServico {
  id              String   @id @default(cuid())
  equipamentoNome String   // referência ao KB por nome
  tipo            TipoOS   // PREVENTIVA | CORRETIVA | CALIBRACAO | QUALIFICACAO
  status          StatusOS // ABERTA | EM_ANDAMENTO | CONCLUIDA | CANCELADA
  responsavel     String   // EC_INTERNA | ASSISTENCIA_AUTORIZADA | LABORATORIO_RBC
  descricao       String?
  prazoHoras      Int?     // MTTR esperado do KB
  abertoEm        DateTime @default(now())
  prazoEm         DateTime?
  concluidoEm     DateTime?
  tecnicoNome     String?
  custo           Float?
  observacao      String?
  alertaOrigemId  String?  // se OS criada a partir de alerta ANVISA
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AlertaVerificacao {
  id                  String   @id @default(cuid())
  equipamentoNome     String
  numeroAlerta        String
  responsavel         String
  dataVerificacao     DateTime
  observacao          String?
  createdAt           DateTime @default(now())
}

model RegistroDisponibilidade {
  id              String   @id @default(cuid())
  equipamentoNome String
  mes             String   // "2025-01"
  horasDisponiveis Float
  horasProgramadas Float
  disponibilidade Float    // calculado
  createdAt       DateTime @default(now())
}
```

---

## SEED DO BANCO

**Usar o arquivo `seed_v2.ts` fornecido.**

O seed popula as tabelas de referência a partir do JSON. Os dados operacionais (OS, verificações, disponibilidade) começam vazios.

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

---

## API ROUTES — ESPECIFICAÇÃO

### `/api/equipamentos`
```typescript
GET  /api/equipamentos              // lista com filtros: ?risco=CRÍTICO&anvisa=III
GET  /api/equipamentos/[nome]       // detalhe por nome (URL encoded)
GET  /api/equipamentos/[nome]/kpis  // KPIs do equipamento
```

### `/api/alertas`
```typescript
GET   /api/alertas                  // todos os alertas achatados, ordenados por criticidade
GET   /api/alertas?status=ABERTO    // filtrado
PATCH /api/alertas                  // { equipamentoNome, numeroAlerta, responsavel }
```

### `/api/compatibilidade`
```typescript
GET /api/compatibilidade?nome=Máquina+de+Hemodiálise
// Retorna o objeto depende_de do equipamento
// + enriquecido com status de cada par (existe no patrimônio? sim/não)
```

### `/api/manutencao`
```typescript
GET    /api/manutencao              // lista OS com filtros
POST   /api/manutencao              // criar OS
PATCH  /api/manutencao/[id]         // atualizar status
GET    /api/manutencao/kpis         // métricas agregadas
```

### `/api/dashboard`
```typescript
GET /api/dashboard
// Retorna objeto com todos os dados do dashboard em uma chamada:
{
  totalEquipamentos: 201,
  alertasCriticos: 4,
  alertasAbertos: 60,
  ccoAnual: 2666854,
  contratosATObrigatorios: 35,
  distribuicaoRisco: { CRÍTICO: N, ALTO: N, MÉDIO: N, BAIXO: N },
  distribuicaoManutencao: { EC_INTERNA: N, AT: N, LAB: N },
  top10CCO: [...],
  alertasRecentesCriticos: [...],
}
```

---

## COMPONENTES REUTILIZÁVEIS OBRIGATÓRIOS

### `RiscoBadge`
```tsx
<RiscoBadge nivel="CRÍTICO" />  // vermelho
<RiscoBadge nivel="ALTO" />     // laranja
<RiscoBadge nivel="MÉDIO" />    // amarelo
<RiscoBadge nivel="BAIXO" />    // verde
```

### `GravidadeBadge`
```tsx
<GravidadeBadge gravidade="CRÍTICA" />
<GravidadeBadge gravidade="INDETERMINADA" />
```

### `ManutencaoTipoBadge`
```tsx
<ManutencaoTipoBadge tipo="EC_INTERNA" />
<ManutencaoTipoBadge tipo="ASSISTENCIA_AUTORIZADA" />
<ManutencaoTipoBadge tipo="LABORATORIO_RBC" />
```

### `KPICard`
```tsx
<KPICard
  label="Disponibilidade Esperada"
  valor={98.5}
  unidade="%"
  alertaAmarelo={96.0}
  alertaVermelho={93.0}
  real={97.2}  // opcional — quando houver dado histórico
/>
```

### `AlertaCompatibilidade`
Especificado no Módulo 3 acima.

---

## REGRAS CRÍTICAS DE DESENVOLVIMENTO

### 1. NUNCA inventar dados
Todos os dados vêm do JSON. Se um campo não existe para um equipamento, mostrar `—` ou `N/I`.

### 2. score_risco é polimórfico
```typescript
// SEMPRE usar esta função:
export const getNivelRisco = (item: any): string => {
  if (typeof item.score_risco === 'string') return item.score_risco
  if (typeof item.score_risco === 'object') return item.score_risco?.nivel ?? 'MÉDIO'
  return 'MÉDIO'
}
```

### 3. AlertaCompatibilidade em contexto de aquisição
Quando o usuário adicionar um equipamento à lista de aquisição, verificar imediatamente:
- `depende_de.requer_instalacao_conjunta` — mostrar banner de aviso
- `depende_de.depende_de` — mostrar alerta crítico bloqueante

### 4. Alertas ANVISA — ordenação
Sempre exibir na ordem: CRÍTICA → ALTA → MÉDIA → INDETERMINADA → BAIXA → RESOLVIDO

### 5. Textos longos de descritivo
O campo `descritivo_tecnico.conteudo` tem até 4.000 caracteres. Usar `<pre>` com fonte mono para preservar a formatação, ou parsear as seções numeradas (1. IDENTIFICAÇÃO, 2. NORMAS, etc.)

### 6. Valores monetários
```typescript
const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
```

### 7. Performance
O JSON tem 3,6 MB. Carregar apenas no servidor (Server Components). Nunca importar o JSON inteiro no cliente. Usar `getStaticProps` ou Server Actions com cache.

---

## SEQUÊNCIA DE IMPLEMENTAÇÃO RECOMENDADA

```
Semana 1:
  [ ] Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
  [ ] Configurar Prisma + schema + seed
  [ ] lib/kb.ts — indexar e expor o JSON
  [ ] Layout base: Sidebar + Header
  [ ] Módulo Dashboard (dados reais do JSON)
  [ ] Componentes base: RiscoBadge, GravidadeBadge, KPICard

Semana 2:
  [ ] Módulo Equipamentos — lista com filtros
  [ ] Módulo Equipamentos — detalhe com abas
  [ ] hooks/useCompatibilidade.ts
  [ ] AlertaCompatibilidade.tsx (todas as variantes)
  [ ] API routes: /equipamentos, /compatibilidade

Semana 3:
  [ ] Módulo Alertas ANVISA (adaptar componente existente)
  [ ] Módulo Manutenção — lista de OS
  [ ] Módulo Manutenção — criar OS com alerta de compatibilidade
  [ ] API routes: /alertas, /manutencao

Semana 4:
  [ ] Módulo Aquisição — verificação automática de pares
  [ ] KPIs de desempenho com gráficos Recharts
  [ ] Relatórios + exportação
  [ ] Testes e polimento visual
```

---

## ARQUIVOS FORNECIDOS

Copie para o projeto na seguinte estrutura:

```
data/
  hospital_knowledge_base_enriched.json  ← KB completo (3,6 MB)

prisma/
  schema.prisma                          ← usar schema_v2.prisma como base
  seed.ts                                ← usar seed_v2.ts

components/
  alertas/
    AnvisaAlertas.jsx                    ← adaptar anvisa_alertas_sistema.jsx
```

Os arquivos `schema_v2.prisma`, `seed_v2.ts` e `anvisa_alertas_sistema.jsx` estão na pasta de outputs da sessão de desenvolvimento.

---

## ENTREGÁVEL ESPERADO

Um sistema web funcional e visualmente vendável com:

1. **Dashboard** com métricas reais do parque de equipamentos
2. **Catálogo de equipamentos** com busca, filtros e detalhe completo
3. **Sistema de alertas ANVISA** com gestão de verificação pela EC
4. **Alerta de compatibilidade** automático em todos os módulos relevantes
5. **Gestão de ordens de serviço** com classificação EC vs AT vs Lab
6. **Módulo de aquisição** com verificação automática de pares obrigatórios

O sistema deve ser **imediatamente impressionante** para um gestor hospitalar ou profissional de Engenharia Clínica — dados reais, interface profissional, zero dados mockados.

---

*AION — Engenharia Clínica Hospitalar | Hospital Estadual 3 Colinas | FAEPA | Franca/SP*
*Base de conhecimento v2.9 | 201 equipamentos | 20 campos | 82 alertas ANVISA*
