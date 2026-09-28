// src/testarConexao.ts — Atividade, item 1: teste de conexão
import { pool } from './database.js';

async function testarConexao(): Promise<void> {
  try {
    const connection = await pool.getConnection();
    console.log('Conexão realizada com sucesso!');
    connection.release(); // devolve a conexão ao pool
  } catch (erro) {
    console.error('Falha ao conectar:', erro);
    process.exitCode = 1;
  } finally {
    await pool.end(); // encerra o programa de teste
  }
}

testarConexao();
