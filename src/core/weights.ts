export type WeightSyntax = 'parentheses' | 'square' | 'curly' | 'section';
export type WeightSettings = {
  enabled: boolean;
  syntax: WeightSyntax;
  increment: number;
  hideNeutralWeight?: boolean;
  keepNeutralBrackets?: boolean;
  hideNeutralColon?: boolean;
};
export const defaultWeights: WeightSettings = {
  enabled: false,
  syntax: 'parentheses',
  increment: 0.1,
  hideNeutralWeight: false,
  keepNeutralBrackets: false,
  hideNeutralColon: false,
};
export function validWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}
export function parseWeightSettings(value: unknown): WeightSettings {
  const input = value as Partial<WeightSettings> | null;
  return {
    hideNeutralWeight: input?.hideNeutralWeight === true,
    keepNeutralBrackets: input?.keepNeutralBrackets === true,
    hideNeutralColon: input?.hideNeutralColon === true,
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
export function formatWeightedText(
  text: string,
  weight: number,
  syntax: WeightSyntax,
  options?: Pick<WeightSettings, 'hideNeutralWeight' | 'keepNeutralBrackets' | 'hideNeutralColon'>,
): string {
  const neutralHidden = weight === 1 && options?.hideNeutralWeight;
  if (neutralHidden && !options?.keepNeutralBrackets) return text;
  const value = neutralHidden ? '' : String(weight);
  const hideColon = neutralHidden && options?.hideNeutralColon;
  if (syntax === 'section') return text + (hideColon ? '' : '::') + value;
  const [open, close] =
    syntax === 'square' ? ['[', ']'] : syntax === 'curly' ? ['{', '}'] : ['(', ')'];
  const escaped = [...text]
    .map((character) =>
      character === '\\' || character === open || character === close
        ? '\\' + character
        : character,
    )
    .join('');
  return `${open}${escaped}${hideColon ? '' : ':'}${value}${close}`;
}
