import manifest from '@/public/media/media-manifest.json';

export const photos = manifest.images;
export const videos = manifest.videos;
export type Photo = (typeof photos)[number];
export type Video = (typeof videos)[number];
export function photo(id: string): Photo {
  const item = photos.find((entry) => entry.id === id);
  if (!item) throw new Error(`Foto não encontrada: ${id}`);
  return item;
}
export function video(id: string): Video {
  const item = videos.find((entry) => entry.id === id);
  if (!item) throw new Error(`Vídeo não encontrado: ${id}`);
  return item;
}
export const looks = [
  {
    slug: 'vermelho-amarracoes',
    ref: '01',
    title: 'Vermelho. Sem rodeios.',
    name: 'Look vermelho com amarrações',
    color: 'red',
    cover: 'editorial-06',
    alternate: 'editorial-08',
    images: ['editorial-06', 'editorial-08', 'editorial-03', 'editorial-11'],
    details: [
      'Amarrações aparentes',
      'Ilhoses e recortes',
      'Vermelho em destaque',
    ],
    description:
      'Amarrações que desenham o look. O vermelho encontra ilhoses, recortes e uma presença que ocupa a cena.',
    videoIds: ['editorial-filme'],
  },
  {
    slug: 'verde-ferragens',
    ref: '02',
    title: 'Verde. Fora do padrão.',
    name: 'Look verde com ferragens',
    color: 'green',
    cover: 'editorial-05',
    alternate: 'editorial-09',
    images: [
      'editorial-05',
      'editorial-09',
      'editorial-10',
      'editorial-07',
      'editorial-01',
    ],
    details: [
      'Fivelas e ferragens',
      'Recortes e bordas aparentes',
      'Verde militar',
    ],
    description:
      'O verde militar encontra cintos, ferragens e recortes. Detalhes que dão outra leitura a cada ângulo.',
    videoIds: ['editorial-filme'],
  },
  {
    slug: 'jeans-camadas',
    ref: '03',
    title: 'Camadas de expressão.',
    name: 'Look em jeans claro e roxo',
    color: 'denim',
    cover: 'processo-04',
    alternate: 'processo-02',
    images: ['processo-04', 'processo-02', 'processo-01', 'processo-03'],
    details: [
      'Jeans claro e roxo',
      'Camadas e recortes',
      'Aplicações brilhantes',
    ],
    description:
      'Jeans claro, tons roxos e aplicações. Camadas que se encontram entre os recortes e os detalhes da peça.',
    videoIds: ['jeans-detalhes', 'jeans-movimento', 'jeans-aplicacoes'],
  },
];
export type Look = (typeof looks)[number];
export function findLook(slug: string) {
  return looks.find((item) => item.slug === slug);
}
export const editorialPhotos = [
  'editorial-04',
  'editorial-07',
  'editorial-11',
  'editorial-02',
  'editorial-08',
  'editorial-10',
  'placa',
  'processo-02',
  'editorial-01',
  'editorial-03',
  'editorial-05',
  'editorial-06',
  'editorial-09',
  'processo-01',
  'processo-03',
  'processo-04',
].map(photo);
