# QA — adaptação Cloudflare Pages/D1

## Verificações concluídas

- `test:store:d1`: 32 verificações aprovadas no runtime Cloudflare local, banco separado `.wrangler/store-tests`.
- Preservação: comparados todos os campos das tabelas antigas de conversas, mensagens e contas administrativas antes/depois da migração repetida e do fluxo completo. Hashes e registros permaneceram iguais.
- Login administrativo legado acessa a loja e o chat com a mesma sessão, sem copiar/trocar senhas.
- Cadastro, BCrypt 12, sessão HttpOnly, CSRF, Origin, proibição de papel público e CRUD exclusivo.
- Checkout: centavos no servidor, CPF, versão, dono, concorrência/idempotência, rejeição de preço injetado.
- Ciphertext AES no D1 sem CPF/endereço em claro; alteração do ciphertext falha com 503.
- Arquivamento preserva pedidos; Google desabilitado sem credenciais e callback inválido rejeitado.
- Playwright: 3 testes aprovados em 1 minuto (compra, CRUD, CTA/menu). Uma tentativa anterior do menu falhou durante rebuild/HMR; reexecução sem edição simultânea passou.
- TypeScript, lint e `build:pages`: aprovados.
- Smoke test do artefato final em `wrangler pages dev`: aprovado (SSR real, assets, catálogo D1, cookie CSRF, bloqueio administrativo e diálogo móvel). Não depende do proxy Vite.
- Nenhum comando remoto de migração/deploy foi executado. D1 real/local antigo não usado pelos testes.
- Leitura final do D1 local antigo: 2 conversas, 3 mensagens, 1 administrador e nenhuma tabela `store_*`; alterações de teste ficaram isoladas.

## Limites e pendências externas

- Google real depende de credenciais/callback; não validado com conta real.
- Mercado Pago não cobra nem se comunica com provedor nesta fase.
- Auditoria npm detecta alertas preexistentes de framework/dependências, detalhados em STOREFRONT.md; sem upgrade forçado.
- BCrypt em JS exige capacidade de CPU compatível, não o orçamento de 10 ms do plano gratuito.
- Arquivos Spring/PostgreSQL foram arquivados logicamente, não apagados.

## Pacote Pages

Saída `.pages-dist`; servidor protegido em `_worker.js/`; configuração `wrangler.jsonc` aponta ao D1 já existente. O script de build corrige o redirect de configuração gerado pelo plugin Vite, que originalmente apontava ao formato Workers.

Configuração Vite separada em `deploy/wrangler.vite.jsonc` evita duplicar bindings/flags da configuração Pages. A pasta gerada `.pages-dist` é ignorada pelo watcher para evitar EBUSY no Windows/OneDrive. Build e testes D1 foram repetidos com esses ajustes e passaram. Tentativas de teste antes do servidor indicar Ready falharam por conexão recusada, não por perda de dados; a execução após Ready passou nas 32 verificações.
