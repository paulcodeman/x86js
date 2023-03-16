const instructions = [
    // mov eax, 0
    { code: 0xb8, operands: [0x00, 0x00, 0x00, 0x00], mnemonic: "mov" },
    { code: 0xc7, operands: [0xc0, 0x00, 0x00, 0x00, 0x00], mnemonic: "" },

    // mov ebx, 10
    { code: 0xbb, operands: [0x0a, 0x00, 0x00, 0x00], mnemonic: "mov" },

    // add eax, ebx
    { code: 0x03, operands: [0xc3], mnemonic: "add" },

    // cmp eax, 50
    { code: 0x3d, operands: [0x32, 0x00, 0x00, 0x00], mnemonic: "cmp" },

    // je done
    { code: 0x74, operands: [0x07], mnemonic: "je" },

    // jmp loop
    { code: 0xeb, operands: [0xf4], mnemonic: "jmp" },

    // done:
    { code: 0xc3, mnemonic: "" }
];

class CPU {
    constructor() {
        this.registers = new Uint32Array(8);
        this.memory = new Uint8Array(1024);
        this.flags = {
            zero: false,
            carry: false,
            overflow: false,
            negative: false
        };
        this.eip = 0;
    }

    run() {
        while (this.eip < instructions.length) {
            const instruction = instructions[this.eip];
            const [operands, operandSize] = this.parseOperands(instruction.operands);
            switch (instruction.mnemonic) {
                case "mov":
                    this.mov(operands);
                    break;
                case "add":
                    this.add(operands);
                    break;
                case "sub":
                    this.sub(operands);
                    break;
                case "jmp":
                    this.jmp(operands);
                    break;
                case "cmp":
                    this.cmp(operands);
                    break;
                case "je":
                    this.je(operands);
                    break;
                default:
                    console.error(`Unknown instruction: ${instruction.mnemonic}`);
                    return;
            }
            this.eip += instruction.length || 1;
        }
    }

    parseOperands(operands) {
        const operandSize = operands.shift();
        const operandValues = operands.map((operand) => {
            if (typeof operand === "number") {
                return operand;
            }
            if (operand.startsWith("r")) {
                return this.registers[parseInt(operand.slice(1))];
            }
            if (operand.startsWith("0x")) {
                return parseInt(operand.slice(2), 16);
            }
            return parseInt(operand);
        });
        return [operandValues, operandSize];
    }

    mov([src, dest]) {
        dest = this.resolveRegister(dest);
        this.writeOperand(dest, src);
    }

    add([a, b]) {
        const result = a + b;
        this.flags.carry = result > 0xffffffff;
        this.flags.overflow = (a > 0 && b > 0 && result < 0) || (a < 0 && b < 0 && result >= 0);
        this.flags.zero = result === 0;
        this.flags.negative = result < 0;
        b = this.resolveRegister(b);
        this.writeOperand(b, result);
    }

    sub([a, b]) {
        const result = a - b;
        this.flags.carry = result < 0;
        this.flags.overflow = (a > 0 && b < 0 && result < 0) || (a < 0 && b > 0 && result >= 0);
        this.flags.zero = result === 0;
        this.flags.negative = result < 0;
        b = this.resolveRegister(b);
        this.writeOperand(b, result);
    }

    jmp([address]) {
        this.eip = address;
    }

    cmp([a, b]) {
        const result = a - b;
        this.flags.carry = result < 0;
        this.flags.zero = result === 0;
        this.flags.negative = result < 0;
    }

    je([address]) {
        if (this.flags.zero) {
            this.eip = address;
        }
    }

    resolveRegister(register) {
        if (typeof register === "string" && register.startsWith("r")) {
            register = parseInt(register.slice(1));
        }
        return this.registers[register];
    }

    writeOperand(dest, value) {
        if (typeof dest === "string" && dest.startsWith("r")) {
            dest = parseInt(dest.slice(1));
        }
        if (dest < 8) {
            this.registers[dest] = value;
        } else {
            this.memory[dest - 8] = value;
        }
    }
}

const cpu = new CPU();
cpu.registers[0] = 0; // eax
cpu.registers[3] = 50; // esi
cpu.memory[0] = 0xeb; // jmp loop
cpu.memory[1] = 0xf9; // offset from current address (-7)

cpu.run();
console.log(cpu.registers[0]); // should output 55
