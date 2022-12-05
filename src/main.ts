import memory from "./memory";
// import rom from '../public/roms/Brick (Brix hack, 1990).ch8?raw';
import display from "./display";
import cpu from "./cpu";

const data = await fetch('/roms/Brix [Andreas Gustafsson, 1990].ch8');


memory().loadRom([...new Uint8Array(await data.arrayBuffer())]);
display.init();

let counter = 0;

function cycle() {
  if (counter < 6000) {
    cpu().cycle();
    if (cpu().drawFlag) {
      display.paint();
    }
    counter += 1;
    setTimeout(() => cycle(), 2)
  }
  return;
}

cycle();

console.log(memory(), memory().memory.slice(0x200));
