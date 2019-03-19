const xmlns = "http://www.w3.org/2000/svg";
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

  const valuesToPoints = (values) => {
    const { x, y } = values;
    const points = [];
    for (let i = 0; i < x.length; i++) {
      points.push(x[i]);
      points.push(',');
      points.push(y[i]);
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
    scaleElement.innerHTML = '';
    svgElement.setAttributeNS(null, 'viewBox', `${minX} ${minY} ${width} ${height}`);
    polylines = data.map((item) => {
      const { values, color } = item;
      const polyline = createSVGElement('polyline');
      polyline.setAttributeNS(null, 'points', valuesToPoints(values));
      polyline.setAttributeNS(null, 'stroke', color);
      polyline.setAttributeNS(null, 'stroke-width', '2');
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
