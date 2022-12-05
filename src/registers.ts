export default (function registers() {
  const V = Array.from({length: 16 }).fill(0) as number[];
  return function () {
    return {
      V,
      I: 0x00
    };
  };
}());
