# Search Company

Aplicação **local** para encontrar empresas no Google Maps que **ainda não têm site** e oferecer a criação de um. Ela busca empresas pela Google Places API (New), classifica a situação do site de cada uma e acompanha os leads até o fechamento.

A cidade é **livre**: o usuário informa na interface a cidade, as categorias e os bairros de cada busca. Nada no código deve assumir uma cidade fixa.

## Regra nº 1: nunca passar de 990 requisições no mês

A conta tem **1.000 requisições grátis por mês** de Text Search Enterprise. Passar disso gera cobrança no cartão.

- **Nunca faça uma requisição real à Places API sem autorização explícita do usuário.** Isso vale para qualquer chamada: teste "grátis" (só IDs), `curl`, script ou o próprio app. Para testar, use o mock (ver "Testes").
- **A chave da API do Google fica no navegador de cada usuário.** Ele a digita na tela de busca (`src/store/apiKeyStore.ts`). Com "Lembrar neste navegador", ela vai para o `localStorage`; sem isso, fica só na memória até recarregar.
  - Ela vai no header `X-Google-Api-Key` de `POST /searches` (e, opcionalmente, de `GET /usage`). O backend só a repassa ao Google: ela não vai para o banco nem para o log.
  - O banco guarda só o SHA-256 dela (`ApiRequest.keyHash`, pelo `fingerprint` de `src/utils/_fingerprint.js`), para contar o uso por chave.
  - **Nunca leia, imprima ou peça a chave real**: nem do navegador do usuário, nem da linha `GOOGLE_API_KEY` que possa ter sobrado no `api/.env`, que não é mais usada.
- **Cada usuário tem os próprios 990 por mês.** A trava é **rígida em 990**: com 990 requisições usadas no mês, o backend recusa novas buscas desse usuário até virar o mês.
  - O teto fica em `HARD_REQUEST_LIMIT`, em `api/src/config/settings.js`.
  - O `MONTHLY_REQUEST_LIMIT` do `.env` só consegue baixar esse valor.

Como a trava funciona (`api/src/services/usage.js` e `search.js`):

- **O contador fica no banco.** Cada chamada HTTP à Places API vira uma linha em `ApiRequest`, com o usuário e o hash da chave usada.
  - O uso do mês de um usuário conta as linhas dele **e** as feitas com a chave que ele está usando (a do header), por qualquer conta. Assim, trocar de chave ou usar a mesma chave em outra conta não zera o uso.
  - As requisições de antes das contas (sem `keyHash`) contam pelo `userId`.
- **A chave entra crua e o hash é calculado só em `usage.js`** (`getUsage`, `assertQuota` e `reserveRequest` recebem `apiKey`).
- **A linha é criada antes da chamada.** `reserveRequest` cria a linha antes de a requisição sair. Depois, `finishRequest` grava o resultado. A linha conta mesmo que a chamada falhe ou o processo caia no meio.
- **Cada página é uma requisição.** Uma busca de 3 páginas gasta 3, e o limite é conferido antes de **cada** página.
- **Conferência e registro são atômicos.** A contagem e a criação rodam numa transação com `pg_advisory_xact_lock`. Além disso, cada usuário roda **uma busca por vez**: uma segunda busca simultânea dele recebe 409.
- **O mês é o do Google.** A cota grátis volta à meia-noite do dia 1 no horário do Pacífico, então o mês é calculado no fuso `America/Los_Angeles` (ex.: `2026-10`).
- **Não há retry automático.** A busca para no primeiro erro, e o front para a fila inteira.
- **As chamadas de cada usuário são espaçadas** conforme `REQUESTS_PER_MINUTE` (padrão 10), que deve bater com a cota por minuto configurada no console.
- **Só `searchText` chama a API** (`api/src/services/places.js`), e só depois de `reserveRequest`. Qualquer uso da chave fora do backend fica fora da conta.

## Google Places API (New): o que usamos

O sistema usa a API oficial, sem scraping do Maps, que vai contra os termos do Google.

### Text Search (New)

```
POST https://places.googleapis.com/v1/places:searchText
Content-Type: application/json
X-Goog-Api-Key: <chave enviada pelo navegador no header X-Google-Api-Key>
X-Goog-FieldMask: <FIELD_MASK de api/src/services/places.js>

{
  "textQuery": "barbearia em Aldeota, Fortaleza",
  "languageCode": "pt-BR",
  "regionCode": "BR",
  "pageSize": 20,
  "includePureServiceAreaBusinesses": true,
  "pageToken": "<nextPageToken da resposta anterior, a partir da 2ª página>"
}
```

- O texto da busca é `"<categoria> em <bairro>, <cidade>"`, ou `"<categoria> em <cidade>"` sem bairro. Para cobrir uma cidade, as buscas são divididas em **categoria × bairro**.
- `pageSize` vai até 20, e cada busca devolve no **máximo 60 resultados** (3 páginas).
- Na paginação, **todos os parâmetros** precisam ser iguais aos da primeira chamada, exceto `pageSize` e `pageToken`. Qualquer diferença gera `INVALID_ARGUMENT`.
- A mesma busca pode trazer resultados diferentes, e por isso a deduplicação é pelo `places.id`.
- `includePureServiceAreaBusinesses: true` inclui empresas que atendem numa região sem ter endereço físico (eletricista, diarista etc.). Elas são ótimos leads.
- A API também aceita `includedType` + `strictTypeFiltering` (tipos da Tabela A), `minRating`, `locationBias` e `locationRestriction` (só retângulo). Nenhum deles é usado por enquanto.
- Todas as empresas que a API devolve são gravadas, inclusive as fechadas (`businessStatus`). Ver "Nenhum dado é descartado".

### Field mask e preço

O preço depende dos campos pedidos. **A requisição é cobrada pela faixa (SKU) mais cara entre os campos.** Valores de 10/2026:

| SKU | Campos (exemplos) | Grátis por mês | Depois |
|---|---|---|---|
| Text Search Essentials (IDs Only) | `places.id`, `nextPageToken` | ilimitado | — |
| Text Search Pro | `displayName`, `formattedAddress`, `addressComponents`, `primaryType`, `googleMapsUri`, `businessStatus` | 5.000 | US$ 32/1.000 |
| **Text Search Enterprise** | `websiteUri`, `nationalPhoneNumber`, `internationalPhoneNumber`, `rating`, `userRatingCount`, `regularOpeningHours` | **1.000** | US$ 35/1.000 |
| Text Search Enterprise + Atmosphere | `reviews`, `editorialSummary`, `generativeSummary`, `paymentOptions`… | 1.000 | US$ 40/1.000 |

- Como precisamos de `websiteUri` e telefone, toda busca cai em **Enterprise**. Os campos Pro e Essentials vêm junto sem custo extra.
- Mais campos **não** gastam mais requisições: cada chamada HTTP conta como 1, com qualquer quantidade de campos ou de resultados.
- O field mask (`FIELD_MASK` em `api/src/services/places.js`) pede **todos** os campos Essentials, Pro e Enterprise da Text Search: 45 campos de `places` mais o `nextPageToken`. A lista foi conferida na página de SKUs e na referência do `Place`.
  - **Nunca** use `*` nem inclua campos Enterprise + Atmosphere (`reviews`, `reviewSummary`, `editorialSummary`, `generativeSummary`, `paymentOptions`, `parkingOptions`, `delivery`, `takeout`, `dineIn`, `serves*`, `routingSummaries` etc.), porque eles mudam a faixa da requisição.
  - `entrances`, `navigationPoints` e `searchUri` ficam de fora porque a documentação classifica esses campos de forma inconsistente.
- `addressComponents` traz o bairro real da empresa. Uma busca "em Aldeota" pode trazer empresas de bairros vizinhos.
- Em `photos` vêm só as referências das fotos. Baixar a imagem é outra chamada, da API de fotos (Place Photos), que tem SKU e cota próprios e não passa pela trava. A doc diz que essas referências podem expirar.
- Desde 01/03/2025 não existe mais o crédito mensal de US$ 200. Cada SKU tem a própria cota grátis.

### Termos de uso (armazenamento)

- O `place_id` pode ser guardado sem restrição. O Google recomenda atualizar IDs com mais de 12 meses, o que é **gratuito**: basta um Place Details pedindo só o campo `id`.
- Latitude e longitude só podem ficar em cache por até 30 dias.
- **O restante do conteúdo** (nome, telefone, endereço, site, nota) **não pode ser armazenado** além das exceções dos termos. Ver "Decisões em aberto".
- Ao exibir resultados fora de um mapa do Google, é obrigatório atribuir a fonte ao Google. O rodapé "Dados das empresas: Google Maps" foi removido a pedido do usuário em 20/10/2026; ver "Decisões em aberto".

### Links

- Visão geral: https://developers.google.com/maps/documentation/places/web-service/op-overview
- Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search
- Campos por SKU: https://developers.google.com/maps/documentation/places/web-service/data-fields
- Preços: https://developers.google.com/maps/billing-and-pricing/pricing
- Detalhes dos SKUs: https://developers.google.com/maps/billing-and-pricing/sku-details
- Políticas: https://developers.google.com/maps/documentation/places/web-service/policies
- Tipos de lugar (Tabela A): https://developers.google.com/maps/documentation/places/web-service/place-types

## Repositório

Monorepo `git@github.com-personal:marcelohmribeiro/search-company.git`:

| Pasta | Stack |
|---|---|
| `api/` | Node 22 (ESM, JavaScript), Express 5, Prisma 7 + Postgres 17 (`@prisma/adapter-pg`), zod 4, dotenv, plop |
| `app/` | React 19, Vite 6, Tailwind CSS v4, shadcn/ui (Radix, preset nova), lucide-react, sonner, React Router 7, Zustand, axios, zod 4 (TSX/TS) |

### Como rodar

```bash
# api/
bun install
docker compose up -d --wait  # sobe o Postgres (api/docker-compose.yml) em localhost:5432
bunx prisma migrate dev  # aplica as migrations
bunx prisma generate     # no Prisma 7, o migrate não gera o client sozinho
bun run dev              # node --watch server.js, em http://localhost:3333

# app/
bun install
bun dev                  # http://localhost:5173
bun run lint && bun run build
```

Depois de qualquer mudança no `schema.prisma`: `bunx prisma migrate dev --name <nome>` **no banco local** e depois `bunx prisma generate`.

### Banco no Supabase

O banco de produção fica no Supabase, no plano grátis: 500 MB, pausa depois de 7 dias sem uso e sem backup automático. No projeto, o Data API está desligado e o RLS automático está ligado. O RLS não afeta a API, porque o Prisma conecta como `postgres`, que é dono das tabelas.

- **String de conexão:** use a do **Session pooler** (porta 5432, funciona em IPv4) do botão Connect, com `?sslmode=require` no final, em `DATABASE_URL`. A mesma URL serve para a API e para as migrations.
  - A conexão direta (`db.<ref>.supabase.co`) só funciona em IPv6 no plano grátis.
  - O transaction pooler (6543) é para serverless.
- **SSL** (`api/src/services/prisma.js`):
  - O Prisma CLI entende `sslmode=require` como "criptografa".
  - O `pg` da API trataria `require` como `verify-full` e recusaria a CA própria do Supabase. Por isso a API tira o `sslmode` da URL e monta o SSL sozinha.
  - Com `sslmode` na URL, a conexão da API é criptografada sem validar o certificado, como no Prisma CLI.
  - Não use `sslrootcert`/`sslcert` na URL: o `pg` e o Prisma interpretam esses parâmetros de formas diferentes.
- **Migrations:** no Supabase, só `bun run migrate:deploy` (`prisma migrate deploy`). **Nunca rode `prisma migrate dev` no Supabase**: ele usa um banco sombra e pode propor resetar o banco, o que apagaria leads e o contador do mês.
- **Dados:** em 17/10/2026, os dados do banco local foram copiados para o Supabase, incluindo o contador do mês. Desde então, o Postgres do Docker serve só para desenvolvimento e testes; não rode buscas reais nele.
  - O container Docker não tem IPv6, e a conexão direta do Supabase (`db.<ref>.supabase.co`) só funciona em IPv6. Por isso, para copiar dados pelo terminal, rode o `pg_dump` no container e grave com o Node na máquina (pg_dump com `--inserts`, sem as linhas `\restrict`).
  - Os bancos ordenam texto de jeitos diferentes: o Postgres Alpine local usa musl e o Supabase usa glibc. Ao comparar dados entre eles, ordene com `collate "C"`.
- **Espaço:** o usuário decidiu manter todos os campos e as duas cópias dos dados do Google (~300 MB por mês no uso máximo). Acompanhe o tamanho na página Usage do Supabase.

### Variáveis de ambiente

- `api/.env`:
  - `DATABASE_URL`: local, `postgresql://search:search@localhost:5432/search_company`; no Supabase, a URL do Session pooler com `?sslmode=require` (ver "Banco no Supabase").
  - `PORT` (3333) e `FRONTEND_URL` (`http://localhost:5173`).
  - `JWT_SECRET`: segredo que assina os tokens. **Obrigatório**: sem ele, a API não sobe. Na Vercel, cadastre o mesmo tipo de valor (um segredo longo e aleatório).
  - Opcionais: `MONTHLY_REQUEST_LIMIT` (só baixa o teto de 990), `REQUESTS_PER_MINUTE` (padrão 10) e `PLACES_API_URL` (para apontar a um mock).
- `app/.env`: `VITE_APP_NAME` (opcional, padrão `Search Company`) e `VITE_API_URL` (`http://localhost:3333`). O `src/config/index.ts` valida as duas com zod (`envSchema.parse`) e exporta `settings`, com elas e as chaves do `localStorage` (`STORAGE_KEYS`). O script do tema no `index.html` repete a chave do tema, porque roda antes do bundle.
- Os dois `.env` estão no `.gitignore`. A chave do Google não está em nenhum deles: cada usuário a informa no próprio navegador.

### Convenções

- **`api/`**
  - Os imports internos usam o alias `#src/...` (definido em `package.json` → `imports`). Cada pasta tem um `index.js` que reexporta seus arquivos **por caminho relativo** (`./arquivo.js`). Importe sempre a pasta (`#src/services`), nunca `#src/<pasta>/<arquivo>.js`: na Vercel, o empacotamento não inclui arquivos importados nesse formato, e a função quebra com `ERR_MODULE_NOT_FOUND`.
  - Controllers são fábricas (`XController()`) com `try/catch` e `next(error)`, no padrão de `plop/component/`. Ao gerar pelo plop, responda **sim** para `verifyJWT`: toda rota nova precisa de login.
  - **Cada camada com o seu papel:**
    - rotas ligam caminho, middleware e controller;
    - controllers só validam a entrada com zod, chamam o service e respondem;
    - middlewares só leem o header e decidem (a verificação do JWT fica em `readSessionToken`, no service de auth, e o papel de admin em `isAdmin`, no de usuários);
    - services têm as regras e o acesso ao banco: `search.js` só orquestra a busca, `places.js` só fala com o Google, `usage.js` só cuida da trava, `leads.js` lê e grava leads (inclusive os de uma página da busca, em `saveSearchLeads`);
    - utils são funções puras, como `placeToLead` (converte um `Place` nas colunas do `Lead`) e `classifySite`.
  - Sem comentários inline. JSDoc só com uma linha objetiva do que a função faz, quando o nome não basta.
  - A entrada é validada com zod, em `src/schemas/`. Os controllers chamam `schema.parse(...)`. Quando a validação falha, o `handleError` devolve 400 com o primeiro problema, no formato `"campo": mensagem`. As mensagens saem em português pelo `z.locales.pt()`, configurado em `src/schemas/index.js`.
  - Para responder com erro, lance `httpError(status, mensagem)`. O `handleError` (`src/utils/_handleError.js`) devolve `{ error }`; erros conhecidos do Prisma viram 409, 400 ou 404 pela tabela `PRISMA_ERRORS`.
  - O servidor escuta **só em `127.0.0.1`**, e o Postgres expõe a porta só nesse endereço. Assim nenhum outro dispositivo da rede acessa os dois. O acesso à API exige login (ver "Autenticação").
  - As URLs usam `localhost` (`http://localhost:3333`, `localhost:5432`), que aponta para esse mesmo endereço.
  - O front precisa ser aberto exatamente em `http://localhost:5173`, a origem liberada no CORS pelo `FRONTEND_URL`. Para o navegador, `127.0.0.1:5173` é outra origem, e a API recusaria as chamadas.
- **`app/`**
  - O alias `src/` aponta para `app/src`.
  - As chamadas à API ficam em `src/services/`, os tipos em `src/types/` e os rótulos em português em `src/constants/labels.ts`.
  - O uso do mês é um store do Zustand (`src/store/usageStore.ts`).
  - **Hooks** ficam em `src/hooks/` e são importados de `src/hooks`:
    - `useApi(fetcher)`: carrega dados da API com `data`, `error`, `loading`, `reload` e `setData`, ignorando respostas antigas. O `fetcher` precisa ser estável (função de `src/services` ou `useCallback`). Use em toda tela que carrega dados, em vez de `useEffect` com `useState`.
    - `useLeadQuery()`: filtros, página e tamanho de página da tela de leads na URL.
    - `useSearchRunner(onFinish)`: roda a fila de combinações da busca, uma de cada vez, e guarda o andamento.
    - `useAuthSubmit()`: envia o login ou o cadastro e abre a sessão.
  - Sem comentários inline no código do app. Documentação só em JSDoc, quando diz algo que o nome e o tipo não dizem.
  - A interface usa **shadcn/ui** (`components.json`: base Radix, preset `nova`, cor neutra, fonte Geist, ícones lucide):
    - Para adicionar um componente, rode `bunx shadcn@latest add <nome>` em `app/`. Ele cai em `src/components/ui/`.
    - Não edite à mão os arquivos de `src/components/ui/`. Ajuste a aparência por `className` em quem usa o componente.
    - O `cn` vem do pacote `cn` (do próprio shadcn), reexportado em `src/lib/utils.ts`.
    - As cores do tema ficam nas variáveis CSS de `src/css/index.css`, com as do tema escuro em `.dark`.
  - **Tema claro e escuro** com `next-themes` (`ThemeProvider` em `src/main.tsx`, chave `search-company:theme` no `localStorage`). Sem escolha salva, segue o sistema. O botão do sol/lua no cabeçalho (`src/components/ThemeToggle.tsx`) alterna entre claro e escuro. Um script no `index.html` aplica o `.dark` antes do React carregar, para a página não piscar.
    - Cores fixas do Tailwind precisam da variante escura: `bg-*-50` com `dark:bg-*-950/60`, `border-*-200` com `dark:border-*-900`, `text-*-700` com `dark:text-*-300` e `text-*-600` com `dark:text-*-400`. Pontos e barras (`bg-*-500`) servem nos dois temas.
  - Os componentes próprios ficam em `src/components/search/` (formulário, chave do Google, andamento e histórico), `src/components/leads/` (filtros, tabela, painel de detalhes, badge do site e select de status) e `src/components/admin/` (usuários, empresas e entradas). `LeadRating` (nota com estrelas) e `LeadStatusLabel` (status com a bolinha) ficam em `src/components/leads/` e servem às tabelas de leads, do admin e da busca. `PageHeader`, `UsageMeter`, `ThemeToggle`, `AuthCard` (layout do login e do cadastro), `RequireAuth` e `RequireAdmin` ficam na raiz de `src/components/`.
  - Os avisos usam o `toast` do `sonner`; o `Toaster` e o `TooltipProvider` ficam em `src/pages/layout.tsx`.
  - Formatação em pt-BR (data, número e nota) fica em `src/lib/format.ts`.
- Os valores de enum ficam em inglês no código (`NO_WEBSITE`, `CONTACTED`) e são exibidos em português na interface.

## Aplicação

### Nenhum dado é descartado

Tudo o que a API devolve é guardado. A filtragem (tem site, fechada, nota etc.) acontece **só na consulta**, pelos filtros da interface e da API. Nunca na gravação.

- O corpo de cada resposta do Google fica em `ApiRequest.response`, sem alteração. Isso inclui as respostas de erro e os lugares que não viram lead, por exemplo um lugar sem `id`.
- Esse corpo é gravado **antes** de processar os leads. Se a gravação dos leads falhar, a página paga continua no banco e pode ser reprocessada.
- Todo lugar com `id` vira um `Lead`, qualquer que seja a situação do site ou o `businessStatus`.

### Dados (`api/prisma/schema.prisma`)

- **`ApiRequest`**: uma linha por chamada ao Google, com `period` (mês no fuso do Pacífico), página, status (`PENDING`/`SUCCESS`/`ERROR`), status HTTP, nº de resultados, erro, `response` (o corpo da resposta como veio), o usuário e `keyHash` (hash da chave usada).
- **`Search`**: uma busca de um usuário. Guarda cidade, categoria, bairro, `textQuery`, páginas pedidas e buscadas, leads novos (novos **para esse usuário**) e `status` (`DONE`/`LIMIT_REACHED`/`FAILED`). `exhausted` indica que não havia mais páginas.
- **`Lead`**: uma empresa do Google, **a mesma para todos os usuários**. `id` = `places.id`. Quando outro usuário acha a mesma empresa, ela não é duplicada: ele só passa a tê-la na lista dele (`UserLead`), e os dados do Google são atualizados.
  - Dados do Google. Cada busca que reencontra a empresa sobrescreve esses dados, e o `siteStatus`, com os da resposta mais recente. Um campo que sumiu do Google fica vazio, e os valores antigos continuam nas respostas guardadas em `ApiRequest.response`. Esses dados ficam em:
    - colunas próprias para o que a interface usa: nome, endereço, bairro, telefones, site, nota, avaliações, `types`, `pureServiceArea`, `openingHours`, `priceLevel` e os links de fotos e avaliações;
    - `googleData`, um JSON com o objeto `Place` completo, com todos os campos do field mask. A listagem não devolve esse campo.
  - `siteStatus`.
  - `state`: sigla do estado, vinda de `addressComponents`.
- **`UserLead`**: a empresa na lista de um usuário. Chave: usuário + `leadId`.
  - Campos de acompanhamento: `status` e `notes`. Cada usuário tem os seus, e o de um não aparece para o outro.
  - Busca de origem: `city`, `category`, `searchNeighborhood` e `firstSearchId`, da primeira busca **desse usuário** que trouxe a empresa. `firstSeenAt` é quando ela entrou na lista dele.
  - Esses campos nunca são sobrescritos por uma busca.
  - A API devolve o lead "achatado": os campos do `Lead` com os do `UserLead` por cima (`toUserLead` em `src/services/leads.js`).
- **`LeadPitch`**: o plano de venda do site para uma empresa da lista de um usuário (chave: usuário + `leadId`, apagado junto com o `UserLead`). Só o dono vê.
  - Cabeçalho: `demoUrl`, `decisionMaker`, `contactWhatsapp` (número ou link; sem ele, as mensagens usam o telefone do Google) e `contactNotes`.
  - `blocks`: lista ordenada de blocos com `id` estável, de três tipos: `markdown` (título e texto: brief, SPIN, preço, objeções), `message` (rótulo, `group` `main`/`followup`/`alternative`, `dayOffset`, texto e `sentAt`) e `checklist` (itens com `done`).
  - `nextFollowUpAt`: envio da mensagem principal + `dayOffset` do primeiro follow-up ainda não enviado. A sequência alternativa não entra. É recalculado a cada gravação (`src/services/pitches.js`).
  - As mensagens usam `{{vendedor}}` no lugar do nome de quem vende, trocado pelo `User.displayName` ao exibir e copiar.
- **`SearchLead`**: quais empresas cada busca trouxe, com a página e a data.
- **`User`**: quem pode entrar no app.
  - `username` (sempre em minúsculas, de 3 a 30 letras sem acento, números, `.`, `-` ou `_`) e `passwordHash` (`salt:hash` do scrypt). A senha nunca é guardada.
  - `role`: `ADMIN` ou `USER`.
  - `displayName`: o nome que entra no lugar de `{{vendedor}}` nas mensagens dos pitches.
- **`ApiToken`**: tokens pessoais do usuário, para ferramentas fora do app (como o Claude). Guarda o nome, o SHA-256 do token (`tokenHash`), os 4 últimos caracteres, a criação e o último uso. O valor do token não é guardado.
- **`UserAccess`**: as entradas de cada usuário no app (`startedAt` e `lastSeenAt`). Cada `GET /me`, que o front chama ao abrir o app, registra uma entrada; aberturas com menos de 30 minutos de intervalo estendem a mesma.

### Classificação do `websiteUri` (`api/src/utils/_classifySite.js`)

| `websiteUri` | Situação |
|---|---|
| vazio | **sem site** |
| `instagram.com` | **só Instagram** |
| `wa.me` / `whatsapp.com` / `wa.link` | **só WhatsApp** |
| `facebook.com` / `fb.com` | **só Facebook** |
| `linktr.ee` e outros agregadores de links | **agregador de links** |
| qualquer outro | **tem site**: provavelmente não é lead, mas vale conferir |

Os subdomínios contam como o domínio principal: `m.facebook.com` também é Facebook.

### Autenticação

- **Login por usuário e senha.** `POST /auth/login` confere a senha e devolve `{ token, user }`. O token é um JWT com `{ id }`, válido por 7 dias.
- **Cadastro aberto no app** (`/register`). `POST /auth/register` com `{ username, password }` cria um usuário comum (`USER`) e já devolve `{ token, user }`, como o login.
  - O usuário é gravado em minúsculas e o login não diferencia maiúsculas. A senha precisa ter de 8 a 200 caracteres. Usuário que já existe responde 409.
  - Não há script de terminal para criar usuários. Para tornar alguém admin, altere o `role` dele direto no banco.
- **Rotas protegidas:** todas, menos `POST /auth/login`, `POST /auth/register` e `GET /`, passam pelo `verifyJWT` (`src/middlewares/auth.js`). Sem token, ou com token inválido ou expirado, a resposta é 401 `{ message }`.
- **Tokens pessoais** (`src/services/apiTokens.js`), para o Claude ler os leads e atualizar status e anotações sem a senha:
  - São criados e revogados na tela **Tokens** (`/tokens`), só com a sessão do app. O valor (`sc_` + 32 bytes aleatórios) aparece uma única vez, e o banco guarda só o SHA-256. Cada usuário pode ter até 10.
  - Valem **só** nas rotas de `/leads`, que usam `verifyJWTOrApiToken`. Em qualquer outra rota (buscas, uso, `/me`, `/me/tokens`, admin), o `verifyJWT` responde 401. Por isso um token nunca faz buscas nem gasta requisições, mesmo sendo de um admin.
  - Rota nova continua com `verifyJWT`. Só use `verifyJWTOrApiToken` numa rota que o Claude precise chamar e que não gaste requisições.
  - Revogar apaga o token, e ele para de funcionar na hora. O último uso é gravado no máximo uma vez por minuto.
  - A skill `landing-page` (repositório `claude-skills`, `scripts/leads.py`) lê `SEARCH_COMPANY_API_URL` e `SEARCH_COMPANY_TOKEN` do bloco `env` do `~/.claude/settings.json`, busca os leads "Fazendo" (`GET /leads?status=IN_PROGRESS`) e envia o plano de venda pelo `PUT /leads/:id/pitch`, em vez de gravar um md.
- **Cada usuário só vê o que é dele:** leads, filtros, buscas, histórico e uso do mês saem sempre do `req.user.id`.
- **Admin:** as rotas `/admin` passam também pelo `requireAdmin` (`src/middlewares/admin.js`), que lê o papel no banco a cada chamada (`isAdmin`) e responde 403 para quem não é admin.
  - O admin tem a própria lista, como qualquer usuário, e vê a dos outros só pelo painel, sem poder alterar.
- Na migration `users_own_leads`, os dados que já existiam foram para o primeiro usuário (o de menor id), que virou admin. No Supabase, o único usuário antes dela era o admin, hoje `admin` (antes `admin@gmail.com`). Os outros usuários foram apagados em 19/10/2026 e 20/10/2026.
- A senha é guardada com `scrypt` do Node (`src/utils/_password.js`), com salt aleatório e comparação em tempo constante.
- **No app:**
  - o token fica no `localStorage` (`search-company:auth`, em `src/store/authStore.ts`) e o interceptor do axios o envia como `Authorization: Bearer`;
  - um 401 fora do login encerra a sessão;
  - o `RequireAuth` manda quem não tem sessão para `/login?next=<página>`, e depois do login volta para ela (o `next` só aceita caminhos do próprio app);
  - token vencido ou sem formato de JWT conta como sem sessão (`src/lib/token.ts` lê o `exp`). A assinatura só a API confere: um token falso com prazo abre a tela, mas a primeira chamada volta 401 e encerra a sessão;
  - o botão "Sair" fica no cabeçalho;
  - o login tem o link "Criar conta" e o cadastro tem "Entrar", os dois mantendo o `next`;
  - ao abrir o app, o `Layout` chama `GET /me`, que atualiza o papel no `authStore` e registra a entrada;
  - o link "Admin" só aparece para o admin, e o `RequireAdmin` manda os outros de volta para a busca.

### Endpoints do backend

Todos, menos `POST /auth/login`, `POST /auth/register` e `GET /`, exigem o header `Authorization: Bearer <token>`.

- `POST /auth/login` com `{ username, password }`: devolve `{ token, user }`, ou 401 com usuário ou senha errados.
- `POST /auth/register` com `{ username, password }`: cria a conta (`USER`) e devolve `{ token, user }`. 409 se o usuário já existe.
- `GET /me`: o usuário logado, `{ id, username, role, displayName }`. Registra uma entrada no app.
- `PATCH /me` com `{ displayName }`: altera o nome usado em `{{vendedor}}`. Vazio vira `null`.
- `GET /me/tokens`, `POST /me/tokens` com `{ name }` e `DELETE /me/tokens/:id`: lista, cria e revoga tokens pessoais. Só com a sessão do app. A criação devolve o `token` completo, uma única vez.
- `GET /usage`: uso do mês do usuário, `{ period, used, limit, remaining }`. Com o header `X-Google-Api-Key`, inclui o que outras contas fizeram com a mesma chave, como a trava conta.
- `POST /searches` com `{ city, category, neighborhood?, maxPages (1–3, padrão 3), skipIfDone (padrão true) }` e o header `X-Google-Api-Key`: roda **uma** combinação com essa chave.
  - Sem o header, responde 400.
  - Respostas: 201 com `{ skipped, search, usage }`, 409 com outra busca do usuário em andamento e 429 com a cota dele esgotada.
  - Com `skipIfDone`, uma busca **do próprio usuário** com o mesmo texto, que já terminou e cobriu as páginas pedidas, é pulada sem gastar requisição. A mesma busca feita por outro usuário não conta.
- `GET /searches`: histórico do usuário, com as mais recentes primeiro.
- `GET /searches/:id/leads`: `{ search, items }` com as empresas que uma busca do usuário trouxe, no formato de `GET /leads` mais `page` (página da busca) e `isNew` (foi essa busca que a colocou na lista). Ordem: página e, dentro dela, mais avaliações. 404 se a busca é de outro usuário.
- Todas as rotas de `/leads` abaixo aceitam também um token pessoal no `Authorization: Bearer`.
- `GET /leads`: listagem paginada dos leads do usuário.
  - Filtros: `siteStatus`, `status` e `businessStatus` (aceitam vários valores separados por vírgula), `minRating`, `minReviews`, `city`, `category`, `neighborhood`, `q` (nome) e `pitch` (`has`, `none` ou `due`, com o follow-up já vencido).
  - Cada lead traz `pitch: { nextFollowUpAt }`, ou `null` sem plano de venda.
  - Também aceita `page`, `pageSize` (até 100) e `orderBy` (`reviews`, `rating`, `name` ou `recent`).
  - Todas as ordenações terminam no `leadId`, para a paginação não repetir nem pular empresas empatadas.
- `GET /leads/filters`: cidades, categorias e bairros dos leads do usuário.
- `GET /leads/:id`: um lead da lista do usuário, no formato de `GET /leads`. 404 se a empresa não está na lista dele.
- `PATCH /leads/:id`: altera só `status` e `notes` do lead **na lista do usuário**. 404 se a empresa não está na lista dele.
- `GET /leads/:id/pitch`: o plano de venda, ou `null`.
- `PUT /leads/:id/pitch` com `{ demoUrl, decisionMaker, contactWhatsapp, contactNotes, blocks }`: cria ou substitui o plano. Blocos e itens sem `id` ganham um; num bloco de mesmo `id`, `sentAt` e `done` omitidos mantêm o valor salvo.
- `PATCH /leads/:id/pitch/blocks/:blockId` com `{ sent }` (mensagem) ou `{ itemId, done }` (checklist).
- `DELETE /leads/:id/pitch`: apaga o plano.
- Só admin (403 para os outros):
  - `GET /admin/users`: todos os usuários, com empresas, buscas, uso do mês, entradas, último acesso e se têm chave.
  - `GET /admin/users/:id`: um usuário, com os mesmos números.
  - `GET /admin/users/:id/leads`: os leads dele, com os mesmos filtros e a paginação de `GET /leads`.
  - `GET /admin/users/:id/accesses`: as entradas dele no app, as mais recentes primeiro (até 200).

### Frontend

- **Busca (`/`):**
  - Chave da API do Google (`src/components/search/GoogleApiKeyField.tsx`): um campo com "mostrar/esconder" e "Lembrar neste navegador". A barra de uso do cabeçalho se atualiza quando a chave muda.
  - Campos de cidade, categorias e bairros (um por linha), páginas por busca e "pular buscas já feitas".
  - Mostra a estimativa de custo (combinações × páginas) e pede confirmação num diálogo antes de rodar.
  - Roda as combinações em sequência, mostrando o andamento, e permite parar depois da atual. Também mostra o histórico.
  - Clicar numa busca do histórico abre um modal (`SearchLeadsDialog`) com as empresas que ela trouxe: nota, situação do site, status e página, com o selo "Nova" nas que entraram na lista por ela. Clicar numa empresa abre o painel de detalhes dela.
- **Leads (`/leads`):**
  - Filtros em chips (situação do site, status e funcionamento) e campos para nome, cidade, categoria, bairro, nota mínima, mínimo de avaliações e ordenação.
  - Por padrão, nenhum chip vem marcado e a lista mostra todas as empresas. Cada chip marcado restringe a lista; os filtros só escondem da tela, e os dados continuam no banco.
  - **O estado da tela fica na URL** (`/leads?q=…&siteStatus=…&page=3&pageSize=25`), por `src/lib/leadQuery.ts` e pelo hook `useLeadQuery`:
    - A URL só guarda o que difere do padrão: sem `siteStatus`, `status` ou `businessStatus`, nenhum chip está marcado.
    - Recarregar, abrir em outra aba e usar voltar/avançar mantêm filtros e página.
    - Mudar de página cria uma entrada no histórico. Mudar filtros só substitui a URL atual.
    - Os campos digitados (nome e mínimo de avaliações) só vão para a URL e para a API depois de 300 ms sem digitar.
    - Valores inválidos na URL voltam ao padrão, e uma página além da última vai para a última.
    - O link "Leads" do menu volta aos últimos filtros usados (`src/store/leadsViewStore.ts`, só em memória).
  - Paginação na API (`page`, `pageSize` até 100). A tela oferece 25, 50 ou 100 linhas por página e números de página com reticências; no celular mostra "2 de 6".
  - Empresas que não estão funcionando aparecem com um aviso em vermelho embaixo do nome.
  - Clicar em qualquer parte da linha abre os detalhes da empresa no painel lateral (`LeadDetailSheet`), com anotações, informações do Google e atalhos para WhatsApp, Maps, fotos e avaliações. O status pode ser trocado direto na tabela: o select, os links e os botões da linha não abrem o painel.
  - A coluna Ações tem só atalhos: WhatsApp (com telefone), Instagram (quando o site no Google é o Instagram) e fotos no Google (`photosUri`, ou a página no Maps).
  - A tabela e os filtros são memorizados (`memo`) e recebem funções estáveis (`useCallback`), para abrir e fechar o painel não redesenhar todas as linhas.
- **Plano de venda (`/leads/:id/venda`)** (`src/pages/leads/pitch.tsx`, `src/components/pitch/`, `src/lib/pitch.ts`), aberto pelo painel do lead ou pelo ícone na coluna Ações:
  - o cabeçalho com a demonstração e o contato, e os blocos, cada um editável no lugar, com setas para reordenar e remoção. O markdown é renderizado com `react-markdown` + `remark-gfm` (tabelas);
  - nas mensagens, "Copiar e abrir WhatsApp" copia o texto, abre o WhatsApp do contato e marca como enviada; "Copiar" só copia. Se o texto tem `{{vendedor}}` e o usuário não tem `displayName`, um aviso pede o nome antes de copiar (ou copia mesmo assim);
  - os follow-ups mostram a data de envio, e a lista de leads mostra "Follow-up hoje"/"Follow-up atrasado" e o chip "Plano de venda" (com plano, sem plano, follow-up vencido).
- **Tokens (`/tokens`)** (`src/pages/tokens/`, `src/components/tokens/`): cria um token com nome, mostra o valor uma vez já como o bloco `env` para o `~/.claude/settings.json` e lista os tokens com o fim, a criação, o último uso e o botão "Revogar".
- **Admin (`/admin`)**, só para o administrador (`src/pages/admin/`, `src/components/admin/`):
  - lista dos usuários com empresas, buscas, requisições no mês, entradas e último acesso;
  - página de cada usuário (`/admin/users/:id`) com esses números, as empresas dele (só leitura, das mais recentes) e as entradas no app.
- O cabeçalho mostra as requisições usadas no mês **pelo usuário** numa barra que muda de cor: verde, âmbar com menos de 100 restantes e vermelho quando a cota acaba.

## Testes

**Nunca teste contra o banco principal.** As linhas de `ApiRequest` de teste entram na contagem do mês real. Os testes usam:

- um banco separado, criado com `docker exec search-company-db createdb -U search search_company_test` e preparado com `DATABASE_URL=... bunx prisma migrate deploy`;
- um mock HTTP da Text Search, apontado por `PLACES_API_URL`;
- chaves falsas no header `X-Google-Api-Key` e `MONTHLY_REQUEST_LIMIT` baixo;
- usuários de teste criados por `POST /auth/register` na API apontada para o banco de teste. A migration `users_own_leads` recusa rodar num banco com dados e sem nenhum usuário.

Ao terminar, apague o banco de teste com `dropdb`.

## Abordagem comercial

- Priorize empresas com nota boa e muitas avaliações: elas têm clientes e dinheiro girando. Por isso a ordenação padrão é "mais avaliações".
- "Sem site no Maps" não garante que a empresa não tenha site. Confira antes de abordar.
- Quem usa Instagram ou WhatsApp no lugar de site também é lead, e isso é um bom argumento de venda.
- **Nada de disparo em massa** no WhatsApp: isso gera bloqueio e conta como spam. Mande mensagens individuais e personalizadas.
- Uma tática forte é mandar o print de uma prévia do site, já com o nome e as fotos do negócio.

## Status do Google Cloud

Projeto `prospeccao-sites`, com faturamento vinculado.

- [x] Chave de API criada (o usuário a informa na tela de busca)
- [ ] Confirmar que a **Places API (New)** está ativada
- [ ] Restringir a chave só à Places API (New)
- [ ] Baixar a cota por minuto do Text Search (ex.: 10/min) e deixar `REQUESTS_PER_MINUTE` igual
- [ ] Criar um alerta de orçamento de R$ 5 (ele só manda e-mail, não bloqueia)

O Google **não bloqueia** sozinho quando a cota grátis acaba, então a proteção principal é a trava no backend. No cadastro do cartão, o Google faz uma pré-autorização de R$ 125, que não é cobrada e some em alguns dias.

## Decisões em aberto

- **Atribuição ao Google.** Os termos pedem a atribuição quando os dados aparecem fora de um mapa do Google, e o app não mostra mais nenhuma. Se o app passar a ser usado por outras pessoas, vale voltar com ela num lugar discreto.

- **Armazenamento dos dados dos leads.** Pelos termos, só o `place_id` pode ser guardado, e coordenadas só podem ficar até 30 dias. O app grava hoje o nome, o telefone, o site e a nota no banco. Também grava `location`, `viewport` e `plusCode` dentro de `googleData`. Há duas saídas:
  - aceitar esse risco, já que o uso é pessoal;
  - guardar só o `place_id`, a classificação e os dados próprios (status e anotações), e buscar o resto de novo quando precisar. Isso custa um Place Details Enterprise por empresa e pesa no limite de requisições.
