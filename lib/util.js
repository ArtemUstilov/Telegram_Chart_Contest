export function format(data) {
    return ({
        lines: data.columns.filter(col => data.types[col[0]] === 'line' || data.types[col[0]] === 'bar').map(line => ({
            values: line.slice(1),
            color: data.colors[line[0]],
            name: data.names[line[0]],
        })),
        x: data.columns.find(col => data.types[col[0]] === 'x').slice(1),
    });
}

export function findClosestValueIndex(arr, value) {
  let min = 0;
  let max = arr.length - 1;
  if (arr[min] > value) {
    return min;
  }
  if (arr[max] < value) {
    return max;
  }
  while (true) {
    if (max - min === 1) {
      if (arr[min] === value) {
        return min;
      } else {
        return max;
      }
    }
    const mid = Math.round((min + max) / 2);
    if (arr[mid] === value) {
      return mid;
    }
    if (arr[mid] < value) {
      min = mid;
    } else {
      max = mid;
    }
  }
}

export const findMaximum = (arr, minIndex, maxIndex) => {
  let max = -Infinity;
  for (let i = minIndex; i <= maxIndex; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
};
export const findMinimum = (arr, minIndex, maxIndex) => {
  let min = Infinity;
  for (let i = minIndex; i <= maxIndex; i++) {
    if (arr[i] < min) {
      min = arr[i];
    }
  }
  return min;
};
