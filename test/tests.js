module("Syntax and coding standards");

jsHintTest("JSHint", "../8008.js");

module("Basic tests");

test("Namespace", function () {
  notEqual(CPU8008, null, "CPU8008 is defined");
  equal(typeof CPU8008, "object", "CPU8008 is an object");
});

module("Simple OP tests", {
  setup: function () {},
});
var byteAt = function (addr) {
  return RAM[addr];
};
var byteTo = function (addr, v) {
  RAM[addr] = v;
};

var RAM;

test("Reset", function () {
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.reset();
  var s = CPU8008.status();
  equal(s.pc, 0x0, "Reset");
});

test("Flags", function () {
  RAM = [0xc0];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("f", 0xff);
  CPU8008.set("pc", 0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.f, 0x0f, "Flags");
});

test("Simple op LAB", function () {
  RAM = [0xc1, 2, 0x55];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("a", 0x55);
  CPU8008.set("b", 0xaa);
  console.log(CPU8008.status());
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.a, 0xaa, "Operation");
  equal(s.b, 0xaa, "Operation");
  equal(CPU8008.T(), 10, "Timer");
});

test("Simple op LAM", function () {
  RAM = [0xc7, 2, 0xaa];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("a", 0x55);
  CPU8008.set("h", 0x0);
  CPU8008.set("l", 0x2);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.a, 0xaa, "Operation");
  equal(CPU8008.T(), 16, "Timer");
});

test("Simple op LMA", function () {
  RAM = [0xf8, 2, 0xaa];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("a", 0x55);
  CPU8008.set("h", 0x0);
  CPU8008.set("l", 0x2);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.a, 0x55, "Operation");
  equal(RAM[2], 0x55, "Operation");
  equal(CPU8008.T(), 14, "Timer");
});

test("Simple op LAI 02", function () {
  RAM = [0x06, 2, 0x55];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 2, "PC");
  equal(s.a, 2, "Operation");
  equal(CPU8008.T(), 16, "Timer");
});

test("Simple op LMI 02", function () {
  RAM = [0x3e, 2, 0x55];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("h", 0x0);
  CPU8008.set("l", 0x2);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 2, "PC");
  equal(RAM[2], 0x02, "Operation");
  equal(CPU8008.T(), 18, "Timer");
});

test("Simple op INC", function () {
  RAM = [0x10];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("c", 0x0);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.c, 1, "Operation");
  equal(s.f, 0, "Flags");
  equal(CPU8008.T(), 10, "Timer");

  CPU8008.set("pc", 0);
  CPU8008.set("c", 0xff);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.c, 0, "Operation");
  equal(s.f, 6, "Flags");
});

test("Simple op DEC", function () {
  RAM = [0x11];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("c", 0x0);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.c, 0xff, "Operation");
  equal(s.f, 10, "Flags");
  equal(CPU8008.T(), 10, "Timer");

  CPU8008.set("pc", 0);
  CPU8008.set("c", 0x1);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 1, "PC");
  equal(s.c, 0, "Operation");
  equal(s.f, 6, "Flags");
});

test("Simple op JMP", function () {
  RAM = [0x44, 0x12, 0xf4];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 0x3412, "PC");
  equal(s.f, 0, "Flags");
  equal(CPU8008.T(), 22, "Timer");
});

test("Simple op JFC", function () {
  RAM = [0x40, 0x12, 0xf4];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 0x3412, "PC");
  equal(s.f, 0, "Flags");
  equal(CPU8008.T(), 22, "Timer");
});

test("Simple op JTC", function () {
  RAM = [0x60, 0x12, 0xf4];
  CPU8008.init(byteTo, byteAt, null);
  CPU8008.set("pc", 0);
  CPU8008.set("f", 0x0);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 0x3, "PC");
  equal(s.f, 0, "Flags");
  equal(CPU8008.T(), 18, "Timer");
});

test("Simple op OUT", function () {
  RAM = [0x51, 0x12, 0xf4, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  CPU8008.init(byteTo, byteAt, null, byteTo, byteAt);
  CPU8008.set("pc", 0);
  CPU8008.set("a", 0x55);
  CPU8008.steps(1);
  var s = CPU8008.status();
  equal(s.pc, 0x1, "PC");
  equal(RAM[0], 0x55, "Flags");
  equal(CPU8008.T(), 12, "Timer");
});
