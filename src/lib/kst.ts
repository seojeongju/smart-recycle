export function kstToday(): string {
  const shifted = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}
