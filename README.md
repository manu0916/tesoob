# Tesoob

Site editorial com fotografias reais, três referências de looks, galeria completa, bastidores, vídeos sob demanda e consultas de encomenda.

## Desenvolvimento

Dentro desta pasta, execute `npm install` e `npm run dev`. A prévia de desenvolvimento usa http://localhost:3000 e atualiza com as alterações. `npm run build` gera o Worker e os arquivos estáticos em `dist/`.

## Contato e conteúdo

- `lib/site-config.ts`: configure `whatsappNumber` com o número verdadeiro, somente dígitos, incluindo país e DDD. Está `null` porque o número não foi fornecido. Nesse estado os links levam ao Instagram com rótulo correto; as páginas de referência permitem copiar o texto da consulta. Informar um telefone válido ativa os links do WhatsApp, com mensagens contextualizadas. Reinicie ou publique uma nova versão após modificar a configuração.
- `lib/site-config.ts`: `publicOrigin` contém a origem real fornecida por Sites. Ela é usada em metadados e links de referência nas mensagens; caminhos locais não são enviados.
- `lib/catalog.ts`: nomes descritivos, agrupamento, textos e fotos das três referências. São referências para consulta, sem afirmação de disponibilidade ou venda do look como conjunto.
- `components/tesoob.tsx`: página inicial, galeria, menu, vídeos e página de referência.
- `app/globals.css`: cores, tipografia, composição, estados responsivos e animações.

Rotas compartilháveis: `/pecas/vermelho-amarracoes`, `/pecas/verde-ferragens` e `/pecas/jeans-camadas`.

## Mídias

`public/media/media-manifest.json` relaciona os 22 arquivos originais do ZIP aos derivados, dimensões e textos alternativos. `details-manifest.json` registra a origem e as coordenadas dos três recortes de detalhes. Nenhuma roupa ou modelo foi gerado ou alterado por IA.

As 16 fotos estão disponíveis na galeria e no restante do site. As imagens WebP originalmente nomeadas `.jpg` foram preservadas no tamanho principal e recebem a extensão correta. Existem derivados de 480 e 800 pixels e `srcset` para otimização responsiva. As imagens de referência podem ser ampliadas sem recorte.

Os seis vídeos estão preservados com `faststart`. Os cinco vídeos principais estão acessíveis por reprodução voluntária; o clipe de menos de um segundo fica no acervo e possui pôster. Vídeos começam sem som após clique, têm controles e pausam ao sair da tela. As fotografias e o texto tornam o site compreensível sem depender do áudio.

O logo foi extraído fielmente do quadro de 54 segundos do reel original. A imagem de compartilhamento usa a fotografia real. Fontes Barlow Condensed e Manrope são servidas localmente; licenças OFL estão em `public/fonts/`.

## Verificação

- `npm run lint` e `npm exec -- tsc --noEmit` verificam o código.
- `npm run build` verifica a compilação de publicação.
- A revisão no navegador cobriu larguras de 320, 360, 390, 768 e 1440 px, galerias com 16 fotos, setas/Escape e devolução de foco, abas de detalhes, navegação móvel, rotas diretas, campos opcionais, redução de movimento e pausa dos vídeos fora da tela.
- Sem erros de execução ou arquivos HTTP ausentes durante os fluxos conferidos.
- O envio ao WhatsApp real depende do telefone correto e permanece pendente. Nenhum botão confirma pedido ou envia mensagem automaticamente.

O repositório de Sites e `.openai/hosting.json` identificam a prévia privada. Não há banco de dados, cadastro, checkout ou coleta de dados no servidor.
