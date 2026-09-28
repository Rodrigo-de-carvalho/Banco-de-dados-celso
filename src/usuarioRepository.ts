// src/usuarioRepository.ts
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './database.js';
import type { CriterioUsuario, NovosDados, Usuario } from './usuario.js';

// CREATE — cadastra nome e e-mail e devolve o id gerado.
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

// A coluna vem de uma lista fechada no código; o valor continua parametrizado.
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

// READ — nome pode retornar várias pessoas; e-mail é UNIQUE.
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

// UPDATE — localiza por nome ou e-mail e muda um ou os dois campos.
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

// Lançado quando a exclusão atingiria vários homônimos sem autorização.
export class ExclusaoMultiplaError extends Error {
  constructor(public readonly encontrados: Usuario[]) {
    super(
      `O critério encontrou ${encontrados.length} usuários. ` +
      'Confirme a exclusão múltipla ou use o e-mail.'
    );
    this.name = 'ExclusaoMultiplaError';
  }
}

export type OpcoesExclusao = { confirmarMultiplos?: boolean };

// DELETE — Atividade, item 5: se o critério atingir mais de uma linha,
// a exclusão só acontece com confirmarMultiplos: true.
export async function excluirUsuario(
  criterio: CriterioUsuario, opcoes: OpcoesExclusao = {}
): Promise<number> {
  const { coluna, valor } = criarFiltro(criterio);
  const conexao = await pool.getConnection();
  try {
    // A transação garante que o que foi contado é o que será excluído.
    await conexao.beginTransaction();
    const [encontrados] = await conexao.execute<(Usuario & RowDataPacket)[]>(
      `SELECT id, nome, email, criado_em
         FROM usuarios WHERE ${coluna} = ? FOR UPDATE`,
      [valor]
    );
    if (encontrados.length > 1 && !opcoes.confirmarMultiplos) {
      throw new ExclusaoMultiplaError(encontrados);
    }
    const [resultado] = await conexao.execute<ResultSetHeader>(
      `DELETE FROM usuarios WHERE ${coluna} = ?`,
      [valor]
    );
    await conexao.commit();
    return resultado.affectedRows;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}
