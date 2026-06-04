'use client';

import { useState, useEffect, useMemo } from 'react';
import { getUniqueNomes, getCompletedTurnos, getMostRecentCompletedTurno, getRecord, DomainRecord } from '@/lib/types';

// ── helpers ───────────────────────────────────────────────────────────────────
function fmt(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  const s = String(v);
  if (s === 'null' || s === '') return '—';
  return s;
}
function numFmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR');
}

// ── manobras data ─────────────────────────────────────────────────────────────
type CostItem = { label: string; value: string };
type ResourceRef = { key: keyof DomainRecord; label: string };

type Manobra = {
  nome: string;
  icon: string;
  custos: CostItem[];
  recursos: ResourceRef[]; // which current domain resources are relevant
  descricao: string;
};

const MANOBRAS: Manobra[] = [
  {
    nome: 'Ameaçar',
    icon: '⚔️',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [{ key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' }],
    descricao: 'Demonstração de força contra um ou mais domínios. Se vencer, o oponente deve realizar Não Fazer Nada ou Esperar no próximo turno. Sucesso crítico: oponente fica "atordoado" por 1d turnos. Se perder, a reação do alvo pode piorar. Uso contínuo pode resultar em guerra.',
  },
  {
    nome: 'Blefar',
    icon: '🎭',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [{ key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' }],
    descricao: 'Ameaças sutis, mentiras ou engano com outro domínio ou próprio povo. Sempre sofre -4 nas rolagens. Sucesso funciona como Negociar (diplomacia) ou Ameaçar (intimidação). Arriscada — difícil distinguir de propaganda legítima.',
  },
  {
    nome: 'Sabotar',
    icon: '🗡️',
    custos: [{ label: 'Força de Trabalho', value: '2 pts' }],
    recursos: [{ key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' }],
    descricao: 'Sabotagem física de infraestrutura, ataques políticos ou culturais, sabotagem de registros financeiros, ataque a instituições religiosas ou inserção de desinformação. Sabotagem puramente social pode ser melhor representada por Blefe ou Ameaçar.',
  },
  {
    nome: 'Negociar',
    icon: '🕊️',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [{ key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' }],
    descricao: 'Negociação verdadeira com outros reinos ou com o próprio povo. Geralmente ocorre antes de acordos comerciais ou em diplomacia. Ao contrário de Blefe, é honesto — embora outro domínio possa ter dificuldade em distinguir.',
  },
  {
    nome: 'Comercializar',
    icon: '🤝',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' },
      { key: 'Bens_Luxo_Pontos', label: 'Bens de Luxo disponíveis' },
      { key: 'Dinheiro_Final', label: 'Dinheiro disponível' },
    ],
    descricao: 'Negociação entre domínios: troca de dinheiro, Pontos de Recurso, serviços e/ou bens. Troca simples na qual cada domínio negocia seus ativos.',
  },
  {
    nome: 'Reunir Mão de Obra',
    icon: '👥',
    custos: [
      { label: 'Dinheiro', value: 'Potencialmente' },
      { label: 'Bens de Luxo', value: 'Potencialmente' },
    ],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho atual' },
      { key: 'Dinheiro_Final', label: 'Dinheiro disponível' },
      { key: 'Bens_Luxo_Pontos', label: 'Bens de Luxo disponíveis' },
    ],
    descricao: 'Recruta forças militares, mão de obra ou Pontos de Força de Trabalho. Pode fundar novas cidades, construir grandes estruturas ou reunir cidadãos para um propósito específico como preparar um cerco.',
  },
  {
    nome: 'Alocar Recursos',
    icon: '📋',
    custos: [
      { label: 'Força de Trabalho', value: '1 pt' },
      { label: 'Custos extras', value: 'Variável' },
    ],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' },
      { key: 'Dinheiro_Final', label: 'Dinheiro disponível' },
    ],
    descricao: 'Manobra de propósito geral: lidar com epidemias, gerenciar burocracia, política interna. Escolhida ao lidar com questões internas do domínio.',
  },
  {
    nome: 'Coletar / Extrair',
    icon: '⛏️',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' },
      { key: 'Agricultura_Pontos', label: 'Agricultura atual' },
      { key: 'Recursos_Naturais_Pontos', label: 'Recursos Naturais atuais' },
      { key: 'Bens_Luxo_Pontos', label: 'Bens de Luxo atuais' },
    ],
    descricao: 'Ganha mais Pontos de Recurso (qualquer tipo, exceto Força de Trabalho). Ocupa o turno inteiro. O tipo de recurso deve ser especificado no início da sequência. Para ganhar Força de Trabalho, use Reunir Mão de Obra.',
  },
  {
    nome: 'Fabricar',
    icon: '🏭',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' },
      { key: 'Recursos_Naturais_Pontos', label: 'Recursos Naturais (entrada)' },
      { key: 'Bens_Luxo_Pontos', label: 'Bens de Luxo (saída ×1,5)' },
    ],
    descricao: 'Converte Pontos de Recursos Naturais em 1,5× o mesmo número de Pontos de Bens de Luxo (arredonde para cima).',
  },
  {
    nome: 'Melhorar',
    icon: '🏗️',
    custos: [
      { label: 'Força de Trabalho', value: '1 pt' },
      { label: 'Dinheiro', value: 'Valor da mudança no domínio' },
    ],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' },
      { key: 'Dinheiro_Final', label: 'Dinheiro disponível' },
      { key: 'Valor_Modificado', label: 'Valor modificado atual' },
    ],
    descricao: 'Adquire novos aprimoramentos ou remove limitações. Custa o equivalente à mudança no Valor do Domínio. Falha: metade do custo economizada. Falha crítica: todo custo perdido. Sucesso crítico: dobra o efeito sem custo adicional.',
  },
  {
    nome: 'Demolir',
    icon: '🔨',
    custos: [
      { label: 'Força de Trabalho', value: '1 pt' },
      { label: 'Dinheiro', value: 'Variável' },
    ],
    recursos: [
      { key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' },
      { key: 'Dinheiro_Final', label: 'Dinheiro disponível' },
    ],
    descricao: 'Usada para descartar aprimoramentos do domínio ou adicionar novas limitações de reino.',
  },
  {
    nome: 'Planejar',
    icon: '🗺️',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [{ key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' }],
    descricao: 'Estuda uma situação, avalia objetivos e planeja ações futuras. Concede +2 em rolagens para uma manobra específica. Manobras adicionais de Planejamento: +1 por turno extra, até +6 após cinco turnos consecutivos.',
  },
  {
    nome: 'Reconhecimento',
    icon: '🔭',
    custos: [{ label: 'Força de Trabalho', value: '1 pt' }],
    recursos: [{ key: 'Forca_Trabalho_Pontos', label: 'Força de Trabalho disponível' }],
    descricao: 'Similar a Planejar, mas reduz o custo em Força de Trabalho da próxima manobra: -1 pt a cada 4 pontos de margem de sucesso (mínimo 1 pt a menos). Também usado para reconhecer forças inimigas antes de batalhas ou recursos de outro domínio.',
  },
  {
    nome: 'Esperar',
    icon: '⏳',
    custos: [{ label: 'Custo', value: 'Conforme reação' }],
    recursos: [],
    descricao: 'Permite que um reino atrase suas reações a outros domínios até que um ou mais deles realizem uma manobra específica. O reino em espera pode então executar uma manobra predefinida antes que qualquer outro aja.',
  },
  {
    nome: 'Não Fazer Nada',
    icon: '💤',
    custos: [{ label: 'Custo', value: 'Nenhum' }],
    recursos: [],
    descricao: 'O domínio não realiza nenhuma ação e não gasta nenhum Ponto de Recurso.',
  },
];

// ── manobra card ──────────────────────────────────────────────────────────────
function ManobraCard({ manobra, record }: { manobra: Manobra; record: DomainRecord | null }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`manobra-card ${open ? 'manobra-card--open' : ''}`}>
      {/* ── always-visible header ── */}
      <div className="manobra-header">
        <div className="manobra-title-row">
          <span className="manobra-icon">{manobra.icon}</span>

          <span className="manobra-nome">
            {manobra.nome}
          </span>

          <button
            className="manobra-toggle"
            onClick={() => setOpen(o => !o)}
          >
            {open ? '▴' : '▾'} descrição
          </button>
        </div>

        {(manobra.custos.length > 0 || manobra.recursos.length > 0) && (
          <div className="manobra-grid">
            <div className="manobra-column">
              <div className="manobra-column-title">
                Custo
              </div>

              {manobra.custos.map(c => (
                <div
                  key={c.label}
                  className="manobra-pill manobra-pill--cost manobra-pill--full"
                >
                  <span className="pill-label">
                    {c.label}
                  </span>

                  <span className="pill-value">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="manobra-column">
              <div className="manobra-column-title">
                Disponível
              </div>

              {manobra.recursos.map(r => {
                const val = record ? record[r.key] : null;

                const display =
                  val === null || val === undefined
                    ? '—'
                    : String(val);

                return (
                  <div
                    key={r.key}
                    className={`manobra-pill manobra-pill--resource ${
                      display === '—'
                        ? 'manobra-pill--empty'
                        : ''
                    }`}
                  >
                    <span className="pill-label">
                      {r.label}
                    </span>

                    <span className="pill-value">
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── collapsible description ── */}
      {open && (
        <div className="manobra-body">
          <p className="manobra-descricao">{manobra.descricao}</p>
          {manobra.nome !== 'Não Fazer Nada' && manobra.nome !== 'Esperar' && (
            <p className="manobra-extra-note">
              ✦ Manobra extra no mesmo turno: +2 pts de Força de Trabalho adicionais ou −6 em todas as rolagens.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false, large = false }: {
  label: string; value: string; accent?: boolean; large?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''} ${large ? 'stat-card--large' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="section-header">
      <span className="section-icon">{icon}</span>
      <span className="section-title">{title}</span>
    </div>
  );
}

const STORAGE_KEY = 'rpg-selected-dominio';

// ── main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ data }: { data: DomainRecord[] }) {
  const nomes = useMemo(() => getUniqueNomes(data), [data]);

  const [selectedNome, setSelectedNome] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && nomes.includes(saved)) return saved;
    }
    return nomes[0];
  });

  const [selectedTurno, setSelectedTurno] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'recursos' | 'informacoes' | 'manobras'>('recursos');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedNome);
  }, [selectedNome]);

  useEffect(() => {
    if (selectedTurno === null) {
      const recent = getMostRecentCompletedTurno(data, selectedNome);
      setSelectedTurno(recent);
    }
  }, [data, selectedNome, selectedTurno]);

  const availableTurnos = useMemo(() => getCompletedTurnos(data, selectedNome), [data, selectedNome]);
  const record = useMemo(() =>
    selectedTurno !== null ? getRecord(data, selectedNome, selectedTurno) : null,
    [data, selectedNome, selectedTurno]
  );

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="page-header">
        <p className="header-eyebrow">Registros do Reino</p>
        <h1 className="header-title">Dashboard RPG G&amp;F</h1>
        <p className="header-subtitle">⚔ Administração de Domínios ⚔</p>
      </header>

      {/* ── Controls ── */}
      <div className="controls">
        <div className="control-group">
          <label className="control-label">Domínio</label>
          <div className="select-wrapper">
            <select value={selectedNome} onChange={e => { setSelectedNome(e.target.value); setSelectedTurno(null); }}>
              {nomes.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="control-group">
          <label className="control-label">Turno</label>
          <div className="select-wrapper">
            <select
              value={selectedTurno ?? ''}
              onChange={e => setSelectedTurno(Number(e.target.value))}
              disabled={availableTurnos.length === 0}
            >
              {availableTurnos.length === 0
                ? <option value="">Nenhum turno feito</option>
                : availableTurnos.map(t => <option key={t} value={t}>Turno {t}</option>)
              }
            </select>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="tab-nav">
        <button className={`tab-button ${activeTab === 'recursos' ? 'active' : ''}`} onClick={() => setActiveTab('recursos')}>
          Recursos
        </button>
        <button className={`tab-button ${activeTab === 'informacoes' ? 'active' : ''}`} onClick={() => setActiveTab('informacoes')}>
          Informações
        </button>
        <button className={`tab-button ${activeTab === 'manobras' ? 'active' : ''}`} onClick={() => setActiveTab('manobras')}>
          Manobras
        </button>
      </div>

      {/* ── Content ── */}
      <div className="content">
        {/* ── RECURSOS TAB ── */}
        {activeTab === 'recursos' && (
          <>
            {!record ? (
              <div className="empty">✦ Selecione um domínio ✦</div>
            ) : (
              <>
                {record.Agricultura_Pontos !== null && (
                  <div className="section">
                    <SectionHeader icon="🌾" title="Pontos de Recurso" />
                    <div className="section-body">
                      <div className="pontos-grid">
                        {[
                          { label: 'Agricultura', value: record.Agricultura_Pontos },
                          { label: 'Recursos\nNaturais', value: record.Recursos_Naturais_Pontos },
                          { label: 'Força de\nTrabalho', value: record.Forca_Trabalho_Pontos },
                          { label: 'Bens\nde Luxo', value: record.Bens_Luxo_Pontos },
                        ].map(p => (
                          <div className="ponto-item" key={p.label}>
                            <span className="ponto-label">{p.label}</span>
                            <span className="ponto-value">{p.value ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {record.Dinheiro_Inicial && (
                  <div className="section">
                    <SectionHeader icon="💰" title="Resumo Financeiro" />
                    <div className="section-body">
                      <div className="finance-row">
                        <span className="finance-label">Dinheiro Inicial</span>
                        <span className="finance-value finance-value--neutral">{fmt(record.Dinheiro_Inicial)}</span>
                      </div>
                      {record.Total_Entradas && (
                        <div className="finance-row">
                          <span className="finance-label">Total de Entradas</span>
                          <span className="finance-value finance-value--pos">+{fmt(record.Total_Entradas)}</span>
                        </div>
                      )}
                      {record.Renda && (
                        <div className="finance-row">
                          <span className="finance-label" style={{ paddingLeft: 10, opacity: 0.75 }}>↳ Renda</span>
                          <span className="finance-value finance-value--pos">{fmt(record.Renda)}</span>
                        </div>
                      )}
                      {record.Tributos_Vassalos && (
                        <div className="finance-row">
                          <span className="finance-label" style={{ paddingLeft: 10, opacity: 0.75 }}>↳ Tributos de Vassalos</span>
                          <span className="finance-value finance-value--pos">{fmt(record.Tributos_Vassalos)}</span>
                        </div>
                      )}
                      {record.Total_Saidas && (
                        <div className="finance-row">
                          <span className="finance-label">Total de Saídas</span>
                          <span className="finance-value finance-value--neg">{fmt(record.Total_Saidas)}</span>
                        </div>
                      )}
                      {record.Tributos_Pagos && (
                        <div className="finance-row">
                          <span className="finance-label" style={{ paddingLeft: 10, opacity: 0.75 }}>↳ Tributos Pagos</span>
                          <span className="finance-value finance-value--neg">{fmt(record.Tributos_Pagos)}</span>
                        </div>
                      )}
                      {record.Despesas_Militares && (
                        <div className="finance-row">
                          <span className="finance-label" style={{ paddingLeft: 10, opacity: 0.75 }}>↳ Despesas Militares</span>
                          <span className="finance-value finance-value--neg">{fmt(record.Despesas_Militares)}</span>
                        </div>
                      )}
                      {record.Outras_Saidas && (
                        <div className="finance-row">
                          <span className="finance-label" style={{ paddingLeft: 10, opacity: 0.75 }}>↳ Outras Saídas</span>
                          <span className="finance-value finance-value--neg">{fmt(record.Outras_Saidas)}</span>
                        </div>
                      )}
                      {record.Dinheiro_Final && (
                        <div className="finance-row finance-row--total">
                          <span className="finance-label" style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.1em', color: 'var(--gold)' }}>DINHEIRO FINAL</span>
                          <span className="finance-value finance-value--total">{fmt(record.Dinheiro_Final)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── INFORMAÇÕES TAB ── */}
        {activeTab === 'informacoes' && (
          <>
            {!record ? (
              <div className="empty">✦ Selecione um domínio ✦</div>
            ) : (
              <>
                {record.Area_mi2 && (
                  <div className="section">
                    <SectionHeader icon="🏰" title="Informações do Domínio" />
                    <div className="section-body">
                      <div className="stat-grid stat-grid--3">
                        <StatCard label="Área (mi²)" value={numFmt(record.Area_mi2)} />
                        <StatCard label="Governo" value={fmt(record.Governo)} />
                        <StatCard label="Economia" value={fmt(record.Economia)} />
                        <StatCard label="Lealdade" value={fmt(record.Lealdade)} accent />
                        <StatCard label="Terreno" value={fmt(record.Terreno)} large accent />
                      </div>
                    </div>
                  </div>
                )}
                {record.CR !== null && (
                  <div className="section">
                    <SectionHeader icon="⚔️" title="Estatísticas" />
                    <div className="section-body">
                      <div className="stat-grid stat-grid--3">
                        <StatCard label="CR" value={fmt(record.CR)} accent />
                        <StatCard label="ConR" value={fmt(record.ConR)} accent />
                        <StatCard label="OR" value={fmt(record.OR)} accent />
                        <StatCard label="Bônus Defesa" value={fmt(record.Bonus_Defesa)} />
                        <StatCard label="MS" value={fmt(record.MS)} />
                        <StatCard label="População" value={numFmt(record.Populacao)} />
                      </div>
                    </div>
                  </div>
                )}
                {(record.Valor_Base || record.Valor_Modificado) && (
                  <div className="section">
                    <SectionHeader icon="💎" title="Valor do Domínio" />
                    <div className="section-body">
                      <div className="stat-grid">
                        <StatCard label="Valor Base" value={numFmt(record.Valor_Base)} />
                        <StatCard label="Valor Modificado" value={numFmt(record.Valor_Modificado)} accent />
                      </div>
                    </div>
                  </div>
                )}
                <div className="ornament">✦ ✦ ✦</div>
              </>
            )}
          </>
        )}

        {/* ── MANOBRAS TAB ── */}
        {activeTab === 'manobras' && (
          <>
            <div className="manobras-intro">
              <p>A cada turno, escolha uma manobra para o domínio. Custam Força de Trabalho extra para executar mais de uma por turno.</p>
              {record && (
                <div className="manobras-recursos-snapshot">
                  <span className="snapshot-label">Recursos — Turno {record.Turno} ({selectedNome})</span>
                  <div className="snapshot-grid">
                    <div className="snapshot-item">
                      <span className="snapshot-key">🌾 Agri.</span>
                      <span className="snapshot-val">{record.Agricultura_Pontos ?? '—'}</span>
                    </div>
                    <div className="snapshot-item">
                      <span className="snapshot-key">🪨 Nat.</span>
                      <span className="snapshot-val">{record.Recursos_Naturais_Pontos ?? '—'}</span>
                    </div>
                    <div className="snapshot-item">
                      <span className="snapshot-key">💪 Trab.</span>
                      <span className="snapshot-val">{record.Forca_Trabalho_Pontos ?? '—'}</span>
                    </div>
                    <div className="snapshot-item">
                      <span className="snapshot-key">💎 Luxo</span>
                      <span className="snapshot-val">{record.Bens_Luxo_Pontos ?? '—'}</span>
                    </div>
                    <div className="snapshot-item snapshot-item--wide">
                      <span className="snapshot-key">💰 Dinheiro</span>
                      <span className="snapshot-val">{fmt(record.Dinheiro_Final)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {MANOBRAS.map(m => (
              <ManobraCard key={m.nome} manobra={m} record={record} />
            ))}

            <div className="ornament">✦ ✦ ✦</div>
          </>
        )}
      </div>
    </div>
  );
}