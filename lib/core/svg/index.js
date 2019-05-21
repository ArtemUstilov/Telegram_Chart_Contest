import { createSVGAxis, FONT_SIZE_COEF } from "../../axis";
import { dateFormatter, numberFormatter } from '../../format';
import {createSVGTable} from "../../table";
import {createSVGElement, createTransformer} from "../../util";

const MAX_RANGE = 100;
const STROKE_WIDTH = 1;

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'svg-graph'+options.suffixId,
  xFormatter: dateFormatter(10),
  yFormatter: numberFormatter(10),
  createAxis: false,
  fontSize: 16,
  fill: true,
}, options);

export const createSVGGraph = function (parent, customOptions) {
  const options = createOptions(parent, customOptions);
  const svgElement = createSVGElement('svg');
  svgElement.setAttribute('height', options.height);
  svgElement.setAttribute('id', options.id);
  svgElement.setAttribute('width', options.width);
  svgElement.style.transition = 'all 0.5s';
  svgElement.style.webkitTransition = 'all 0.5s';

  let prev = window.innerWidth;

  window.addEventListener('resize', () => {
    if(Math.abs(prev = window.innerWidth) < 50)return;
    prev = window.innerWidth;

    options.width = window.innerWidth*0.94;
    svgElement.setAttribute('width', options.width);
  }, false);
  svgElement.setAttribute('style', `position: absolute; top: ${options.isPreview ? 0 : 32}px; margin: 0 0 ${options.fontSize * FONT_SIZE_COEF}px ${-(options.enlarge || 0)}px;`);
  svgElement.setAttribute('preserveAspectRatio', 'none');
  svgElement.setAttribute('viewBox', `0 0 ${MAX_RANGE} ${MAX_RANGE}`);
  const scale2Element = createSVGElement('g');
  svgElement.appendChild(scale2Element);
  const scaleElement = createSVGElement('g');
  scale2Element.appendChild(scaleElement);
  parent.insertBefore(svgElement, parent.firstChild);
  let range;
  let NightMode = false;
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
    table = createSVGTable(options, options.onZoom, parent);
  }

  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const setData = function setData(newData) {
    data = newData;
    if(options.additionalAxis || data.lines[0] === 'Shares') {
      scale.sMaxY = Math.max(...data.lines[data.lines.length-1].values);
    }else{
      scale.sMaxY = null;
    }
    if (axis) {
      if(options.additionalAxis) axis.setType2Colors(newData.lines.map(l => l.color));
      if(newData.lines[0].name === 'Shares' && newData.lines.length === 1){
        transformer.setScale({...scale, maxY: scale.sMaxY});
        axis.setScale({...scale, maxY: null});
      }else{
        transformer.setScale(scale);
        axis.setScale(scale);
      }

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
      if(options.additionalAxis && data.lines[0].name === 'Shares'){
        axis.setScale({...newScale, maxY: null});
      }else if(data.lines.length === 1){
      axis.setScale({...newScale, sMaxY: null});
      }else{
        axis.setScale(newScale);
      }
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
      points.push(' ');
      points.push(transformer.transformY(y[i]));
      points.push(' ');
    }
    return points.join('');
  };
  const refresh = function refresh() {
    if (axis) {
      axis.refresh();
    }
    currScale = scale;
    const { lines, x } = data;
      scaleElement.innerHTML = '';
    transformer.setScale(scale);
    polylines = lines.map((item, i) => {
        const { values: y, color } = item;
        if(i === 1 && options.additionalAxis) {
          transformer.setScale({ ...scale, maxY: scale.sMaxY });
        }else{
          transformer.setScale(scale);
        }
          const polyline = createSVGElement('polyline');
          polyline.setAttribute('points', valuesToPoints(x, y));
          polyline.setAttribute('stroke', NightMode ? (options.colors[color] || color) : color);
      polyline.setAttribute('vector-effect', 'non-scaling-stroke');
            polyline.setAttribute('stroke-width', STROKE_WIDTH);
          polyline.setAttribute('fill', 'none');
          polyline.style.transition = 'all 1s';
          scaleElement.appendChild(polyline);
          return polyline;
      });
    transformer.setScale(scale);
  };
  function updateMode (isNight){
    NightMode = !!isNight;
    if(axis)
      axis.updateMode(isNight);
    if(table)
      table.updateMode(isNight);
    refresh();
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
  function toCircle() {
return null;
  }
  function fade() {
    for(let i = 0; i < 10; i++){
      setTimeout(() =>     svgElement.style.opacity = '' + (1 - i/10), i*100);
    }
    table && table.fade();
    axis && axis.fade();
  }
  return {
    setData,
    getData,
    setRange,
    toCircle,
    setScale,
    getScale,
    refresh,
    updateMode,
    rescale,
    fade,
  }
};
