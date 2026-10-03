export type NeutralWeightMode = 'full' | 'omit-syntax' | 'omit-value' | 'omit-value-and-colons';
export type WeightSyntax = 'parentheses' | 'square' | 'curly' | 'section';
export type WeightSettings = {
  enabled: boolean;
  syntax: WeightSyntax;
  increment: number;
  neutralWeightMode?: NeutralWeightMode;
};
export const defaultWeights: WeightSettings = {
  enabled: false,
  syntax: 'parentheses',
  increment: 0.1,
  neutralWeightMode: 'full',
};
export function validWeight(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}
export function parseWeightSettings(value: unknown): WeightSettings {
  const input = value as
    | (Partial<WeightSettings> & {
        hideNeutralWeight?: boolean;
        keepNeutralBrackets?: boolean;
        hideNeutralColon?: boolean;
      })
    | null;
  const legacyMode: NeutralWeightMode =
    input?.hideNeutralWeight !== true
      ? 'full'
      : input.keepNeutralBrackets !== true
        ? 'omit-syntax'
        : input.hideNeutralColon === true
          ? 'omit-value-and-colons'
          : 'omit-value';
  return {
    neutralWeightMode: ['full', 'omit-syntax', 'omit-value', 'omit-value-and-colons'].includes(
      input?.neutralWeightMode ?? '',
    )
      ? input!.neutralWeightMode!
      : legacyMode,
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
  options?: Pick<WeightSettings, 'neutralWeightMode'>,
): string {
  const mode = options?.neutralWeightMode ?? 'full';
  const neutralHidden = weight === 1 && mode !== 'full';
  if (neutralHidden && mode === 'omit-syntax') return text;
  const value = neutralHidden ? '' : String(weight);
  const hideColon = neutralHidden && mode === 'omit-value-and-colons';
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
