import type { GameItem } from './app.models';

export type GameOneProductCategory = 'compostables' | 'reciclables' | 'no-reciclables';

export interface GameOneProduct {
  readonly id: string;
  readonly label: string;
  readonly category: GameOneProductCategory;
  readonly path: string;
}

const HOME_CATEGORY_DETAILS: Record<
  GameOneProductCategory,
  Pick<GameItem, 'detail' | 'points' | 'symbol'>
> = {
  compostables: {
    detail: 'Residuo organico compostable.',
    points: 130,
    symbol: 'ORG',
  },
  reciclables: {
    detail: 'Material recuperable si esta limpio y seco.',
    points: 120,
    symbol: 'REC',
  },
  'no-reciclables': {
    detail: 'Residuo que va al cesto de resto.',
    points: 100,
    symbol: 'RES',
  },
};

export const GAME_ONE_PRODUCTS: readonly GameOneProduct[] = [
  {
    id: 'compostables-cabito-de-manzana',
    label: 'cabito de manzana',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-cabito-de-manzana.png',
  },
  {
    id: 'compostables-cafe-molido',
    label: 'Cafe molido',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-cafe-molido.png',
  },
  {
    id: 'compostables-cascara-banana',
    label: 'cascara banana',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-cascara-banana.png',
  },
  {
    id: 'compostables-cascara-de-huevo',
    label: 'Cascara de huevo',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-cascara-de-huevo.png',
  },
  {
    id: 'compostables-cascara-naranja',
    label: 'cascara naranja',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-cascara-naranja.png',
  },
  {
    id: 'compostables-cesped-cortado',
    label: 'Cesped cortado',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-cesped-cortado.png',
  },
  {
    id: 'compostables-flores-marchitas',
    label: 'Flores marchitas',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-flores-marchitas.png',
  },
  {
    id: 'compostables-hojas-secas',
    label: 'Hojas secas',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-hojas-secas.png',
  },
  {
    id: 'compostables-ramas-pequenas',
    label: 'Ramas pequenas',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-ramas-pequenas.png',
  },
  {
    id: 'compostables-resto-de-sandia',
    label: 'resto de sandia',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-resto-de-sandia.png',
  },
  {
    id: 'compostables-restos-de-verduras',
    label: 'Restos de verduras',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-restos-de-verduras.png',
  },
  {
    id: 'compostables-saquitos-de-te',
    label: 'Saquitos de te',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-saquitos-de-te.png',
  },
  {
    id: 'compostables-yerba-mate-usada',
    label: 'Yerba mate usada',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/compostables-yerba-mate-usada.png',
  },
  {
    id: 'reciclables-bidon-plastico-limpio',
    label: 'Bidon plastico limpio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-bidon-plastico-limpio.png',
  },
  {
    id: 'reciclables-bolsa-de-plastico-compras',
    label: 'Bolsa de plastico',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-bolsa-de-plastico-compras.png',
  },
  {
    id: 'reciclables-botella-de-plastico-pet',
    label: 'Botella de plastico PET',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-botella-de-plastico-pet.png',
  },
  {
    id: 'reciclables-botella-de-shampoo',
    label: 'Botella de shampoo',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-botella-de-shampoo.png',
  },
  {
    id: 'reciclables-botella-de-vidrio',
    label: 'Botella de vidrio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-botella-de-vidrio.png',
  },
  {
    id: 'reciclables-caja-de-carton',
    label: 'Caja de carton',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-caja-de-carton.png',
  },
  {
    id: 'reciclables-carton-de-embalaje',
    label: 'Carton de embalaje',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-carton-de-embalaje.png',
  },
  {
    id: 'reciclables-diario',
    label: 'Diario',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-diario.png',
  },
  {
    id: 'reciclables-envase-de-detergente',
    label: 'Envase de detergente',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-envase-de-detergente.png',
  },
  {
    id: 'reciclables-frasco-de-vidrio',
    label: 'Frasco de vidrio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-frasco-de-vidrio.png',
  },
  {
    id: 'reciclables-lata-de-conserva',
    label: 'Lata de conserva',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-lata-de-conserva.png',
  },
  {
    id: 'reciclables-lata-de-gaseosa',
    label: 'Lata de gaseosa',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-lata-de-gaseosa.png',
  },
  {
    id: 'reciclables-papel-de-oficina-limpio',
    label: 'Papel de oficina limpio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-papel-de-oficina-limpio.png',
  },
  {
    id: 'reciclables-pomo',
    label: 'pomo',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-pomo.png',
  },
  {
    id: 'reciclables-pote-de-helado-telgopor',
    label: 'Pote de helado telgopor',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-pote-de-helado-telgopor.png',
  },
  {
    id: 'reciclables-revista',
    label: 'Revista',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-revista.png',
  },
  {
    id: 'reciclables-sachet',
    label: 'Sachet',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-sachet.png',
  },
  {
    id: 'reciclables-tapitas-plasticas',
    label: 'Tapitas plasticas',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-tapitas-plasticas.png',
  },
  {
    id: 'reciclables-tetra',
    label: 'tetra',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-tetra.png',
  },
  {
    id: 'reciclables-tubo-de-carton',
    label: 'Tubo de carton',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/reciclables-tubo-de-carton.png',
  },
  {
    id: 'no-reciclables-barbijo-descartable',
    label: 'Barbijo descartable',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-barbijo-descartable.png',
  },
  {
    id: 'no-reciclables-blister-de-remedio',
    label: 'blister de remedio',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-blister-de-remedio.png',
  },
  {
    id: 'no-reciclables-caja-pizza-muy-sucia',
    label: 'caja pizza muy sucia',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-caja-pizza-muy-sucia.png',
  },
  {
    id: 'no-reciclables-cepillo-de-dientes-de-plastico',
    label: 'Cepillo de dientes de plastico',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-cepillo-de-dientes-de-plastico.png',
  },
  {
    id: 'no-reciclables-ceramica-rota',
    label: 'Ceramica rota',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-ceramica-rota.png',
  },
  {
    id: 'no-reciclables-colilla-de-cigarrillo',
    label: 'Colilla de cigarrillo',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-colilla-de-cigarrillo.png',
  },
  {
    id: 'no-reciclables-curitas',
    label: 'curitas',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-curitas.png',
  },
  {
    id: 'no-reciclables-envase-de-telgopor-sucio',
    label: 'Envase de telgopor sucio',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-envase-de-telgopor-sucio.png',
  },
  {
    id: 'no-reciclables-esponja-de-cocina',
    label: 'Esponja de cocina',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-esponja-de-cocina.png',
  },
  {
    id: 'no-reciclables-globos',
    label: 'globos',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-globos.png',
  },
  {
    id: 'no-reciclables-guantes-descartables',
    label: 'Guantes descartables',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-guantes-descartables.png',
  },
  {
    id: 'no-reciclables-hisopos',
    label: 'hisopos',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-hisopos.png',
  },
  {
    id: 'no-reciclables-panal-descartable',
    label: 'Panal descartable',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-panal-descartable.png',
  },
  {
    id: 'no-reciclables-papel-de-golosinas',
    label: 'Papel de golosinas',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-papel-de-golosinas.png',
  },
  {
    id: 'no-reciclables-papel-higienico-usado',
    label: 'Papel higienico usado',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-papel-higienico-usado.png',
  },
  {
    id: 'no-reciclables-papel-plastificado',
    label: 'Papel plastificado',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-papel-plastificado.png',
  },
  {
    id: 'no-reciclables-paquete-de-fideo',
    label: 'paquete de fideo',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-paquete-de-fideo.png',
  },
  {
    id: 'no-reciclables-servilleta-sucia-con-grasa',
    label: 'Servilleta sucia con grasa',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no-reciclables/no-reciclables-servilleta-sucia-con-grasa.png',
  },
];

function formatProductLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export const GAME_ONE_ITEMS: readonly GameItem[] = GAME_ONE_PRODUCTS.map(
  ({ id, label, category }) => ({
    id,
    label: formatProductLabel(label),
    category,
    detail: HOME_CATEGORY_DETAILS[category].detail,
    points: HOME_CATEGORY_DETAILS[category].points,
    symbol: HOME_CATEGORY_DETAILS[category].symbol,
  }),
);
