const xmlns = "http://www.w3.org/2000/svg";
const MAX_RANGE = 100;
const createSVGElement = tag => document.createElementNS(xmlns, tag)

export const createSVGGraph = function (element) {
  const svgElement = createSVGElement('svg');
  
  svgElement.setAttributeNS(null, 'height', element.offsetHeight);
  svgElement.setAttributeNS(null, 'width', element.offsetWidth);
  svgElement.setAttributeNS(null, 'viewBox', '0 0 1 1');
  svgElement.setAttributeNS(null, 'preserveAspectRatio', 'none');
  const scaleElement = createSVGElement('g');
  svgElement.appendChild(scaleElement);

  let polylines = [];
  let data = [];
  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const setData = function setData(newData) {
    data = newData;
  };
  const getData = function getData() {
    return data;
  };
  const setScale = function setData(newScale) {
    scale = newScale;
  };
  const getScale = function getScale() {
    return scale;
  };

  const valuesToPoints = (x, y, coefX, coefY) => {
    const points = [];
    for (let i = 0; i < x.length; i++) {
      points.push(x[i] * coefX);
      points.push(',');
      points.push(y[i] * coefY);
      points.push(' ');
    }
    return points.join('');
  };

  const refresh = function refresh() {
    // TODO: reuse polylines
    // if (polylines.length !== data.length) {
    //   if (polylines.length < data.length) {
        
    //   } else {

    //   }
    // }
    const { minX, maxX, minY, maxY } = scale;
    const width = maxX - minX;
    const height = maxY - minY;
    const coefX = MAX_RANGE / Math.max(Math.abs(minX), Math.abs(maxX));
    const coefY = MAX_RANGE / Math.max(Math.abs(minY), Math.abs(maxY));
    scaleElement.innerHTML = '';
    scaleElement.setAttributeNS(null, 'transform', `scale(1, -1) translate(0, ${(minY + maxY) * coefY * -1})`)
    svgElement.setAttributeNS(null, 'viewBox', `${minX * coefX} ${minY * coefY} ${width * coefX} ${height * coefY}`);
    const { lines, x } = data;
    polylines = lines.map((item) => {
      const { values: y, color } = item;
      const polyline = createSVGElement('polyline');
      polyline.setAttributeNS(null, 'points', valuesToPoints(x, y, coefX, coefY));
      polyline.setAttributeNS(null, 'stroke', color);
      polyline.setAttributeNS(null, 'stroke-width', '1');
      polyline.setAttributeNS(null, 'fill', 'none');
      polyline.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');
      scaleElement.appendChild(polyline);
      return polyline;
    });
  };

  element.appendChild(svgElement);
  return {
    setData,
    getData,
    setScale,
    getScale,
    refresh
  }
};
