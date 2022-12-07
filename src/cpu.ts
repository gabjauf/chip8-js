import memory from './memory';
import registers from './registers';
import { ENTRY_POINT_ADDRESS } from './constants';
export default (function cpu() {
  let programCounter = ENTRY_POINT_ADDRESS;
  let stackPointer = 0x00;
  let drawFlag = false;
  let delay_timer = 0;
  let sound_timer = 0;
  let stack: number[] = [];
  let mem = memory();
  let reg = registers();
  let key: number[] = Array.from({ length: 16 }).fill(0) as number[];
  let opcode: number;
  function init() {
  }
  function cycle() {

    // Fetch op code
    opcode = mem.memory[programCounter] << 8 | mem.memory[programCounter + 1];   // Op code is two bytes

    switch (opcode & 0xF000) {

      // 00E_
      case 0x0000:

        switch (opcode & 0x000F) {
          // 00E0 - Clear screen
          case 0x0000:
            mem.display.fill(0)
            drawFlag = true;
            programCounter += 2;
            break;

          // 00EE - Return from subroutine
          case 0x000E:
            --stackPointer;
            programCounter = stack[stackPointer];
            programCounter += 2;
            break;

          default:
            console.error("\nUnknown op code: %.4X\n", opcode);
            throw new Error(`\nUnknown op code: ${opcode}\n`);
        }
        break;

      // 1NNN - Jumps to address NNN
      case 0x1000:
        programCounter = opcode & 0x0FFF;
        break;

      // 2NNN - Calls subroutine at NNN
      case 0x2000:
        stack[stackPointer] = programCounter;
        ++stackPointer;
        programCounter = opcode & 0x0FFF;
        break;

      // 3XNN - Skips the next instruction if VX equals NN.
      case 0x3000:
        if (reg.V[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF))
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // 4XNN - Skips the next instruction if VX does not equal NN.
      case 0x4000:
        if (reg.V[(opcode & 0x0F00) >> 8] !== (opcode & 0x00FF))
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // 5XY0 - Skips the next instruction if VX equals VY.
      case 0x5000:
        if (reg.V[(opcode & 0x0F00) >> 8] === reg.V[(opcode & 0x00F0) >> 4])
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // 6XNN - Sets VX to NN.
      case 0x6000:
        reg.V[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
        programCounter += 2;
        break;

      // 7XNN - Adds NN to VX.
      case 0x7000:
        reg.V[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
        programCounter += 2;
        break;

      // 8XY_
      case 0x8000:
        switch (opcode & 0x000F) {

          // 8XY0 - Sets VX to the value of VY.
          case 0x0000:
            reg.V[(opcode & 0x0F00) >> 8] = reg.V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY1 - Sets VX to (VX OR VY).
          case 0x0001:
            reg.V[(opcode & 0x0F00) >> 8] |= reg.V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY2 - Sets VX to (VX AND VY).
          case 0x0002:
            reg.V[(opcode & 0x0F00) >> 8] &= reg.V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY3 - Sets VX to (VX XOR VY).
          case 0x0003:
            reg.V[(opcode & 0x0F00) >> 8] ^= reg.V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY4 - Adds VY to VX. VF is set to 1 when there's a carry,
          // and to 0 when there isn't.
          case 0x0004:
            reg.V[(opcode & 0x0F00) >> 8] += reg.V[(opcode & 0x00F0) >> 4];
            if (reg.V[(opcode & 0x00F0) >> 4] > (0xFF - reg.V[(opcode & 0x0F00) >> 8]))
              reg.V[0xF] = 1; //carry
            else
              reg.V[0xF] = 0;
            programCounter += 2;
            break;

          // 8XY5 - VY is subtracted from VX. VF is set to 0 when
          // there's a borrow, and 1 when there isn't.
          case 0x0005:
            if (reg.V[(opcode & 0x00F0) >> 4] > reg.V[(opcode & 0x0F00) >> 8])
              reg.V[0xF] = 0; // there is a borrow
            else
              reg.V[0xF] = 1;
            reg.V[(opcode & 0x0F00) >> 8] -= reg.V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 0x8XY6 - Shifts VX right by one. VF is set to the value of
          // the least significant bit of VX before the shift.
          case 0x0006:
            reg.V[0xF] = reg.V[(opcode & 0x0F00) >> 8] & 0x1;
            reg.V[(opcode & 0x0F00) >> 8] = reg.V[(opcode & 0x0F00) >> 8] >> 1;
            programCounter += 2;
            break;

          // 0x8XY7: Sets VX to VY minus VX. VF is set to 0 when there's
          // a borrow, and 1 when there isn't.
          case 0x0007:
            if (reg.V[(opcode & 0x0F00) >> 8] > reg.V[(opcode & 0x00F0) >> 4])	// VY-VX
              reg.V[0xF] = 0; // there is a borrow
            else
              reg.V[0xF] = 1;
            reg.V[(opcode & 0x0F00) >> 8] = reg.V[(opcode & 0x00F0) >> 4] - reg.V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // 0x8XYE: Shifts VX left by one. VF is set to the value of
          // the most significant bit of VX before the shift.
          case 0x000E:
            reg.V[0xF] = reg.V[(opcode & 0x0F00) >> 8] >> 7;
            reg.V[(opcode & 0x0F00) >> 8] = reg.V[(opcode & 0x0F00) >> 8] << 1;
            programCounter += 2;
            break;

          default:
            console.error("\nUnknown op code: %.4X\n", opcode);
            throw new Error(`\nUnknown op code: ${opcode}\n`);
        }
        break;

      // 9XY0 - Skips the next instruction if VX doesn't equal VY.
      case 0x9000:
        if (reg.V[(opcode & 0x0F00) >> 8] !== reg.V[(opcode & 0x00F0) >> 4])
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // ANNN - Sets reg.I to the address NNN.
      case 0xA000:
        reg.I = opcode & 0x0FFF;
        programCounter += 2;
        break;

      // BNNN - Jumps to the address NNN plus V0.
      case 0xB000:
        programCounter = (opcode & 0x0FFF) + reg.V[0];
        break;

      // CXNN - Sets VX to a random number, masked by NN.
      case 0xC000:
        reg.V[(opcode & 0x0F00) >> 8] = (Math.random() % (0xFF + 1)) & (opcode & 0x00FF);
        programCounter += 2;
        break;

      // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8
      // pixels and a height of N pixels.
      // Each row of 8 pixels is read as bit-coded starting from mem
      // location reg.I;
      // reg.I value doesn't change after the execution of this instruction.
      // VF is set to 1 if any screen pixels are flipped from set to unset
      // when the sprite is drawn, and to 0 if that doesn't happen.
      case 0xD000:
        {
          let x = reg.V[(opcode & 0x0F00) >> 8];
          let y = reg.V[(opcode & 0x00F0) >> 4];
          let height = opcode & 0x000F;
          let pixel;

          reg.V[0xF] = 0;
          for (let yline = 0; yline < height; yline++) {
            pixel = mem.memory[reg.I + yline];
            for (let xline = 0; xline < 8; xline++) {
              if ((pixel & (0x80 >> xline)) !== 0) {
                if (mem.display[(x + xline + ((y + yline) * 64))] === 1) {
                  reg.V[0xF] = 1;
                }
                mem.display[x + xline + ((y + yline) * 64)] ^= 1;
              }
            }
          }

          drawFlag = true;
          programCounter += 2;
        }
        break;

      // EX__
      case 0xE000:

        switch (opcode & 0x00FF) {
          // EX9E - Skips the next instruction if the key stored
          // in VX is pressed.
          case 0x009E:
            if (key[reg.V[(opcode & 0x0F00) >> 8]] !== 0)
              programCounter += 4;
            else
              programCounter += 2;
            break;

          // EXA1 - Skips the next instruction if the key stored
          // in VX isn't pressed.
          case 0x00A1:
            if (key[reg.V[(opcode & 0x0F00) >> 8]] === 0)
              programCounter += 4;
            else
              programCounter += 2;
            break;

          default:
            console.log("\nUnknown op code: %.4X\n", opcode);
            throw new Error(`\nUnknown op code: ${opcode}\n`);
        }
        break;

      // FX__
      case 0xF000:
        switch (opcode & 0x00FF) {
          // FX07 - Sets VX to the value of the delay timer
          case 0x0007:
            reg.V[(opcode & 0x0F00) >> 8] = delay_timer;
            programCounter += 2;
            break;

          // FX0A - A key press is awaited, and then stored in VX
          case 0x000A:
            {
              let key_pressed = false;

              for (let i = 0; i < 16; ++i) {
                if (key[i] !== 0) {
                  reg.V[(opcode & 0x0F00) >> 8] = i;
                  key_pressed = true;
                }
              }

              // If no key is pressed, return and try again.
              if (!key_pressed)
                return;

              programCounter += 2;
            }
            break;

          // FX15 - Sets the delay timer to VX
          case 0x0015:
            delay_timer = reg.V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // FX18 - Sets the sound timer to VX
          case 0x0018:
            sound_timer = reg.V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // FX1E - Adds VX to reg.I
          case 0x001E:
            // VF is set to 1 when range overflow (reg.I+VX>0xFFF), and 0
            // when there isn't.
            if (reg.I + reg.V[(opcode & 0x0F00) >> 8] > 0xFFF)
              reg.V[0xF] = 1;
            else
              reg.V[0xF] = 0;
            reg.I += reg.V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // FX29 - Sets reg.I to the location of the sprite for the
          // character in VX. Characters 0-F (in hexadecimal) are
          // represented by a 4x5 font
          case 0x0029:
            reg.I = reg.V[(opcode & 0x0F00) >> 8] * 0x5;
            programCounter += 2;
            break;

          // FX33 - Stores the Binary-coded decimal representation of VX
          // at the addresses reg.I, reg.I plus 1, and reg.I plus 2
          case 0x0033:
            mem.memory[reg.I] = reg.V[(opcode & 0x0F00) >> 8] / 100;
            mem.memory[reg.I + 1] = (reg.V[(opcode & 0x0F00) >> 8] / 10) % 10;
            mem.memory[reg.I + 2] = reg.V[(opcode & 0x0F00) >> 8] % 10;
            programCounter += 2;
            break;

          // FX55 - Stores V0 to VX in mem starting at address reg.I
          case 0x0055:
            for (let i = 0; i <= ((opcode & 0x0F00) >> 8); ++i)
              mem.memory[reg.I + i] = reg.V[i];

            // On the original interpreter, when the
            // operation is done, reg.I = reg.I + X + 1.
            reg.I += ((opcode & 0x0F00) >> 8) + 1;
            programCounter += 2;
            break;

          case 0x0065:
            for (let i = 0; i <= ((opcode & 0x0F00) >> 8); ++i)
              reg.V[i] = mem.memory[reg.I + i];

            // On the original interpreter,
            // when the operation is done, reg.I = reg.I + X + 1.
            reg.I += ((opcode & 0x0F00) >> 8) + 1;
            programCounter += 2;
            break;

          default:
            console.error("Unknown opcode [0xF000]: 0x%X\n", opcode);
            throw new Error(`\nUnknown op code: ${opcode}\n`);
        }
        break;

      default:
        console.error("\nUnimplemented op code: %.4X\n", opcode);
        throw new Error(`\nUnknown op code: ${opcode}\n`);
    }


    // Update timers
    if (delay_timer > 0)
      --delay_timer;

    if (sound_timer > 0)
      if (sound_timer === 1)
        // TODO: Implement sound
        --sound_timer;
  }

  return function () {
    return {
      init,
      programCounter,
      opcode,
      stackPointer,
      cycle,
      drawFlag,
    };
  };
}());