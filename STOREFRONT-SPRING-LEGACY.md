# Referência histórica — Spring/PostgreSQL, não utilizada no Cloudflare

Substituída pela versão Cloudflare Pages/D1. Não execute este SQL no D1. Consulte `STOREFRONT.md` para a configuração atual. O Java foi preservado como referência e não é publicado nem chamado pelo site.

## Arquitetura e limites

O repositório existente usa React/Vinext em Cloudflare Workers e D1 para o chat. A nova loja acrescenta **Spring Boot 3.5.16 / Java 21 / PostgreSQL**, em `backend/`, sem substituir o atendimento existente. O frontend permanece no projeto atual. Java e PostgreSQL precisam de hospedagem própria; não executam dentro do Worker.

Fluxo: navegador → `/store-api/*` na mesma origem do site → Spring Boot → PostgreSQL. Em desenvolvimento, `vite.config.ts` faz o proxy. Na publicação, `app/store-api/[...path]/route.ts` encaminha para a origem HTTPS configurada em `STORE_API_ORIGIN`. O gateway limita o corpo a 64 KiB, usa destino fixo, não encaminha cookies do chat e permite redirects somente internos ou para o Google.

Não há publicação automática, cobrança, estoque, cálculo de frete, recuperação de senha ou verificação de e-mail local nesta entrega. O cadastro local permite entrar imediatamente. Google exige e-mail verificado pelo provedor. Produtos e preços de demonstração só existem no servidor de testes, nunca na migração de produção.

## 1. Banco de dados PostgreSQL

O DDL completo está em [`backend/src/main/resources/db/migration/V1__store.sql`](backend/src/main/resources/db/migration/V1__store.sql). Flyway executa a migração no primeiro startup; Hibernate apenas valida o schema (`ddl-auto: validate`). Não aplique o SQL manualmente e depois inicie Flyway em um banco já preenchido sem planejar um baseline.

| Tabela | Conteúdo e invariantes |
| --- | --- |
| `users` | UUID, e-mail normalizado e único, `password_hash` BCrypt nullable, `google_id` único nullable, papel `CUSTOMER`/`ADMIN`, habilitação. Pelo menos uma identidade é obrigatória. |
| `products` | Nome, preço decimal positivo, URL de imagem, descrição, observação nullable, ativo, versão e timestamps. Observação só com espaços é normalizada para `NULL` no serviço. |
| `orders` | Dono, produto, nome/preço congelados, quantidade, total, BRL, status, JSON de checkout criptografado, idempotência por usuário e versão. Exclusão de produto é lógica e preserva pedidos. |

`checkout_ciphertext` contém `key-id.base64(nonce).base64(ciphertext+tag)`, não JSON legível. Dentro do envelope estão nome do destinatário, CPF, endereço completo, complemento e IDs de contexto. Cada escrita usa nonce novo. E-mail de login e metadados comerciais do pedido não são criptografados por esse conversor; devem ter controle de acesso e política de retenção. Não armazenamos número de cartão ou CVV.

Consultas de inspeção sem revelar dados de checkout:

```sql
-- Metadados públicos; consultas da aplicação usam parâmetros JPA.
SELECT id, name, price, image_url, description, observation, version
FROM products WHERE active = TRUE
ORDER BY created_at DESC LIMIT 12;

-- Conferir envelope sem exportar o conteúdo sensível.
SELECT id, status, split_part(checkout_ciphertext, '.', 1) AS key_id,
       length(checkout_ciphertext) AS encrypted_length
FROM orders ORDER BY created_at DESC LIMIT 20;

-- Migrações aplicadas pelo Flyway.
SELECT version, description, success FROM flyway_schema_history;
```

Use um usuário de banco restrito à loja. O Compose é uma configuração local; em produção, separe credenciais de migração (DDL) das credenciais da aplicação (DML), use conexão TLS ao banco, backups protegidos e acesso de rede restrito.

## 2. Backend Java Spring Boot

### Código completo por responsabilidade

- Entidades e repositórios: [`backend/src/main/java/com/tesoob/store/domain`](backend/src/main/java/com/tesoob/store/domain).
- AES-256-GCM e conversor JPA: [`FieldCipher.java`](backend/src/main/java/com/tesoob/store/crypto/FieldCipher.java), [`EncryptedStringConverter.java`](backend/src/main/java/com/tesoob/store/crypto/EncryptedStringConverter.java). `StoreOrder.checkoutJson` aplica `@Convert`, criptografando antes de passar o valor ao JDBC.
- Segurança: [`SecurityConfig.java`](backend/src/main/java/com/tesoob/store/security/SecurityConfig.java), [`GoogleUserService.java`](backend/src/main/java/com/tesoob/store/security/GoogleUserService.java), [`AdminBootstrap.java`](backend/src/main/java/com/tesoob/store/security/AdminBootstrap.java).
- Produtos: [`ProductController.java`](backend/src/main/java/com/tesoob/store/web/ProductController.java), [`ProductService.java`](backend/src/main/java/com/tesoob/store/service/ProductService.java).
- Cadastro/login: [`AuthController.java`](backend/src/main/java/com/tesoob/store/web/AuthController.java).
- Checkout e pedidos: [`CheckoutController.java`](backend/src/main/java/com/tesoob/store/web/CheckoutController.java), [`CheckoutService.java`](backend/src/main/java/com/tesoob/store/service/CheckoutService.java).
- Contrato de pagamentos: [`PaymentGateway.java`](backend/src/main/java/com/tesoob/store/payment/PaymentGateway.java), [`MercadoPagoPreparation.java`](backend/src/main/java/com/tesoob/store/payment/MercadoPagoPreparation.java).

### Endpoints

Todos os caminhos abaixo começam com `/store-api`.

| Método / caminho | Permissão / operação |
| --- | --- |
| `GET /products?page=0`, `GET /products/{id}` | Público; apenas produtos ativos. |
| `GET /auth/csrf`, `GET /auth/options` | Público; token CSRF e disponibilidade do Google. |
| `POST /auth/register` | Público + CSRF; `{email,password}`, sempre `CUSTOMER`. |
| `POST /auth/login`, `POST /auth/logout` | Login/logout com CSRF; sessão HttpOnly. |
| `GET /auth/me` | Usuário autenticado. |
| `GET /oauth2/authorization/google` | Inicia Google quando o perfil está configurado. |
| `GET /admin/products?page=0` | Admin; inclui inativos. |
| `POST /admin/products` | Admin + CSRF; criação. |
| `PUT /admin/products/{id}` | Admin + CSRF; edição com versão otimista. |
| `DELETE /admin/products/{id}?version=0` | Admin + CSRF; versão corrente obrigatória, arquivamento sem apagar pedidos. |
| `POST /checkout` | Login + CSRF + header UUID `Idempotency-Key`. |
| `GET /orders?page=0`, `GET /orders/{id}` | Apenas pedidos do usuário autenticado. |

Exemplo de produto (preços e imagem ilustrativos, não inseridos automaticamente):

```json
{
  "name": "Nome da peça",
  "price": 199.90,
  "imageUrl": "/media/editorial-04.webp",
  "description": "Descrição cadastrada pelo administrador.",
  "observation": null,
  "active": true,
  "version": 0
}
```

Na edição, envie a `version` retornada na leitura. Valores desatualizados geram 409. Imagens aceitam URL HTTPS ou arquivo existente `/media/...`; o formulário implementa a opção **URL**, não upload. O servidor não baixa URLs remotas. Texto é renderizado como texto React, nunca HTML arbitrário.

O cliente obtém `/auth/csrf` com cookies e envia o token no header informado (`X-CSRF-TOKEN`). `lib/store-api.ts` faz isso em cada mutação, inclusive após a rotação de sessão no login. Não há token de autenticação em `localStorage`.

### Checkout e segurança

O body de checkout contém `productId`, `productVersion`, `quantity` e `billing` (`recipient`, `document`, `postalCode`, `street`, `number`, `complement`, `district`, `city`, `state`). CPF tem 11 dígitos e verificação de dígitos; CEP tem 8 dígitos. Endereço é solicitado só nessa etapa. Esta versão usa o mesmo endereço para faturamento e entrega.

O servidor lê produto/preço do banco e calcula o total com `BigDecimal`; não aceita preço enviado pelo navegador. O DTO rejeita campos desconhecidos. Locks no usuário e produto, transação e chave única evitam pedidos duplicados por retry concorrente. Repetir uma chave com outro conteúdo dá 409. Consultar pedido alheio dá 404. Desabilitar usuário ou remover o papel administrativo bloqueia as operações mesmo com sessão anterior.

Senhas usam BCrypt custo 12, mínimo 12 caracteres e limite de 72 bytes UTF-8. Sessões expiram por inatividade em 30 minutos; cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção. CSRF permanece habilitado. O administrador é criado somente por bootstrap explícito; registro público não recebe papel, e bootstrap não promove conta de cliente existente. Google é identificado por `sub`; coincidência de e-mail não vincula automaticamente uma conta local/admin.

Os endpoints de autenticação têm limite conservador por IP e por instância. Atrás do Worker/proxy, o Spring vê o IP do proxy: implemente também rate limiting por cliente na borda antes de produção. Não habilite confiança irrestrita em `X-Forwarded-For`. Sessões atuais são em memória; para múltiplas réplicas use Spring Session/Redis ou afinidade e documente o comportamento de reinício. Configure HTTPS, limites no ingress, observabilidade sem bodies/CPF e uma política de retenção/exclusão LGPD antes de receber clientes reais.

### Chaves e rotação

`STORE_AES_KEY` deve conter 32 bytes aleatórios em Base64. É obrigatória, sem valor padrão. Guarde em secret manager, separada do banco e do repositório. Perder a chave torna os dados irrecuperáveis. Backups precisam de estratégia própria para as chaves.

O keyring aceita múltiplas chaves `store.crypto.keys.<id>` e `store.crypto.active-key`. Para rotação, mantenha `v1`, acrescente `v2` em configuração externa segura e mude a ativa. Dados novos usam `v2`; dados antigos continuam legíveis com `v1`. Migre os envelopes antigos por um job administrativo transacional e auditado, incluindo backups, antes de remover uma chave. A rotação do conjunto é suportada; esse job operacional não é executado automaticamente. Não substitua o conteúdo de uma chave mantendo o mesmo ID.

### Executar localmente com PostgreSQL próprio

Requisitos: Java 21, Maven 3.9+, Node conforme `package.json`, PostgreSQL 17. Na raiz `site`:

Nesta máquina também existe Java 26; selecione o JDK 21 ao executar Maven/Java. Em PowerShell, ajuste `JAVA_HOME` para a instalação 21 e acrescente seu diretório `bin` ao `Path` do terminal. A verificação local usou o Maven 3.9.11 baixado em `%TEMP%/apache-maven-3.9.11`; os comandos abaixo pressupõem `mvn` disponível no `Path`.

```powershell
cd backend
mvn test
mvn package
mvn dependency:build-classpath "-Dmdep.outputFile=target/runtime-classpath.txt" "-DincludeScope=runtime"
$storeClasspath = 'target/classes;' + (Get-Content -Raw target/runtime-classpath.txt).Trim()
java -cp $storeClasspath com.tesoob.store.security.SecretTools aes
java -cp $storeClasspath com.tesoob.store.security.SecretTools
```

O primeiro utilitário gera a chave AES. O segundo solicita senha administrativa sem eco e retorna apenas o hash BCrypt. Trate ambos os resultados como segredos; não cole em logs ou commits.

Copie os nomes de `backend/store.env.example` para seu ambiente/secret manager. `DB_PASSWORD` e `STORE_AES_KEY` são obrigatórios. Para criar admin, forneça `STORE_ADMIN_EMAIL` e `STORE_ADMIN_PASSWORD_HASH` antes do primeiro startup. Remova as variáveis de bootstrap depois da criação. Um arquivo `.env` não é carregado automaticamente pelo Spring; exporte as variáveis no processo ou use o Compose abaixo.

```powershell
# Com as variáveis configuradas e o banco acessível, dentro de backend:
mvn spring-boot:run
# Em outro terminal, dentro de site:
npm install
npm run dev
```

Abra `http://localhost:3000/loja`; admin em `/admin/produtos`. O atendimento antigo em `/admin` continua com sua própria autenticação/D1. Não se reutilizam silenciosamente senhas ou permissões entre os dois sistemas.

Alternativa Docker, depois de preencher `backend/.env` (ignorado pelo Git):

```powershell
docker compose --env-file backend/.env -f infra/compose.store.yml up --build
```

No `.env` usado pelo Compose, coloque hashes BCrypt entre aspas simples para preservar `$`. `COOKIE_SECURE=false` é permitido apenas no HTTP local. Não exponha o PostgreSQL publicamente. O backend do Compose fica restrito a `127.0.0.1:8080`; em produção use ingress HTTPS adequado. Docker não foi executado nesta máquina.

### Configurar Google

Crie um OAuth Web Client no Google Cloud. Defina `SPRING_PROFILES_ACTIVE=google`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI`. Callback local: `http://localhost:3000/store-api/login/oauth2/code/google`. Em produção: `https://SEU-SITE/store-api/login/oauth2/code/google`. Cadastre o mesmo URI exato no Google, sempre com a origem pública do **frontend**, não a origem privada do Java. Sem configuração, o frontend informa indisponibilidade e mantém login local funcional. O OAuth real depende dessas credenciais e não foi validado contra uma conta Google nesta execução.

### Mercado Pago: ponto de extensão

`MercadoPagoPreparation` retorna `status: AWAITING_INTEGRATION` e `redirectUrl: null`, sem cobrança; pedido fica em `AWAITING_INTEGRATION`. Não existe endpoint que permita ao navegador marcar um pedido como pago.

Quando integrar, implemente o contrato `PaymentGateway` com SDK/HTTP oficial, segredo somente no backend e checkout hospedado/tokenizado pelo provedor. Persistir IDs de preferência/transação requer nova migração. Acrescente webhook com assinatura verificada, processamento idempotente, consulta autenticada ao provedor e conferência de pedido/valor/moeda antes de alterar status. Nunca considere a URL de retorno do navegador como comprovação de pagamento. Não grave PAN/CVV nem coloque documento/endereço em logs.

## 3. Frontend: dark glassmorphism

- CTA magnético no hero: [`components/magnetic-store-cta.tsx`](components/magnetic-store-cta.tsx), integrado em `components/tesoob.tsx`.
- Vitrine e detalhe: [`components/storefront.tsx`](components/storefront.tsx), rotas `/loja` e `/loja/produtos/[id]`.
- Login/cadastro/Google/histórico: [`components/store-account.tsx`](components/store-account.tsx), `/loja/conta`.
- Gestão: [`components/store-admin.tsx`](components/store-admin.tsx), `/admin/produtos`.
- Checkout: [`components/store-checkout.tsx`](components/store-checkout.tsx), `/loja/checkout/[id]`.
- Tokens, superfícies translúcidas, composição assimétrica e responsividade: [`app/store.css`](app/store.css).
- Fetch tipado, CSRF e erros: [`lib/store-api.ts`](lib/store-api.ts).

A tipografia, logo, fotografias reais e fundo escuro do site foram preservados. A loja usa hierarquia editorial, cards escalonados e glassmorphism discreto. O CTA respeita `prefers-reduced-motion`, assim como as transições. Estados de carregamento, vazio, falha, indisponibilidade e confirmação fazem parte dos componentes, sem dados fictícios de fallback.

A regra de observação é aplicada em um único componente reutilizado em cards, detalhe e resumo de checkout:

```tsx
const observation = value?.trim();
if (!observation) return null;
// Somente então é criado o bloco com label e texto.
```

Não há wrapper vazio, margem reservada ou label quando a observação não existe. O frontend envia branco como `null` e o backend normaliza novamente.

## Verificação e preview descartável

```powershell
npm run lint
npx tsc --noEmit
npm run build
cd backend
mvn test
```

Os testes Java sobem PostgreSQL nativo temporário via Zonky (dependência somente de teste), executam Flyway e exercitam o conversor real. Não usam H2 e não exigem Docker. O primeiro uso baixa binários para o cache local.

`backend/src/test/java/com/tesoob/store/PreviewServer.java` permite QA ponta a ponta com banco descartável, produtos identificados `[DEMO]` e chave efêmera. É excluído do JAR de produção. Para reproduzir:

```powershell
# Dentro de backend. Configure STORE_PREVIEW_PASSWORD no ambiente apenas de testes,
# com senha temporária de 12+ caracteres, se quiser testar o admin.
mvn test-compile dependency:build-classpath "-Dmdep.outputFile=target/test-classpath.txt" "-DincludeScope=test"
$storeTestClasspath = 'target/test-classes;target/classes;' + (Get-Content -Raw target/test-classpath.txt).Trim()
java -cp $storeTestClasspath com.tesoob.store.PreviewServer
```

Não execute junto de outro backend na porta 8080. O preview restringe acesso a loopback; se configurado, admin é `admin@preview.test` com a senha temporária fornecida no ambiente. Não use informações pessoais reais. Encerre com Ctrl+C: o servidor fecha o banco temporário. Não há persistência garantida para esse preview.

Com o preview e o Vite já ativos, em outro terminal na raiz `site`:

```powershell
$env:STORE_TEST_ORIGIN = 'http://localhost:3000'
$env:STORE_CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
# STORE_PREVIEW_PASSWORD deve ser a mesma definida para o PreviewServer.
npm run test:store
```

Os testes Playwright criam contas e produtos exclusivamente no preview indicado. Não aponte para produção. Screenshots e traces ficam em `test-results/`, ignorado pelo Git; contêm dados sintéticos de checkout. O teste cobre a regra de observação, cadastro/login, checkout sem cobrança, isolamento da área administrativa e CRUD. Resultados efetivamente executados estão em `storefront-qa.md`.

### Referências técnicas

- [Spring Security: persistência explícita do contexto de sessão](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html).
- [Google OpenID Connect: identificação por subject e claims](https://developers.google.com/identity/openid-connect/openid-connect).
- [OWASP: criptografia autenticada e gerenciamento de chaves](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).
- [PostgreSQL temporário nativo para testes](https://github.com/zonkyio/embedded-postgres).
