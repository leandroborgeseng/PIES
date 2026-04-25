'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

const STORAGE_KEY = 'aion_editable_areas';
const LEGACY_CUSTOM_STORAGE_KEY = 'aion_custom_areas';

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

type EditableArea = {
  id: number;
  nome: string;
  setorNome: string;
  pavimento: string;
  parametroLabel: string;
  baseParametro: number;
  source?: 'system' | 'custom';
  itens: CustomItem[];
};

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function carregarAreas(areasSistema: EditableArea[]): EditableArea[] {
  if (typeof window === 'undefined') return areasSistema;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as EditableArea[];
    if (stored.length > 0) return mergeAreas(areasSistema, stored);

    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_CUSTOM_STORAGE_KEY) ?? '[]') as EditableArea[];
    return mergeAreas(areasSistema, legacy.map((area) => ({ ...area, source: 'custom' as const })));
  } catch {
    return areasSistema;
  }
}

function mergeAreas(areasSistema: EditableArea[], stored: EditableArea[]) {
  const storedById = new Map(stored.map((area) => [area.id, area]));
  const mergedSystem = areasSistema.map((area) => ({ ...(storedById.get(area.id) ?? area), source: 'system' as const }));
  const custom = stored.filter((area) => area.id < 0).map((area) => ({ ...area, source: 'custom' as const }));
  return [...custom, ...mergedSystem];
}

function salvarAreas(areas: EditableArea[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(areas));
  window.dispatchEvent(new Event('aion-custom-areas-updated'));
}

function novaArea(): EditableArea {
  return {
    id: -Date.now(),
    nome: 'Nova área',
    setorNome: 'CUSTOMIZADO',
    pavimento: 'N/I',
    parametroLabel: 'leitos',
    baseParametro: 1,
    source: 'custom',
    itens: [],
  };
}

export function AreaItemManager({ areasSistema, equipamentos }: { areasSistema: EditableArea[]; equipamentos: EquipamentoCatalogo[] }) {
  const [areas, setAreas] = useState<EditableArea[]>(areasSistema);
  const [areaAtivaId, setAreaAtivaId] = useState<number | null>(areasSistema[0]?.id ?? null);
  const [buscaArea, setBuscaArea] = useState('');
  const [buscaEquipamento, setBuscaEquipamento] = useState('');
  const areaAtiva = areas.find((area) => area.id === areaAtivaId) ?? areas[0];

  useEffect(() => {
    const loaded = carregarAreas(areasSistema);
    setAreas(loaded);
    setAreaAtivaId(loaded[0]?.id ?? null);
  }, [areasSistema]);

  const areasFiltradas = useMemo(() => areas.filter((area) => normalizar(`${area.setorNome} ${area.nome}`).includes(normalizar(buscaArea))), [areas, buscaArea]);
  const equipamentosFiltrados = useMemo(() => equipamentos
    .filter((item) => normalizar(item.nome).includes(normalizar(buscaEquipamento)))
    .slice(0, 40), [buscaEquipamento, equipamentos]);

  function persistir(next: EditableArea[]) {
    setAreas(next);
    salvarAreas(next);
    if (!next.some((area) => area.id === areaAtivaId)) setAreaAtivaId(next[0]?.id ?? null);
  }

  function adicionarArea() {
    const area = novaArea();
    persistir([area, ...areas]);
    setAreaAtivaId(area.id);
  }

  function atualizarArea(patch: Partial<EditableArea>) {
    if (!areaAtiva) return;
    persistir(areas.map((area) => area.id === areaAtiva.id ? { ...area, ...patch } : area));
  }

  function removerArea(id: number) {
    persistir(areas.filter((area) => area.id !== id));
  }

  function restaurarAreaSistema(id: number) {
    const original = areasSistema.find((area) => area.id === id);
    if (!original) return;
    persistir(areas.map((area) => area.id === id ? original : area));
  }

  function adicionarItem(equipamento: EquipamentoCatalogo) {
    if (!areaAtiva) return;
    const item: CustomItem = {
      id: Date.now(),
      equipmentId: equipamento.id,
      nome: equipamento.nome,
      quantidade: 1,
      valorUnitario: equipamento.valor ?? 0,
      classificacao: 'RECOMENDADO',
      justificativa: '',
    };
    atualizarArea({ itens: [item, ...areaAtiva.itens] });
  }

  function atualizarItem(itemId: number, patch: Partial<CustomItem>) {
    if (!areaAtiva) return;
    atualizarArea({ itens: areaAtiva.itens.map((item) => item.id === itemId ? { ...item, ...patch } : item) });
  }

  function removerItem(itemId: number) {
    if (!areaAtiva) return;
    atualizarArea({ itens: areaAtiva.itens.filter((item) => item.id !== itemId) });
  }

  return (
    <div className="grid">
      <section className="card card-pad" style={{ borderColor: '#0066b240' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="badge" style={{ color: 'var(--primary)', marginBottom: 10 }}>Editor da base de planejamento</div>
            <h2 className="title">Áreas e itens do sistema</h2>
            <p className="subtle" style={{ maxWidth: 840 }}>Edite áreas e itens vindos do KB ou cadastre áreas novas. As alterações ficam salvas localmente e substituem a área original no fluxo de Novo Projeto.</p>
          </div>
          <button className="button" onClick={adicionarArea}><Plus size={16} /> Nova área</button>
        </div>
      </section>

      <section className="grid grid-3">
        <div className="card card-pad">
          <h3 className="section-title">Áreas</h3>
          <input className="input" placeholder="Buscar área" value={buscaArea} onChange={(e) => setBuscaArea(e.target.value)} style={{ marginBottom: 12 }} />
          <div className="grid" style={{ maxHeight: 720, overflow: 'auto' }}>
            {areasFiltradas.map((area) => <button key={area.id} className="card card-pad" style={{ textAlign: 'left', cursor: 'pointer', borderColor: area.id === areaAtiva?.id ? 'var(--primary)' : 'var(--border)' }} onClick={() => setAreaAtivaId(area.id)}>
              <span className="badge" style={{ color: area.source === 'custom' ? 'var(--low)' : 'var(--primary)', marginBottom: 8 }}>{area.source === 'custom' ? 'Nova' : 'Sistema'}</span>
              <strong style={{ display: 'block' }}>{area.setorNome} · {area.nome}</strong>
              <div className="subtle">{area.itens.length} item(ns) · base {area.baseParametro} {area.parametroLabel}</div>
            </button>)}
          </div>
        </div>

        <div className="card card-pad" style={{ gridColumn: 'span 2' }}>
          {areaAtiva ? <div className="grid">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h3 className="section-title">Editar área</h3>
                <span className="badge" style={{ color: areaAtiva.source === 'custom' ? 'var(--low)' : 'var(--primary)' }}>{areaAtiva.source === 'custom' ? 'Área cadastrada' : 'Área do sistema editável'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {areaAtiva.source !== 'custom' && <button className="button secondary" onClick={() => restaurarAreaSistema(areaAtiva.id)}><RotateCcw size={14} /> Restaurar padrão</button>}
                {areaAtiva.source === 'custom' && <button className="button secondary" onClick={() => removerArea(areaAtiva.id)}><Trash2 size={14} /> Excluir área</button>}
              </div>
            </div>
            <div className="grid grid-2">
              <label><div className="subtle" style={{ marginBottom: 6 }}>Nome da área</div><input className="input" value={areaAtiva.nome} onChange={(e) => atualizarArea({ nome: e.target.value })} /></label>
              <label><div className="subtle" style={{ marginBottom: 6 }}>Setor</div><input className="input" value={areaAtiva.setorNome} onChange={(e) => atualizarArea({ setorNome: e.target.value })} /></label>
              <label><div className="subtle" style={{ marginBottom: 6 }}>Pavimento</div><input className="input" value={areaAtiva.pavimento} onChange={(e) => atualizarArea({ pavimento: e.target.value })} /></label>
              <label><div className="subtle" style={{ marginBottom: 6 }}>Parâmetro</div><select className="select" value={areaAtiva.parametroLabel} onChange={(e) => atualizarArea({ parametroLabel: e.target.value })}><option value="leitos">leitos</option><option value="salas">salas</option><option value="unidades">unidades</option></select></label>
              <label><div className="subtle" style={{ marginBottom: 6 }}>Quantidade base</div><input className="input mono" type="number" min={1} value={areaAtiva.baseParametro} onChange={(e) => atualizarArea({ baseParametro: Number(e.target.value) || 1 })} /></label>
            </div>

            <div className="card card-pad">
              <h3 className="section-title">Adicionar item do catálogo</h3>
              <input className="input" placeholder="Buscar equipamento" value={buscaEquipamento} onChange={(e) => setBuscaEquipamento(e.target.value)} />
              <div className="grid" style={{ marginTop: 12, maxHeight: 320, overflow: 'auto' }}>
                {equipamentosFiltrados.map((equipamento) => <button key={equipamento.id} className="card card-pad" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => adicionarItem(equipamento)}>
                  <strong>{equipamento.nome}</strong>
                  <div className="subtle">{formatBRL(equipamento.valor)} · risco {equipamento.risco}</div>
                </button>)}
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead><tr><th>Item</th><th>Classe</th><th>Qtd base</th><th>Preço</th><th>Total base</th><th>Justificativa</th><th></th></tr></thead>
                <tbody>
                  {areaAtiva.itens.length === 0 && <tr><td colSpan={7} className="subtle">Adicione itens do catálogo para compor esta área.</td></tr>}
                  {areaAtiva.itens.map((item) => <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td><select className="select" value={item.classificacao} onChange={(e) => atualizarItem(item.id, { classificacao: e.target.value })}><option>OBRIGATÓRIO</option><option>RECOMENDADO</option><option>CONDICIONAL</option><option>OPCIONAL</option></select></td>
                    <td><input className="input mono" style={{ width: 90 }} type="number" min={0} value={item.quantidade} onChange={(e) => atualizarItem(item.id, { quantidade: Number(e.target.value) || 0 })} /></td>
                    <td><input className="input mono" style={{ width: 130 }} type="number" min={0} value={item.valorUnitario} onChange={(e) => atualizarItem(item.id, { valorUnitario: Number(e.target.value) || 0 })} /></td>
                    <td><strong>{formatBRL(item.quantidade * item.valorUnitario)}</strong></td>
                    <td><textarea className="textarea" style={{ minWidth: 220, minHeight: 70 }} value={item.justificativa ?? ''} onChange={(e) => atualizarItem(item.id, { justificativa: e.target.value })} placeholder="Justificativa técnica ou referência" /></td>
                    <td><button className="button secondary" onClick={() => removerItem(item.id)}><Trash2 size={14} /></button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="badge" style={{ color: 'var(--low)' }}><Save size={14} />Salvo automaticamente no navegador</div>
          </div> : <p className="subtle">Crie ou selecione uma área para editar.</p>}
        </div>
      </section>
    </div>
  );
}
