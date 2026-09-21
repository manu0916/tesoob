# Vitrine Cloudflare Pages + D1

## Preservação do banco antigo

A vitrine agora usa a mesma binding **DB** do chat, sem Spring Boot/PostgreSQL ou serviço na porta 8080. Conversas, mensagens, administradores e hashes antigos permanecem nas tabelas `chat_*`. A sessão administrativa existente autoriza `/admin/produtos`; também é possível entrar com o mesmo e-mail/senha em `/loja/conta`. Logout nessa conta encerra a sessão administrativa compartilhada.

Clientes ficam separados em `store_users`. Cadastro público/Google não atribui papel administrativo nem vincula contas por coincidência de e-mail. A conta administrativa é para gestão; compras devem usar conta de cliente.

## 1. SQL correto — somente acréscimos

Use **[`drizzle/0002_storefront.sql`](drizzle/0002_storefront.sql)** no D1 existente. Não apague/recrie o banco e não execute o SQL PostgreSQL de `backend/` no D1.

A migração só cria objetos `store_*` com `IF NOT EXISTS`, sem `DROP`, `ALTER`, `DELETE` ou atualização dos registros antigos. Tabelas novas: `store_users`, `store_sessions`, `store_products`, `store_orders`, `store_oauth_states`, `store_rate_limits`. Schemas e snapshots Drizzle estão sincronizados; `db/schema.ts` antigo permanece intacto.

Antes de publicar, exporte um backup privado do banco correto e confira nome/ID. O `database_id` em `wrangler.jsonc` é o ID já existente no projeto. Exemplos para executar **após conferir o destino**:

```powershell
npx wrangler d1 export tesoob --remote --output CAMINHO_PRIVADO_NOVO_DO_BACKUP.sql
npx wrangler d1 execute tesoob --remote --file drizzle/0002_storefront.sql
```

Esses comandos remotos não foram executados pelo assistente. O export contém dados pessoais e hashes: não colocar no Git/pasta pública. Também é possível executar somente o conteúdo de `0002_storefront.sql` no console D1. Não reaplique `0000_chat.sql` e `0001_admin_login.sql` no banco já existente. O runtime inicializa a migração adicional de maneira idempotente, seguindo o padrão do chat; aplicá-la antes permite auditar a mudança.

Conferências somente de leitura antes/depois:

```sql
SELECT count(*) AS conversas FROM chat_conversations;
SELECT count(*) AS mensagens FROM chat_messages;
SELECT count(*) AS administradores FROM chat_admin_accounts;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
SELECT id, name, price_cents, active FROM store_products;
SELECT id, status, length(checkout_ciphertext) AS tamanho_cifrado FROM store_orders;
```

## 2. Pages e secrets

O projeto usa Vinext/React com SSR. Não basta publicar arquivos estáticos: `npm run build:pages` prepara Pages Functions em modo avançado `_worker.js`, preservando páginas e APIs no mesmo domínio.

- Diretório raiz no painel: `site`, se essa pasta existe no seu repositório remoto.
- Comando: `npm run build:pages`.
- Saída: `.pages-dist`.
- Compatibilidade: `2026-05-15`, flag `nodejs_compat`.
- Binding D1: **DB**, apontando para o banco antigo correto.
- Configuração: `wrangler.jsonc`; confirme o nome remoto do projeto antes de qualquer deploy.

`deploy/wrangler.vite.jsonc` separa o ambiente de desenvolvimento da configuração Pages. Execute `build:pages` antes de publicar/pré-visualizar: além do bundle, ele ajusta o redirect de configuração gerado pelo Vite para o formato Pages. Os processos usam estados locais separados; nenhum preview local altera o banco remoto.

O bundle de servidor fica dentro de `.pages-dist/_worker.js/`, nunca como arquivo estático público. `deploy/pages-entry.js` encaminha assets ao Pages e SSR/APIs ao aplicativo. Java e Docker não fazem parte do pacote. `backend/` foi preservado como referência histórica, documentada em `STOREFRONT-SPRING-LEGACY.md`.

No painel Pages → Settings → Variables and Secrets, configure no ambiente correto:

| Nome | Uso |
| --- | --- |
| `STORE_AES_KEY` | Secret obrigatório no checkout: 32 bytes aleatórios em Base64. |
| `STORE_ACTIVE_KEY` | Padrão `v1`; ID ativo do keyring. |
| `STORE_AES_KEYS` | Opcional: JSON de chaves por ID; se informado substitui `STORE_AES_KEY`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Opcionais para habilitar Google. |
| `GOOGLE_REDIRECT_URI` | `https://SEU-DOMINIO/store-api/login/oauth2/code/google`, idêntico ao Google Cloud. |

Gere a chave em terminal privado, por exemplo `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Guarde em secret manager; nunca em código/SQL/`NEXT_PUBLIC_*`. Sem chave válida, catálogo/login funcionam, mas checkout falha com 503 sem salvar dados em claro. Perder a chave torna pedidos ilegíveis. Para rotação, mantenha IDs antigos em `STORE_AES_KEYS`, adicione novo ID e altere `STORE_ACTIVE_KEY`. Não existe job automático de recifragem.

Google implementa authorization code + PKCE, state de uso único, nonce, JWKS, RS256, issuer, audience, expiração e e-mail verificado. Credenciais reais e teste com seu domínio ainda são necessários.

**Capacidade:** BCrypt custo 12 em JavaScript é deliberadamente custoso e não é adequado ao limite de CPU de 10 ms do Workers Free. Use capacidade de Functions/Workers compatível e valide métricas antes de publicar. Não reduza a segurança da senha para caber no plano gratuito. Senhas administrativas antigas continuam PBKDF2 para manter compatibilidade.

**Dependências:** `npm audit --omit=dev` identificou alertas na árvore atual: React Server Components, Vinext/image-size, Vite, Undici e esbuild (6 entradas, 5 altas na execução). BCrypt/Jose novos não foram apontados. Não apliquei `audit fix --force` nem upgrade de framework fora da adaptação. Resolva os alertas e valide as versões antes de exposição pública. Não se trata de auditoria externa de segurança.

## 3. Código e segurança

- `app/store-api/[...path]/route.ts`: entrada Worker nativa, sem proxy para Java.
- `lib/store-server.ts`: rotas, CSRF, autorização e erros sanitizados.
- `lib/store-auth.ts`: sessões D1, BCrypt, Google e login administrativo existente.
- `lib/store-security.ts`: validação e AES-256-GCM/Web Crypto.
- `lib/store-products.ts`: CRUD e concorrência por versão.
- `lib/store-orders.ts`: checkout, idempotência e isolamento por usuário.
- `lib/store-database.ts`: migração e rate limiting distribuído no D1.

Nome/CPF/endereço/complemento do checkout são criptografados antes de qualquer bind SQL. AES-GCM usa nonce aleatório de 12 bytes e autenticação vinculada ao pedido/usuário. APIs de histórico não devolvem esses dados; logs não imprimem payloads. E-mail de login e metadados comerciais são pesquisáveis em claro. O chat antigo não é recifrado por esta adaptação.

Sessões têm token aleatório HttpOnly/SameSite=Lax/Secure em HTTPS; só hash persiste no D1. Clientes expiram em 30 minutos absolutos. Escritas exigem CSRF e Origin exato. DTOs rejeitam campos desconhecidos e consultas são parametrizadas. Cadastro público não aceita papel nem checkout aceita preço informado pelo cliente.

Dinheiro é armazenado em centavos. Uma única instrução `INSERT ... SELECT ... ON CONFLICT` verifica disponibilidade/versão, congela o preço do servidor e deduplica retries por usuário. Reutilizar chave com payload diferente dá 409. Arquivar produtos preserva pedidos. Pedidos alheios dão 404.

Mercado Pago permanece **sem cobrança**, status `AWAITING_INTEGRATION`. A integração futura exige secrets, webhook assinado, idempotência e reconciliação de valor/moeda; nunca confiar só no retorno do navegador. PAN/CVV não são coletados.

A UI continua em `/loja`, `/loja/produtos/[id]`, `/loja/conta`, `/loja/checkout/[id]`, `/admin/produtos`. Observação ausente/vazia não renderiza bloco nem espaço.

## Desenvolvimento e verificação

```powershell
npm install
npm run dev
npx tsc --noEmit
npm run lint
npm run build:pages
npm run preview:pages -- --port 4178 --persist-to .wrangler/pages-tests
```

No Windows, encerre a prévia Pages antes de reconstruir `.pages-dist` e inicie-a novamente após o build; o processo monitora esse diretório. Aguarde a mensagem `Ready` antes de executar os testes.

Para uso local normal, configure `.dev.vars` a partir de `.dev.vars.example`; não publique esse arquivo. Nenhum produto fictício é criado no banco real.

Os testes D1 usam exclusivamente `.wrangler/store-tests`, separado do estado normal e do banco remoto. Inicie Vite na porta 4177 com `STORE_LOCAL_TEST=1` e `STORE_LOCAL_AES_KEY` aleatória no ambiente do processo. Só `serve` usa essas opções, nunca o build. Defina `STORE_PREVIEW_PASSWORD` temporária de 12+ caracteres nos terminais de teste para o admin sintético `admin@preview.test`.

```powershell
npm run test:store:d1
$env:STORE_TEST_ORIGIN='http://127.0.0.1:4177'
$env:STORE_CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:store
```

Fixtures ficam apenas no D1 isolado. Nunca aponte esses testes para produção. Resultados detalhados em `storefront-d1-qa.md`.

Referências: [Pages Advanced Mode](https://developers.cloudflare.com/pages/functions/advanced-mode/), [D1 API](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect), [Pages Functions: capacidade](https://developers.cloudflare.com/pages/functions/pricing/).
