// src/atividade.ts — Atividade prática (slide 24), itens 2 a 5
import type { QueryError } from 'mysql2';
import { pool } from './database.js';
import {
  alterarUsuario, cadastrarUsuario, consultarUsuario,
  excluirUsuario, ExclusaoMultiplaError
} from './usuarioRepository.js';

const usuarios = [
  { nome: 'Carlos Pereira', email: 'carlos@email.com' },
  { nome: 'Carlos Pereira', email: 'carlos.p@email.com' }, // homônimo
  { nome: 'Beatriz Lima', email: 'bia@email.com' },
  { nome: 'Daniel Rocha', email: 'daniel@email.com' },
  { nome: 'Eduarda Alves', email: 'duda@email.com' }
];

function titulo(texto: string): void {
  console.log(`\n=== ${texto} ===`);
}

async function main(): Promise<void> {
  try {
    // Limpa execuções anteriores para evitar conflito de e-mail (UNIQUE).
    await pool.execute('DELETE FROM usuarios WHERE email IN (?, ?, ?, ?, ?, ?)',
      [...usuarios.map(u => u.email), 'daniel.rocha@email.com']);

    titulo('2. Cadastrar cinco usuários (dois com o mesmo nome)');
    for (const u of usuarios) {
      try {
        const id = await cadastrarUsuario(u.nome, u.email);
        console.log(`Cadastrado: ${u.nome} <${u.email}> — id ${id}`);
      } catch (erro) {
        const erroMySQL = erro as QueryError;
        if (erroMySQL.code === 'ER_DUP_ENTRY') {
          console.error(`Já existe usuário com o e-mail ${u.email}.`);
        } else {
          throw erro;
        }
      }
    }

    titulo('3. Consultar por nome e depois por e-mail');
    const porNome = await consultarUsuario({ nome: 'Carlos Pereira' });
    console.log(`Por nome "Carlos Pereira": ${porNome.length} resultado(s)`);
    console.table(porNome);
    const porEmail = await consultarUsuario({ email: 'carlos@email.com' });
    console.log(`Por e-mail "carlos@email.com": ${porEmail.length} resultado(s)`);
    console.table(porEmail);
    console.log('Comparação: o nome pode repetir e retornar várias linhas;' +
      ' o e-mail é UNIQUE e retorna no máximo uma.');

    titulo('4a. Alterar o nome localizando pelo e-mail');
    console.log('Alterados:', await alterarUsuario(
      { email: 'bia@email.com' }, { nome: 'Beatriz Lima Souza' }
    ));
    console.table(await consultarUsuario({ email: 'bia@email.com' }));

    titulo('4b. Alterar o e-mail localizando pelo nome');
    console.log('Alterados:', await alterarUsuario(
      { nome: 'Daniel Rocha' }, { email: 'daniel.rocha@email.com' }
    ));
    console.table(await consultarUsuario({ nome: 'Daniel Rocha' }));

    titulo('5. Impedir excluir vários homônimos sem autorização');
    try {
      await excluirUsuario({ nome: 'Carlos Pereira' });
    } catch (erro) {
      if (!(erro instanceof ExclusaoMultiplaError)) throw erro;
      console.log('Bloqueado:', erro.message);
      console.table(erro.encontrados);
    }
    console.log('Ainda cadastrados:',
      (await consultarUsuario({ nome: 'Carlos Pereira' })).length);

    console.log('Excluindo só um deles pelo e-mail:',
      await excluirUsuario({ email: 'carlos.p@email.com' }));

    console.log('Com autorização explícita:',
      await excluirUsuario({ nome: 'Carlos Pereira' }, { confirmarMultiplos: true }));
  } catch (erro) {
    console.error('Erro na operação:', erro);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
