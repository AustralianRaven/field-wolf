/** iNaturalist writes many plant common names in lower case ("common poppy"). Show them sentence-cased. */
export const displayName = (common: string | null | undefined, scientific: string): string =>
  common ? common.charAt(0).toUpperCase() + common.slice(1) : scientific;
