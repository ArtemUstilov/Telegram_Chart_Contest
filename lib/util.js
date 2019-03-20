export function format(data) {
    return ({
        lines: data.columns.filter(col => data.types[col[0]] === 'line').map(line => ({
            values: line.slice(1),
            color: data.colors[line[0]],
            name: data.names[line[0]],
        })),
        x: data.columns.find(col => data.types[col[0]] === 'x').slice(1),
    });
};
