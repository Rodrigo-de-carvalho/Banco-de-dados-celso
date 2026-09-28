// src/usuario.ts
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  criado_em: Date;
}

// O critério aceita exatamente nome OU e-mail.
export type CriterioUsuario =
  | { nome: string; email?: never }
  | { email: string; nome?: never };
