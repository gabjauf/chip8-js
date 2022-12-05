import memory from "./memory";
const screen = document.getElementById('screen').getContext('2d');
const screen_width = 960;
const screen_height = 640;
const BLANK_COLOR = "black";
const FILLED_COLOR = "white";
const display_width_bytes = 0x40;
const display_height_bytes = 0x20;
const width_ratio = Math.floor(screen_width / display_width_bytes);
const height_ratio = Math.floor(screen_height / display_height_bytes);
console.log(width_ratio, height_ratio);

function clear() {
  screen.fillStyle = BLANK_COLOR;
  screen.fillRect(0, 0, screen_width, screen_height);
}

function paint() {
  memory().display.forEach(function (pixel: number, index: number) {
    let x = (index % display_width_bytes) * width_ratio;
    let y = Math.floor(index / display_width_bytes) * height_ratio;
    if (pixel === 1) {
      screen.fillStyle = FILLED_COLOR;
      screen.fillRect(x, y, width_ratio, height_ratio);
    } else {
      screen.fillStyle = BLANK_COLOR;
      screen.fillRect(x, y, width_ratio, height_ratio);
    }
  });
}


export default {
  init() {
    clear()
  },
  clear,
  paint
}
