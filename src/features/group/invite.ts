export function normalizeInviteInput(value: string) {
  return value.trim();
}

export function buildLocalMemberId(inputId: string) {
  const normalized = normalizeInviteInput(inputId);
  if (normalized) return normalized;

  const random = Math.random().toString(36).slice(2, 8);
  return `local-${random}`;
}
