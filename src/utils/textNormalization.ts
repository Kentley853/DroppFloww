/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeCode(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function hasText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

export function safeIncludes(
  source: unknown,
  searchValue: unknown
): boolean {
  const normalizedSource = normalizeText(source);
  const normalizedSearch = normalizeText(searchValue);

  if (!normalizedSource || !normalizedSearch) {
    return false;
  }

  return normalizedSource.includes(normalizedSearch);
}
