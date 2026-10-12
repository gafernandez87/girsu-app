export const COMPOST_MIX_BONUS = 100;
export const COMPOST_SKIP_MIX_PENALTY = 50;
export const COMPOST_MIXING_DURATION_MS = 1800;

export interface CompostNotice {
  readonly title: string;
  readonly message: string;
}

export const COMPOST_NOTICES = {
  worms: {
    title: '¡Lombrices en la compostera!',
    message:
      'Las lombrices ayudan a transformar los restos orgánicos en humus, un abono natural que ayuda a que las plantas crezcan mejor.',
  },
  wet: {
    title: '💧 ¡Demasiada humedad!',
    message:
      'La compostera necesita aire para funcionar bien. Agregá materiales secos y mezclá para equilibrarla.',
  },
  dry: {
    title: '🍂 ¡Demasiado seco!',
    message:
      'Los organismos necesitan humedad para transformar los residuos. Agregá materiales húmedos y mezclá para equilibrar la compostera.',
  },
  mixed: {
    title: '¡Muy bien!',
    message:
      'Mezclar la compostera ayuda a incorporar oxígeno y distribuir la humedad. Hacelo con cuidado para cuidar a tus lombrices.',
  },
  skipped: {
    title: '¡Ojo!',
    message:
      'Si no mezclamos la compostera, puede faltar oxígeno y la descomposición puede volverse más lenta. Además, pueden aparecer malos olores.',
  },
} as const satisfies Record<string, CompostNotice>;
