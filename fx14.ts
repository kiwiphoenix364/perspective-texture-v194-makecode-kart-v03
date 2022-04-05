// Fixed-point math using 14 bits after the decimal point ("binary point?")

// Adapted from https://github.com/microsoft/pxt-common-packages/blob/master/libs/base/fixed.ts
interface Fx14 {
    _dummyFx14: string;
}
function Fx14(v: number) {
    return ((v * 16384) | 0) as any as Fx14
}
namespace F14 {
    export const zeroFx14 = 0 as any as Fx14
    export const oneHalfFx14 = 8192 as any as Fx14
    export const oneFx14 = 16384 as any as Fx14
    export const twoFx14 = 32768 as any as Fx14

    export function neg(a: Fx14) {
        return (-(a as any as number)) as any as Fx14
    }
    export function toInt14(a: Fx14, n: number) {
        return (a as any as number)
    }
    export function toIntShifted(a: Fx14, n: number) {
        return (a as any as number) >> (n + 14)
    }
    export function add(a: Fx14, b: Fx14) {
        return ((a as any as number) + (b as any as number)) as any as Fx14
    }
    export function iadd(a: number, b: Fx14) {
        return ((a << 14) + (b as any as number)) as any as Fx14
    }
    export function sub(a: Fx14, b: Fx14) {
        return ((a as any as number) - (b as any as number)) as any as Fx14
    }
    export function mul2(a: Fx14, b: Fx14) {
        // For testing only, a float-based version
        return Fx14(F14.toFloat(a) * F14.toFloat(b))
    }
    export function mulScale2(a: Fx14, b: Fx14) {
        // For testing only, a float-based version
        return Fx14(F14.toFloat(a) * F14.toFloat(b))
    }
    // Multiply two 16.14 numbers (the slowest version)
    export function mulLL(a: Fx14, b: Fx14) {
        return (
            (Math.imul((a as any as number) & 0x3fff, (b as any as number) & 0x3fff) >> 14) +
            Math.imul((a as any as number) & 0x3fff, (b as any as number) >> 14) +
            Math.imul((a as any as number) >> 14, (b as any as number) & 0x3fff) +
            (Math.imul((a as any as number) >> 14, (b as any as number) >> 14) << 14)
        ) as any as Fx14
    }
    // Multiply a 16.14 number by a 0.14 number (range -1..1)
    export function mulLS(a: Fx14, b: Fx14) {
        return (
            (Math.imul((a as any as number) & 0x3fff, (b as any as number)) >> 14) +
            Math.imul((a as any as number) >> 14, (b as any as number))
        ) as any as Fx14
    }
    // Multiply two 0.14 numbers (both in the range -1..1)
    export function mulSS(a: Fx14, b: Fx14) {
        return (Math.imul((a as any as number), (b as any as number)) >> 14) as any as Fx14
    }
    export function imul(a: Fx14, b: number) {
        return Math.imul((a as any as number), (b as any as number)) as any as Fx14
    }
    // Divide a 0.14 number by a 16.14 number
    export function divSL(a: Fx14, b: Fx14) {
        return Math.idiv((a as any as number) << 14, b as any as number) as any as Fx14
    }
    export function idiv(a: Fx14, b: number) {
        return Math.idiv((a as any as number), b) as any as Fx14
    }
    export function compare(a: Fx14, b: Fx14) {
        return (a as any as number) - (b as any as number)
    }
    export function equals(a: Fx14, b: Fx14) {
        return (a as any as number) == (b as any as number)
    }
    export function greater(a: Fx14, b: Fx14) {
        return (a as any as number) > (b as any as number)
    }
    export function greaterOrEqual(a: Fx14, b: Fx14) {
        return (a as any as number) >= (b as any as number)
    }
    export function less(a: Fx14, b: Fx14) {
        return (a as any as number) < (b as any as number)
    }
    export function lessOrEqual(a: Fx14, b: Fx14) {
        return (a as any as number) <= (b as any as number)
    }
    export function abs(a: Fx14) {
        if ((a as any as number) < 0)
            return (-(a as any as number)) as any as Fx14
        else
            return a
    }
    export function min(a: Fx14, b: Fx14) {
        if (a < b)
            return a
        else
            return b
    }
    export function max(a: Fx14, b: Fx14) {
        if (a > b)
            return a
        else
            return b
    }
    export function floor(v: Fx14): Fx14 {
        return ((v as any as number) & ~0x3fff) as any as Fx14;
    }
    export function ceil(v: Fx14): Fx14 {
        return (v as any as number) & 0x3fff ? F14.floor(F14.add(v, F14.oneFx14)) : v;
    }
    export function leftShift(a: Fx14, n: number) {
        return (a as any as number << n) as any as Fx14
    }
    export function rightShift(a: Fx14, n: number) {
        return (a as any as number >> n) as any as Fx14
    }
    export function toInt(v: Fx14) {
        return ((v as any as number) + 8192) >> 14
    }
    export function toIntFloor(v: Fx14) {
        return (v as any as number) >> 14
    }
    export function toFloat(v: Fx14) {
        return (v as any as number) / 16384
    }
    export function div2(a: Fx14, b: Fx14) {
        // For testing only, a float-based version
        return Fx14(F14.toFloat(a) / F14.toFloat(b))
    }
    /*
    // this one doesn't work
    export function divLL(a: Fx14, b: Fx14) {
        // aa.bb / cc.dd = aabb / ccdd == aa00 / ccdd + 00bb / ccdd
        // = aa.00 / cc.dd + 00.bb / cc.dd
        return (
            (Math.idiv((a as any as number) & ~0x3fff, b as any as number) << 14) +
            Math.idiv(((a as any as number) & 0x3fff) << 14, b as any as number)
        ) as any as Fx14
    }
    */
    // Divide a 9.14 number by a 9.14 number
    export function divMM(a: Fx14, b: Fx14) {
        //console.log("float a=" + F14.toFloat(a) + " / b=" + F14.toFloat(b) + " = " + F14.toFloat(F14.div2(a, b)))
        let x = a as any as number
        let y = b as any as number
        //console.log("x=" + x + " y=" + y)
        let high = Math.idiv(x, y)
        x -= Math.imul(high, y)
        //console.log("high=" +high + " x=" + x)
        x <<= 7
        let mid = Math.idiv(x, y)
        x -= Math.imul(mid, y)
        //console.log("mid=" + mid + " x=" + x)
        x <<= 7
        let low = Math.idiv(x, y)
        x -= Math.imul(low, y)
        //console.log("low=" + low + " remainder=" + x)
        return (
            (high << 14) + (mid << 7) + low
        ) as any as Fx14
    }

    function testDivMM () {
        let correct = 0
        for (let j = 0; j < 256; ++j) {
            for (let i = 0; i < 256; ++i) {
                let a = j * 3 + j + j / 256
                let b = i * 3 + i + i / 256
                let v1 = F14.div2(Fx14(a), Fx14(b))
                let v2 = F14.divMM(Fx14(a), Fx14(b))
                if (F14.compare(v1, v2)) {
                    console.log("" + a + "/" + b + " = " + F14.toFloat(v1) + ", got " + F14.toFloat(v2))
                } else {
                    ++correct
                }
                v1 = F14.div2(Fx14(a), Fx14(-b))
                v2 = F14.divMM(Fx14(a), Fx14(-b))
                if (F14.compare(v1, v2)) {
                    console.log("" + a + "/" + b + " = " + F14.toFloat(v1) + ", got " + F14.toFloat(v2))
                } else {
                    ++correct
                }
                v1 = F14.div2(Fx14(-a), Fx14(b))
                v2 = F14.divMM(Fx14(-a), Fx14(b))
                if (F14.compare(v1, v2)) {
                    console.log("" + a + "/" + b + " = " + F14.toFloat(v1) + ", got " + F14.toFloat(v2))
                } else {
                    ++correct
                }
                v1 = F14.div2(Fx14(-a), Fx14(-b))
                v2 = F14.divMM(Fx14(-a), Fx14(-b))
                if (F14.compare(v1, v2)) {
                    console.log("" + a + "/" + b + " = " + F14.toFloat(v1) + ", got " + F14.toFloat(v2))
                } else {
                    ++correct
                }
            }
        }
        console.log("correct: " + correct)
    }
    //testDivMM()
    //console.log(F14.toFloat(F14.divMM(Fx14(9.5625), Fx14(12.75))))
    //console.log(F14.toFloat(F14.divMM(Fx14(2816.04296875), Fx14(13.05078125))))
    //console.log(F14.toFloat(F14.divMM(Fx14(4096.0625), Fx14(53248.8125))))
}
