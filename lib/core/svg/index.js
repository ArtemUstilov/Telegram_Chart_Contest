import { createSVGAxis, FONT_SIZE_COEF } from "../../axis";
import { dateFormatter, numberFormatter } from '../../format';

const xmlns = "http://www.w3.org/2000/svg";
const MAX_RANGE = 100;
const createSVGElement = tag => document.createElementNS(xmlns, tag)

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'svg-graph',
  xFormatter: dateFormatter(5),
  yFormatter: dateFormatter(10),
  createAxis: false,
  fontSize: 16,
}, options);

export const createSVGGraph = function (parent, customOptions) {
  const options = createOptions(parent, customOptions);
  const svgElement = createSVGElement('svg');
  svgElement.setAttribute('height', options.height);
  svgElement.setAttribute('width', options.width);
  svgElement.setAttribute('id', options.id);
  svgElement.setAttribute('viewBox', '0 0 1 1');
  svgElement.setAttribute('preserveAspectRatio', 'none');
  const scaleElement = createSVGElement('g');
  svgElement.appendChild(scaleElement);
  parent.insertBefore(svgElement, parent.firstChild);

  let axis;
  if (options.createAxis) {
    axis = createSVGAxis(options);
    svgElement.style.marginBottom = options.fontSize * FONT_SIZE_COEF;
    parent.insertBefore(axis.element, svgElement.nextSibling);
  }

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
    if (axis) {
      axis.setScale(newScale);
    }
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
    if (axis) {
      axis.refresh();
    }
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
    scaleElement.setAttribute('transform', `scale(1, -1) translate(0, ${(minY + maxY) * coefY * -1})`)
    svgElement.setAttribute('viewBox', `${minX * coefX} ${minY * coefY} ${width * coefX} ${height * coefY}`);
    const { lines, x } = data;
    polylines = lines.map((item) => {
      const { values: y, color } = item;
      const polyline = createSVGElement('polyline');
      polyline.setAttribute('points', valuesToPoints(x, y, coefX, coefY));
      polyline.setAttribute('stroke', color);
      polyline.setAttribute('stroke-width', '2.5');
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('vector-effect', 'non-scaling-stroke');
      scaleElement.appendChild(polyline);
      return polyline;
    });
  };
  function updateMode (isNight){
    if(axis)
      axis.updateMode(isNight);
  }
  return {
    setData,
    getData,
    setScale,
    getScale,
    refresh,
    updateMode
  }
};
