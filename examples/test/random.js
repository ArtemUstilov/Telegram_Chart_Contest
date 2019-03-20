const randomSign = () => Math.sign(Math.random() - 0.5);
const random = (x = 1000) => randomSign() * (1 / (Math.random() + 1 / x) - 1 / (1 + 1 / x));

const generateRandomFunction = count => {
    const data = Array.from({ length: count })
        .map(() => ({ offset: random(), plus: random(), mpyX: random(), mpyFunc: random() }))
        .map(({ offset, plus, mpyX, mpyFunc }) => x => plus + mpyFunc * Math.sin(offset + x * mpyX));
    return x => data.map(func => func(x)).reduce((a, b) => a + b);
};


const generateRandomGraph = (min, max, lineCount, pointCount, funcCount = 10) => {
    const valuesAll =  Array.from({ length: lineCount }).map(() => ([]));
    const x = [];
    const fns = Array.from({ length: lineCount }).map(() => generateRandomFunction(funcCount));
    for (let i = 0; i < pointCount; i++) {
        const x0 = i / (pointCount - 1) * (max - min) + min;
        x.push(x0);
        fns.forEach((fn, index) => {
            valuesAll[index].push(fn(x0));
        });
    }
    return {
        lines: valuesAll.map((values, index) => ({
            name: `Test ${index}`,
            color: '#ff0000',
            values,
        })),
        x,
    };
};