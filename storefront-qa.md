# Verificação da vitrine — 20/09/2026

## Ambiente e escopo

- Windows, Java 21, Spring Boot 3.5.16, PostgreSQL 17.10 nativo temporário.
- Frontend React/Vinext local em `http://127.0.0.1:4175`, backend loopback em 8080.
- Chrome real automatizado por Playwright, sem mock de API nos fluxos de compra/admin.
- Dados sintéticos: contas `example.test`/`preview.test`, produtos `[DEMO]`, CPF de teste, preços ilustrativos. Nada foi publicado ou cobrado.

## Resultados

- `npm run build`: passou; inclui as novas rotas e gateway `/store-api/:path+`.
- `npx tsc --noEmit` e `npm run lint`: passaram na validação final.
- `mvn test`: reexecução final passou em 7 testes, 0 falhas/erros/skips, com PostgreSQL real.
- Playwright: 3 cenários passaram na reexecução final: cadastro/login/checkout, CRUD administrativo e CTA/menu móvel.

## Segurança exercitada pelo backend

- CRUD anônimo e de cliente bloqueados; mutação sem CSRF bloqueada.
- Cadastro não aceita `role`; senha persistida como BCrypt e login conserva contexto na sessão.
- Observação branca vira `NULL`; edição concorrente retorna conflito; arquivamento exclui produto público.
- Conversor JPA real persiste ciphertext no PostgreSQL, sem CPF/endereço legíveis.
- AES-GCM usa nonces distintos, rejeita adulteração e aceita keyring para rotação.
- Checkout usa preço do servidor, rejeita preço injetado/CPF inválido/versão antiga.
- Reenvio idempotente mantém um pedido; reutilizar chave com payload diferente conflita.
- Outro usuário não acessa o pedido; Flyway aplica e valida a migração real.

## UI e fluxos

- Identidade existente preservada: logo e imagens reais, fundo quase preto, fontes locais condensada/editorial e cor de destaque quente.
- Vitrine com colunas assimétricas, deslocamento vertical e produto largo; mobile reorganiza em uma coluna.
- Formulários usam superfícies translúcidas, bordas discretas e foco visível; checkout móvel apresenta resumo antes do formulário.
- Observações ausentes não geram elemento, label ou margem em card/detalhe; mesma função é usada no resumo.
- Nenhum dado de cartão solicitado. Confirmação informa explicitamente ausência de cobrança.
- Teste de overflow em 390 px passou. Evidências em `test-results/store-desktop.png`, `store-mobile.png` e `checkout-mobile.png`.
- Peças, Editorial, Processo e Encomendar: botões testados com fechamento do diálogo, URL correta e seção de destino posicionada. Fechar menu e Visitar a vitrine também passaram. Captura em `test-results/store-menu-mobile.png`.
- Inspeção visual direta das capturas estabilizadas em 1280 px e 390 px: imagens carregadas, texto legível, resumo e formulário sem sobreposição, observação presente apenas na peça verde. A captura final não usa placeholders nem produtos de QA abandonados.

## Ajustes encontrados durante a verificação

- Corrigida a tipagem do corpo do proxy compatível com Cloudflare e TypeScript.
- Nome acessível explícito nos seletores de estado/quantidade.
- Testes aguardam carregamento real de imagens lazy, removem foco transitório e desabilitam animação apenas na captura. Screenshots anteriores à estabilização não foram usados como prova visual final.
- Arquivado um produto sintético deixado por execução interrompida, somente no banco descartável; nenhum produto real foi removido.
- Uma rodada concorrente excedeu o timeout de 60 segundos. Encerrado o preview duplicado antigo e usado limite de 120 segundos para os fluxos completos com capturas; a execução final passou. Um lint em andamento encontrou um helper temporário que acabava de ser removido; a execução limpa seguinte passou.

## Limites de validação

- Google: implementação OIDC presente, mas autenticação real exige client ID/secret e callback; não validada com conta Google.
- Mercado Pago: somente preparação, sem integração/chamada/cobrança real, conforme escopo.
- Docker/Compose e gateway Worker em produção: código/compilação disponíveis, mas publicação não executada. Navegador local usa proxy Vite.
- Sem auditoria de segurança externa, teste de carga, verificação de estoque/frete ou alegação de prontidão irrestrita para produção.
- O atendimento D1 antigo não foi migrado para PostgreSQL e continua separado.

Resultado: implementação local e fluxos acima aprovados; integrações externas/publicação permanecem limitadas conforme descrito.
