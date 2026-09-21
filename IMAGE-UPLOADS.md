# Fotos da vitrine por arquivo

O administrador usa **Foto da peça → Escolher arquivo** ao criar/editar produtos.
JPG, PNG e WebP de até 10 MB são aceitos. A foto aparece em prévia e só é enviada
ao salvar. Na edição, não selecionar arquivo mantém a foto atual. URLs antigas
continuam funcionando; o campo de URL não é mais exposto no formulário.

## Armazenamento

- R2 privado: bucket `tesoob-media`, binding `STORE_IMAGES` em `wrangler.jsonc`.
- O bucket foi criado com autorização; não precisa habilitar domínio público R2.
- O Pages precisa ser republicado com essa configuração para receber a binding.
- Sem binding, upload responde 503; não salva imagem em D1 ou no disco temporário.
- Sem mudanças nas tabelas: `store_products.image_url` guarda o caminho público
  `/store-api/images/<sha256>.webp`, servido pelo Worker.
- Não publique documentos privados: as fotos enviadas são acessíveis por seu URL,
  inclusive antes de associar o arquivo a um produto e após arquivar uma peça.

## Validação e proteção

- Upload: `POST /store-api/admin/images`, sessão administrativa, Origin/CSRF e
  limite de 20 tentativas por IP/minuto, antes da leitura do corpo.
- O navegador decodifica e converte a foto em WebP, até 2400 px por lado, removendo
  EXIF/localização. Não preserva animação. Fonte limitada a 40 megapixels.
- Backend limita o corpo real a 5 MB mesmo sem Content-Length, verifica tipo,
  container WebP, dimensões e ausência de EXIF/XMP/animação. Não é um antivírus
  ou decodificador completo de imagens; apenas admins confiáveis podem enviar.
- O nome é derivado do conteúdo, sem o nome original do arquivo. Retentativas do
  mesmo conteúdo usam o mesmo objeto. O formulário reutiliza upload bem-sucedido
  se o salvamento do produto falhar, sem obrigar nova seleção.
- Imagens públicas são servidas com `image/webp`, `nosniff`, CSP restritiva, ETag
  e cache imutável. Nenhuma rota lista objetos ou aceita nomes arbitrários.
- Salvar um produto com caminho de upload verifica que o objeto existe no R2.
- Fotos anteriores não são removidas automaticamente: podem ser compartilhadas
  ou referenciadas. Uploads abandonados ficam no bucket; uma futura limpeza deve
  verificar referências antes de remover objetos. Há custos conforme uso/plano.

## Testes locais (sem produção)

```powershell
npm run build:pages
npm run preview:pages -- --port 4191 --persist-to .wrangler/upload-tests
```

Em outro terminal dentro de `site`:

```powershell
$env:STORE_TEST_ORIGIN='http://127.0.0.1:4191'
$env:STORE_UPLOAD_TEST='1'
$env:STORE_CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
npx playwright test tests/store/image-upload.spec.ts tests/store/admin-workspace.spec.ts
```

A integração usa D1 e R2 locais e uma sessão sintética no estado isolado
`.wrangler/upload-tests`. Não usa credenciais reais nem dados de produção.

Referências: [Pages R2 bindings](https://developers.cloudflare.com/pages/functions/bindings/),
[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
