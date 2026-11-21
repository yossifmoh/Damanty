/**
 * Derives a concise display nickname from a user's full name using first + last words
 * (e.g. "يوسف محمد أحمد" -> "يوسف أحمد").
 */
export function getDisplayNickname(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
