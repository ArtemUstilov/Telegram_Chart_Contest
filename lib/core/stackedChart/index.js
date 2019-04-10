import { createSVGAxis, FONT_SIZE_COEF } from "../../axis/index";
import { dateFormatter, numberFormatter } from '../../format/index';
import {createSVGTable} from "../../table/index";
import {createSVGElement, createTransformer} from "../../util";

const MAX_RANGE = 100;
const STROKE_WIDTH = 2.5;

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'svg-graph'+options.suffixId,
  xFormatter: dateFormatter(5),
  yFormatter: numberFormatter(10),
  createAxis: false,
  fontSize: 16,
}, options);


export const createStackedGraph = function (parent, customOptions) {
  const options = createOptions(parent, customOptions);
  const svgElement = createSVGElement('svg');
  svgElement.setAttribute('height', options.height);
  svgElement.setAttribute('width', options.width + (options.enlarge || 0));
  svgElement.setAttribute('style', `margin-left: ${-(options.enlarge || 0)}px;`);
  svgElement.setAttribute('id', options.id);
  svgElement.setAttribute('preserveAspectRatio', 'none');
  svgElement.setAttribute('viewBox', `0 0 ${MAX_RANGE} ${MAX_RANGE}`);
  const scale2Element = createSVGElement('g');
  svgElement.appendChild(scale2Element);
  const scaleElement = createSVGElement('g');
  scale2Element.appendChild(scaleElement);
  parent.insertBefore(svgElement, parent.firstChild);

  let axis, table;
  if (options.createAxis) {
    axis = createSVGAxis(options);
    svgElement.style.marginBottom = options.fontSize * FONT_SIZE_COEF;
    parent.insertBefore(axis.labelsElement, svgElement.nextSibling);
    parent.appendChild(axis.axisElement);
  }

  const transformer = createTransformer({ minX: 0, maxX: MAX_RANGE, minY: 0, maxY: MAX_RANGE }, false, true);
  let range;

  let polylines = [];
  let data = [];
  let stackedData = {};
  let currScale = null;

  if (options.createNameplates) {
    table = createSVGTable({...options, type: 'stacked'}, data);
    parent.appendChild(table.element);
  }

  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const setData = function setData(newData) {
    data = newData;
    let stackedLine = new Array(data.lines[0].values.length).fill(0);
    stackedData = {lines: [], x: data.x};
    data.lines.forEach(line => {
      stackedData.lines.push(({values: line.values.map((element, i) => {
          stackedLine[i] += element;
          return stackedLine[i]
        }), color: line.color, name: line.name }));
    })
    if(table)table.setData(newData);
  };
  const getData = function getData() {
    return stackedData;
  };
  const setScale = function setData(newScale) {
    if (axis) {
      axis.setScale(newScale);
    }
    if (table) {
      table.setScale(newScale);
    }
    transformer.setScale(newScale);
    scale = newScale;
  };
  const getScale = function getScale() {
    return scale;
  };
  const valuesToPoints = (x, y, diff) => {
    const points = [];
    let XX = transformer.transformX(x[0]);
    points.push(0);
    points.push(',');
    points.push(MAX_RANGE);
    points.push(' ');
    let min = range.minXIndex;
    if(range.minXIndex > 0)
      min--;
    for (let i = min; i <= range.maxXIndex; i++) {
      let YY = transformer.transformY(y[i]);
      points.push(XX + diff * (i));
      points.push(',');
      points.push(YY);
      points.push(' ');
      points.push(XX + diff * (i + 1));
      points.push(',');
      points.push(YY);
      points.push(' ');
    }
    points.push(MAX_RANGE);
    points.push(',');
    points.push(MAX_RANGE);
    points.push(' ');
    return points.join('');
  };
  const refresh = function refresh() {
    if (axis) {
      axis.refresh();
    }
    currScale = scale;
    scaleElement.innerHTML = '';
    const { lines, x } = data;
    const dif = transformer.transformX(x[1]) - transformer.transformX(x[0]);
    polylines = stackedData.lines.map((item, i) => {
      const polyline = createSVGElement('polygon');
      const { color } = item;
      polyline.setAttribute('points', valuesToPoints(x, item.values, dif));
      polyline.setAttribute('fill', color);
      if(i === stackedData.lines.length-1){
        if(table)table.setField(polyline);
      }
      return polyline;
    });
    polylines.reverse().forEach(p => {
      scaleElement.appendChild(p);
    })
  };
  function updateMode (isNight){
    if(axis)
      axis.updateMode(isNight);
    if(table)
      table.updateMode(isNight);
  }
  function rescale() {
   refresh();
  }
  const setRange = (newRange)=>{
    range = newRange;
  }
  return {
    setData,
    getData,
    setRange,

    setScale,
    getScale,
    refresh,
    updateMode,
    rescale,
  }
};
