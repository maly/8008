# 8008
Intel 8008 emulator in pure JavaScript

Used in 8080 emulation at [ASM80 online IDE](http://www.asm80.com)

You can use 8008 also as Node.js or AMD module.

Usage
-----

(a.k.a. The API)

- *window.CPU8008* - main object (instantiated at the start - it shall change)
- *CPU8008.init(memoryTo,memoryAt,ticker, portTo, portAt)* - Initializes the whole system. All parameters are callback functions for port / memory access:
	- memoryTo(addr,value) - store byte to given address
	- memoryAt(addr) - read byte from given address
	- ticker(T) - unused now. For future use
	- portTo(addr,value) - write byte to given port
	- portAt(addr) - read byte from given port
- *CPU8008.T()* - returns clock ticks count from last init (or reset)
- *CPU8008.reset()* - does a CPU reset
- *CPU8008.set(register, value)* - sets internal register (named PC, A, B, C, D, E, H, L, F, SP) to a given value (SP means S, it's for compatibility)
- *CPU8008.status()* - Returns a object {pc, a, b, c, d, e, h, l, f, sp} with actual state of internal registers
- *CPU8008.steps(N)* - Execute instructions as real CPU, which takes "no less than N" clock ticks.
- *CPU8008.disasm(a, b, c)* - Disassembler. Takes 3 successive values (the longest 8008 opcode takes 3 bytes). Returns array of two values - mnemo code and instruction length in bytes, eg. ["ADI 66",2].

Tests
-----

8008 is slightly tested with qUnit - just a basic functionality at this moment

Support
-------

[![Become a Patron!](https://github.com/omenmicro/omenmicro.eu/blob/master/img/become-a-patron-button.png?raw=true)](https://www.patreon.com/bePatron?u=23689010)
