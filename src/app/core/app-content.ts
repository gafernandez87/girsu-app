import { GameItem, GameStage, LeaderboardEntry, UserProfile } from './app.models';
import { GAME_ONE_ITEMS } from './game-1-products';

type IndustrialItemCategory = 'plastico' | 'papel-carton' | 'vidrio' | 'metal' | 'descarte';

const INDUSTRIAL_ITEM_DETAILS: Record<IndustrialItemCategory, string> = {
  plastico: 'Material plastico recuperable en planta.',
  'papel-carton': 'Papel o carton recuperable si esta limpio y seco.',
  vidrio: 'Vidrio recuperable en circuito industrial.',
  metal: 'Metal valorizable en planta.',
  descarte: 'Material que no debe mezclarse con reciclables secos.',
};

function industrialItemCategory(item: GameItem): IndustrialItemCategory {
  const id = item.id;

  if (id.startsWith('no-reciclables-')) {
    return 'descarte';
  }

  if (id.includes('vidrio')) {
    return 'vidrio';
  }

  if (id.includes('lata')) {
    return 'metal';
  }

  if (
    id.includes('carton') ||
    id.includes('diario') ||
    id.includes('papel') ||
    id.includes('revista') ||
    id.includes('tetra') ||
    id.includes('tubo-de-carton')
  ) {
    return 'papel-carton';
  }

  if (
    id.includes('plastico') ||
    id.includes('pet') ||
    id.includes('bidon') ||
    id.includes('bolsa') ||
    id.includes('detergente') ||
    id.includes('pomo') ||
    id.includes('sachet') ||
    id.includes('shampoo') ||
    id.includes('tapitas') ||
    id.includes('telgopor')
  ) {
    return 'plastico';
  }

  return 'descarte';
}

const INDUSTRIAL_ITEMS: readonly GameItem[] = GAME_ONE_ITEMS.filter(
  (item) => item.category !== 'compostables',
).map((item) => {
  const category = industrialItemCategory(item);

  return {
    ...item,
    category,
    detail: INDUSTRIAL_ITEM_DETAILS[category],
  };
});

export const CURRENT_USER: UserProfile = {
  id: 'demo-user',
  name: 'Sofia',
  role: 'student',
  school: 'Escuela Ambiental Jujuy',
  course: '6to grado',
};

export const GAME_STAGES: readonly GameStage[] = [
  {
    id: 'separacion-origen',
    order: 1,
    title: 'Separacion en origen',
    shortTitle: 'Hogar',
    subtitle: 'Clasificar residuos desde la cocina',
    objective: 'Promover el habito primario de separar residuos en el nucleo familiar.',
    environment:
      'Cocina familiar con tonos calidos, luz natural y referencias visuales al paisaje andino.',
    introText:
      'En este juego vas a separar residuos del hogar en el cesto correcto para aprender que materiales se reciclan, cuales van al resto y cuales pueden compostarse.',
    mechanic:
      'Arrastrar cada residuo domestico al cesto correcto: reciclables, no reciclables o compostables.',
    scoring:
      'Cada acierto suma puntos inmediatos y el tiempo restante agrega una bonificacion final.',
    kind: 'sorting',
    durationSeconds: 70,
    accentColor: '#2f7d57',
    backgroundColor: '#f3dfc1',
    dropZones: [
      {
        id: 'reciclables',
        label: 'Reciclables',
        shortLabel: 'Reciclables',
        color: '#2f8f4e',
        description: 'Plastico, papel, carton, metal y vidrio limpio.',
      },
      {
        id: 'compostables',
        label: 'Compostables',
        shortLabel: 'Compostables',
        color: '#8a5a26',
        description: 'Residuos vegetales para degradacion biologica.',
      },
      {
        id: 'no-reciclables',
        label: 'No reciclables',
        shortLabel: 'No reciclables',
        color: '#000000',
        description: 'Materiales sin valorizacion actual.',
      },
    ],
    items: GAME_ONE_ITEMS,
  },
  {
    id: 'valorizacion-industrial',
    order: 2,
    title: 'Valorizacion industrial',
    shortTitle: 'Planta',
    subtitle: 'Separar materiales en cinta',
    objective:
      'Visibilizar el trabajo de recuperadores urbanos y la clasificacion tecnica por material.',
    environment:
      'Planta urbana limpia, luminosa y techada, con cinta transportadora y cerros al fondo.',
    introText:
      'En este juego vas a clasificar materiales secos en una planta de valorizacion para sostener el flujo de reciclaje y evitar que el descarte contamine la cinta.',
    mechanic: 'Clasificar residuos secos en plastico, papel/carton, vidrio, metal o descarte.',
    scoring:
      'Los aciertos sostienen el flujo de la planta; los errores representan mezcla inadecuada.',
    kind: 'conveyor',
    durationSeconds: 200,
    accentColor: '#246a73',
    backgroundColor: '#dcecef',
    dropZones: [
      {
        id: 'plastico',
        label: 'Plastico',
        shortLabel: 'Azul',
        color: '#2f80ed',
        description: 'Botellas PET, envases y contenedores limpios.',
      },
      {
        id: 'papel-carton',
        label: 'Papel y carton',
        shortLabel: 'Amarillo',
        color: '#d99b21',
        description: 'Cajas, diarios, revistas y carpetas.',
      },
      {
        id: 'vidrio',
        label: 'Vidrio',
        shortLabel: 'Verde',
        color: '#3a9152',
        description: 'Frascos, botellas y envases de conserva.',
      },
      {
        id: 'metal',
        label: 'Metal',
        shortLabel: 'Rojo',
        color: '#c44536',
        description: 'Latas de aluminio, hojalata y ferrosos pequeños.',
      },
      {
        id: 'descarte',
        label: 'Descarte',
        shortLabel: 'Compuerta',
        color: '#4f5963',
        description: 'Residuos no valorizables que no deben contaminar la cinta.',
      },
    ],
    items: INDUSTRIAL_ITEMS,
  },
  {
    id: 'compostaje-domiciliario',
    order: 3,
    title: 'Compostaje domiciliario',
    shortTitle: 'Compost',
    subtitle: 'Balancear verdes y marrones',
    objective:
      'Introducir la economia circular biologica mediante compostaje hogareño y balance de nutrientes.',
    environment:
      'Patio jujeño con suelo arcilloso, plantas regionales, cerros de fondo y compostera central.',
    introText:
      'En este juego vas a armar una compostera equilibrando materiales verdes humedos y marrones secos para transformar restos organicos en abono.',
    mechanic:
      'Alternar materiales verdes humedos y marrones secos para mantener el equilibrio de humedad.',
    scoring:
      'Cada capa correcta suma puntos y el equilibrio final desbloquea el abono para el jardin.',
    kind: 'compost',
    durationSeconds: 90,
    accentColor: '#8a5a26',
    backgroundColor: '#e7d5bd',
    dropZones: [
      {
        id: 'verdes',
        label: 'Verdes humedos',
        shortLabel: 'Nitrogeno',
        color: '#4f8f46',
        description: 'Cascaras, verduras, yerba y saquitos de te.',
      },
      {
        id: 'marrones',
        label: 'Marrones secos',
        shortLabel: 'Carbono',
        color: '#9c6b3d',
        description: 'Hojas secas, ramas, cesped seco y carton sin tinta.',
      },
    ],
    items: [
      {
        id: 'restos-verdura',
        label: 'Verduras',
        symbol: 'VER',
        category: 'verdes',
        detail: 'Aporta humedad y nitrogeno.',
        points: 120,
      },
      {
        id: 'cascaras-fruta',
        label: 'Cascaras',
        symbol: 'FRU',
        category: 'verdes',
        detail: 'Restos de fruta para nitrogeno.',
        points: 120,
      },
      {
        id: 'hojas-lechuga',
        label: 'Lechuga',
        symbol: 'LEC',
        category: 'verdes',
        detail: 'Hoja vegetal humeda.',
        points: 115,
      },
      {
        id: 'yerba-compost',
        label: 'Yerba',
        symbol: 'YRB',
        category: 'verdes',
        detail: 'Material verde humedo.',
        points: 120,
      },
      {
        id: 'te',
        label: 'Saquito te',
        symbol: 'TE',
        category: 'verdes',
        detail: 'Organico compostable.',
        points: 110,
      },
      {
        id: 'hojas-secas',
        label: 'Hojas secas',
        symbol: 'HOJ',
        category: 'marrones',
        detail: 'Aporta estructura y carbono.',
        points: 130,
      },
      {
        id: 'ramas',
        label: 'Ramas',
        symbol: 'RAM',
        category: 'marrones',
        detail: 'Material seco del jardin.',
        points: 130,
      },
      {
        id: 'cesped-seco',
        label: 'Cesped seco',
        symbol: 'CES',
        category: 'marrones',
        detail: 'Fibra seca para airear la mezcla.',
        points: 120,
      },
      {
        id: 'carton-sin-tinta',
        label: 'Carton limpio',
        symbol: 'CAR',
        category: 'marrones',
        detail: 'Carbono sin tinta.',
        points: 110,
      },
      {
        id: 'carton-trocitos',
        label: 'Carton trozado',
        symbol: 'CTZ',
        category: 'marrones',
        detail: 'Pedacitos de carton sin tinta.',
        points: 115,
      },
    ],
  },
  {
    id: 'relleno-sanitario',
    order: 4,
    title: 'Relleno sanitario',
    shortTitle: 'Relleno',
    subtitle: 'Compactar sin desperdiciar espacio',
    objective:
      'Mostrar la complejidad de la ingenieria sanitaria y la importancia de reducir residuos desde el hogar.',
    environment:
      'Fosa impermeabilizada con geomembrana, grua hidraulica y cerros jujeños al atardecer.',
    introText:
      'En este juego vas a ubicar bolsas en una fosa sanitaria intentando compactar bien, evitar huecos y cuidar la vida util del relleno.',
    mechanic:
      'Ubicar bolsas de residuos en la fosa con criterio de encastre para evitar huecos y colapso.',
    scoring:
      'La buena compactacion suma puntos y sostener la vida util de la fosa agrega bonificacion.',
    kind: 'landfill',
    durationSeconds: 80,
    accentColor: '#7251a3',
    backgroundColor: '#e2d6f0',
    dropZones: [
      {
        id: 'fosa-compacta',
        label: 'Fosa compacta',
        shortLabel: 'Compactar',
        color: '#7251a3',
        description: 'Ubicacion eficiente dentro de la fosa impermeabilizada.',
      },
      {
        id: 'zona-riesgo',
        label: 'Huecos vacios',
        shortLabel: 'Riesgo',
        color: '#a4503f',
        description: 'Espacios desordenados que reducen la vida util.',
      },
    ],
    items: [
      {
        id: 'bolsa-1',
        label: 'Bolsa chica',
        symbol: 'B1',
        category: 'fosa-compacta',
        detail: 'Debe encastrarse cerca del fondo.',
        points: 120,
      },
      {
        id: 'bolsa-2',
        label: 'Bolsa larga',
        symbol: 'B2',
        category: 'fosa-compacta',
        detail: 'Conviene ubicarla alineada.',
        points: 130,
      },
      {
        id: 'bolsa-3',
        label: 'Bolsa media',
        symbol: 'B3',
        category: 'fosa-compacta',
        detail: 'Debe evitar huecos.',
        points: 120,
      },
      {
        id: 'bolsa-4',
        label: 'Bolsa pesada',
        symbol: 'B4',
        category: 'fosa-compacta',
        detail: 'Aporta estabilidad si se ubica abajo.',
        points: 140,
      },
    ],
  },
];

export const MOCK_LEADERBOARD: readonly LeaderboardEntry[] = [
  {
    position: 1,
    name: 'Camila',
    school: 'Esc. N 12 San Salvador',
    score: 3920,
  },
  {
    position: 2,
    name: 'Mateo',
    school: 'Colegio Secundario Purmamarca',
    score: 3640,
  },
  {
    position: 3,
    name: CURRENT_USER.name,
    school: CURRENT_USER.school,
    score: 0,
    isCurrentUser: true,
  },
  {
    position: 4,
    name: 'Lucia',
    school: 'Esc. Rural Tilcara',
    score: 2780,
  },
];

export function findStageById(stageId: string | null): GameStage {
  return GAME_STAGES.find((stage) => stage.id === stageId) ?? GAME_STAGES[0];
}
