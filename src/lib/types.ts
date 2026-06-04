// Shared types and pure data-helper functions.
// Safe to import from both server and client components.

export type DomainRecord = {
  Turno_Feito: 'Sim' | 'Não';
  Turno: number;
  Nome: string;
  Area_mi2: number | null;
  Valor_Tamanho_Dominio: number | null;
  Agricultura_Pontos: number | null;
  Recursos_Naturais_Pontos: number | null;
  Forca_Trabalho_Pontos: number | null;
  Bens_Luxo_Pontos: number | null;
  Populacao: number | null;
  Lealdade: string | null;
  CR: number | null;
  ConR: number | null;
  OR: number | null;
  Governo: string | null;
  Economia: string | null;
  Bonus_Defesa: number | null;
  Terreno: string | null;
  MS: number | null;
  Valor_Base: number | null;
  Valor_Modificado: number | null;
  Dinheiro_Inicial: string | null;
  Total_Entradas: string | null;
  Total_Entradas_Recorrentes: string | null;
  Renda: string | null;
  Tributos_Vassalos: string | null;
  Outras_Entradas: string | null;
  Total_Saidas: string | null;
  Total_Saidas_Recorrentes: string | null;
  Tributos_Pagos: string | null;
  Despesas_Militares: string | null;
  Outras_Saidas: string | null;
  Dinheiro_Final: string | null;
};

export function getUniqueNomes(data: DomainRecord[]): string[] {
  const seen = new Set<string>();
  return data.reduce<string[]>((acc, r) => {
    if (!seen.has(r.Nome)) { seen.add(r.Nome); acc.push(r.Nome); }
    return acc;
  }, []);
}

export function getCompletedTurnos(data: DomainRecord[], nome: string): number[] {
  return data
    .filter(r => r.Nome === nome && r.Turno_Feito === 'Sim')
    .map(r => r.Turno)
    .sort((a, b) => a - b);
}

export function getMostRecentCompletedTurno(data: DomainRecord[], nome: string): number | null {
  const turnos = getCompletedTurnos(data, nome);
  return turnos.length === 0 ? null : turnos[turnos.length - 1];
}

export function getRecord(data: DomainRecord[], nome: string, turno: number): DomainRecord | null {
  return data.find(r => r.Nome === nome && r.Turno === turno) ?? null;
}
