'use client';

import { useState, useEffect, useMemo } from 'react';
import { getUniqueNomes, getCompletedTurnos, getMostRecentCompletedTurno, getRecord, DomainRecord } from '@/lib/types';

// ── helpers ──────────────────────────────────────────────────────────────────
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

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = false, large = false }: {
  label: string;
  value: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''} ${large ? 'stat-card--large' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ── section header ────────────────────────────────────────────────────────────
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
    // On first render, restore from localStorage if the saved value still exists in the data
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && nomes.includes(saved)) return saved;
    }
    return nomes[0];
  });

  const [selectedTurno, setSelectedTurno] = useState<number | null>(null);

  // Persist the selected domínio whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedNome);
  }, [selectedNome]);

  // When domínio changes, auto-select most recent completed turno
  useEffect(() => {
    const recent = getMostRecentCompletedTurno(data, selectedNome);
    setSelectedTurno(recent);
  }, [data, selectedNome]);

  const availableTurnos = useMemo(() => getCompletedTurnos(data, selectedNome), [data, selectedNome]);
  const record = useMemo(() => selectedTurno !== null ? getRecord(data, selectedNome, selectedTurno) : null, [data, selectedNome, selectedTurno]);

  const isTurnoFeito = record?.Turno_Feito === 'Sim';

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
              <select
                value={selectedNome}
                onChange={e => setSelectedNome(e.target.value)}
              >
                {nomes.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
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
                  : availableTurnos.map(t => (
                    <option key={t} value={t}>Turno {t}</option>
                  ))
                }
              </select>
            </div>
          </div>
        </div>

        {/* ── Turno Status Badge ── */}
        {/* {record && (
          <div className="turno-status">
            <div className={`badge ${isTurnoFeito ? 'badge--done' : 'badge--pending'}`}>
              <span>{isTurnoFeito ? '✦' : '◌'}</span>
              <span>{isTurnoFeito ? 'Turno Concluído' : 'Turno Pendente'}</span>
            </div>
          </div>
        )} */}

        {/* ── Content ── */}
        <div className="content">
          {!record ? (
            <div className="empty">✦ Selecione um domínio ✦</div>
          ) : (
            <>
              {/* ── Pontos ── */}
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

              {/* ── Financeiro ── */}
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

              {/* ── Domain Info ── */}
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

              {/* ── Estatísticas ── */}
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

              {/* ── Valor ── */}
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
        </div>
    </div>
  );
}
