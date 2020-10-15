# CHIP-8 Emulator

<picture>

<intro date="08/03/2020">

![CHIP-8 emulator displaying the CHIP-8 logo.](../files/images/chip8.png)

CHIP-8 is an interpreted programming language that was developed for 8-bit microcomputers in the mid-1970s. This is a very simple CHIP-8 interpreter written in C++. 

</intro>

- [Introduction](#introduction)
- [Implementation](#implementation)
- [Installation and Usage](#installation-and-usage)
- [Acknowledgements etc.](#acknowledgements)

</picture>

## Introduction

CHIP-8 is an interpreted programming language that was developed for 8-bit microcomputers in the mid-1970s. CHIP-8 programs are run on a virtual machine to allows for video games to be more easily programmed for those computers. 

A CHIP-8 emulator is probably the simplest emulator project someone can make. It only has 35 instructions and each opcode is only 2 bytes long. The memory consists of 4096 bytes and there are 16 registers (V1-VF). Along with this, there are no interrupts, only two simple timer registers for delay and sound.

The graphics consists of a 64 by 32 screen and drawing to the screen is done using XOR, and is initialised with a draw flag. If a pixel is turned off as a result of drawing, the VF register is set letting you know if there has been a collision. There is also a simple stack of depth 16.

This all results in a very simple to implement emulator.

## Implementation

My CHIP-8 emulator is written in C++.

The opcodes and vaious pointers are represented as shorts: 
```c++
short opcode;
short I; // index register
short pc; // program counter
short sp; // stack pointer
```
I break the the opcode into what it would represent under different circumstances (what the opcode means). This means that I only need to use bit-shifts once at the beginning of each execution loop. This is as follows:
```c++
uint16_t addr;
uint8_t byte;
short x;
short y;
```
The draw flag is obviosuly represented as a boolean:
```c++
bool drawFlag;
```
Memory, registers, and the stack are implemented using arrays:
```c++
uint8_t memory[4096];
uint8_t v[16];
short stack[16];
```
The two timers are 8-bit unsigned variables:
```c++
uint8_t delayTimer;
uint8_t soundTimer;
```
CHIP-8 code starts at address `0x200`. This would usually contain the interpreter itself. Since this is an emulator, we don't need that. Instead we use this space for the fontset that represents the numbers `0x0` to `0xF`:
```c++
uint8_t fontset[80] = { 
	0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
	0x20, 0x60, 0x20, 0x20, 0x70, // 1
	0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
	0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
	0x90, 0x90, 0xF0, 0x10, 0x10, // 4
	0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
	0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
	0xF0, 0x10, 0x20, 0x40, 0x40, // 7
	0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
	0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
	0xF0, 0x90, 0xF0, 0x90, 0x90, // A
	0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
	0xF0, 0x80, 0x80, 0x80, 0xF0, // C
	0xE0, 0x90, 0x90, 0x90, 0xE0, // D
	0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
	0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    };
```

The emulator itself is very simple. On initialisation, the various arrays and variables are set to zero and the ROM is read to memory. 

When an instruction is read, the opcode is found first by looking at the two bytes at the program counter. These are merged to form the opcode. Next, we work out what the various parts of the opcode might mean. We work out what would be defined if the opcode was manipulating registers, memory, or bytes. This is done so that the case statements don't have right shifts in every case.

```c++
opcode = memory[pc] << 8 | memory[pc + 1];

addr = opcode & 0x0FFF; // if it's an adress instruction
byte = opcode & 0x00FF; // if it's reading/writing a byte
x = (opcode & 0x0F00) >> 8; // if it's accessing a register
y = (opcode & 0x00F0) >> 4; // if it's checking two registers
```

Every possible instruction has its own function which is called inside the opcode switch statement. For example, the opcode `0x2000` is `CALL addr`. The function for this would look like this:

```c++
void Chip8::CALL_addr(uint16_t addr)
{
    stack[sp] = pc;
    sp++;
    pc = addr;
}
```
The switch statement for decoding the opcode first looks at the first part of the opcode by ANDing the opcode with `0xF000`. This means the main switch statement is easy to understand as only the first character of the opcode matters. If multiple opcodes have the same character, then another switch statement is called and the opcode is ANDed again with different 16 bit values depending on the opcode. Part of the main switch statement can be seen below:

```c++
switch(opcode & 0xF000) {
	case 0x1000:
		JP_addr(addr);
		break;
	case 0x2000:
		CALL_addr(addr);
		break;
	case 0x8000:
		switch (opcode & 0xF00F) {
			case 0x8000:
				LD_Vx_Vy(x, y);
				break; 
			case 0x8001:
				OR_Vx_Vy(x, y);
				break;
			// more cases, this just a sample
			}
	}
```

This is essentially the entire emulator. The execution code is called repeatedly and all the registers, memory, and display memory are updated accordingly. If the draw flag is set then the screen is drawn. It is as simple as that.

The CHIP-8 emulator has its own keypad. In order to replicate this for normal computer keyboards, we use the mapping that everyone who makes a CHIP-8 emulator seems to use:


```
Keypad                   Keyboard
+-+-+-+-+                +-+-+-+-+
|1|2|3|C|                |1|2|3|4|
+-+-+-+-+                +-+-+-+-+
|4|5|6|D|                |Q|W|E|R|
+-+-+-+-+       =>       +-+-+-+-+
|7|8|9|E|                |A|S|D|F|
+-+-+-+-+                +-+-+-+-+
|A|0|B|F|                |Z|X|C|V|
+-+-+-+-+                +-+-+-+-+
```

This input is handled using the SDL2 library. When the emulator is waiting for input we use the SDL events to determine which key is pressed. This is done by keeping the keys in an array and using a while loop to handle key press and release events. These are all done every cycle along with the opcode decoding and execution.

```c++
// Keypad array
uint8_t keys[16] = {SDLK_x, SDLK_1, SDLK_2, SDLK_3, SDLK_q, SDLK_w, SDLK_e, SDLK_a, SDLK_s, SDLK_d, SDLK_z, SDLK_c, SDLK_4, SDLK_r, SDLK_f, SDLK_v};

// Handle SDL events
while (SDL_PollEvent(&e)) {
	// Handle key press events
	if (e.type == SDL_KEYDOWN) {
		if (e.key.keysym.sym == SDLK_ESCAPE) {
			return 0;
		}

		for (int i = 0; i < 16; i++) {
			if (e.key.keysym.sym == keys[i]) {
				chip8.keypad[i] = 1;
			}
		}
	}

	// Handle key release events
	if (e.type == SDL_KEYUP) {
		for (int i = 0; i < 16; i++) {
			if (e.key.keysym.sym == keys[i]) {
				chip8.keypad[i] = 0;
			}
		}
	}
} 
```

That's it. As stated at the beginning, a CHIP-8 emulator is very easy to write. Information on installation and usage can be seen below.

## Installation and Usage

**Prerequisites**

This emulator utilises SDL2 for graphics. If you are using Ubuntu this can be easily installed by running `sudo apt-get install libsdl2-dev` in the terminal.

For other operating systems see [this page from the libsdl wiki](https://wiki.libsdl.org/Installation).

**Installation**

Compile with `g++ main.cpp -o chip8 -l SDL2 `

Run with `./chip8 <ROM> <width> <height>`

Alternatively, run `./chip8 <ROM>` for a window with `width=1024`, and `height=512`.

**ROMS**

The [GitHub repository](https://github.com/joshjennings98/chip8) includes a two player game of pong at `pong.ch8`. 

For some more roms to try out, see [this GitHub repo](https://github.com/loktar00/chip8/tree/master/roms).

To see the controls, read the implementation section.

## Acknowledgements

These resources were helpful when I programmed this:

* [http://devernay.free.fr/hacks/chip8](http://devernay.free.fr/hacks/chip8/C8TECH10.HTM)
* [http://www.multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/](http://www.multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/)
* [https://en.wikipedia.org/wiki/CHIP-8](https://en.wikipedia.org/wiki/CHIP-8)
* [https://mir3z.github.io/chip8-emu/](https://mir3z.github.io/chip8-emu/)
* [https://github.com/JamesGriffin/CHIP-8-Emulator](https://github.com/JamesGriffin/CHIP-8-Emulator)

## GitHub Repository

The full project can be viewed on [GitHub.](https://github.com/joshjennings98/chip8)

