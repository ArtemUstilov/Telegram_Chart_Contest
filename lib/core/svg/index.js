import { createSVGAxis, FONT_SIZE_COEF } from "../../axis";
import { dateFormatter, numberFormatter } from '../../format';
import {createSVGTable} from "../../table";
import {createSVGElement, createTransformer} from "../../util";

const MAX_RANGE = 100;
const STROKE_WIDTH = 2.5;

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'svg-graph'+options.suffixId,
  xFormatter: dateFormatter(10),
  yFormatter: numberFormatter(10),
  createAxis: false,
  fontSize: 16,
}, options);


const createTransformFromScale = (width, height, prevScale, newScale) => {
  const { minX: minX0, maxX: maxX0, minY: minY0, maxY: maxY0 } = prevScale || {};
  const { minX, maxX, minY, maxY } = newScale || {};

  const diffX0 = maxX0 - minX0;
  const midX0 = (maxX0 + minX0) / 2;
  const diffY0 = maxY0 - minY0;
  const midY0 = (maxY0 + minY0) / 2;

  const diffX = maxX - minX;
  const midX = (maxX + minX) / 2;
  const diffY = maxY - minY;
  const midY = (maxY + minY) / 2;

  const scaleX = diffX0 / diffX;
  const scaleY = diffY0 / diffY;

  const translateX = (minX0 - minX) * width * scaleX / diffX0;
  const translateY = height - height * scaleY - height * (minY - minY0) * scaleY / diffY0;
  return { scaleX, scaleY, translateX, translateY };
};

export const createSVGGraph = function (parent, customOptions) {
  const options = createOptions(parent, customOptions);
  const svgElement = createSVGElement('svg');
  svgElement.setAttribute('height', options.height);
  svgElement.setAttribute('id', options.id);
  svgElement.setAttribute('width', options.width + (options.enlarge || 0));
  svgElement.setAttribute('style', `margin: 0 0 ${options.fontSize * FONT_SIZE_COEF}px ${-(options.enlarge || 0)}px;`);
  svgElement.setAttribute('preserveAspectRatio', 'none');
  svgElement.setAttribute('viewBox', `0 0 ${MAX_RANGE} ${MAX_RANGE}`);
  const scale2Element = createSVGElement('g');
  svgElement.appendChild(scale2Element);
  const scaleElement = createSVGElement('g');
  scale2Element.appendChild(scaleElement);
  parent.insertBefore(svgElement, parent.firstChild);
  let range;

  let axis, table;
  if (options.createAxis) {
    axis = createSVGAxis(options);
    parent.insertBefore(axis.labelsElement, svgElement.nextSibling);
    parent.appendChild(axis.axisElement);
  }

  const transformer = createTransformer({ minX: 0, maxX: MAX_RANGE, minY: 0, maxY: MAX_RANGE }, false, true);

  let polylines = [];
  let data = [];
  let currScale = null;

  if (options.createNameplates) {
    table = createSVGTable(options, data);
    parent.appendChild(table.element);
  }

  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const setData = function setData(newData) {
    data = newData;
    if(options.additionalAxis && newData.lines.length === 2) {
      scale.sMaxY = Math.max(...data.lines[1].values);
    }else{
      scale.sMaxY = null;
    }
    if (axis) {
      if(options.additionalAxis) axis.setType2Colors(newData.lines.map(l => l.color));
      axis.setScale(scale);
    }
    if(table){
      table.setData(data);
      table.setScale(scale);
    }
  };
  const getData = function getData() {
    return data;
  };
  const setScale = function setScale(newScale) {
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

  const valuesToPoints = (x, y) => {
    const points = [];
    let min = range.minXIndex;
    if(range.minXIndex > 0)
      min--;
    for (let i = min; i <= range.maxXIndex; i++) {
      points.push(transformer.transformX(x[i]));
      points.push(',');
      points.push(transformer.transformY(y[i]));
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
    currScale = scale;
    scaleElement.innerHTML = '';
    const { lines, x } = data;
    polylines = lines.map((item, i) => {
      const { values: y, color } = item;
      if(i === 1 && options.additionalAxis) {
        transformer.setScale({ ...scale, maxY: scale.sMaxY });
      }
      const polyline = createSVGElement('polyline');
      polyline.setAttribute('points', valuesToPoints(x, y));
      polyline.setAttribute('stroke', color);
      polyline.setAttribute('stroke-width', STROKE_WIDTH);
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('vector-effect', 'non-scaling-stroke');
      scaleElement.appendChild(polyline);
      return polyline;
    });
    transformer.setScale(scale);
  };
  function updateMode (isNight){
    if(axis)
      axis.updateMode(isNight);
    if(table)
      table.updateMode(isNight);
  }
  const setRange = (newRange)=>{
    range = newRange;
  }
  function rescale() {
    refresh();
    // const { scaleX, scaleY, translateX, translateY } = createTransformFromScale(MAX_RANGE, MAX_RANGE, currScale, scale);
    // polylines.forEach(line => line.setAttribute('stroke-width', STROKE_WIDTH / Math.sqrt(Math.min(scaleX, scaleY))));
    // scale2Element.setAttribute('transform', `matrix(${scaleX}, 0, 0, ${scaleY}, ${translateX}, ${translateY})`)
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
