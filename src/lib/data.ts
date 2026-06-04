// Server-only module — reads data/dominios.csv at build/request time.
// Only import this from Server Components (e.g. app/page.tsx).
import fs from 'fs';
import path from 'path';
import type { DomainRecord } from './types';

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        fields.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  };

  const headers = parseRow(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] ?? '').trim(); });
    records.push(row);
  }

  return records;
}

function toNum(v: string): number | null {
  if (!v || v === '') return null;
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? null : n;
}

function toStr(v: string): string | null {
  return v && v !== '' ? v : null;
}

// ── main loader ───────────────────────────────────────────────────────────────
export function loadDominiosData(): DomainRecord[] {
  const csvPath = path.join(process.cwd(), 'data', 'dominios.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(raw);

  return rows.map(r => ({
    Turno_Feito: (r['Turno_Feito'] === 'Sim' ? 'Sim' : 'Não') as 'Sim' | 'Não',
    Turno: toNum(r['Turno']) ?? 0,
    Nome: r['Nome'] ?? '',
    Area_mi2: toNum(r['Area_mi2']),
    Valor_Tamanho_Dominio: toNum(r['Valor_Tamanho_Dominio']),
    Agricultura_Pontos: toNum(r['Agricultura_Pontos']),
    Recursos_Naturais_Pontos: toNum(r['Recursos_Naturais_Pontos']),
    Forca_Trabalho_Pontos: toNum(r['Forca_Trabalho_Pontos']),
    Bens_Luxo_Pontos: toNum(r['Bens_Luxo_Pontos']),
    Populacao: toNum(r['Populacao']),
    Lealdade: toStr(r['Lealdade']),
    CR: toNum(r['CR']),
    ConR: toNum(r['ConR']),
    OR: toNum(r['OR']),
    Governo: toStr(r['Governo']),
    Economia: toStr(r['Economia']),
    Bonus_Defesa: toNum(r['Bonus_Defesa']),
    Terreno: toStr(r['Terreno']),
    MS: toNum(r['MS']),
    Valor_Base: toNum(r['Valor_Base']),
    Valor_Modificado: toNum(r['Valor_Modificado']),
    Dinheiro_Inicial: toStr(r['Dinheiro_Inicial']),
    Total_Entradas: toStr(r['Total_Entradas']),
    Total_Entradas_Recorrentes: toStr(r['Total_Entradas_Recorrentes']),
    Renda: toStr(r['Renda']),
    Tributos_Vassalos: toStr(r['Tributos_Vassalos']),
    Outras_Entradas: toStr(r['Outras_Entradas']),
    Total_Saidas: toStr(r['Total_Saidas']),
    Total_Saidas_Recorrentes: toStr(r['Total_Saidas_Recorrentes']),
    Tributos_Pagos: toStr(r['Tributos_Pagos']),
    Despesas_Militares: toStr(r['Despesas_Militares']),
    Outras_Saidas: toStr(r['Outras_Saidas']),
    Dinheiro_Final: toStr(r['Dinheiro_Final']),
  }));
}
