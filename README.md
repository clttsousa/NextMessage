# NextMessage Ops - Gestão de Atendimentos (Interno)

Aplicação interna para transformar mensagens operacionais não estruturadas (ex.: WhatsApp) em atendimentos estruturados com dono, status, histórico e auditoria.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + componentes no estilo shadcn/ui
- React Hook Form + Zod
- Prisma ORM + Neon PostgreSQL
- TanStack Table
- date-fns

## Funcionalidades implementadas
- Autenticação por e-mail/senha com sessão segura (cookie httpOnly)
- Bloqueio de login para usuários inativos
- RBAC (`ADMIN`, `ATTENDANT`) em UI e API
- Gestão de usuários (admin): criar, listar, ativar/desativar, papel, política de troca de senha
- Gestão de atendimentos:
  - criação manual
  - criação híbrida: mensagem bruta WhatsApp -> pré-preenchimento automático
  - listagem com filtros (cliente, protocolo, telefone, status)
  - detalhe com histórico
  - assumir atendimento (com proteção contra corrida)
  - atualização operacional com validações de negócio
  - reatribuição (admin)
  - reabertura (admin)
- Dashboard operacional
- Auditoria de ações críticas com before/after, IP e user-agent quando disponível

## Setup local
1. Instale dependências:
```bash
npm install
```
2. Configure variáveis:
```bash
cp .env.example .env
```
3. Aponte `DATABASE_URL` para seu banco Neon (com `sslmode=require`).
4. Gere client Prisma:
```bash
npm run prisma:generate
```
5. Execute migrações:
```bash
npm run prisma:deploy
```
6. Crie admin inicial:
```bash
npm run prisma:seed
```
7. Rode em desenvolvimento:
```bash
npm run dev
```

## Produção
```bash
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run build
npm run start
```

## Neon PostgreSQL (resumo)
1. Crie projeto no Neon.
2. Copie connection string PostgreSQL.
3. Configure `DATABASE_URL` com TLS (`sslmode=require`).
4. Execute migrações com `npm run prisma:deploy`.

## Regras de negócio cobertas
- Status padrão inicial `PENDENTE` e sem responsável.
- Duplo claim evitado por `updateMany` em transação com condição `assignedTo = null`.
- `RETORNAR_DEPOIS` exige data de retorno.
- `RESOLVIDO` exige desfecho.
- `VIROU_OS`/`became_service_order` exige número de O.S. ou justificativa.
- `CANCELADO` exige motivo.
- Reabertura apenas por admin, mantendo histórico e auditoria.

## Arquitetura (alto nível)
- `app/`: páginas e rotas API (App Router)
- `lib/auth`: sessão, middleware e guards
- `lib/schemas`: validações Zod compartilhadas
- `lib/services`: serviços transversais (auditoria)
- `prisma/`: schema, migração e seed

## V2 aplicada: parser de mensagem WhatsApp
Foi adicionado um parser inicial em `lib/services/parser/whatsapp-parser.ts` e um endpoint `POST /api/attendances/parse` para transformar texto bruto em campos estruturados. A tela `\/attendimentos\/novo` permite colar a mensagem, revisar e salvar o atendimento.
