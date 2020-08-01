// Copyright (C) 2020 Martin Maly
//
// JS emulator for Intel 8008 CPU.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// DEVELOPERS AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

/* jshint sub: true */

(function (name, definition) {
  if (typeof module != "undefined") module.exports = definition();
  else if (typeof define == "function" && typeof define.amd == "object")
    define(definition);
  else this[name] = definition();
})("CPU8008", function () {
  var flagTable = [
    6,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    2,
    0,
    0,
    2,
    2,
    0,
    0,
    2,
    0,
    2,
    2,
    0,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
    8,
    10,
    10,
    8,
    8,
    10,
    10,
    8,
    10,
    8,
    8,
    10,
  ];

  function pad(str, n) {
    var r = [];
    for (var i = 0; i < n - str.length; ++i) r.push("0");
    r.push(str);
    return r.join("");
  }

  var CARRY = 0x01;
  var PARITY = 0x02;
  var ZERO = 0x04;
  var SIGN = 0x08;

  var byteTo, byteAt, portOut, portIn, ticks;

  var cpu = {
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
    h: 0,
    l: 0,
    pc: 0,
    sp: [],
    f: 0,
    halted: false,
    cycles: 0,
    hl: function () {
      return this.l | (this.h << 8);
    },

    dst: function (v, r) {
      if (r == "M") {
        writeByte(this.hl(), v);
      } else {
        this[r] = v;
      }
    },
    src: function (r) {
      if (r == "M") {
        return byteAt(this.hl());
      } else {
        return this[r];
      }
    },
  };

  var toString = function () {
    return (
      "{" +
      " af: " +
      pad(this.af().toString(16), 4) +
      " bc: " +
      pad(this.bc().toString(16), 4) +
      " de: " +
      pad(this.de().toString(16), 4) +
      " hl: " +
      pad(this.hl().toString(16), 4) +
      " pc: " +
      pad(this.pc.toString(16), 4) +
      " sp: " +
      pad(this.sp.toString(16), 4) +
      " flags: " +
      (cpu.f & ZERO ? "z" : ".") +
      (cpu.f & SIGN ? "s" : ".") +
      (cpu.f & PARITY ? "p" : ".") +
      (cpu.f & CARRY ? "c" : ".") +
      " " +
      " }"
    );
  };

  // Load the data from the array into the Cpu memory
  // starting at address.

  // Step through one instruction
  var step = function () {
    if (cpu.halted) {
      cpu.cycles++;
      return 1;
    }
    var i = byteAt(cpu.pc++);
    var inT = cpu.cycles;
    execute(i);
    cpu.pc &= 0x3fff;
    //processInterrupts();
    return cpu.cycles - inT;
  };

  var writePort = function (port, v) {
    if (portOut) portOut(port & 0x1f, v);
  };

  var readPort = function (port) {
    if (portIn) return portIn(port & 0x7);
    return 255;
  };

  var getByte = function (addr) {
    return byteAt(addr & 0x3fff);
  };

  var getWord = function (addr) {
    //var ram = this.ram;
    var l = byteAt(addr & 0x3fff);
    var h = byteAt((addr + 1) & 0x3fff);
    return (h << 8) | l;
  };

  var nextByte = function () {
    var pc = cpu.pc;
    var b = byteAt(pc & 0x3fff);
    cpu.pc = (pc + 1) & 0x3fff;
    return b;
  };

  var nextWord = function () {
    //var ram = this.ram;
    var l = byteAt(cpu.pc & 0xffff);
    var h = byteAt((cpu.pc + 1) & 0xffff);
    cpu.pc = (cpu.pc + 2) & 0x3fff;
    return (h << 8) | l;
  };

  var writeByte = function (addr, value) {
    var v = value & 0xff;
    byteTo(addr & 0x3fff, v);
  };

  var writeWord = function (addr, value) {
    var l = value;
    var h = value >> 8;
    this.writeByte(addr & 0x3fff, l);
    this.writeByte((addr + 1) & 0x3fff, h);
  };

  var szp = function (r) {
    cpu.f = (cpu.f & 1) | flagTable[r];
  };

  // set flags after arithmetic and logical ops
  var calcFlags = function (v, lhs, rhs) {
    var x = v & 0xff;

    if (v >= 0x100 || v < 0) cpu.f |= CARRY;
    else cpu.f &= ~CARRY & 0xff;

    cpu.f = flagTable[x];
    if (v >= 0x100 || v < 0) cpu.f |= CARRY;
    else cpu.f &= ~CARRY & 0xff;

    return x;
  };

  var incrementByte = function (o) {
    var c = flags & CARRY; // carry isnt affected
    var r = this.calcFlags(o + 1, o, 1);
    cpu.f = (cpu.f & ~CARRY & 0xff) | c;
    if ((r & 0x0f) === 0) {
      cpu.f = flags | HALFCARRY;
    } else {
      flags &= ~HALFCARRY & 0xff;
    }
    return r;
  };

  var decrementByte = function (o) {
    var c = flags & CARRY; // carry isnt affected
    var r = this.calcFlags(o - 1, o, 1);
    cpu.f = (cpu.f & ~CARRY & 0xff) | c;
    if ((o & 0x0f) > 0) {
      cpu.f = flags | HALFCARRY;
    } else {
      flags &= ~HALFCARRY & 0xff;
    }

    return r;
  };

  var addByte = function (lhs, rhs) {
    var mid = this.calcFlags(lhs + rhs, lhs, rhs);
    this.acADD(lhs, rhs, mid);
    return mid;
  };

  var addByteWithCarry = function (lhs, rhs) {
    var mid = this.addByte(lhs, rhs + (cpu.f & CARRY ? 1 : 0));
    this.acADD(lhs, rhs, mid);
    return mid;
  };

  var subtractByte = function (lhs, rhs) {
    var mid = this.calcFlags(lhs - rhs, lhs, rhs);
    this.acSUB(lhs, rhs, mid);
    return mid;
  };

  var subtractByteWithCarry = function (lhs, rhs) {
    var nrhs = rhs + (cpu.f & CARRY ? 1 : 0);
    var mid = this.calcFlags(lhs - nrhs, lhs, nrhs);
    //  var mid =  this.calcFlags(lhs, rhs + ((cpu.f & CARRY) ? 1 : 0));
    this.acSUB(lhs, rhs, mid);
    return mid;
  };

  var andByte = function (lhs, rhs) {
    var x = this.calcFlags(lhs & rhs, lhs, rhs);
    var ac = (lhs & 0x08) | (rhs & 0x08);
    if (ac > 0) {
      flags |= HALFCARRY;
    } else {
      flags &= ~HALFCARRY;
    }
    flags &= ~CARRY & 0xff;
    return x;
  };

  var xorByte = function (lhs, rhs) {
    var x = this.calcFlags(lhs ^ rhs, lhs, rhs);
    //flags |= HALFCARRY;
    flags &= ~HALFCARRY;
    flags &= ~CARRY & 0xff;
    return x;
  };

  var orByte = function (lhs, rhs) {
    var x = this.calcFlags(lhs | rhs, lhs, rhs);
    //flags |= HALFCARRY;
    flags &= ~HALFCARRY;
    flags &= ~CARRY & 0xff;
    return x;
  };

  var addWord = function (lhs, rhs) {
    var r = lhs + rhs;
    if (r > 0xffff) {
      flags |= CARRY;
    } else {
      flags &= ~CARRY;
    }

    /*
  flags |= SIGN;
  flags |= ZERO;
  flags |= HALFCARRY;
  flags |= PARITY;
*/
    return r & 0xffff;
  };

  var processInterrupts = function () {};

  var tx = function (n) {
    cpu.cycles += n;
  };
  var txm = function (r, n, nm) {
    if (r == "M") cpu.cycles += nm;
    else cpu.cycles += n;
  };

  var condCheck = function (dest) {
    var cond = dest & 3;
    var condl = 0;
    if (cond === 0) condl = cpu.f & CARRY ? 1 : 0;
    else if (cond === 1) condl = cpu.f & ZERO ? 1 : 0;
    else if (cond === 1) condl = cpu.f & SIGN ? 1 : 0;
    else condl = cpu.f & PARITY ? 1 : 0;
    return dest >> 2 == condl ? 1 : 0;
  };

  var storeA = function (val) {
    cpu.a = val & 0xff;
    szp(cpu.a);
    if (val > 255 || val < 0) cpu.f |= CARRY;
    else cpu.f &= ~CARRY;
  };

  var execute = function (i) {
    var addr, w, c, val;

    cpu.f = cpu.f & 0x0f;
    cpu.pc = cpu.pc & 0x3fff;

    /*
    if (i == 0xff || i === 0x00 || i == 0x01) {
      // HALT
      tx(8);
      cpu.halted = true;
      return;
    }
    */
    //maybe we will need a register
    var dest = (i & 0x38) >> 3;
    var src = i & 0x07;
    var dr = "abcdehlM"[dest];
    var sr = "abcdehlM"[src];
    var qq = i >> 6;

    //0xc0 - 0xff
    //Lxx / MOV instructions
    //11xx xxxx
    if (qq == 3) {
      //Lxy
      if (sr == "M" && dr == "M") {
        //hlt
        cpu.halted = true;
        tx(8);
      }
      if (sr != "M" && dr != "M") {
        cpu.dst(cpu[sr], dr);
        tx(10);
        return;
      }
      if (dr == "M") {
        cpu.dst(cpu[sr], dr);
        tx(14);
        return;
      }
      cpu.dst(byteAt(cpu.hl()), dr);
      tx(16);
      return;
    }
    // ----- Lxx end

    //arithmetics
    else if (qq == 2) {
      txm(dr, 10, 16);
      if (src === 0) {
        //add
        val = cpu.a + cpu.src(dr);
        storeA(val);
        return;
      }
      if (src === 1) {
        //adi
        val = cpu.a + cpu.src(dr);
        if (cpu.f & CARRY) val++;
        storeA(val);
        return;
      }
      if (src === 2) {
        //sux
        val = cpu.a - cpu.src(dr);
        storeA(val);
        return;
      }
      if (src === 3) {
        //sbx
        val = cpu.a - cpu.src(dr);
        if (cpu.f & CARRY) val--;
        storeA(val);
        return;
      }

      if (src === 4) {
        //and
        val = cpu.a & cpu.src(dr);
        storeA(val);
        return;
      }
      if (src === 5) {
        //xor
        val = cpu.a ^ cpu.src(dr);
        storeA(val);
        return;
      }
      if (src === 6) {
        //xor
        val = cpu.a | cpu.src(dr);
        storeA(val);
        return;
      }
      if (src === 7) {
        //cp

        var olda = cpu.a;
        val = cpu.a - cpu.src(dr);
        storeA(val);
        cpu.a = olda;
        return;
      }
    }
    //branches / inputs
    else if (qq == 1) {
      if ((src & 1) === 1) {
        var port = (i > 1) & 0x1f;
        if (port < 8) {
          cpu.a = readPort(port) & 0xff;
        } else {
          writePort(port, cpu.a);
        }
        return;
      }
      var adx = nextWord() & 0x3fff;
      var cond = condCheck(dest & 3);
      //branches / inputs
      if (src === 4) cond = 1;
      if (src === 6) cond = 1;
      if ((src & 0x3) === 0) {
        //jump
        if (cond) {
          tx(22);
          cpu.pc = adx;
        } else {
          tx(18);
        }
        return;
      }
      if ((src & 0x3) === 2) {
        //call
        if (cond) {
          tx(22);
          cpu.sp.push(cpu.pc);
          cpu.pc = adx;
        } else {
          tx(18);
        }
        return;
      }
    }

    // others
    else if (qq === 0) {
      //others
      if (src === 0) {
        //inr
        if (dr == "M") return; //not defined
        if (dr != "a") {
          cpu[dr] = ++cpu[dr] & 0xff;
          szp(cpu[dr]);
          tx(10);
        } else {
          cpu.halted = true;
          tx(8);
        }
        return;
      }
      if (src === 1) {
        //dcr
        if (dr == "M") return; //not defined
        if (dr != "a") {
          cpu[dr] = --cpu[dr] & 0xff;
          szp(cpu[dr]);
          tx(10);
        } else {
          cpu.halted = true;
          tx(8);
        }
        return;
      }

      if (src === 2) {
        //rotations
        if (dest > 3) return; //not defined
        tx(10);
        var cy;
        switch (dest) {
          case 0:
            val = cpu.a << 1;
            cy = val > 255 ? 1 : 0;
            cpu.a = (val & 0xff) | cy;
            break;
          case 1:
            cy = cpu.a & 1;
            val = cpu.a >> 1;
            cpu.a = (val & 0xff) | (cy << 7);
            break;
          case 2:
            val = cpu.a << 1;
            cy = val > 255 ? 1 : 0;
            cpu.a = (val & 0xff) | (cpu.f & 1);
            break;
          case 3:
            cy = cpu.a & 1;
            val = cpu.a >> 1;
            cpu.a = (val & 0xff) | ((cpu.f & 1) << 7);
            break;
        }
        if (cy) cpu.f |= CARRY;
        else cpu.f &= ~CARRY;
        return;
      }

      if (src == 3) {
        //RET cond
        var cond = condCheck(dest & 3);
        if (cond) {
          tx(10);
          if (cpu.sp.length < 1) return;
          cpu.pc = cpu.sp.pop() & 0x3fff;
        } else {
          tx(6);
        }
        return;
      }

      if (src == 4) {
        //ALU with imm
        tx(16);
        var cy = cpu.f & CARRY ? CARRY : 0;
        val = nextByte();
        if (dest === 0) {
          //add
          val = cpu.a + val;
          storeA(val);
        }
        if (dest === 1) {
          //adi
          val = cpu.a + val;
          if (cpu.f & CARRY) val++;
          storeA(val);
        }
        if (dest === 2) {
          //sux
          val = cpu.a - val;
          storeA(val);
        }
        if (dest === 3) {
          //sbx
          val = cpu.a - val;
          if (cpu.f & CARRY) val--;
          storeA(val);
        }

        if (dest === 4) {
          //and
          val = cpu.a & val;
          storeA(val);
        }
        if (dest === 5) {
          //xor
          val = cpu.a ^ val;
          storeA(val);
        }
        if (dest === 6) {
          //xor
          val = cpu.a | val;
          storeA(val);
        }
        if (dest === 7) {
          //cp

          var olda = cpu.a;
          val = cpu.a - val;
          storeA(val);
          cpu.a = olda;
        }
        if (cy) cpu.f |= CARRY;
        else cpu.f &= ~CARRY;
        return;
      }
      if (src == 5) {
        //RST cond
        tx(10);
        cpu.sp.push(cpu.pc);
        cpu.pc = dest * 8;
        return;
      }
      if (src == 6) {
        //LxI
        val = nextByte();
        tx(16);
        cpu.dst(val, dr);
        if (dr == "M") {
          tx(2);
        }
        return;
      }
      if (src === 7) {
        if (cpu.sp.length < 1) return;
        cpu.pc = cpu.sp.pop() & 0x3fff;
        tx(10);
        return;
      }
    }
  };

  var tracer = false;

  var reset = function () {
    //pc=wordAt(ResetTo);
    cpu.pc = 0;
    cpu.sp = [];
    cpu.halted = false;
    cpu.ra = cpu.rb = cpu.rc = cpu.rd = cpu.re = cpu.rh = cpu.rl = 0;
    cpu.f = 0;
    inte = 0;
    cpu.cycles = 0;
  };

  var goTrace = function (proc) {
    console.log(toHex4(proc.pc));
  };

  // ============ DISASSEMBLER
  var dx = [
    ["*HLT", 1],
    ["*HLT", 1],
    ["RLC", 1],
    ["RFC", 1],
    ["ADI d8", 2],
    ["RST 0", 1],
    ["LAI d8", 2],
    ["RET", 1],
    ["INB", 1],
    ["DCB", 1],
    ["RRC", 1],
    ["RFZ", 1],
    ["ACI d8", 2],
    ["RST 1", 1],
    ["LBI d8", 2],
    ["*RET", 1],
    ["INC", 1],
    ["DCC", 1],
    ["RAL", 1],
    ["RFS", 1],
    ["SUI d8", 2],
    ["RST 2", 1],
    ["LCI d8", 2],
    ["*RET", 1],
    ["IND", 1],
    ["DCD", 1],
    ["RAR", 1],
    ["RFP", 1],
    ["SBI d8", 2],
    ["RST 3", 1],
    ["LDI d8", 2],
    ["*RET", 1],
    ["INE", 1],
    ["DCE", 1],
    ["*NOP", 1],
    ["RTC", 1],
    ["NDI d8", 2],
    ["RST 4", 1],
    ["LEI d8", 2],
    ["*RET", 1],
    ["INH", 1],
    ["DCH", 1],
    ["*NOP", 1],
    ["RTZ", 1],
    ["XRI d8", 2],
    ["RST 5", 1],
    ["LHI d8", 2],
    ["*RET", 1],
    ["INL", 1],
    ["DCL", 1],
    ["*NOP", 1],
    ["RTS", 1],
    ["ORI d8", 2],
    ["RST 6", 1],
    ["LLI d8", 2],
    ["*RET", 1],
    ["*NOP", 1],
    ["*NOP", 1],
    ["*NOP", 1],
    ["RTP", 1],
    ["CPI d8", 2],
    ["RST 7", 1],
    ["LMI d8", 2],
    ["*RET", 1],
    ["JFC a16", 3],
    ["INP 0", 1],
    ["CFC a16", 3],
    ["INP 1", 1],
    ["JMP a16", 3],
    ["INP 2", 1],
    ["CAL a16", 3],
    ["INP 3", 1],
    ["JFZ a16", 3],
    ["INP 4", 1],
    ["CFZ a16", 3],
    ["INP 5", 1],
    ["*JMP a16", 3],
    ["INP 6", 1],
    ["*CAL a16", 3],
    ["INP 7", 1],
    ["JFS a16", 3],
    ["OUT 8", 1],
    ["CFS a16", 3],
    ["OUT 9", 1],
    ["*JMP a16", 3],
    ["OUT 10", 1],
    ["*CAL a16", 3],
    ["OUT 11", 1],
    ["JFP a16", 3],
    ["OUT 12", 1],
    ["CFP a16", 3],
    ["OUT 13", 1],
    ["*JMP a16", 3],
    ["OUT 14", 1],
    ["*CAL a16", 3],
    ["OUT 15", 1],
    ["JTC a16", 3],
    ["OUT 16", 1],
    ["CTC a16", 3],
    ["OUT 17", 1],
    ["*JMP a16", 3],
    ["OUT 18", 1],
    ["*CAL a16", 3],
    ["OUT 19", 1],
    ["JTZ a16", 3],
    ["OUT 20", 1],
    ["CTZ a16", 3],
    ["OUT 21", 1],
    ["*JMP a16", 3],
    ["OUT 22", 1],
    ["*CAL a16", 3],
    ["OUT 23", 1],
    ["JTS a16", 3],
    ["OUT 24", 1],
    ["CTS a16", 3],
    ["OUT 25", 1],
    ["*JMP a16", 3],
    ["OUT 26", 1],
    ["*CAL a16", 3],
    ["OUT 27", 1],
    ["JTP a16", 3],
    ["OUT 28", 1],
    ["CTP a16", 3],
    ["OUT 29", 1],
    ["*JMP a16", 3],
    ["OUT 30", 1],
    ["*CAL a16", 3],
    ["OUT 31", 1],
    ["ADA", 1],
    ["ADB", 1],
    ["ADC", 1],
    ["ADD", 1],
    ["ADE", 1],
    ["ADH", 1],
    ["ADL", 1],
    ["ADM", 1],
    ["ACA", 1],
    ["ACB", 1],
    ["ACC", 1],
    ["ACD", 1],
    ["ACE", 1],
    ["ACH", 1],
    ["ACL", 1],
    ["ACM", 1],
    ["SUA", 1],
    ["SUB", 1],
    ["SUC", 1],
    ["SUD", 1],
    ["SUE", 1],
    ["SUH", 1],
    ["SUL", 1],
    ["SUM", 1],
    ["SBA", 1],
    ["SBB", 1],
    ["SBC", 1],
    ["SBD", 1],
    ["SBE", 1],
    ["SBH", 1],
    ["SBL", 1],
    ["SBM", 1],
    ["NDA", 1],
    ["NDB", 1],
    ["NDC", 1],
    ["NDD", 1],
    ["NDE", 1],
    ["NDH", 1],
    ["NDL", 1],
    ["NDM", 1],
    ["XRA", 1],
    ["XRB", 1],
    ["XRC", 1],
    ["XRD", 1],
    ["XRE", 1],
    ["XRH", 1],
    ["XRL", 1],
    ["XRM", 1],
    ["ORA", 1],
    ["ORB", 1],
    ["ORC", 1],
    ["ORD", 1],
    ["ORE", 1],
    ["ORH", 1],
    ["ORL", 1],
    ["ORM", 1],
    ["CPA", 1],
    ["CPB", 1],
    ["CPC", 1],
    ["CPD", 1],
    ["CPE", 1],
    ["CPH", 1],
    ["CPL", 1],
    ["CPM", 1],
    ["NOP", 1],
    ["LAB", 1],
    ["LAC", 1],
    ["LAD", 1],
    ["LAE", 1],
    ["LAH", 1],
    ["LAL", 1],
    ["LAM", 1],
    ["LBA", 1],
    ["LBB", 1],
    ["LBC", 1],
    ["LBD", 1],
    ["LBE", 1],
    ["LBH", 1],
    ["LBL", 1],
    ["LBM", 1],
    ["LCA", 1],
    ["LCB", 1],
    ["LCC", 1],
    ["LCD", 1],
    ["LCE", 1],
    ["LCH", 1],
    ["LCL", 1],
    ["LCM", 1],
    ["LDA", 1],
    ["LDB", 1],
    ["LDC", 1],
    ["LDD", 1],
    ["LDE", 1],
    ["LDH", 1],
    ["LDL", 1],
    ["LDM", 1],
    ["LEA", 1],
    ["LEB", 1],
    ["LEC", 1],
    ["LED", 1],
    ["LEE", 1],
    ["LEH", 1],
    ["LEL", 1],
    ["LEM", 1],
    ["LHA", 1],
    ["LHB", 1],
    ["LHC", 1],
    ["LHD", 1],
    ["LHE", 1],
    ["LHH", 1],
    ["LHL", 1],
    ["LHM", 1],
    ["LLA", 1],
    ["LLB", 1],
    ["LLC", 1],
    ["LLD", 1],
    ["LLE", 1],
    ["LLH", 1],
    ["LLL", 1],
    ["LLM", 1],
    ["LMA", 1],
    ["LMB", 1],
    ["LMC", 1],
    ["LMD", 1],
    ["LME", 1],
    ["LMH", 1],
    ["LML", 1],
    ["HLT", 1],
  ];
  var disasm = function (a, b, c) {
    var pad4 = function (q) {
      while (q.length < 4) {
        q = "0" + q;
      }
      return q;
    };
    var pad2 = function (q) {
      while (q.length < 2) {
        q = "0" + q;
      }
      return q;
    };
    var out = dx[a];
    if (out[1] == 2) {
      out[0] = out[0].replace("d8", "" + pad2(b.toString(16)));
    }
    if (out[1] == 3) {
      out[0] = out[0].replace("a16", "" + pad4((b + 256 * c).toString(16)));
    }
    return out;
  };
  // ============ MAIN

  return {
    trace: function (stat) {
      tracer = stat;
    },
    steps: function (Ts) {
      T = 0;

      while (Ts > 0) {
        var ticks = step();
        if (!ticks) ticks = 1; //at least...
        Ts -= ticks;

        if (tracer) goTrace(cpu);
      }
    },
    T: function () {
      return cpu.cycles;
    },
    memr: function (addr) {
      return byteAt(addr);
    },

    reset: reset,
    init: function (bt, ba, tck, porto, porti) {
      byteTo = bt;
      byteAt = ba;
      ticks = tck;
      portOut = porto;
      portIn = porti;
      //proc = new Cpu();
      reset();
    },
    status: function () {
      return cpu;
    },
    interrupt: function (vector) {
      proc.halted = 0;
      proc.push(proc.pc);
      proc.pc = vector || 0x38;
    },
    set: function (reg, value) {
      reg = reg.toUpperCase();
      switch (reg) {
        case "PC":
          cpu.pc = value;
          return;
        case "A":
          cpu.a = value;
          return;
        case "B":
          cpu.b = value;
          return;
        case "C":
          cpu.c = value;
          return;
        case "D":
          cpu.d = value;
          return;
        case "E":
          cpu.e = value;
          return;
        case "H":
          cpu.h = value;
          return;
        case "L":
          cpu.l = value;
          return;
        case "F":
          cpu.f = value;
          return;
        case "SP":
          cpu.sp = value;
          return;
      }
    },
    flagsToString: function () {
      var f = "",
        fx = "SZPC";
      for (var i = 0; i < 4; i++) {
        var n = cpu.f & (0x8 >> i);
        if (n === 0) {
          f += fx[i].toLowerCase();
        } else {
          f += fx[i];
        }
      }
      return f;
    },
    disasm: disasm,
  };
});
