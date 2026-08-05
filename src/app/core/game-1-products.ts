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
    path: '/assets/game-1/products/compostables/cabito%20de%20manzana.png',
  },
  {
    id: 'compostables-cafe-molido',
    label: 'Cafe molido',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Caf%C3%A9%20molido.png',
  },
  {
    id: 'compostables-cascara-banana',
    label: 'cascara banana',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/cascara%20banana.png',
  },
  {
    id: 'compostables-cascara-de-huevo',
    label: 'Cascara de huevo',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/C%C3%A1scara%20de%20huevo.png',
  },
  {
    id: 'compostables-cascara-naranja',
    label: 'cascara naranja',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/cascara%20naranja.png',
  },
  {
    id: 'compostables-cesped-cortado',
    label: 'Cesped cortado',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/C%C3%A9sped%20cortado.png',
  },
  {
    id: 'compostables-flores-marchitas',
    label: 'Flores marchitas',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Flores%20marchitas.png',
  },
  {
    id: 'compostables-hojas-secas',
    label: 'Hojas secas',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Hojas%20secas.png',
  },
  {
    id: 'compostables-ramas-pequenas',
    label: 'Ramas pequenas',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Ramas%20peque%C3%B1as.png',
  },
  {
    id: 'compostables-resto-de-sandia',
    label: 'resto de sandia',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/resto%20de%20sand%C3%ADa.png',
  },
  {
    id: 'compostables-restos-de-verduras',
    label: 'Restos de verduras',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Restos%20de%20verduras.png',
  },
  {
    id: 'compostables-saquitos-de-te',
    label: 'Saquitos de te',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Saquitos%20de%20t%C3%A9.png',
  },
  {
    id: 'compostables-yerba-mate-usada',
    label: 'Yerba mate usada',
    category: 'compostables',
    path: '/assets/game-1/products/compostables/Yerba%20mate%20usada.png',
  },
  {
    id: 'reciclables-bidon-plastico-limpio',
    label: 'Bidon plastico limpio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Bid%C3%B3n%20pl%C3%A1stico%20limpio.png',
  },
  {
    id: 'reciclables-bolsa-de-plastico-compras',
    label: 'Bolsa de plastico',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Bolsa%20de%20pl%C3%A1stico%20compras.png',
  },
  {
    id: 'reciclables-botella-de-plastico-pet',
    label: 'Botella de plastico PET',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Botella%20de%20pl%C3%A1stico%20PET.png',
  },
  {
    id: 'reciclables-botella-de-shampoo',
    label: 'Botella de shampoo',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Botella%20de%20shampoo.png',
  },
  {
    id: 'reciclables-botella-de-vidrio',
    label: 'Botella de vidrio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Botella%20de%20vidrio.png',
  },
  {
    id: 'reciclables-caja-de-carton',
    label: 'Caja de carton',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Caja%20de%20cart%C3%B3n.png',
  },
  {
    id: 'reciclables-carton-de-embalaje',
    label: 'Carton de embalaje',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Cart%C3%B3n%20de%20embalaje.png',
  },
  {
    id: 'reciclables-diario',
    label: 'Diario',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Diario.png',
  },
  {
    id: 'reciclables-envase-de-detergente',
    label: 'Envase de detergente',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Envase%20de%20detergente.png',
  },
  {
    id: 'reciclables-frasco-de-vidrio',
    label: 'Frasco de vidrio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Frasco%20de%20vidrio.png',
  },
  {
    id: 'reciclables-lata-de-conserva',
    label: 'Lata de conserva',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Lata%20de%20conserva.png',
  },
  {
    id: 'reciclables-lata-de-gaseosa',
    label: 'Lata de gaseosa',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Lata%20de%20gaseosa.png',
  },
  {
    id: 'reciclables-papel-de-oficina-limpio',
    label: 'Papel de oficina limpio',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Papel%20de%20oficina%20limpio.png',
  },
  {
    id: 'reciclables-pomo',
    label: 'pomo',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/pomo.png',
  },
  {
    id: 'reciclables-pote-de-helado-telgopor',
    label: 'Pote de helado telgopor',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Pote%20de%20helado%20telgopor.png',
  },
  {
    id: 'reciclables-revista',
    label: 'Revista',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Revista.png',
  },
  {
    id: 'reciclables-sachet',
    label: 'Sachet',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Sachet.png',
  },
  {
    id: 'reciclables-tapitas-plasticas',
    label: 'Tapitas plasticas',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Tapitas%20pl%C3%A1sticas.png',
  },
  {
    id: 'reciclables-tetra',
    label: 'tetra',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/tetra.png',
  },
  {
    id: 'reciclables-tubo-de-carton',
    label: 'Tubo de carton',
    category: 'reciclables',
    path: '/assets/game-1/products/reciclables/Tubo%20de%20cart%C3%B3n.png',
  },
  {
    id: 'no-reciclables-barbijo-descartable',
    label: 'Barbijo descartable',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Barbijo%20descartable.png',
  },
  {
    id: 'no-reciclables-blister-de-remedio',
    label: 'blister de remedio',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/blister%20de%20remedio.png',
  },
  {
    id: 'no-reciclables-caja-pizza-muy-sucia',
    label: 'caja pizza muy sucia',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/caja%20pizza%20muy%20sucia.png',
  },
  {
    id: 'no-reciclables-cepillo-de-dientes-de-plastico',
    label: 'Cepillo de dientes de plastico',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Cepillo%20de%20dientes%20de%20pl%C3%A1stico.png',
  },
  {
    id: 'no-reciclables-ceramica-rota',
    label: 'Ceramica rota',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Cer%C3%A1mica%20rota.png',
  },
  {
    id: 'no-reciclables-colilla-de-cigarrillo',
    label: 'Colilla de cigarrillo',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Colilla%20de%20cigarrillo.png',
  },
  {
    id: 'no-reciclables-curitas',
    label: 'curitas',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/curitas.png',
  },
  {
    id: 'no-reciclables-envase-de-telgopor-sucio',
    label: 'Envase de telgopor sucio',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Envase%20de%20telgopor%20sucio.png',
  },
  {
    id: 'no-reciclables-esponja-de-cocina',
    label: 'Esponja de cocina',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Esponja%20de%20cocina.png',
  },
  {
    id: 'no-reciclables-globos',
    label: 'globos',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/globos.png',
  },
  {
    id: 'no-reciclables-guantes-descartables',
    label: 'Guantes descartables',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Guantes%20descartables.png',
  },
  {
    id: 'no-reciclables-hisopos',
    label: 'hisopos',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/hisopos.png',
  },
  {
    id: 'no-reciclables-panal-descartable',
    label: 'Panal descartable',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Pa%C3%B1al%20descartable.png',
  },
  {
    id: 'no-reciclables-papel-de-golosinas',
    label: 'Papel de golosinas',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Papel%20de%20golosinas.png',
  },
  {
    id: 'no-reciclables-papel-higienico-usado',
    label: 'Papel higienico usado',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Papel%20higi%C3%A9nico%20usado.png',
  },
  {
    id: 'no-reciclables-papel-plastificado',
    label: 'Papel plastificado',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Papel%20plastificado.png',
  },
  {
    id: 'no-reciclables-paquete-de-fideo',
    label: 'paquete de fideo',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/paquete%20de%20fideo.png',
  },
  {
    id: 'no-reciclables-servilleta-sucia-con-grasa',
    label: 'Servilleta sucia con grasa',
    category: 'no-reciclables',
    path: '/assets/game-1/products/no%20reciclables/Servilleta%20sucia%20con%20grasa.png',
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
