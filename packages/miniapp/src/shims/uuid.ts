function randomHex(length: number) {
  let value = '';
  while (value.length < length) {
    value += Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  }
  return value.slice(0, length);
}

function formatUuid() {
  const hex = randomHex(32);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

export function v4() {
  return formatUuid();
}

export default {
  v4,
};
