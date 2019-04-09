import { createSVGAxis, FONT_SIZE_COEF } from "../../axis";
import { dateFormatter, numberFormatter } from '../../format';
import {createSVGTable} from "../../table";
import { reduceGraph, findClosestValueIndex } from "../..";

const xmlns = "http://www.w3.org/2000/svg";
const MAX_RANGE = 100;
const STROKE_WIDTH = 2.5;
const createSVGElement = tag => document.createElementNS(xmlns, tag)

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'svg-graph'+options.suffixId,
  xFormatter: dateFormatter(5),
  yFormatter: numberFormatter(10),
  createAxis: false,
  fontSize: 16,
}, options);

const createTransformer = ({ minX, maxX, minY, maxY }, swapX, swapY) => {
  const realScale = { minX, maxX, minY, maxY };
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
  svgElement.setAttribute('width', options.width);
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
    axis = createSVGAxis({...options, secondYAxis: true});
    svgElement.style.marginBottom = options.fontSize * FONT_SIZE_COEF;
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
    if(table)table.setData(data);
  };
  const getData = function getData() {
    return data;
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

  const valuesToPoints = (x, y) => {
    const points = [];
    for (let i = 0; i < x.length; i++) {
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
    let start = findClosestValueIndex(data.x, minX) - 2;
    let end = findClosestValueIndex(data.x, maxX) + 2;
    const reducedData = reduceGraph(data, 1000, start < 0 ? 0 : start, end > data.x.length - 1 ? data.x.length - 1 : end, 0.5);
    scaleElement.innerHTML = '';
    const { lines, x } = reducedData;
    polylines = lines.map((item) => {
      const { values: y, color } = item;
      const polyline = createSVGElement('polyline');
      polyline.setAttribute('points', valuesToPoints(x, y));
      polyline.setAttribute('stroke', color);
      polyline.setAttribute('stroke-width', STROKE_WIDTH);
      polyline.setAttribute('fill', 'none');
      polyline.setAttribute('vector-effect', 'non-scaling-stroke');
      scaleElement.appendChild(polyline);
      return polyline;
    });
  };
  function updateMode (isNight){
    if(axis)
      axis.updateMode(isNight);
    if(table)
      table.updateMode(isNight);
  }
  function rescale() {
    const { scaleX, scaleY, translateX, translateY } = createTransformFromScale(MAX_RANGE, MAX_RANGE, currScale, scale);
    polylines.forEach(line => line.setAttribute('stroke-width', STROKE_WIDTH / Math.sqrt(Math.min(scaleX, scaleY))));
    scale2Element.setAttribute('transform', `matrix(${scaleX}, 0, 0, ${scaleY}, ${translateX}, ${translateY})`)
  }
  return {
    setData,
    getData,
    setScale,
    getScale,
    refresh,
    updateMode,
    rescale,
  }
};
