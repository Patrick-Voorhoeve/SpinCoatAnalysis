export function siRound(x: number) {
    if (x<1e3) return x+'';
    const digits    = Math.log10(x) | 0
    const tier      = digits/3 | 0
    let   newVal    = (x / 10**(tier*3)).toFixed(3);
    return `${newVal}${(['','k','M','G','T'])[tier]}`
}
