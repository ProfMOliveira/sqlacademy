# SQL Trainer

Laboratório interativo de SQL em Next.js + Tailwind CSS, preparado para deploy na Vercel.

## Recursos
- Editor SQL no navegador
- Banco SQLite local via sql.js (asm.js, sem dependência de arquivo WASM externo)
- CREATE TABLE, INSERT, SELECT, WHERE, ORDER BY, DISTINCT
- Agregações, GROUP BY/HAVING
- INNER JOIN e LEFT JOIN
- UPDATE, DELETE, ALTER TABLE e constraints
- Subqueries, CTE, Window Functions, Views e Transactions
- Aulas, exemplos, dicas, busca e progresso
- Banco restaurável para um cenário inicial

## Rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000.

## Deploy na Vercel
1. Suba esta pasta para um repositório GitHub.
2. Importe o repositório na Vercel.
3. Use as configurações padrão do Next.js.

A aplicação usa a variante asm.js do sql.js em produção. Isso evita a dependência de carregamento de `sql-wasm.wasm` por CDN e elimina o erro de inicialização do WebAssembly em ambientes como a Vercel.

## Observação
O banco é local à sessão/navegador e serve para treinamento. Não é um banco PostgreSQL persistente. Para uma versão multiusuário, com contas, histórico e banco persistente, conecte uma base PostgreSQL/Neon e mova a execução SQL para uma API segura.
