export function format(data) {
    return ({
        lines: data.columns.filter(col => data.types[col[0]] === 'line' || data.types[col[0]] === 'bar' || data.types[col[0]] === 'area').map(line => ({
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
export const createTransformer = ({ minX, maxX, minY, maxY }, swapX, swapY) => {
  const realWidth = maxX - minX;
  const realHeight = maxY - minY;
  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  let width = 1, height = 1;
  const setScale = (newScale) => {
    scale = newScale;
    width = scale.maxX - scale.minX;
    height = scale.maxY - scale.minY;
  };
  const transformX = x => ((swapX ? 1 : 0) + (swapX ? -1 : 1) * (x - scale.minX) / width) * realWidth + minX;
  const transformY = y => ((swapY ? 1 : 0) + (swapY ? -1 : 1) * (y - scale.minY) / height) * realHeight + minY;
  return { transformX, transformY, setScale, realHeight, realWidth };
};
export function getProps(e, ...props) {
  let res = [];
  if (e[props[0]]) {
    props.forEach(x => res.push(e[x]))
  } else {
    let touches =
      e.touches ||
      e.targetTouches ||
      e.changedTouches ||
      e.originalEvent.touches ||
      e.originalEvent.targetTouches;
    let touch = touches[0];
    props.forEach(x => {
      res.push(touch[x]);
    })
  }
  return res;
}
const xmlns = "http://www.w3.org/2000/svg";
export const createSVGElement = tag => document.createElementNS(xmlns, tag);
