import { GameStage, LeaderboardEntry, UserProfile } from './app.models';

export const CURRENT_USER: UserProfile = {
  id: 'demo-user',
  name: 'Sofia',
  role: 'student',
  school: 'Escuela Ambiental Jujuy',
  course: '6to grado'
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
        shortLabel: 'Secos',
        color: '#2f8f4e',
        description: 'Plastico, papel, carton, metal y vidrio limpio.'
      },
      {
        id: 'no-reciclables',
        label: 'No reciclables',
        shortLabel: 'Resto',
        color: '#2f80ed',
        description: 'Materiales sin valorizacion actual.'
      },
      {
        id: 'compostables',
        label: 'Compostables',
        shortLabel: 'Organicos',
        color: '#8a5a26',
        description: 'Residuos vegetales para degradacion biologica.'
      }
    ],
    items: [
      {
        id: 'botella-pet',
        label: 'Botella PET',
        symbol: 'PET',
        category: 'reciclables',
        detail: 'Plastico limpio y seco.',
        points: 120
      },
      {
        id: 'frasco-vidrio',
        label: 'Frasco',
        symbol: 'VID',
        category: 'reciclables',
        detail: 'Vidrio entero y limpio.',
        points: 120
      },
      {
        id: 'carton',
        label: 'Carton',
        symbol: 'CAR',
        category: 'reciclables',
        detail: 'Carton seco.',
        points: 110
      },
      {
        id: 'cascara',
        label: 'Cascara',
        symbol: 'ORG',
        category: 'compostables',
        detail: 'Residuo vegetal.',
        points: 130
      },
      {
        id: 'yerba',
        label: 'Yerba',
        symbol: 'YRB',
        category: 'compostables',
        detail: 'Organico humedo.',
        points: 130
      },
      {
        id: 'envoltorio',
        label: 'Envoltorio',
        symbol: 'ENV',
        category: 'no-reciclables',
        detail: 'Material mixto o sucio.',
        points: 100
      }
    ]
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
    mechanic:
      'Clasificar residuos secos en plastico, papel/carton, vidrio, metal o descarte.',
    scoring:
      'Los aciertos sostienen el flujo de la planta; los errores representan mezcla inadecuada.',
    kind: 'conveyor',
    durationSeconds: 75,
    accentColor: '#246a73',
    backgroundColor: '#dcecef',
    dropZones: [
      {
        id: 'plastico',
        label: 'Plastico',
        shortLabel: 'Azul',
        color: '#2f80ed',
        description: 'Botellas PET, envases y contenedores limpios.'
      },
      {
        id: 'papel-carton',
        label: 'Papel y carton',
        shortLabel: 'Amarillo',
        color: '#d99b21',
        description: 'Cajas, diarios, revistas y carpetas.'
      },
      {
        id: 'vidrio',
        label: 'Vidrio',
        shortLabel: 'Verde',
        color: '#3a9152',
        description: 'Frascos, botellas y envases de conserva.'
      },
      {
        id: 'metal',
        label: 'Metal',
        shortLabel: 'Rojo',
        color: '#c44536',
        description: 'Latas de aluminio, hojalata y ferrosos pequeños.'
      },
      {
        id: 'descarte',
        label: 'Descarte',
        shortLabel: 'Compuerta',
        color: '#4f5963',
        description: 'Residuos no valorizables que no deben contaminar la cinta.'
      }
    ],
    items: [
      {
        id: 'pet-planta',
        label: 'Botella',
        symbol: 'PET',
        category: 'plastico',
        detail: 'Botella plastica limpia.',
        points: 120
      },
      {
        id: 'caja',
        label: 'Caja',
        symbol: 'BOX',
        category: 'papel-carton',
        detail: 'Carton de embalaje.',
        points: 120
      },
      {
        id: 'diario',
        label: 'Diario',
        symbol: 'PAP',
        category: 'papel-carton',
        detail: 'Papel seco.',
        points: 110
      },
      {
        id: 'botella-vidrio',
        label: 'Botella vidrio',
        symbol: 'VID',
        category: 'vidrio',
        detail: 'Vidrio entero.',
        points: 130
      },
      {
        id: 'lata',
        label: 'Lata',
        symbol: 'ALU',
        category: 'metal',
        detail: 'Aluminio valorizable.',
        points: 130
      },
      {
        id: 'papel-sucio',
        label: 'Papel sucio',
        symbol: 'DSC',
        category: 'descarte',
        detail: 'No debe mezclarse con reciclables limpios.',
        points: 100
      }
    ]
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
    mechanic:
      'Alternar materiales verdes humedos y marrones secos para mantener el equilibrio de humedad.',
    scoring:
      'Cada capa correcta suma puntos y el equilibrio final desbloquea el abono para el jardin.',
    kind: 'compost',
    durationSeconds: 70,
    accentColor: '#8a5a26',
    backgroundColor: '#e7d5bd',
    dropZones: [
      {
        id: 'verdes',
        label: 'Verdes humedos',
        shortLabel: 'Nitrogeno',
        color: '#4f8f46',
        description: 'Cascaras, verduras, yerba y saquitos de te.'
      },
      {
        id: 'marrones',
        label: 'Marrones secos',
        shortLabel: 'Carbono',
        color: '#9c6b3d',
        description: 'Hojas secas, ramas, cesped seco y carton sin tinta.'
      }
    ],
    items: [
      {
        id: 'restos-verdura',
        label: 'Verduras',
        symbol: 'VER',
        category: 'verdes',
        detail: 'Aporta humedad y nitrogeno.',
        points: 120
      },
      {
        id: 'yerba-compost',
        label: 'Yerba',
        symbol: 'YRB',
        category: 'verdes',
        detail: 'Material verde humedo.',
        points: 120
      },
      {
        id: 'te',
        label: 'Saquito te',
        symbol: 'TE',
        category: 'verdes',
        detail: 'Organico compostable.',
        points: 110
      },
      {
        id: 'hojas-secas',
        label: 'Hojas secas',
        symbol: 'HOJ',
        category: 'marrones',
        detail: 'Aporta estructura y carbono.',
        points: 130
      },
      {
        id: 'ramas',
        label: 'Ramas',
        symbol: 'RAM',
        category: 'marrones',
        detail: 'Material seco del jardin.',
        points: 130
      },
      {
        id: 'carton-sin-tinta',
        label: 'Carton limpio',
        symbol: 'CAR',
        category: 'marrones',
        detail: 'Carbono sin tinta.',
        points: 110
      }
    ]
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
        description: 'Ubicacion eficiente dentro de la fosa impermeabilizada.'
      },
      {
        id: 'zona-riesgo',
        label: 'Huecos vacios',
        shortLabel: 'Riesgo',
        color: '#a4503f',
        description: 'Espacios desordenados que reducen la vida util.'
      }
    ],
    items: [
      {
        id: 'bolsa-1',
        label: 'Bolsa chica',
        symbol: 'B1',
        category: 'fosa-compacta',
        detail: 'Debe encastrarse cerca del fondo.',
        points: 120
      },
      {
        id: 'bolsa-2',
        label: 'Bolsa larga',
        symbol: 'B2',
        category: 'fosa-compacta',
        detail: 'Conviene ubicarla alineada.',
        points: 130
      },
      {
        id: 'bolsa-3',
        label: 'Bolsa media',
        symbol: 'B3',
        category: 'fosa-compacta',
        detail: 'Debe evitar huecos.',
        points: 120
      },
      {
        id: 'bolsa-4',
        label: 'Bolsa pesada',
        symbol: 'B4',
        category: 'fosa-compacta',
        detail: 'Aporta estabilidad si se ubica abajo.',
        points: 140
      }
    ]
  }
];

export const MOCK_LEADERBOARD: readonly LeaderboardEntry[] = [
  {
    position: 1,
    name: 'Camila',
    school: 'Esc. N 12 San Salvador',
    score: 3920
  },
  {
    position: 2,
    name: 'Mateo',
    school: 'Colegio Secundario Purmamarca',
    score: 3640
  },
  {
    position: 3,
    name: CURRENT_USER.name,
    school: CURRENT_USER.school,
    score: 0,
    isCurrentUser: true
  },
  {
    position: 4,
    name: 'Lucia',
    school: 'Esc. Rural Tilcara',
    score: 2780
  }
];

export function findStageById(stageId: string | null): GameStage {
  return GAME_STAGES.find((stage) => stage.id === stageId) ?? GAME_STAGES[0];
}
