const memory = require('./memory')();
module.exports = (function cpu() {
  function init() {
  }
  return function () {
    return {
      init,
    };
  };
}());