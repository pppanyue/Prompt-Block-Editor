export type SeparatorRules = {
  newLineBeforeOuterGroup: boolean;
  newLineBeforeInnerGroup: boolean;
  punctuationOverrides: boolean;
  endingSigns: string;
};
export const defaultSeparatorRules: SeparatorRules = {
  newLineBeforeOuterGroup: false,
  newLineBeforeInnerGroup: false,
  punctuationOverrides: false,
  endingSigns: '.!?。！？',
};
export function parseSeparatorRules(value: unknown): SeparatorRules {
  const input = value as (Partial<SeparatorRules> & { newLineBeforeGroup?: boolean }) | null;
  return {
    newLineBeforeOuterGroup:
      typeof input?.newLineBeforeOuterGroup === 'boolean'
        ? input.newLineBeforeOuterGroup
        : input?.newLineBeforeGroup === true,
    newLineBeforeInnerGroup:
      typeof input?.newLineBeforeInnerGroup === 'boolean'
        ? input.newLineBeforeInnerGroup
        : input?.newLineBeforeGroup === true,
    punctuationOverrides: input?.punctuationOverrides === true,
    endingSigns:
      typeof input?.endingSigns === 'string'
        ? input.endingSigns
        : defaultSeparatorRules.endingSigns,
  };
}
export function hasEndingSign(text: string, signs: string): boolean {
  const ending = text.trimEnd().replace(/["'’”\)\]\}]+$/u, '');
  return [...signs].some((sign) => ending.endsWith(sign));
}
