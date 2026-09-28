// src/index.ts — fluxo completo do slide 14
import { pool } from './database.js';
import { cadastrarUsuario, consultarUsuario,
  alterarUsuario, excluirUsuario } from './usuarioRepository.js';

async function main(): Promise<void> {
  try {
    const id = await cadastrarUsuario('Ana Silva', 'ana@email.com');
    console.log('ID criado:', id);
    console.table(await consultarUsuario({ email: 'ana@email.com' }));
    console.log('Alterados:', await alterarUsuario(
      { email: 'ana@email.com' }, { nome: 'Ana Souza' }
    ));
    console.log('Excluídos:', await excluirUsuario({ nome: 'Ana Souza' }));
  } catch (erro) {
    console.error('Erro na operação:', erro);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
