module("Syntax and coding standards");

jsHintTest( "JSHint", "../../emu/8008.js");

module("Basic tests");

test( "Namespace", function() {
	notEqual( CPU8008, null, "CPU8008 is defined" );
    equal( typeof(CPU8008), "object", "CPU8008 is an object" );
});


module("Simple OP tests" , {
	setup: function() {

	}
});
var byteAt = function(addr){return RAM[addr];};
var byteTo = function(addr,v){RAM[addr] = v;};

var RAM;

test( "Reset", function() {
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.reset();
	var s = (CPU8008.status());
	equal(s.pc,0x0,"Reset");
});

test( "Flags", function() {
	RAM = [0xc0];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("f",0xff);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.f,0x0F,"Flags");
});



test( "Simple op LAB", function() {
	RAM = [0xc1,2,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.set("a",0x55);
	CPU8008.set("b",0xaa);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,1,"PC");
	equal(s.a,0xaa,"Operation");
	equal(s.b,0xaa,"Operation");
	equal(CPU8008.T(),10,"Timer");

});

test( "Simple op LAM", function() {
	RAM = [0xc7,2,0xaa];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.set("a",0x55);
	CPU8008.set("h",0x0);
	CPU8008.set("l",0x2);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,1,"PC");
	equal(s.a,0xaa,"Operation");
	equal(CPU8008.T(),16,"Timer");

});

test( "Simple op LMA", function() {
	RAM = [0xf8,2,0xaa];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.set("a",0x55);
	CPU8008.set("h",0x0);
	CPU8008.set("l",0x2);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,1,"PC");
	equal(s.a,0x55,"Operation");
	equal(RAM[2],0x55,"Operation");
	equal(CPU8008.T(),14,"Timer");

});

test( "Simple op LAI 02", function() {
	RAM = [0x06,2,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,2,"PC");
	equal(s.a,2,"Operation");
	equal(CPU8008.T(),16,"Timer");

});

test( "Simple op LMI 02", function() {
	RAM = [0x3e,2,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.set("h",0x0);
	CPU8008.set("l",0x2);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,2,"PC");
	equal(RAM[2],0x02,"Operation");
	equal(CPU8008.T(),18,"Timer");

});


test( "Simple op STAA 02", function() {
	RAM = [0x97,2,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.set("a",0xaa);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,2,"PC");
	equal(RAM[2],0xaa,"Operation");
	equal(CPU8008.T(),4,"Timer");

});



test( "Simple op - extended", function() {
	RAM = [0x70,0,3,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0xab,"Operation NEG");
	equal(CPU8008.T(),6,"Timer");

});

test( "Simple op - clear", function() {
	RAM = [0x7F,0,3,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(s.flags & 0x0f,0x04,"Flags nZvc");
	equal(RAM[3],0x00,"Operation CLR");
	equal(CPU8008.T(),6,"Timer");

});



test( "Simple op 2", function() {
	RAM = [0x73,0,3,0xAa];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x55,"Operation COM");
	equal(s.flags & 0x03,0x01,"Flags C");
	equal(CPU8008.T(),6,"Timer");

});

test( "ROL", function() {
	RAM = [0x79,0,3,0x10];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x20,"Operation COM");
	equal(s.flags & 0x03,0x00,"Flags C");
	equal(CPU8008.T(),6,"Timer");
	CPU8008.set("pc",0);
	CPU8008.set("flags",1);

	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x41,"Operation COM");
	equal(s.flags & 0x03,0x00,"Flags C");
	equal(CPU8008.T(),12,"Timer");

});


test( "ROR", function() {
	RAM = [0x76,0,3,0x09];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x04,"Operation COM");
	equal(s.flags & 0x03,0x01,"Flags C");
	equal(CPU8008.T(),6,"Timer");
	CPU8008.set("pc",0);

	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x82,"Operation COM");
	equal(s.flags & 0x03,0x00,"Flags C");
	equal(CPU8008.T(),12,"Timer");

});

test( "ASL", function() {
	RAM = [0x78,0,3,0xA0];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x40,"Operation COM");
	equal(s.flags & 0x03,0x01,"Flags C");
	equal(CPU8008.T(),6,"Timer");
	CPU8008.set("pc",0);

	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	equal(RAM[3],0x80,"Operation COM");
	equal(s.flags & 0x03,0x00,"Flags C");
	equal(CPU8008.T(),12,"Timer");

});


test( "ADD etc.", function() {
	RAM = [0x86, 5, 0x9b, 2, 0x97,6];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	CPU8008.steps(1);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,6,"PC");
	equal(RAM[6],160,"Operation COM");
	equal(CPU8008.T(),9,"Timer");


});


/*
test( "SEX", function() {
	RAM = [0x1D];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("b",0xAA);
	CPU8008.set("flags",0xff);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,1,"PC");
	equal(s.a,0xff,"A");
	//equal(RAM[2],0x55,"Operation");
	equal(s.flags & 0x0F,0x09,"Flags C");
	equal(CPU8008.T(),2,"Timer");

});
test( "EXG", function() {
	RAM = [0x1E, 0x89];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("a",0xAA);
	CPU8008.set("b",0x55);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,2,"PC");
	equal(s.a,0x55,"A");
	equal(s.b,0xAA,"A");
	//equal(RAM[2],0x55,"Operation");
	equal(CPU8008.T(),8,"Timer");

});
test( "TFR", function() {
	RAM = [0x1F, 0x89];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("a",0xAA);
	CPU8008.set("b",0x55);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,2,"PC");
	equal(s.a,0xAA,"A");
	equal(s.b,0xAA,"A");
	//equal(RAM[2],0x55,"Operation");
	equal(CPU8008.T(),6,"Timer");

});

test( "LEAX ,s++", function() {
	RAM = [0x30, 0xe1];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("sp",120);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	//console.log(s);
	equal(s.pc,2,"PC");
	equal(s.sp,122,"SP");
	equal(s.x,120,"X");
	//equal(RAM[2],0x55,"Operation");
	equal(CPU8008.T(),7,"Timer");

});


module("Simple BRA tests");

test( "BRA - relative addr 1", function() {
	RAM = [0x20,0xfe];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,0,"PC");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),3,"Timer");

});

test( "LBRA - relative addr 1", function() {
	RAM = [0x16,0xff,0xfd];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,0,"PC");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),5,"Timer");

});
test( "LBRA - relative addr 0", function() {
	RAM = [0x16,0x00,0x00];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,3,"PC");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),5,"Timer");
});

test( "LBSR - relative addr 1", function() {
	RAM = [0x17,0xff,0xfd];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("SP",0x0006);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(RAM[4]*256+RAM[5],3,"Stack push");
	equal(s.pc,0,"PC");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),9,"Timer");

});
test( "LBSR - relative addr 0", function() {
	RAM = [0x17,0x0,0x0];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("SP",0x0006);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(RAM[4]*256+RAM[5],3,"Stack push");
	equal(s.pc,3,"PC");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),9,"Timer");

});

module("Push / pop");

test( "PSHS", function() {
	RAM = [0x34, 0x06];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("SP",0x0006);
	CPU8008.set("a",0xAA);
	CPU8008.set("b",0x55);	
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(RAM[4],0xaa,"Stack push");
	equal(RAM[5],0x55,"Stack push");
	equal(s.pc,2,"PC");
	equal(s.sp,4,"SP");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),7,"Timer");

});
test( "PULS", function() {
	RAM = [0x35, 0x06,0,0,0xaa,0x55];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("SP",0x0004);
	CPU8008.set("a",0x00);
	CPU8008.set("b",0x00);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.a,0xaa,"Reg A");
	equal(s.b,0x55,"Reg B");
	equal(s.pc,2,"PC");
	equal(s.sp,6,"SP");
	//equal(s.flags & 0x0D,0x01,"Flags C");
	equal(CPU8008.T(),7,"Timer");

});

module("Extended opcodes");

test( "LDY imm", function() {
	RAM = [0x10,0x8e, 0x12, 0x34];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,4,"PC");
	equal(s.y,0x1234,"Y reg");
	equal(CPU8008.T(),4,"Timer");

});

test( "LDY extended", function() {
	RAM = [0x10,0xbe, 0x00, 0x01];
	CPU8008.init(byteTo,byteAt,null);
	CPU8008.set("pc",0);
	CPU8008.steps(1);
	var s = (CPU8008.status());
	equal(s.pc,4,"PC");
	equal(s.y,0xbe00,"Y reg");
	equal(s.flags & 0x0E,0x08,"Flags Nzv");
	equal(CPU8008.T(),7,"Timer");

});


module("Disassembler");

test("simple instruction", function(){
	var d = CPU8008.disasm(0x12, 0x80,0x5c,0,0,0xdc84);
	equal (d[0],"NOP");
	equal (d[1],1);
});
test("illegal instruction", function(){
	var d = CPU8008.disasm(0x01, 0x80,0x5c,0,0,0xdc84);
	equal (d[0],"???");
	equal (d[1],1);
});


test("simple instruction + postbyte", function(){
	var d = CPU8008.disasm(0xa7, 0x80,0x5c,0,0,0xdc84);
	equal (d[0],"STA ,X+");
	equal (d[1],2);
});

test("EXG postbyte", function(){
	var d = CPU8008.disasm(0x1e, 0x31,0x00,0x83,0,0xdc84);
	equal (d[0],"EXG U,X");
	equal (d[1],2);
});
test("TFR postbyte", function(){
	var d = CPU8008.disasm(0x1f, 0x14,0x00,0x83,0,0xdc84);
	equal (d[0],"TFR X,S");
	equal (d[1],2);
});
test("PULS", function(){
	var d = CPU8008.disasm(0x35, 0x96,0xe5,0x10,0,0xdc84);
	equal (d[0],"PULS A,B,X,PC");
	equal (d[1],2);
});


test("Prefixed 0x11", function(){
	var d = CPU8008.disasm(0x11, 0x83,0xe5,0x10,0,0xdc84);
	equal (d[0],"CMPU #$E510");
	equal (d[1],4);
});
test("Prefixed 0x11, indexed", function(){
	var d = CPU8008.disasm(0x11, 0xA3,0x81,0x10,0,0xdc84);
	equal (d[0],"CMPU ,X++");
	equal (d[1],3);
});
test("Prefixed 0x11, indexed, indirect", function(){
	var d = CPU8008.disasm(0x11, 0xA3,0x93,0x10,0,0xdc84);
	equal (d[0],"CMPU [,--X]");
	equal (d[1],3);
});
test("Prefixed 0x11, indexed, offset 8", function(){
	var d = CPU8008.disasm(0x11, 0xA3,0xA8,0x10,0,0xdc84);
	equal (d[0],"CMPU 16,Y");
	equal (d[1],4);
});
test("Prefixed 0x11, indexed, negative offset 8", function(){
	var d = CPU8008.disasm(0x11, 0xA3,0xA8,0x80,0,0xdc84);
	equal (d[0],"CMPU -128,Y");
	equal (d[1],4);
});
test("Prefixed 0x11, indexed, offset 16+PC", function(){
	var d = CPU8008.disasm(0x11, 0xA3,0x8D,0x02,0x08,0xdc84);
	equal (d[0],"CMPU 520,PC");
	equal (d[1],5);
});
*/