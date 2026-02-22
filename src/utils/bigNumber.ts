const SUFFIXES = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg',
];

export function formatNumber(n: number): string {
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1000) return Math.floor(n).toString();

  let tier = 0;
  let scaled = n;
  while (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    scaled /= 1000;
    tier++;
  }

  if (scaled >= 100) return scaled.toFixed(1) + SUFFIXES[tier];
  if (scaled >= 10) return scaled.toFixed(2) + SUFFIXES[tier];
  return scaled.toFixed(2) + SUFFIXES[tier];
}
