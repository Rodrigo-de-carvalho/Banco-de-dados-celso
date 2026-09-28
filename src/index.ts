// src/index.ts — Atividade prática (slide 24)
import { createInterface } from 'node:readline/promises';
import type { QueryError } from 'mysql2';
import { pool } from './database.js';
import { cadastrarUsuario, consultarUsuario,
  alterarUsuario, excluirUsuario } from './usuarioRepository.js';

// 1. Execute o teste de conexão (slide 11). O pool não é encerrado aqui
// porque o programa continua com as próximas etapas.
async function testarConexao(): Promise<void> {
  const connection = await pool.getConnection();
  console.log('Conexão realizada com sucesso!');
  connection.release(); // devolve a conexão ao pool
}

// Pergunta no terminal; só "s" autoriza.
async function confirmar(pergunta: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const resposta = await rl.question(`${pergunta} (s/n) `);
  rl.close();
  return resposta.trim().toLowerCase() === 's';
}

async function main(): Promise<void> {
  try {
    console.log('\n1. Teste de conexão');
    await testarConexao();

    console.log('\n2. Cadastrar cinco usuários, incluindo dois com o mesmo nome');
    const usuarios = [
      { nome: 'Carlos Pereira', email: 'carlos@email.com' },
      { nome: 'Carlos Pereira', email: 'carlos.p@email.com' },
      { nome: 'Beatriz Lima', email: 'bia@email.com' },
      { nome: 'Daniel Rocha', email: 'daniel@email.com' },
      { nome: 'Eduarda Alves', email: 'duda@email.com' }
    ];
    for (const u of usuarios) {
      try {
        console.log('ID criado:', await cadastrarUsuario(u.nome, u.email));
      } catch (erro) {
        // Tratamento de e-mail duplicado (slide 21)
        const erroMySQL = erro as QueryError;
        if (erroMySQL.code === 'ER_DUP_ENTRY') {
          console.error('Já existe usuário com esse e-mail.');
        } else {
          console.error('Não foi possível cadastrar:', erroMySQL.message);
        }
      }
    }

    console.log('\n3. Consultar por nome e depois por e-mail');
    const porNome = await consultarUsuario({ nome: 'Carlos Pereira' });
    console.log('Por nome:', porNome.length, 'resultado(s)');
    console.table(porNome);
    const porEmail = await consultarUsuario({ email: 'carlos@email.com' });
    console.log('Por e-mail:', porEmail.length, 'resultado(s)');
    console.table(porEmail);
    console.log('Comparação: o nome retornou', porNome.length,
      'pessoas homônimas; o e-mail é UNIQUE e retornou', porEmail.length);

    console.log('\n4. Alterar o nome localizando pelo e-mail');
    console.log('Alterados:', await alterarUsuario(
      { email: 'bia@email.com' }, { nome: 'Beatriz Souza' }
    ));
    console.table(await consultarUsuario({ email: 'bia@email.com' }));

    console.log('\n4. Alterar o e-mail localizando pelo nome');
    console.log('Alterados:', await alterarUsuario(
      { nome: 'Daniel Rocha' }, { email: 'daniel.rocha@email.com' }
    ));
    console.table(await consultarUsuario({ nome: 'Daniel Rocha' }));

    // 5. Consulte antes, mostre a quantidade e peça confirmação (slide 19)
    console.log('\n5. Excluir por nome com confirmação de homônimos');
    const criterio = { nome: 'Carlos Pereira' };
    const encontrados = await consultarUsuario(criterio);
    console.log('Usuários encontrados:', encontrados.length);
    console.table(encontrados);
    if (encontrados.length > 1 &&
        !await confirmar(`Excluir os ${encontrados.length} usuários?`)) {
      console.log('Exclusão cancelada.');
    } else {
      console.log('Excluídos:', await excluirUsuario(criterio));
    }
  } catch (erro) {
    console.error('Erro na operação:', erro);
  } finally {
    await pool.end();
  }
}

main();
