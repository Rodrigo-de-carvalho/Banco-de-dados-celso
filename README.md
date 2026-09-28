# MySQL com TypeScript — CRUD de usuários

Atividade prática da aula (slide 24), feita com o código dos slides.

## Como rodar

1. Execute `sql/schema.sql` no MySQL Workbench ou no cliente `mysql`.
2. Crie o arquivo `.env` na raiz (ele não vai para o Git):
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_NAME=aula_typescript
   ```
3. `npm install`
4. `npm run dev`

O programa executa, em ordem, os itens 1 a 5 da atividade. No item 5 ele mostra
quantos usuários têm o nome informado e pede confirmação (`s/n`) antes de
excluir homônimos.

Para rodar de novo sem conflito de e-mail, limpe a tabela antes:
`TRUNCATE TABLE usuarios;`
