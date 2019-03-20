
const distance = (x1, y1, x2, y2, x0, y0) => {
  return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
    / Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
};

const getKeyPoint = (x, y, min, max) => {
  const d = max - min;
  if (d <= 1) {
    return min;
  }
  if (d === 2) {
    return min + 1;
  }
  const point0 = Math.round((min + max) / 2);
  const point1 = Math.round((min + point0) / 2);
  const point2 = Math.round((point0 + max) / 2);
  const distance0 = distance(x[min], y[min], x[max], y[max], x[point0], y[point0]);
  const distance1 = distance(x[min], y[min], x[point0], y[point0], x[point1], y[point1]);
  const distance2 = distance(x[point0], y[point0], x[max], y[max], x[point2], y[point2]);
  const maxDistance = Math.max(distance0, distance1, distance2);
  if (maxDistance === distance0) {
    return point0;
  }
  if (maxDistance === distance1) {
    return getKeyPoint(x, y, min, point0);
  }
  if (maxDistance === distance2) {
    return getKeyPoint(x, y, point0, max);
  }
};

const getNKeyPoints = (x, y, min, max, n, aggregator) => {
  if (n === 0) {
    return aggregator;
  }
  const point = getKeyPoint(x, y, min, max);
  aggregator[point] = 1;
  if (n === 1) {
    return aggregator;
  }
  const distance0 = x[point] - x[min];
  const distance2 = x[max] - x[point];
  const maxDistance = Math.max(distance0, distance2);
  const count = Math.floor((n - 1) / 2);
  let min0, max0, min1, max1;
  if (maxDistance === distance0) {
    min0 = min;
    max0 = point;
    min1 = point;
    max1 = max;
  } else {
    min0 = point;
    max0 = max;
    min1 = min;
    max1 = point;
  }
  getNKeyPoints(x, y, min0, max0, count + (n - 1) % 2, aggregator);
  getNKeyPoints(x, y, min1, max1, count, aggregator);
  return aggregator;
};

export const reduceGraph = (item, N) => {
  const keyPoints = Object.keys(
    Object.assign(
      {}, ...item.lines.map(line => getNKeyPoints(item.x, line.values, 0, item.x.length - 1, N, {})),
    ),
  ).map(item => parseInt(item, 10)).sort((x, y) => x - y);
  // console.log(keyPoints);
  return ({
    lines: item.lines.map(line => ({ ...line, values: keyPoints.map(point => line.values[point]) })),
    x: keyPoints.map(point => item.x[point])
  });
};