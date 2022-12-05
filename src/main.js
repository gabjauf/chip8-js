const registers = require('./registers')();
const memory = require('./memory')();

const CURRENT_ROM = `${__dirname}/../roms/Pong (1 player).ch8`;
let stackPointer = 0x00;

const display = Array.from({ length: 2048 });

memory.loadRom(CURRENT_ROM);


console.log(registers);
console.log(memory, memory.memory.slice(0x200));
