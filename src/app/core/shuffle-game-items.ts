/** Keep each deck random while avoiding three matching categories when alternatives remain. */
export function shuffleGameItems<T extends { readonly category: string }>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  for (let index = 2; index < shuffled.length; index += 1) {
    const category = shuffled[index].category;
    if (shuffled[index - 1].category !== category || shuffled[index - 2].category !== category) {
      continue;
    }

    const alternatives: number[] = [];
    for (let candidate = index + 1; candidate < shuffled.length; candidate += 1) {
      if (shuffled[candidate].category !== category) {
        alternatives.push(candidate);
      }
    }

    // A one-category remainder cannot be mixed without dropping or duplicating items.
    if (alternatives.length === 0) {
      break;
    }

    const swapIndex = alternatives[Math.floor(random() * alternatives.length)];
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
