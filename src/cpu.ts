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
  let key: number[] = Array.from({ length: 16 }).fill(0) as number[];
  let opcode: number;
  function init() {
  }
  function cycle() {

    // Fetch op code
    opcode = memory().memory[programCounter] << 8 | memory().memory[programCounter + 1];   // Op code is two bytes

    switch (opcode & 0xF000) {

      // 00E_
      case 0x0000:

        switch (opcode & 0x000F) {
          // 00E0 - Clear screen
          case 0x0000:
            memory().display.fill(0)
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
        if (registers().V[(opcode & 0x0F00) >> 8] === (opcode & 0x00FF))
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // 4XNN - Skips the next instruction if VX does not equal NN.
      case 0x4000:
        if (registers().V[(opcode & 0x0F00) >> 8] !== (opcode & 0x00FF))
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // 5XY0 - Skips the next instruction if VX equals VY.
      case 0x5000:
        if (registers().V[(opcode & 0x0F00) >> 8] === registers().V[(opcode & 0x00F0) >> 4])
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // 6XNN - Sets VX to NN.
      case 0x6000:
        registers().V[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
        programCounter += 2;
        break;

      // 7XNN - Adds NN to VX.
      case 0x7000:
        registers().V[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
        programCounter += 2;
        break;

      // 8XY_
      case 0x8000:
        switch (opcode & 0x000F) {

          // 8XY0 - Sets VX to the value of VY.
          case 0x0000:
            registers().V[(opcode & 0x0F00) >> 8] = registers().V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY1 - Sets VX to (VX OR VY).
          case 0x0001:
            registers().V[(opcode & 0x0F00) >> 8] |= registers().V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY2 - Sets VX to (VX AND VY).
          case 0x0002:
            registers().V[(opcode & 0x0F00) >> 8] &= registers().V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY3 - Sets VX to (VX XOR VY).
          case 0x0003:
            registers().V[(opcode & 0x0F00) >> 8] ^= registers().V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 8XY4 - Adds VY to VX. VF is set to 1 when there's a carry,
          // and to 0 when there isn't.
          case 0x0004:
            registers().V[(opcode & 0x0F00) >> 8] += registers().V[(opcode & 0x00F0) >> 4];
            if (registers().V[(opcode & 0x00F0) >> 4] > (0xFF - registers().V[(opcode & 0x0F00) >> 8]))
              registers().V[0xF] = 1; //carry
            else
              registers().V[0xF] = 0;
            programCounter += 2;
            break;

          // 8XY5 - VY is subtracted from VX. VF is set to 0 when
          // there's a borrow, and 1 when there isn't.
          case 0x0005:
            if (registers().V[(opcode & 0x00F0) >> 4] > registers().V[(opcode & 0x0F00) >> 8])
              registers().V[0xF] = 0; // there is a borrow
            else
              registers().V[0xF] = 1;
            registers().V[(opcode & 0x0F00) >> 8] -= registers().V[(opcode & 0x00F0) >> 4];
            programCounter += 2;
            break;

          // 0x8XY6 - Shifts VX right by one. VF is set to the value of
          // the least significant bit of VX before the shift.
          case 0x0006:
            registers().V[0xF] = registers().V[(opcode & 0x0F00) >> 8] & 0x1;
            registers().V[(opcode & 0x0F00) >> 8] = registers().V[(opcode & 0x0F00) >> 8] >> 1;
            programCounter += 2;
            break;

          // 0x8XY7: Sets VX to VY minus VX. VF is set to 0 when there's
          // a borrow, and 1 when there isn't.
          case 0x0007:
            if (registers().V[(opcode & 0x0F00) >> 8] > registers().V[(opcode & 0x00F0) >> 4])	// VY-VX
              registers().V[0xF] = 0; // there is a borrow
            else
              registers().V[0xF] = 1;
            registers().V[(opcode & 0x0F00) >> 8] = registers().V[(opcode & 0x00F0) >> 4] - registers().V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // 0x8XYE: Shifts VX left by one. VF is set to the value of
          // the most significant bit of VX before the shift.
          case 0x000E:
            registers().V[0xF] = registers().V[(opcode & 0x0F00) >> 8] >> 7;
            registers().V[(opcode & 0x0F00) >> 8] = registers().V[(opcode & 0x0F00) >> 8] << 1;
            programCounter += 2;
            break;

          default:
            console.error("\nUnknown op code: %.4X\n", opcode);
            throw new Error(`\nUnknown op code: ${opcode}\n`);
        }
        break;

      // 9XY0 - Skips the next instruction if VX doesn't equal VY.
      case 0x9000:
        if (registers().V[(opcode & 0x0F00) >> 8] !== registers().V[(opcode & 0x00F0) >> 4])
          programCounter += 4;
        else
          programCounter += 2;
        break;

      // ANNN - Sets registers().I to the address NNN.
      case 0xA000:
        registers().I = opcode & 0x0FFF;
        programCounter += 2;
        break;

      // BNNN - Jumps to the address NNN plus V0.
      case 0xB000:
        programCounter = (opcode & 0x0FFF) + registers().V[0];
        break;

      // CXNN - Sets VX to a random number, masked by NN.
      case 0xC000:
        registers().V[(opcode & 0x0F00) >> 8] = (Math.random() % (0xFF + 1)) & (opcode & 0x00FF);
        programCounter += 2;
        break;

      // DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8
      // pixels and a height of N pixels.
      // Each row of 8 pixels is read as bit-coded starting from memory()
      // location registers().I;
      // registers().I value doesn't change after the execution of this instruction.
      // VF is set to 1 if any screen pixels are flipped from set to unset
      // when the sprite is drawn, and to 0 if that doesn't happen.
      case 0xD000:
        {
          let x = registers().V[(opcode & 0x0F00) >> 8];
          let y = registers().V[(opcode & 0x00F0) >> 4];
          let height = opcode & 0x000F;
          let pixel;

          registers().V[0xF] = 0;
          for (let yline = 0; yline < height; yline++) {
            pixel = memory().memory[registers().I + yline];
            for (let xline = 0; xline < 8; xline++) {
              if ((pixel & (0x80 >> xline)) !== 0) {
                (x + xline + ((y + yline) * 64)) > 2030 && console.log((x + xline + ((y + yline) * 64)), x, y, xline, yline);
                if (memory().display[(x + xline + ((y + yline) * 64))] === 1) {
                  registers().V[0xF] = 1;
                }
                memory().display[x + xline + ((y + yline) * 64)] ^= 1;
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
            if (key[registers().V[(opcode & 0x0F00) >> 8]] !== 0)
              programCounter += 4;
            else
              programCounter += 2;
            break;

          // EXA1 - Skips the next instruction if the key stored
          // in VX isn't pressed.
          case 0x00A1:
            if (key[registers().V[(opcode & 0x0F00) >> 8]] === 0)
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
            registers().V[(opcode & 0x0F00) >> 8] = delay_timer;
            programCounter += 2;
            break;

          // FX0A - A key press is awaited, and then stored in VX
          case 0x000A:
            {
              let key_pressed = false;

              for (let i = 0; i < 16; ++i) {
                if (key[i] !== 0) {
                  registers().V[(opcode & 0x0F00) >> 8] = i;
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
            delay_timer = registers().V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // FX18 - Sets the sound timer to VX
          case 0x0018:
            sound_timer = registers().V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // FX1E - Adds VX to registers().I
          case 0x001E:
            // VF is set to 1 when range overflow (registers().I+VX>0xFFF), and 0
            // when there isn't.
            if (registers().I + registers().V[(opcode & 0x0F00) >> 8] > 0xFFF)
              registers().V[0xF] = 1;
            else
              registers().V[0xF] = 0;
            registers().I += registers().V[(opcode & 0x0F00) >> 8];
            programCounter += 2;
            break;

          // FX29 - Sets registers().I to the location of the sprite for the
          // character in VX. Characters 0-F (in hexadecimal) are
          // represented by a 4x5 font
          case 0x0029:
            registers().I = registers().V[(opcode & 0x0F00) >> 8] * 0x5;
            programCounter += 2;
            break;

          // FX33 - Stores the Binary-coded decimal representation of VX
          // at the addresses registers().I, registers().I plus 1, and registers().I plus 2
          case 0x0033:
            memory().memory[registers().I] = registers().V[(opcode & 0x0F00) >> 8] / 100;
            memory().memory[registers().I + 1] = (registers().V[(opcode & 0x0F00) >> 8] / 10) % 10;
            memory().memory[registers().I + 2] = registers().V[(opcode & 0x0F00) >> 8] % 10;
            programCounter += 2;
            break;

          // FX55 - Stores V0 to VX in memory() starting at address registers().I
          case 0x0055:
            for (let i = 0; i <= ((opcode & 0x0F00) >> 8); ++i)
              memory().memory[registers().I + i] = registers().V[i];

            // On the original interpreter, when the
            // operation is done, registers().I = registers().I + X + 1.
            registers().I += ((opcode & 0x0F00) >> 8) + 1;
            programCounter += 2;
            break;

          case 0x0065:
            for (let i = 0; i <= ((opcode & 0x0F00) >> 8); ++i)
              registers().V[i] = memory().memory[registers().I + i];

            // On the original interpreter,
            // when the operation is done, registers().I = registers().I + X + 1.
            registers().I += ((opcode & 0x0F00) >> 8) + 1;
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