import { GameItem, GameStage } from './app.models';
import { GAME_ONE_ITEMS } from './game-1-products';

type IndustrialItemCategory = 'plastico' | 'papel-carton' | 'vidrio' | 'metal' | 'descarte';

const INDUSTRIAL_ITEM_DETAILS: Record<IndustrialItemCategory, string> = {
  plastico: 'Material plástico recuperable en planta.',
  'papel-carton': 'Papel o cartón recuperable si está limpio y seco.',
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

export const GAME_STAGES: readonly GameStage[] = [
  {
    id: 'separacion-origen',
    order: 1,
    title: 'Separación en origen',
    landingTitle: 'En casa',
    shortTitle: 'Hogar',
    subtitle: 'Clasificar residuos desde la cocina',
    objective: 'Promover el hábito primario de separar residuos en el núcleo familiar.',
    environment:
      '¡Demos el primer paso separando en origen!\n\nTodos los días generamos residuos, pero no todos van al mismo lugar. Algunos pueden reciclarse, otros convertirse en compost y otros deben descartarse.\n\nTu misión: Colocar cada residuo al cesto que corresponde. ¡Sumá puntos por cada acierto!',
    introText:
      'En este juego vas a clasificar residuos del hogar arrastrándolos con tu dedo hacia el cesto correcto según sean reciclables, no reciclables o compostables.',
    mechanic:
      'Arrastrar cada residuo doméstico al cesto correcto: reciclables, no reciclables o compostables.',
    scoring:
      'Cada acierto suma puntos inmediatos y el tiempo restante agrega una bonificación final.',
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
        description: 'Plástico, papel, cartón, metal y vidrio limpio.',
      },
      {
        id: 'compostables',
        label: 'Compostables',
        shortLabel: 'Compostables',
        color: '#8a5a26',
        description: 'Residuos vegetales para degradación biológica.',
      },
      {
        id: 'no-reciclables',
        label: 'No reciclables',
        shortLabel: 'No reciclables',
        color: '#000000',
        description: 'Materiales sin valorización actual.',
      },
    ],
    items: GAME_ONE_ITEMS,
  },
  {
    id: 'valorizacion-industrial',
    order: 2,
    title: 'Planta de clasificación de residuos',
    landingTitle: 'Planta de reciclaje',
    shortTitle: 'Planta',
    subtitle: 'Separar materiales en cinta',
    objective:
      'Visibilizar el trabajo de recuperadores urbanos y la clasificación técnica por material.',
    environment:
      '¡Llegó el momento de recuperar materiales!\n\nLos residuos reciclables que separamos en casa llegan a las plantas de reciclaje, donde se clasifican y preparan para recuperar sus materiales.\n\nTu misión: arrastrar los residuos que pasan por la cinta transportadora al contenedor que corresponda según el tipo de material: vidrio, plástico, metal, papel y cartón.',
    introText:
      'En este juego vas a clasificar materiales secos en una planta de reciclaje arrastrándolos con tu dedo hacia en el contenedor correcto según sean de vidrio, metal, plástico o papel y cartón',
    mechanic: 'Clasificar residuos secos en plástico, papel/cartón, vidrio, metal o descarte.',
    scoring:
      'Los aciertos sostienen el flujo de la planta; los errores representan mezcla inadecuada.',
    kind: 'conveyor',
    durationSeconds: 200,
    accentColor: '#246a73',
    backgroundColor: '#dcecef',
    dropZones: [
      {
        id: 'plastico',
        label: 'Plástico',
        shortLabel: 'Plástico',
        color: '#2f80ed',
        description: 'Botellas PET, envases y contenedores limpios.',
      },
      {
        id: 'papel-carton',
        label: 'Papel y cartón',
        shortLabel: 'Papel y cartón',
        color: '#d99b21',
        description: 'Cajas, diarios, revistas y carpetas.',
      },
      {
        id: 'metal',
        label: 'Metal',
        shortLabel: 'Metal',
        color: '#c44536',
        description: 'Latas de aluminio, hojalata y ferrosos pequeños.',
      },
      {
        id: 'vidrio',
        label: 'Vidrio',
        shortLabel: 'Vidrio',
        color: '#3a9152',
        description: 'Frascos, botellas y envases de conserva.',
      },
      {
        id: 'descarte',
        label: 'Descarte',
        shortLabel: 'Descarte',
        color: '#000000',
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
      'Introducir la economía circular biológica mediante compostaje hogareño y balance de nutrientes.',
    environment:
      '¡Transformá tus residuos orgánicos en compost!\n\nLas cáscaras de frutas y verduras, las hojas secas y otros restos orgánicos pueden convertirse en un abono natural que nutre el suelo y ayuda a crecer a las plantas.\n\nTu misión: alimentar tu compostera, equilibrar la humedad y mezclar para ayudar al proceso. ¡Cuidá a las lombrices!',
    introText:
      'En este juego vas a tener que encontrar la combinación justa entre materiales secos y húmedos para rellenar una compostera regulando la humedad, el oxígeno y el cuidado de las lombrices.',
    introText2:
      '¡Ojo! Para mantener la compostera equilibrada, deberás intercalar capas de materiales húmedos y secos.',
    mechanic:
      'Alternar materiales verdes húmedos y marrones secos para mantener el equilibrio de humedad.',
    scoring:
      'Cada capa correcta suma puntos y el equilibrio final desbloquea el abono para el jardín.',
    kind: 'compost',
    durationSeconds: 90,
    accentColor: '#8a5a26',
    backgroundColor: '#e7d5bd',
    dropZones: [
      {
        id: 'verdes',
        label: 'Verdes húmedos',
        shortLabel: 'Nitrógeno',
        color: '#4f8f46',
        description: 'Cáscaras, verduras, yerba y saquitos de té.',
      },
      {
        id: 'marrones',
        label: 'Marrones secos',
        shortLabel: 'Carbono',
        color: '#9c6b3d',
        description: 'Hojas secas, ramas, césped seco y cartón sin tinta.',
      },
    ],
    items: [
      {
        id: 'restos-verdura',
        label: 'Verduras',
        symbol: 'VER',
        category: 'verdes',
        detail: 'Aporta humedad y nitrógeno.',
        points: 120,
      },
      {
        id: 'cascaras-fruta',
        label: 'Cáscaras',
        symbol: 'FRU',
        category: 'verdes',
        detail: 'Restos de fruta para nitrógeno.',
        points: 120,
      },
      {
        id: 'hojas-lechuga',
        label: 'Lechuga',
        symbol: 'LEC',
        category: 'verdes',
        detail: 'Hoja vegetal húmeda.',
        points: 115,
      },
      {
        id: 'yerba-compost',
        label: 'Yerba',
        symbol: 'YRB',
        category: 'verdes',
        detail: 'Material verde húmedo.',
        points: 120,
      },
      {
        id: 'te',
        label: 'Saquito de té',
        symbol: 'TE',
        category: 'verdes',
        detail: 'Orgánico compostable.',
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
        detail: 'Material seco del jardín.',
        points: 130,
      },
      {
        id: 'cesped-seco',
        label: 'Césped seco',
        symbol: 'CES',
        category: 'marrones',
        detail: 'Fibra seca para airear la mezcla.',
        points: 120,
      },
      {
        id: 'carton-sin-tinta',
        label: 'Cartón limpio',
        symbol: 'CAR',
        category: 'marrones',
        detail: 'Carbono sin tinta.',
        points: 110,
      },
      {
        id: 'carton-trocitos',
        label: 'Cartón trozado',
        symbol: 'CTZ',
        category: 'marrones',
        detail: 'Pedacitos de cartón sin tinta.',
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
      'Mostrar la complejidad de la ingeniería sanitaria y la importancia de reducir residuos desde el hogar.',
    environment:
      '¡Cada residuo debe llegar al lugar correcto!\n\nLos residuos que no pueden reciclarse ni compostarse necesitan una disposición final adecuada. Los rellenos sanitarios son grandes fosas impermeabilizadas que permiten gestionarlos de manera controlada y reducir su impacto ambiental.\n\nTu misión: organizar las bolsas de residuos que llegan al relleno, aprovechando el espacio para que entre la mayor cantidad de residuos.',
    introText:
      'En este juego vas a ubicar bolsas dentro un relleno sanitario intentando evitar huecos para aprovechar el espacio al máximo. Mientras están cayendo, podés girar la posición de las bolsas tocándolas con tu dedo y arrastrarlas al lado que prefieras',
    introText2:
      '¡Ojo! Las bolsas reciclables no van dentro del relleno. Colocalas en su contenedor para que se puedan recuperar los materiales.',
    mechanic:
      'Ubicar bolsas de residuos en la fosa con criterio de encastre para evitar huecos y colapso.',
    scoring:
      'La buena compactación suma puntos y sostener la vida útil de la fosa agrega bonificación.',
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
        description: 'Ubicación eficiente dentro de la fosa impermeabilizada.',
      },
      {
        id: 'zona-riesgo',
        label: 'Huecos vacíos',
        shortLabel: 'Riesgo',
        color: '#a4503f',
        description: 'Espacios desordenados que reducen la vida útil.',
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

export function findStageById(stageId: string | null): GameStage {
  return GAME_STAGES.find((stage) => stage.id === stageId) ?? GAME_STAGES[0];
}
