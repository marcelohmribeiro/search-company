# Search Company — Web

React 19 + Vite + Tailwind CSS v4 + shadcn/ui + React Router 7. Telas de busca de empresas e de acompanhamento de leads; o backend fica em `../api`.

## Scripts

```bash
bun install
bun dev
bun run build
bun run lint
```

## Variáveis de ambiente

Copie `.env.example` para `.env`:

- `VITE_APP_NAME` — nome do app
- `VITE_API_URL` — URL do backend (`http://localhost:3333`)

## Estrutura

```
src/
├── components/
│   ├── ui/            # componentes do shadcn (bunx shadcn@latest add <nome>)
│   ├── search/        # formulário, andamento e histórico da busca
│   └── leads/         # filtros, tabela, painel de detalhes, badges
├── config/            # settings a partir das env vars
├── constants/         # rótulos em português dos enums
├── css/               # entrada do Tailwind
├── lib/               # utils (cn), formatação pt-BR, busca e telefone/WhatsApp
├── pages/             # index.tsx (Busca), leads/ e layout.tsx
├── routes/            # createBrowserRouter
├── services/          # _api.ts (axios) e serviços por recurso
├── store/             # stores zustand (uso do mês)
└── types/
```
