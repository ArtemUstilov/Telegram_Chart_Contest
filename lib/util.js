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
export function dateToPath(date){
  return {path: `${date.getFullYear()}-${date.getMonth() < 9 ? 0 : ''}${date.getMonth()+1}/${date.getDate() < 10 ? 0 : ''}${date.getDate()}.json`, date: date};
}
export function neighDate(date, offset){
  let newDate = new Date(date);
  newDate.setDate(date.getDate() + offset);
  return newDate;
}
export function getWeek(date){
  return [-3,-2,-1,0,1,2,3].map(offset => dateToPath(neighDate(date, offset)));
}
export const getDataAsync = (path, date) => {
  function handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }
    return myFetch(`${path}/${date}`)
      .then(handleErrors)
      .then(res => res && res.json())
      .catch(error => null);
};
function myFetch(url, options = {}) {
  if (options.credentials == null) options.credentials = 'same-origin';
  return fetch(url, options).then(function(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response)
    } else {
      let error = new Error(response.statusText || response.status);
      error.response = response;
      return Promise.reject(error)
    }
  })
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
export const createTransformer = ({ minX, maxX, minY, maxY }, swapX, swapY, log) => {
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
      (e.originalEvent && e.originalEvent.touches) ||
      (e.originalEvent && e.originalEvent.targetTouches);
    let touch = touches && touches[0];
    props.forEach(x => {
      res.push(touch ? touch[x] : -1000);
    })
  }
  return res;
}
export function getColor(isNight, colors, color){
  return isNight ? (colors[color] || color) : color;
}

const xmlns = "http://www.w3.org/2000/svg";
export const createSVGElement = tag => document.createElementNS(xmlns, tag);
