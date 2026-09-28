# MySQL com TypeScript — CRUD de usuários

Projeto da aula prática: Node.js + TypeScript + `mysql2`, com cadastro, consulta,
alteração e exclusão de usuários por **nome** ou **e-mail**, usando consultas
parametrizadas (proteção contra SQL Injection).

## Como rodar

1. Crie o banco e a tabela (MySQL 8+):
   ```bash
   mysql -u root -p < sql/schema.sql
   ```
2. Configure as credenciais:
   ```bash
   cp .env.example .env   # depois edite a senha
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Execute:
   ```bash
   npm run conexao    # testa a conexão com o banco
   npm run dev        # fluxo completo da aula (cadastrar, consultar, alterar, excluir)
   npm run atividade  # resolução da atividade prática
   ```

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `sql/schema.sql` | Criação do banco `aula_typescript` e da tabela `usuarios` |
| `src/database.ts` | Pool de conexões lendo o `.env` |
| `src/usuario.ts` | Tipos `Usuario`, `CriterioUsuario` e `NovosDados` |
| `src/usuarioRepository.ts` | Funções CRUD e o filtro seguro por nome/e-mail |
| `src/testarConexao.ts` | Teste de conexão |
| `src/index.ts` | Fluxo completo do slide 14 |
| `src/atividade.ts` | Atividade prática |

## Atividade prática

1. **Criar o banco e testar a conexão** — `sql/schema.sql` + `npm run conexao`.
2. **Cadastrar cinco usuários, dois com o mesmo nome** — dois "Carlos Pereira"
   com e-mails diferentes.
3. **Consultar por nome e por e-mail** — por nome volta 2 linhas; por e-mail
   volta no máximo 1, porque a coluna é `UNIQUE`.
4. **Alterar o nome pelo e-mail e o e-mail pelo nome.**
5. **Confirmação para excluir homônimos** — `excluirUsuario` conta as linhas
   dentro de uma transação e, se o critério atingir mais de uma, lança
   `ExclusaoMultiplaError` (com a lista encontrada) e não apaga nada. A exclusão
   de vários só acontece com `{ confirmarMultiplos: true }`:
   ```ts
   await excluirUsuario({ nome: 'Carlos Pereira' });                               // bloqueado
   await excluirUsuario({ nome: 'Carlos Pereira' }, { confirmarMultiplos: true }); // autorizado
   ```
