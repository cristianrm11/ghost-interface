const RE_SEPARATORS = /[_\-[\]]/g;
const RE_CAMEL = /([a-z])([A-Z])/g;
const RE_SPACES = /\s+/g;

export function humanize(key: string): string {
  return key
    .replace(RE_SEPARATORS, ' ')
    .replace(RE_CAMEL, '$1 $2')
    .replace(RE_SPACES, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}
