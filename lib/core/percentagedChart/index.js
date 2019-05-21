import { createSVGAxis, FONT_SIZE_COEF } from "../../axis/index";
import { dateFormatter, numberFormatter } from '../../format/index';
import {createSVGTable} from "../../table/index";
import {createSVGElement, createTransformer, getColor} from "../../util";

const MAX_RANGE = 100;

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'svg-graph'+options.suffixId,
  xFormatter: dateFormatter(5),
  yFormatter: numberFormatter(10),
  createAxis: false,
  fontSize: 16,
}, options);


export const createPercentagedGraph = function (parent, customOptions) {
  const options = createOptions(parent, customOptions);
  const svgElement = createSVGElement('svg');
  percBox();
  svgElement.setAttribute('id', options.id);
  let prev = window.innerWidth;

  window.addEventListener('resize', () => {
    if(Math.abs(prev = window.innerWidth) < 50)return;
    prev = window.innerWidth;

    options.width = window.innerWidth*0.94;
    if(curState === 'chart'){
      svgElement.setAttribute('width', options.width + (options.enlarge || 0));
    }else{
      let minSize = Math.min(options.width, options.height) - 20;
      svgElement.setAttribute('width', minSize);
      svgElement.setAttribute('height', minSize);
      svgElement.style.marginLeft = (options.width - minSize)/2 + 'px';
      svgElement.style.marginTop = (options.height - minSize)/2 + 10 + 'px';
    }
  }, false);
  svgElement.setAttribute('preserveAspectRatio', 'none');
  const scaleElement = createSVGElement('g');
  svgElement.appendChild(scaleElement);
  parent.insertBefore(svgElement, parent.firstChild);
  let range;
  let prevPieData;
  let prevBigPerc;
  let prevDeg;
  let curState = 'chart';
  let NightMode = false;
  let axis, table;
  if (options.createAxis) {
    axis = createSVGAxis({...options, enlarge: 32});
    svgElement.style.marginBottom = options.fontSize * FONT_SIZE_COEF;
    parent.insertBefore(axis.labelsElement, svgElement.nextSibling);
    parent.appendChild(axis.axisElement);
  }

  const transformer = createTransformer({ minX: 0, maxX: MAX_RANGE, minY: 0, maxY: MAX_RANGE }, false, true);

  let polylines = [];
  let data = [];
  let stackedData = {};
  let currScale = null;
  let percentagedData;
  if (options.createNameplates) {
    table = createSVGTable({...options, type: 'percentaged'}, options.onZoom, parent);
  }

  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const setData = function setData(newData) {
    data = newData;
    let stackedLine = new Array(data.lines[0].values.length).fill(0);

    percentagedData = new Array(data.lines.length).fill(0).map(x => ({color: '', name: '', values: []})
    )
    data.lines.forEach((l, j) => {
      percentagedData[j].name = l.name;
      percentagedData[j].color = l.color;
    });

    data.lines[0].values.forEach((val, i) =>{
      let sum = data.lines.reduce((ac, l) => ac + l.values[i], 0);
      data.lines.forEach((l, j) => {
        percentagedData[j].values[i] = Math.round(l.values[i]/sum * 100);
      })
    });
    stackedData = {lines: [], x: data.x};
    percentagedData.forEach((line, J) => {
      stackedData.lines.push(({values: line.values.map((element, i) => {
          if(J === percentagedData.length - 1){
            stackedLine[i] = 100;
          }else {
            stackedLine[i] += element;
          }
          return stackedLine[i]
        }), color: line.color, name: line.name }));
    })
    if(table)table.setData({...newData, percentage: percentagedData});
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
    let max = range.maxXIndex;
    if(options.isPreview){
      min = 0;
      max = y.length-1;
    }
    for (let i = min; i <= max; i++) {
      let YY = transformer.transformY(y[i]);
      points.push(XX + diff * (i));
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
  const setRange = (newRange)=>{
    range = newRange;
  }
  const refresh = function refresh(changeMode = false) {
    if(curState === 'pie'){
      drawPieChart(changeMode);
      return;
    }
    if (axis) {
      axis.refresh();
    }
    currScale = scale;
    const { lines, x } = data;
    if(changeMode){
      polylines.forEach((polyline, i) => {
        const { color } = stackedData.lines[polylines.length - 1 - i];
        polyline.setAttribute('fill', (NightMode || options.night) ? (options.colors[color] || color) : color);
        return polyline;
      });
    }else {
      const dif = transformer.transformX(x[1]) - transformer.transformX(x[0]);
      scaleElement.innerHTML = '';
      polylines = stackedData.lines.map((item) => {
        const polyline = createSVGElement('polygon');
        const { color } = item;
        polyline.setAttribute('points', valuesToPoints(x, item.values, dif));
        polyline.setAttribute('fill', (NightMode || options.night) ? (options.colors[color] || color) : color);
        return polyline;
      });
      polylines.reverse().forEach(p => {
        scaleElement.appendChild(p);
      })
    }
  };
  function updateMode (isNight){
    options.night = false;
    NightMode = !!isNight;
    if(axis)
      axis.updateMode(isNight);
    if(table)
      table.updateMode(isNight);
    refresh(true);
  }
  function rescale() {
   refresh();
  }
  function pieBox(){
    let minSize = Math.min(options.width, options.height) - 20;
    svgElement.style.transition = 'all 0.5s';
    svgElement.style.webkitTransition = 'all 0.5s';
    svgElement.setAttribute('viewBox', `-1 -1 2 2`);
    svgElement.setAttribute('width', minSize);
    svgElement.setAttribute('height', minSize);
    svgElement.style.marginLeft = (options.width - minSize)/2 + 'px';
    svgElement.style.marginTop = (options.height - minSize)/2 + 10 + 'px';
    svgElement.style.transform = 'rotate(360deg)';
  }
  function percBox(){
    svgElement.setAttribute('height', options.height + (!options.isPreview ? 32 : 0));
    svgElement.setAttribute('width', options.width + (options.enlarge || 0));
    svgElement.setAttribute('style', `margin-left: ${-(options.enlarge || 0)}px; margin-top: 0;`);
    svgElement.setAttribute('viewBox', `0 0 ${MAX_RANGE} ${MAX_RANGE}`);
  }
  function isPrev(data){
    if(!prevPieData) return false;
    if(prevPieData.length !== data.length) return false;
    for(let i = 0; i < percentagedData.length; i++){
      if(data[i].value !== prevPieData[i].value || data[i].color !== prevPieData[i].color) return false;
    }
    return true;
  }
  function drawPieChart(changeMode = false){
    let min = range.minXIndex;
    if(range.minXIndex > 0)
      min--;
    let pieData = new Array(percentagedData.length).fill(0);
    for (let i = min; i <= range.maxXIndex; i++) {
      for(let j = 0; j < percentagedData.length; j++){
        pieData[j] += percentagedData[j].values[i];
      }
    }
    let sum = pieData.reduce((ac,val)=> ac+ val, 0);
    pieData = pieData.map((val, i) => ({value: val/sum, color: percentagedData[i].color }));
    if(isPrev(pieData) && !changeMode) return;
    prevPieData = pieData;
    scaleElement.innerHTML = '';
    pieBox();
    let [prevX, prevY] = getCoordinatesForPercent(0);
    let cPerc = 0;
    if(prevBigPerc){
      prevDeg += (prevBigPerc-pieData[0].value)/2 * 360;
        svgElement.style.transform = `rotate(-${prevDeg})`;
    }
    prevBigPerc = pieData[0].value;
    const dil = [100, 2.5, 2, 1.7, 1.6, 1.5];
    pieData.forEach(data => {
      const part = createSVGElement('path');
      const label = createSVGElement('text');
      let [labelX, labelY] = getCoordinatesForPercent(cPerc+data.value/2);
      labelX /= (dil[percentagedData.length-1] || 1.5);
      labelY /= (dil[percentagedData.length-1] || 1.5);
      cPerc += data.value;
      const [x, y] = getCoordinatesForPercent(cPerc);
      const text = Math.round(data.value*100) + '%';
      const d = [
        `M ${prevX} ${prevY}`,
        `A 1 1 0 ${data.value > 0.5 ? 1 : 0} 1 ${x} ${y}`,
        `L 0 0`,
      ].join(' ');
      label.setAttribute('fill', '#fff');
      label.innerHTML = text;
      label.style.zIndex = '10';
      label.style.fontSize = data.value * 0.3 + 0.05 + '';
      label.style.fontWeight = 'bold';
      part.setAttribute('fill', getColor(NightMode, options.colors, data.color));
      part.setAttribute('d', d);
      scaleElement.appendChild(part);
      scaleElement.appendChild(label);
      label.setAttribute('x', labelX - label.getBBox().width/2);
      label.setAttribute('y', labelY + label.getBBox().height/2);
      [prevX, prevY] = [x,y];
    });

  }
  function getCoordinatesForPercent(percent) {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  }
  function toCircle() {
    polylines.forEach(p => {
      scaleElement.removeChild(p);
    })
    parent.removeChild(axis.axisElement);
    parent.removeChild(axis.labelsElement);
    parent.removeChild(parent.lastChild);
    parent.removeChild(parent.lastChild);
    curState = 'pie';
    let min = range.minXIndex;
    if(range.minXIndex > 0)
      min--;
    options.drawNewDragMaster(min, range.maxXIndex, NightMode);
    drawPieChart();
  }
  function fade() {
    for(let i = 0; i < 10; i++){
      setTimeout(() =>     svgElement.style.opacity = '' + (1 - i/10), i*100);
    }
    table && table.fade();
    axis && axis.fade();
  }
  function toInit(){
    svgElement.style.transform = 'rotate(0deg) scale(1.4,1.4)';
    svgElement.style.opacity = '0';
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
    toCircle,
    toInit,
    fade,
  }
};
