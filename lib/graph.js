import {findClosestValueIndex, format} from './util';
import {createCanvasGraph} from './core/canvas';
import {createSVGGraph} from './core/svg';
import {dragMaster} from './markers';
import {btnMaster} from './buttons';

const defaultOptions = {
  mode: 'canvas',
  data: null,
  containerEl: null,
  previewEl: null,
  markerEl: null,
  btnBoxEl: null,
  btnSwitchEl: null,
  id: 'myGraph',
  previewId: 'myPreview',
  width: 300,
  height: 500,
  previewHeight: 50,
};


const findMaximum = (arr, minIndex, maxIndex) => {
  let max = -Infinity;
  for (let i = minIndex; i <= maxIndex; i++) {
    if (arr[i] > max) {
      max = arr[i];
    }
  }
  return max;
};
const findMinimum = (arr, minIndex, maxIndex) => {
  let min = Infinity;
  for (let i = minIndex; i <= maxIndex; i++) {
    if (arr[i] < min) {
      min = arr[i];
    }
  }
  return min;
};

const createGraphUpdater = (myGraph, data, totalMinX, totalMaxX) => {
  const diff = totalMaxX - totalMinX;
  let prevScale, prevData, prevMinXInd, prevMaxXInd, scale;
  const updater = (min, max) => {
    console.time('updater');
    if (isNaN(min) || isNaN(max) || !data.lines.length) {
      return;
    }
    const minX = totalMinX + min * diff;
    const maxX = totalMinX + max * diff;
    const minXIndex = findClosestValueIndex(data.x, minX);
    const maxXIndex = findClosestValueIndex(data.x, maxX);
    const minY = 0; // Math.min(...data.lines.map(line => findMinimum(line.values, minXIndex, maxXIndex)));
    console.log(data.lines)
    console.log('------------------------------------------')
    const maxY = Math.max(...data.lines.map(line => findMaximum(line.values, minXIndex, maxXIndex)));
    prevMinXInd = minXIndex;
    prevMaxXInd = maxXIndex;
    scale = { minX, maxX, minY, maxY };
    myGraph.setScale(scale);
    console.timeEnd('updater');
    console.timeStamp('updater');
  };
  const updateLines = (newData) => {
    console.time('updateLines');
    data = newData;
    if(newData.lines.length){
    const minY = 0; // Math.min(...data.lines.map(line => findMinimum(line.values, prevMinXInd, prevMaxXInd)));
    const maxY = Math.max(...newData.lines.map(line => findMaximum(line.values, prevMinXInd, prevMaxXInd)));
    let scale = { ...prevScale, minY, maxY };
     myGraph.setScale(scale);
    }
    myGraph.setData(newData);
    console.timeEnd('updateLines');
    console.timeStamp('updateLines');
  };
  const draw = () => {
    const scale = myGraph.getScale();
    const data = myGraph.getData();
    if (prevScale !== scale || data !== prevData) {
      console.time('refresh');
      myGraph.refresh();
      console.timeEnd('refresh');
      console.timeStamp('refresh');
    }
    prevScale = scale;
    prevData = data;
    requestAnimationFrame(draw);
  };
  return { draw, updater, updateLines };
};

export function initGraph(customOptions) {
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
    data: rawData,
    containerEl,
    previewEl,
    markerEl,
    btnBoxEl,
    btnSwitchEl,
    id,
    previewId,
    width,
    height,
    previewHeight,
  } = Object.assign({}, defaultOptions, customOptions);
  if (!rawData) {
    throw new Error('Empty graph');
  }
  const data = format(rawData);
  let createGraph;
  switch (mode) {
    case 'canvas':
      createGraph = createCanvasGraph;
      break;
    case 'svg':
      createGraph = createSVGGraph;
      break;
  }
  const myGraph = createGraph(containerEl, {
    width,
    height,
    id,
    createAxis: true,
    createNameplates: true,
    colors: state,
  });
  const previewGraph = createGraph(previewEl, {
    width,
    height: previewHeight,
    id: previewId,
    colors: state
  });
  const minX = Math.min(...data.x);
  const maxX = Math.max(...data.x);

  myGraph.setData(data);
  previewGraph.setData(data);
  const myGraphUpdater = createGraphUpdater(myGraph, data, minX, maxX);
  const previewGraphUpdater = createGraphUpdater(previewGraph, data, minX, maxX);
  myGraphUpdater.updater(0, 1);
  previewGraphUpdater.updater(0, 1);

  function switchBtn() {
    btnSwitchEl.style.left = `calc(50% - ${btnSwitchEl.offsetWidth / 2}px`;
    btnSwitchEl.addEventListener('click', () => {
      let { lightMode, day1, night1 } = state;
      if (lightMode) {
        document.body.style.backgroundColor = night1;
        document.body.style.color = '#fff';
        btnSwitchEl.style.color = '#36a8f1';
        btnSwitchEl.innerText = 'Switch To Day Mode';
        dragMaster.updateMode(true);
        btnMaster.updateMode(true);
        myGraph.updateMode(true);
      } else {
        document.body.style.backgroundColor = day1;
        document.body.style.color = '#222222';
        dragMaster.updateMode(false);
        btnMaster.updateMode(false);
        myGraph.updateMode(false);
        btnSwitchEl.innerText = 'Switch To Night Mode';
        btnSwitchEl.style.color = '#108be3';
      }
      state.lightMode = !lightMode
    })
  }

  dragMaster.makeDraggable(
    markerEl, // element to make draggable
    containerEl.getBoundingClientRect().left, // left barrier
    containerEl.offsetWidth, // width of place to drag within
    10, // min width between markers
    8, // width of left and right details
    70, // drag circle size
    state,
    myGraphUpdater.updater // callback
  );

  btnMaster.drawButtons(
    data, // data set
    btnBoxEl, // parent div
    state,
    myGraphUpdater.updateLines, // callbacks
    previewGraphUpdater.updateLines,
  );
  switchBtn();
  myGraphUpdater.draw();
  previewGraphUpdater.draw();
}
