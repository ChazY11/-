let counter = 0;
function randomHex(length) {
    let value = '';
    while (value.length < length) {
        value += Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
    }
    return value.slice(0, length);
}
export function createId(prefix = 'id') {
    counter = (counter + 1) % 0xffffff;
    return [
        prefix,
        Date.now().toString(36),
        counter.toString(36),
        randomHex(8),
    ].join('-');
}
//# sourceMappingURL=id.js.map