export type ParticipanteInput = {
  identificador: string;
  nome?: string;
  sobrenome?: string;
  celular?: string;
  cidade?: string;
  empresa?: string;
  cargo?: string;
  email?: string;
};

export function normalizarIdentificador(valor: string): string {
  return valor
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}
