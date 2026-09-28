// src/atividade.ts — Atividade prática (slide 24), itens 2 a 5
import { createInterface } from 'node:readline/promises';
import type { QueryError } from 'mysql2';
import { pool } from './database.js';
import type { CriterioUsuario } from './usuario.js';
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

// Pergunta ao usuário no terminal; só "s" ou "sim" autorizam.
async function confirmar(pergunta: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const resposta = await rl.question(`${pergunta} (s/N) `);
    return ['s', 'sim'].includes(resposta.trim().toLowerCase());
  } finally {
    rl.close();
  }
}

// Item 5: a exclusão tenta sem autorização; se o critério atingir vários
// homônimos, mostra a quantidade e quem seria apagado e pede confirmação.
async function excluirComConfirmacao(criterio: CriterioUsuario): Promise<number> {
  try {
    return await excluirUsuario(criterio);
  } catch (erro) {
    if (!(erro instanceof ExclusaoMultiplaError)) throw erro;
    console.log(`Atenção: ${erro.encontrados.length} usuários serão excluídos:`);
    console.table(erro.encontrados);
    if (!await confirmar('Deseja excluir TODOS eles?')) {
      console.log('Exclusão cancelada. Nenhum usuário foi removido.');
      return 0;
    }
    return excluirUsuario(criterio, { confirmarMultiplos: true });
  }
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
    const removidos = await excluirComConfirmacao({ nome: 'Carlos Pereira' });
    console.log('Excluídos:', removidos);
    console.log('Ainda cadastrados com esse nome:',
      (await consultarUsuario({ nome: 'Carlos Pereira' })).length);
  } catch (erro) {
    console.error('Erro na operação:', erro);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
