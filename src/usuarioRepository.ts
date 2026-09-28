// src/usuarioRepository.ts
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './database.js';
import type { Usuario, CriterioUsuario } from './usuario.js';

// 9. Cadastrar nome e e-mail
export async function cadastrarUsuario(
  nome: string, email: string
): Promise<number> {
  const nomeLimpo = nome.trim();
  const emailLimpo = email.trim().toLowerCase();
  if (!nomeLimpo || !emailLimpo) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }
  const [resultado] = await pool.execute<ResultSetHeader>(
    'INSERT INTO usuarios (nome, email) VALUES (?, ?)',
    [nomeLimpo, emailLimpo]
  );
  return resultado.insertId;
}

// 10. Montar um filtro seguro
function criarFiltro(criterio: CriterioUsuario): {
  coluna: 'nome' | 'email'; valor: string
} {
  if ('nome' in criterio && criterio.nome?.trim()) {
    return { coluna: 'nome', valor: criterio.nome.trim() };
  }
  if ('email' in criterio && criterio.email?.trim()) {
    return { coluna: 'email', valor: criterio.email.trim().toLowerCase() };
  }
  throw new Error('Informe um nome ou um e-mail válido.');
}

// 11. Consultar por nome ou e-mail
export async function consultarUsuario(
  criterio: CriterioUsuario
): Promise<Usuario[]> {
  const { coluna, valor } = criarFiltro(criterio);
  const [linhas] = await pool.execute<(Usuario & RowDataPacket)[]>(
    `SELECT id, nome, email, criado_em
       FROM usuarios WHERE ${coluna} = ?`,
    [valor]
  );
  return linhas;
}

// 12. Excluir por nome ou e-mail
export async function excluirUsuario(
  criterio: CriterioUsuario
): Promise<number> {
  const { coluna, valor } = criarFiltro(criterio);
  const [resultado] = await pool.execute<ResultSetHeader>(
    `DELETE FROM usuarios WHERE ${coluna} = ?`,
    [valor]
  );
  return resultado.affectedRows;
}

// 13. Alterar nome e/ou e-mail
type NovosDados = { nome?: string; email?: string };

export async function alterarUsuario(
  criterio: CriterioUsuario, dados: NovosDados
): Promise<number> {
  const filtro = criarFiltro(criterio);
  const campos: string[] = [];
  const valores: string[] = [];
  if (dados.nome?.trim()) {
    campos.push('nome = ?'); valores.push(dados.nome.trim());
  }
  if (dados.email?.trim()) {
    campos.push('email = ?');
    valores.push(dados.email.trim().toLowerCase());
  }
  if (campos.length === 0) throw new Error('Informe dados novos.');
  valores.push(filtro.valor);
  const [r] = await pool.execute<ResultSetHeader>(
    `UPDATE usuarios SET ${campos.join(', ')}
       WHERE ${filtro.coluna} = ?`, valores
  );
  return r.affectedRows;
}
