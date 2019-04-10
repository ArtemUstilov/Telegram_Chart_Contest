import { findClosestValueIndex, format, findMaximum } from './util';
import { createSVGGraph } from './core/svg';
import { createStackedGraph } from './core/stackedChart';
import { createPercentagedGraph } from './core/percentagedChart';
import { reduceGraph } from './optimize';
import { dragMaster } from './markers';
import { btnMaster } from './buttons';

const ANIMATION_DURATION = 500;
const MAX_BOUND = 0.95;
const ANIMATION_SPEED = 0.3;

let _id = 0;

const easeIn = t => t * t * t;
const easeOut = t => {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
};

const debounce = (f, ms) => {
  let timer = null;
  return function (...args) {
    const finish = () => {
      f.apply(this, args);
      timer = null;
    };
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(finish, ms);
  };
};



const createGraphUpdater = (myGraph, data, totalMinX, totalMaxX, additionalAxis) => {
  const diff = totalMaxX - totalMinX;
  let prevAnimationFrame = performance.now();
  let animation = null;
  let prevScale, prevData, prevMinXInd, prevMaxXInd, scale;
  const setAnimation = ({ maxY }) => {
    const now = performance.now()
    animation = {
      startTime: now,
      duration: ANIMATION_DURATION,
      scale: { maxY },
      diff: { maxY: prevScale.maxY - maxY },
    };
  };

  const setAnimationDebounced = debounce(setAnimation, 200);

  const updater = (min, max) => {
    const data = myGraph.getData();
    if (isNaN(min) || isNaN(max) || !data.lines || !data.lines.length) {
      return;
    }
    const minX = totalMinX + min * diff;
    const maxX = totalMinX + max * diff;
    const minXIndex = findClosestValueIndex(data.x, minX);
    const maxXIndex = findClosestValueIndex(data.x, maxX);
    const minY = 0;
    let maxY, sMaxY;
    if(additionalAxis && data.lines.length === 2){
      maxY = findMaximum(data.lines[0].values, minXIndex, maxXIndex);
      sMaxY = findMaximum(data.lines[1].values, minXIndex, maxXIndex);
    }else{
      maxY = Math.max(...data.lines.map(line => findMaximum(line.values, minXIndex, maxXIndex)));
    }
    prevMinXInd = minXIndex;
    prevMaxXInd = maxXIndex;
    if (prevScale) {
      scale = { ...prevScale, minX, maxX, sMaxY };
      setAnimationDebounced({ maxY });
    } else {
      scale = { minX, maxX, minY, maxY, sMaxY };
    }
    myGraph.setScale(scale);
  };
  const updateLines = (newData) => {
    myGraph.setData(newData);
    newData = myGraph.getData();
    if (newData.lines.length) {
      const minY = 0;
      let maxY, sMaxY;
      if(additionalAxis && newData.lines.length === 2){
        maxY = findMaximum(newData.lines[0].values, prevMinXInd, prevMaxXInd);
        sMaxY = findMaximum(newData.lines[1].values, prevMinXInd, prevMaxXInd);
        myGraph.setScale({...prevScale, minY, maxY, sMaxY});
      }else{
        maxY =  Math.max(...newData.lines.map(line => findMaximum(line.values, prevMinXInd, prevMaxXInd)));
        setAnimationDebounced({ maxY });
      }
    }

  };
  const draw = () => {
    const scale = myGraph.getScale();
    const data = myGraph.getData();
    const now = performance.now();
    if (animation && scale) {
      const time = (now - animation.startTime) / animation.duration;
      const prev = (prevAnimationFrame - animation.startTime) / animation.duration;
      if (time < 1) {
        const position = easeIn(time);
        const prevPosition = easeIn(prev);
        const step = position - prevPosition;
        const left = 1 - prevPosition;
        const diff = animation.scale.maxY - scale.maxY;
        const maxY = scale.maxY + (step / left) * diff;
        const newScale = { ...scale, maxY };
        myGraph.setScale(newScale);
      } else {
        animation = null;
      }
    }
    if (data !== prevData) {
      myGraph.refresh();
    } else if (scale !== prevScale) {
      myGraph.rescale();
    }
    prevScale = scale;
    prevData = data;
    prevAnimationFrame = now;
    requestAnimationFrame(draw);
  };
  return { draw, updater, updateLines };
};
export function initGraph(customOptions, parent) {
  _id++;
  let suffixId = _id;

  const defaultOptions = {
    mode: 'svg',
    data: null,
    containerEl: null,
    previewEl: null,
    markerEl: null,
    btnBoxEl: null,
    btnSwitchEl: null,
    id: 'myGraph'+suffixId,
    previewId: 'myPreview'+suffixId,
    width: 300,
    height: 500,
    previewHeight: 50,
    title: 'Chart '+suffixId,
  };
  let containerEl = document.createElement('div');
  let previewEl = document.createElement('div');
  let markerEl = document.createElement('div');
  let btnBoxEl = document.createElement('div');
  containerEl.id = "container"+_id;
  containerEl.classList.add('chart-wrap');
  previewEl.id = "preview-wrap"+_id;
  previewEl.classList.add("preview-wrap");
  markerEl.classList.add('marker');
  btnBoxEl.classList.add('btn-box');
  markerEl.id = "marker"+_id;
  btnBoxEl.id = "btn-box"+_id;

  const state = {
    lightMode: true,
    day1: '#fff',
    night1: '#242f3e',
    night2: '#1f2a38',
    day2: '#f5f9fb',
    axisDay: '#f2f4f5',
    axisNight: '#293544',
    textAxisDay: '#96a2aa',
    textAxisNight: '#546778',
    vertAxisNight: '#3b4a5a',
    vertAxisDay: '#dfe6eb',
    tableDay: '#fff',
    tableNight: '#253241',
  };

  const {
    mode,
    additionalAxis,
    disableBtns,
    data: rawData,
    btnSwitchEl,
    id,
    previewId,
    width,
    height,
    previewHeight,
    title,
  } = Object.assign({}, defaultOptions, customOptions);
  let wrapper = document.createElement('div');
  let titleEl = document.createElement('h2');
  titleEl.innerText = title;
  wrapper.appendChild(titleEl);
  wrapper.classList.add('chart-wrapper');
  wrapper.appendChild(containerEl);

  wrapper.appendChild(previewEl);
  wrapper.appendChild(btnBoxEl);
  previewEl.appendChild(markerEl);
  parent.appendChild(wrapper);

  if (!rawData) {
    throw new Error('Empty graph');
  }
  const data = format(rawData);
  let createGraph;
  switch (mode) {
    case 'svg':
      createGraph = createSVGGraph;
      break;
    case 'stacked':
      createGraph = createStackedGraph;
      break;
    case 'percentaged':
      createGraph = createPercentagedGraph;
      break;
  }
  const myGraph = createGraph(containerEl, {
    width,
    height,
    additionalAxis,
    id,
    createAxis: true,
    createNameplates: true,
    colors: state,
    suffixId
  });
  const previewGraph = createGraph(previewEl, {
    width,
    height: previewHeight,
    additionalAxis,
    id: previewId,
    colors: state,
    suffixId
  });
  const minX = Math.min(...data.x);
  const maxX = Math.max(...data.x);

  myGraph.setData(data);
  previewGraph.setData(data);
  const myGraphUpdater = createGraphUpdater(myGraph, data, minX, maxX, additionalAxis);
  const previewGraphUpdater = createGraphUpdater(previewGraph, data, minX, maxX, additionalAxis);
  myGraphUpdater.updater(0, 1);
  previewGraphUpdater.updater(0, 1);
  let drag = dragMaster()
  let btn = btnMaster();
  function switchBtn() {
    btnSwitchEl.addEventListener('click', () => {
      let { lightMode, day1, night1 } = state;
      if (lightMode) {
        document.body.style.backgroundColor = night1;
        document.body.style.color = '#fff';
        btnSwitchEl.style.color = '#36a8f1';
        btnSwitchEl.style.backgroundColor = '#242f3e';
        btnSwitchEl.innerText = 'Switch To Day Mode';
        drag.updateMode(true);
        btn.updateMode(true);
        myGraph.updateMode(true);
      } else {
        document.body.style.backgroundColor = day1;
        document.body.style.color = '#222222';
        btnSwitchEl.style.backgroundColor = '#fff';
        drag.updateMode(false);
        btn.updateMode(false);
        myGraph.updateMode(false);
        btnSwitchEl.innerText = 'Switch To Night Mode';
        btnSwitchEl.style.color = '#108be3';
      }
      state.lightMode = !lightMode
    })
  }
  drag.makeDraggable(
    markerEl, // element to make draggable
    containerEl.getBoundingClientRect().left, // left barrier
    containerEl.offsetWidth, // width of place to drag within
    12, // min width between markers
    12, // width of left and right details
    70, // drag circle size
    state,
    suffixId,
    myGraphUpdater.updater // callback
  );
  if(!disableBtns){
  btn.drawButtons(
    data, // data set
    btnBoxEl, // parent div
    state,
    suffixId,
    myGraphUpdater.updateLines, // callbacks
    previewGraphUpdater.updateLines,
  );
  }
  switchBtn();
  myGraphUpdater.draw();
  previewGraphUpdater.draw();
}
