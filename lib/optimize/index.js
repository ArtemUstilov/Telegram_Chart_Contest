
const distance = (x1, y1, x2, y2, x0, y0) => {
  const diffY = y2 - y1;
  const diffX = x2 - x1;
  return Math.abs(diffY * x0 - diffX * y0 + x2 * y1 - y2 * x1)
    / Math.sqrt(diffY * diffY + diffX * diffX);
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
  if (n <= 0) {
    return aggregator;
  }
  const point = getKeyPoint(x, y, min, max);
  if (!aggregator[point]) {
    aggregator[point] = 1;
  }
  if (n <=  1) {
    return aggregator;
  }
  if (max - min <= 2) {
    return aggregator;
  }
  const count = Math.floor((n - 1) / 2);
  getNKeyPoints(x, y, min, point - 1, count + ((n - 1) & 1), aggregator);
  getNKeyPoints(x, y, point + 1, max, count, aggregator);
  return aggregator;
};

export const reduceGraph = (item, pointsMax, min0, max0, gridPointsCoef0) => {
  const min = min0 || 0;
  const max = max0 || item.x.length - 1;
  const gridPointsCoef = gridPointsCoef0 || 0;
  const gridPoints = pointsMax * gridPointsCoef;
  const aggregator = Object.create(null);
  if (gridPoints) {
    const gridStep = (max - min) / gridPoints;
    for (let i = min; i < max; i += gridStep) {
      aggregator[Math.floor(i)] = 1;
    }
  }
  const pointsPerLine = Math.floor(pointsMax * (1 - gridPointsCoef) / item.lines.length);
  item.lines.map(line => getNKeyPoints(item.x, line.values, min, max, pointsPerLine, aggregator));
  const keyPoints = Object.keys(aggregator).map(item => parseInt(item, 10)).sort((x, y) => x - y);
  return ({
    lines: item.lines.map(({ name, color, values }) => {
      return { name, color, values: keyPoints.map(point => values[point]) };
    }),
    x: keyPoints.map(point => item.x[point])
  });
};