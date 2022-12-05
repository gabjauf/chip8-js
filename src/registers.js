module.exports = (function registers() {
  const registers = {
    v0: 0x00,
    v1: 0x00,
    v2: 0x00,
    v3: 0x00,
    v4: 0x00,
    v5: 0x00,
    v6: 0x00,
    v7: 0x00,
    v8: 0x00,
    v9: 0x00,
    vA: 0x00,
    vB: 0x00,
    vC: 0x00,
    vD: 0x00,
    vE: 0x00,
    vF: 0x00,
    vI: 0x00,
  };
  return function () {
    return registers;
  };
}());
