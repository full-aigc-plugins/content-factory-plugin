export type TextDiff = {
  commonPrefix: string;
  removed: string;
  added: string;
  commonSuffix: string;
};

export function diffText(before: string, after: string): TextDiff {
  let prefixLength = 0;
  const maxPrefix = Math.min(before.length, after.length);
  while (prefixLength < maxPrefix && before[prefixLength] === after[prefixLength]) {
    prefixLength += 1;
  }

  let suffixLength = 0;
  const beforeRemaining = before.length - prefixLength;
  const afterRemaining = after.length - prefixLength;
  const maxSuffix = Math.min(beforeRemaining, afterRemaining);
  while (
    suffixLength < maxSuffix
    && before[before.length - 1 - suffixLength] === after[after.length - 1 - suffixLength]
  ) {
    suffixLength += 1;
  }

  const suffixStartBefore = before.length - suffixLength;
  const suffixStartAfter = after.length - suffixLength;
  return {
    commonPrefix: before.slice(0, prefixLength),
    removed: before.slice(prefixLength, suffixStartBefore),
    added: after.slice(prefixLength, suffixStartAfter),
    commonSuffix: suffixLength === 0 ? "" : before.slice(suffixStartBefore)
  };
}
