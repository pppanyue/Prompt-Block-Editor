export type WeightSyntax = 'parentheses' | 'square' | 'curly' | 'section';
export type WeightSettings = { enabled: boolean; syntax: WeightSyntax; increment: number };
export const defaultWeights: WeightSettings = {
  enabled: false,
  syntax: 'parentheses',
  increment: 0.1,
};
export function validWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}
export function parseWeightSettings(value: unknown): WeightSettings {
  const input = value as Partial<WeightSettings> | null;
  return {
    enabled: typeof input?.enabled === 'boolean' ? input.enabled : false,
    syntax: ['parentheses', 'square', 'curly', 'section'].includes(input?.syntax ?? '')
      ? input!.syntax!
      : 'parentheses',
    increment:
      typeof input?.increment === 'number' &&
      Number.isFinite(input.increment) &&
      input.increment >= 0.001 &&
      input.increment <= 10
        ? input.increment
        : 0.1,
  };
}
export function formatWeightedText(text: string, weight: number, syntax: WeightSyntax): string {
  if (syntax === 'section') return `${text}::${weight}`;
  const [open, close] =
    syntax === 'square' ? ['[', ']'] : syntax === 'curly' ? ['{', '}'] : ['(', ')'];
  const escaped = [...text]
    .map((character) =>
      character === '\\' || character === open || character === close
        ? '\\' + character
        : character,
    )
    .join('');
  return `${open}${escaped}:${weight}${close}`;
}
