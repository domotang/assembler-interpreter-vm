function assemblerInterpreter(code) {
  code = parse(code);
  var program = Compiler(code);

  return program();
}

function Compiler(code) {
  var end = false;
  var pointer = 0;
  var stack = [];
  var cmp = {};
  var registers = {};
  var labels = {};
  var output = '';
  const machine = {
    setReg,
    getReg,
    setCmp,
    getCmp,
    setOutput,
    movePointer,
    setPointerStack,
    setPointer,
    getLabel,
    setEnd,
    popStack,
  };

  var instructions = code.reduce(compileInstructions, []);

  function setReg(register, value) {
    registers[register] = Number(value);
  }
  function getReg(register) {
    return registers[register];
  }
  function setCmp(x, y) {
    cmp = { x, y };
  }
  function getCmp() {
    return cmp;
  }
  function getLabel(name) {
    return labels[name];
  }
  function setOutput(value) {
    output = value;
  }
  function movePointer(value) {
    pointer += value;
  }
  function setPointerStack(value) {
    stack.push(pointer);
    pointer = value;
  }
  function setPointer(value) {
    pointer = value;
  }
  function popStack() {
    return stack.pop();
  }
  function setEnd() {
    end = true;
  }
  function compileInstructions(accum, cur, i) {
    var instruction = cur.split(/(?<=^[^\s]*)\s/);
    if (instruction[0].match(/.*:$/)) labels[instruction[0].slice(0, -1)] = accum.length - 1;
    else accum.push(Library(instruction, machine));
    return accum;
  }

  return function program() {
    while (!end) {
      if (!instructions[pointer]) return -1;
      instructions[pointer]();
      pointer++;
    }
    return output;
  }
}

function Library(instruction, machine) {
  var { getReg, setReg, setCmp, getCmp, movePointer, setPointer,
    getLabel, setEnd, popStack, setOutput, setPointerStack } = machine;
  switch (instruction[0]) {
    case 'mov':
      return BinaryFnc(mov);
    case 'inc':
      return function inc() {
        setReg(instruction[1], getReg(instruction[1]) + 1);
      }
    case 'dec':
      return function dec() {
        setReg(instruction[1], getReg(instruction[1]) - 1);
      }
    case 'add':
      return BinaryFnc(add);
    case 'sub':
      return BinaryFnc(sub);
    case 'mul':
      return BinaryFnc(mul);
    case 'div':
      return BinaryFnc(div);
    case 'cmp':
      return function cmp() {
        let args = instruction[1].split(/, /);
        var x = (isNaN(args[0])) ? getReg(args[0]) : Number(args[0]);
        var y = (isNaN(args[1])) ? getReg(args[1]) : Number(args[1]);
        setCmp(x, y);
      }
    case 'jmp':
      return function jmp() {
        setPointer(Number(getLabel(instruction[1])));
      }
    case 'call':
      return function call() {
        setPointerStack(Number(getLabel(instruction[1])));
      }
    case 'jne':
      return function jne() {
        if (getCmp().x != getCmp().y) setPointer(Number(getLabel(instruction[1])));
      }
    case 'je':
      return function je() {
        if (getCmp().x == getCmp().y) setPointer(Number(getLabel(instruction[1])));
      }
    case 'jge':
      return function jge() {
        if (getCmp().x >= getCmp().y) setPointer(Number(getLabel(instruction[1])));
      }
    case 'jg':
      return function jg() {
        if (getCmp().x > getCmp().y) setPointer(Number(getLabel(instruction[1])));
      }
    case 'jle':
      return function jle() {
        if (getCmp().x <= getCmp().y) setPointer(Number(getLabel(instruction[1])));
      }
    case 'jl':
      return function jl() {
        if (getCmp().x < getCmp().y) setPointer(Number(getLabel(instruction[1])));
      }
    case 'ret':
      return function ret() {
        setPointer(popStack());
      }
    case 'end':
      return function end() {
        setEnd();
      }
    case 'msg':
      return function msg() {
        let args = instruction[1].split(/(?<='.*?'),\s(?=[^'])|(?<=[^']),\s(?='.*?')/g);
        let message = args.reduce((accum, cur) => {
          if (cur.match(/^'/)) accum.push(cur.replace(/'/g, ''));
          else accum.push(getReg(cur));
          return accum;
        }, []).join('');
        setOutput(message);
      }
  }
  function BinaryFnc(oppFnc) {
    return function binary() {
      let args = instruction[1].split(/, /);
      let y = (isNaN(args[1])) ? getReg(args[1]) : Number(args[1]);
      setReg(args[0], oppFnc(getReg(args[0]), y))
    }
  }
  function add(x, y) {
    return x + y;
  }
  function sub(x, y) {
    return x - y;
  }
  function mul(x, y) {
    return x * y;
  }
  function div(x, y) {
    return Math.floor(x / y);
  }
  function mov(x, y) {
    return x = y;
  }

}

function parse(code) {
  code = code.replace(/^;.+\n|\s*;.+|^\n|(?<=\s)\s/gm, '');
  return code.split(/\n/);
}
