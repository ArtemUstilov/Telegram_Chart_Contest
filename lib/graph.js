import {
  findClosestValueIndex,
  format,
  findMaximum,
  dateToPath,
  neighDate,
  getWeek,
  getDataAsync,
  createSVGElement,
  getProps,
} from './util';
import {createSVGGraph} from './core/svg';
import {createStackedGraph} from './core/stackedChart';
import {createPercentagedGraph} from './core/percentagedChart';
import {dragMaster} from './markers';
import {btnMaster} from './buttons';
import {MONTHESFULL} from "./format";

const ANIMATION_DURATION = 500;

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


const createGraphUpdater = (myGraph, data, totalMinX, totalMaxX, additionalAxis, rangeEl, observer, immutable = false) => {
  const diff = totalMaxX - totalMinX;
  let stopUpdateRange = false;
  let prevAnimationFrame = performance.now();
  let animation = null;
  let prevScale, prevData, prevMinXInd, prevMaxXInd, scale;
  const setAnimation = ({ maxY, maxX, minX, sMaxY }) => {
    const now = performance.now();
    animation = {
      startTime: now,
      duration: ANIMATION_DURATION,
      scale: { maxY, maxX, minX, sMaxY },
      diff: { maxY: prevScale.maxY - maxY },
      diffX: { maxX: prevScale.maxX - maxX },
      diffY: { sMaxY: prevScale.sMaxY - sMaxY },
      diffMinX: { minX: prevScale.minX - minX },
    };
  };

  const setAnimationDebounced = debounce(setAnimation, 70);
  let updates = 0;
  const updater = (min, max) => {
    const data = myGraph.getData();
    if (isNaN(min) || isNaN(max) || !data.lines || !data.lines.length) {
      stopUpdateRange = true;
      updates++;
      return;
    }
    const minX = totalMinX + min * diff;
    const maxX = totalMinX + max * diff;
    const minXIndex = findClosestValueIndex(data.x, minX);
    const maxXIndex = findClosestValueIndex(data.x, maxX);
    const minY = 0;
    let maxY, sMaxY;
    if (additionalAxis && data.lines.length === 2) {
      maxY = findMaximum(data.lines[0].values, minXIndex, maxXIndex);
      sMaxY = findMaximum(data.lines[1].values, minXIndex, maxXIndex);
    } else {
      maxY = Math.max(...data.lines.map(line => findMaximum(line.values, minXIndex, maxXIndex)));
    }
    prevMinXInd = minXIndex;
    prevMaxXInd = maxXIndex;
    if (!immutable || !updates) {
      if (prevScale) {
        scale = { ...prevScale, maxX, minX };
        if (!immutable || !updates) setAnimationDebounced({ maxY, sMaxY });
      } else {
        scale = { minX, maxX, minY, maxY, sMaxY };
      }
    }
    if (!stopUpdateRange) myGraph.setRange({ minXIndex, maxXIndex });
    if (observer) {
      observer.setRange({ minXIndex, maxXIndex });
    }
    myGraph.setScale(scale);


    if (!stopUpdateRange && rangeEl) {
      let s = new Date(minX);
      let e = new Date(maxX);
      if (e.toDateString() === s.toDateString()) {
        s = s.toDateString().split(' ');
        rangeEl.innerText = s[0] + ', ' + s[2] + ' ' + s[1] + ' ' + s[3];
      } else {
        s = s.toDateString().split(' ');
        e = e.toDateString().split(' ');
        rangeEl.innerText = s[2] + ' ' + s[1] + ' ' + s[3] + ' - ' + e[2] + ' ' + e[1] + ' ' + e[3];
      }

    }
    updates++;
  };
  const updateLines = (newData) => {
    if (newData === myGraph.getData)
      return;
    myGraph.setData(newData);
    newData = myGraph.getData();
    if (newData.lines.length) {
      const minY = 0;
      let maxY, sMaxY;
      if (additionalAxis && newData.lines.length === 2) {
        maxY = findMaximum(newData.lines[0].values, prevMinXInd, prevMaxXInd);
        sMaxY = findMaximum(newData.lines[1].values, prevMinXInd, prevMaxXInd);
        myGraph.setScale({ ...prevScale, minY });
        setAnimationDebounced({ maxY, sMaxY });
      } else {
        maxY = Math.max(...newData.lines.map(line => findMaximum(line.values, prevMinXInd, prevMaxXInd)));
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
      if (time <= 1) {
        const position = easeOut(time);
        const prevPosition = easeOut(prev);
        const step = position - prevPosition;
        const left = 1 - prevPosition;
        const diff = animation.scale.maxY - scale.maxY;
        const diffX = animation.scale.maxX - scale.maxX;
        const diffMinX = animation.scale.minX - scale.minX;
        const diffsMaxY = animation.scale.sMaxY - scale.sMaxY;
        const maxX = scale.maxX + (step / left) * diffX;
        const maxY = scale.maxY + (step / left) * diff;
        const minX = scale.minX + (step / left) * diffMinX;
        const sMaxY = scale.sMaxY + (step / left) * diffsMaxY;
        const newScale = {
          ...scale, maxY: maxY || scale.maxY,
          maxX: maxX || scale.maxX,
          minX: minX || scale.minX,
          sMaxY: sMaxY || scale.sMaxY,
        };
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
    setTimeout(draw, 40);
  };
  return { draw, updater, updateLines };
};

export function initGraph(customOptions, parent) {
  _id++;
  let suffixId = _id;
  let markerW, markerL, activeBtn;
  const defaultOptions = {
    mode: 'svg',
    data: null,
    containerEl: null,
    previewEl: null,
    markerEl: null,
    btnBoxEl: null,
    btnSwitchEl: null,
    id: 'myGraph' + suffixId,
    previewId: 'myPreview' + suffixId,
    width: 300,
    height: 500,
    previewHeight: 50,
    title: 'Chart ' + suffixId,
  };
  let containerEl = document.createElement('div');
  let previewEl = document.createElement('div');
  let markerEl = document.createElement('div');
  let btnBoxEl = document.createElement('div');
  let br = document.createElement('div');
  let icon = document.createElement('div');
  let svgPath = createSVGElement('path');
  containerEl.id = "container" + _id;
  containerEl.classList.add('chart-wrap');
  previewEl.id = "preview-wrap" + _id;
  previewEl.classList.add("preview-wrap");
  parent.appendChild(br);
  br.className = 'br';
  markerEl.classList.add('marker');
  btnBoxEl.classList.add('btn-box');
  markerEl.id = "marker" + _id;
  btnBoxEl.id = "btn-box" + _id;
  const state = {
    lightMode: true,
    day1: '#fff',
    night1: '#242f3e',
    night2: '#1f2a38',
    day2: '#f5f9fb',
    axisDay: '#f2f4f5',
    axisNight: '#293544',
    textAxisDay: '#8e8e93',
    textAxisNight: '#87909a',
    vertAxisNight: '#3b4a5a',
    vertAxisDay: '#dfe6eb',
    tableDay: '#fff',
    tableNight: '#253241',
    '#3497ED': '#4681BB',
    '#2373DB': '#345B9C',
    '#9ED448': '#88BA52',
    '#5FB641': '#5AB34D',
    '#F5BD25': '#D9B856',
    '#F79E39': '#D49548',
    '#E65850': '#CF5D57',
    '#FE3C30': '#E6574F',
    '#E8AF14': '#DEB93F',
    '#64ADED': '#4082ce',
  };

  let {
    mode,
    additionalAxis,
    disableBtns,
    data: rawData,
    btnSwitchEl,
    id,
    replace,
    path,
    initScale,
    previewId,
    width,
    disableMarker,
    zoomed,
    activeBtns,
    height,
    nightMode,
    backMode,
    previewHeight,
    title,
  } = Object.assign({}, defaultOptions, customOptions);
  let prev = window.innerWidth;
  window.addEventListener('resize', () => {
    if (Math.abs(prev = window.innerWidth) < 50) return;
    prev = window.innerWidth;
    parent.style.width = window.innerWidth * 0.94 + 'px';
    containerEl.style.width = window.innerWidth * 0.94 + 'px';
    titleBox.style.width = window.innerWidth * 0.94 + 'px';
    width = window.innerWidth * 0.94;
  }, false);

  if (nightMode === false || nightMode === true) {
    state.lightMode = !nightMode;
  }
  containerEl.style.height = height + 64 + 'px';

  let wrapper = document.createElement('div');
  let titleBox = document.createElement('div');
  titleBox.className = 'title-box';
  activeBtn = activeBtns;
  let titleEl = document.createElement('h2');
  let rangeEl = document.createElement('p');
  let titleWrapper = document.createElement('div');
  titleEl.innerText = title;
  titleEl.id = id + '-title';
  titleWrapper.appendChild(titleEl);
  titleBox.appendChild(titleWrapper);
  titleBox.appendChild(rangeEl);
  wrapper.appendChild(titleBox);
  wrapper.classList.add('chart-wrapper');
  wrapper.style.width = width;
  wrapper.id = id + '-wrapper';
  wrapper.appendChild(containerEl);

  if (!disableMarker) wrapper.appendChild(previewEl);
  wrapper.appendChild(btnBoxEl);
  previewEl.appendChild(markerEl);

  const onZoom = (date) => {
    if (mode === 'percentaged') {
      initScale = [markerW, markerL];
      myGraph.toCircle();
      return;
    }
    myGraph.fade();
    let time = performance.now();
    let week = [];
    let isType4 = data.lines.length === 1;
    if (isType4) {
      week.push(dateToPath(neighDate(date, -7)));
      week.push(dateToPath(neighDate(date, -1)));
      week.push(dateToPath(neighDate(date, 0)));
    } else {
      week = getWeek(date)
    }
    let start = new Date(2018, 3, 7);
    let end = new Date(2019, 3, 6);
    week = week.filter(w => w.date.getTime() <= end.getTime() && w.date.getTime() >= start.getTime());
    let weekData = Promise.all(week.map(d => getDataAsync(path, d.path).catch(e => e)));
    weekData
      .then(res => res.filter(r => r && r.columns).sort((a, b) => a.columns[0][1] - b.columns[0][1]))
      .then(res => {
        let colors = ['#3896e8', '#558ded', '#5cbcdf'];
        let newData = res[0];
        if (isType4) {
          newData.names['y0'] = week[week.length - res.length].date.getDate() + ' ' + MONTHESFULL[week[week.length - res.length].date.getMonth()];
          for (let i = 1; i < res.length; i++) {
            res[i].columns[1][0] = 'y' + i;
            newData.columns.push(res[i].columns[1]);
            newData.colors['y' + i] = colors[i];
            newData.names['y' + i] = week[i + week.length - res.length].date.getDate() + ' ' + MONTHESFULL[week[i + week.length - res.length].date.getMonth()];
            newData.types['y' + i] = 'line';
          }
        } else {
          for (let i = 1; i < res.length; i++) {
            for (let j = 0; j < res[0].columns.length; j++)
              newData.columns[j] = newData.columns[j].concat(res[i].columns[j].slice(1));
          }
        }
        return newData;
      })
      .then(res => {
        time = performance.now() - time;
        setTimeout(() => {
          initGraph({
              data: res,
              btnSwitchEl: document.getElementById('mode-switch'),
              width,
              replace: wrapper.id,
              path,
              height,
              zoomed: true,
              title,
              colors: state,
              mode: isType4 ? 'svg' : mode,
              disableMarker: isType4,
              backMode: mode,
              nightMode: !state.lightMode,
              additionalAxis,
              activeBtns: !isType4 && activeBtn,
              initScale: [markerW, markerL],
            },
            parent);
        }, 1000 - time);
      })
      .catch(error => null);
  };
  const setPos = (w, l) => {
    markerW = w || markerW;
    markerL = l || markerL;
  };
  const setActiveBtns = (state) => {
    activeBtn = state;
  };

  function zoomTitle() {
    icon.style.width = '18px';
    let iconSvg = createSVGElement('svg');
    iconSvg.setAttribute('aria-hidden', 'true');
    iconSvg.setAttribute('focusable', 'false');
    iconSvg.setAttribute('data-icon', 'search-minus');
    iconSvg.setAttribute('role', 'img');
    iconSvg.setAttribute('viewBox', '0 0 512 512');
    svgPath.setAttribute('d', 'M304 192v32c0 6.6-5.4 12-12 12H124c-6.6 0-12-5.4-12-12v-32c0-6.6 5.4-12 12-12h168c6.6 0 12 5.4 12 12zm201 284.7L476.7 505c-9.4 9.4-24.6 9.4-33.9 0L343 405.3c-4.5-4.5-7-10.6-7-17V372c-35.3 27.6-79.7 44-128 44C93.1 416 0 322.9 0 208S93.1 0 208 0s208 93.1 208 208c0 48.3-16.4 92.7-44 128h16.3c6.4 0 12.5 2.5 17 7l99.7 99.7c9.3 9.4 9.3 24.6 0 34zM344 208c0-75.2-60.8-136-136-136S72 132.8 72 208s60.8 136 136 136 136-60.8 136-136z');
    iconSvg.appendChild(svgPath);
    icon.appendChild(iconSvg);
    startTapAnim(titleWrapper);
    titleWrapper.insertBefore(icon, titleEl);
    titleEl.innerText = 'Zoom Out';
    let zoomColor = '#108BE3';
    if (nightMode)
      zoomColor = '#48AAF0';
    svgPath.setAttribute('fill', zoomColor);
    titleEl.style.color = zoomColor;
    titleWrapper.onclick = onZoomOut;
    titleWrapper.style.cursor = 'pointer';
  }

  const onZoomOut = () => {
    setTimeout(() => endAnim(titleWrapper), 1000);
    if (mode === 'percentaged') {
      myGraph.toInit();
      setTimeout(() => {
        fetch(`${path}/overview.json`)
          .then(res => res.json())
          .then(res => {
            initGraph({
                data: res,
                btnSwitchEl: document.getElementById('mode-switch'),
                width,
                replace: wrapper.id,
                height,
                title,
                nightMode: !state.lightMode,
                colors: state,
                mode: backMode || mode,
                path,
                zoomed: false,
                additionalAxis,
                activeBtns: activeBtn,
                initScale: initScale || [markerW, markerL],
              },
              parent);
          })
          .catch(err => err);
      }, 300);
    } else {
      myGraph.fade();
      let time = performance.now();
      fetch(`${path}/overview.json`)
        .then(res => res.json())
        .then(res => {
          time = performance.now() - time;
          setTimeout(() => {
            initGraph({
                data: res,
                btnSwitchEl: document.getElementById('mode-switch'),
                width,
                replace: wrapper.id,
                height,
                title,
                nightMode: !state.lightMode,
                colors: state,
                mode: backMode || mode,
                path,
                zoomed: false,
                additionalAxis,
                activeBtns: activeBtn,
                initScale: initScale || [markerW, markerL],
              },
              parent);
          }, 1000 - time);

        }).catch(err => err);
    }
  };
  if (replace) {
    if (zoomed) {
      zoomTitle();
    }
    let prev = document.getElementById(replace);
    parent.insertBefore(wrapper, prev);
    parent.removeChild(prev);
  } else {
    parent.appendChild(wrapper);
  }
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

  function drawNewDragMaster(min, max, night) {
    myGraphUpdater.updater('stop', 'stop');
    previewEl.removeChild(previewEl.firstChild);
    zoomed = true;
    zoomTitle();
    previewGraph = createGraph(previewEl, {
      width: width,
      height: previewHeight,
      additionalAxis,
      id: previewId + '1',
      night,
      colors: state,
      suffixId,
      isPreview: true,
    });
    // initScale =
    previewGraph.setData(data);
    previewGraphUpdater = createGraphUpdater(previewGraph, data, data.x[min], data.x[max], additionalAxis, rangeEl, myGraph, true);
    previewGraphUpdater.updater(0, 1);
    let drag = dragMaster();
    drag.makeDraggable(
      markerEl, // element to make draggable
      previewEl.getBoundingClientRect().left, // left barrier
      previewEl.offsetWidth, // width of place to drag within
      zoomed ? 50 : 12, // min width between markers
      12, // width of left and right details
      70, // drag circle size
      state,
      suffixId,
      previewGraphUpdater.updater,
      myGraphUpdater.updater,
      null,
      [previewEl.offsetWidth - 24, 0],
      night,
    );
    btnBoxEl.innerHTML = '';
    btn.drawButtons(
      additionalAxis || data.lines.length === 1,
      data, // data set
      btnBoxEl, // parent div
      state,
      suffixId,
      data.lines.length !== 1 && setActiveBtns,
      btn.getState(),
      night,
      startTapAnim,
      endAnim,
      myGraphUpdater.updateLines, // callbacks
      previewGraphUpdater && previewGraphUpdater.updateLines,
    );
    previewGraphUpdater.draw();
  }

  const myGraph = createGraph(containerEl, {
    width,
    height,
    additionalAxis,
    id,
    onZoom,
    nightMode,
    zoomed,
    isType4: backMode !== mode,
    createAxis: true,
    createNameplates: true,
    colors: state,
    suffixId,
    drawNewDragMaster,
    startTapAnim,
    endAnim,
  });


  //TODO colors, clean code 50%


  let previewGraph;
  // previewEl.style.left = width*0.1 + 'px';
  previewEl.style.width = width + 'px';
  if (!disableMarker) {
    previewGraph = createGraph(previewEl, {
      width: width,
      height: previewHeight,
      additionalAxis,
      id: previewId,
      nightMode,
      colors: state,
      suffixId,
      isPreview: true,
    });
  }
  const minX = Math.min(...data.x);
  const maxX = Math.max(...data.x);

  myGraph.setData(data);
  previewGraph && previewGraph.setData(data);
  const myGraphUpdater = createGraphUpdater(myGraph, data, minX, maxX, additionalAxis, rangeEl);
  myGraphUpdater.updater(0, 1);
  let previewGraphUpdater;
  if (previewGraph) {
    previewGraphUpdater = createGraphUpdater(previewGraph, data, minX, maxX, additionalAxis);
    previewGraphUpdater.updater(0, 1);
  }

  let drag = dragMaster();
  let btn = btnMaster();

  function startTapAnim(el, t = -1, l = -1) {
    el.addEventListener('click', (e) => tap(e, t, l), false);
  }

  function endAnim(el) {
    el.onclick = null;
  }

  function tap(e, t, l) {
    e.preventDefault();
    let [pageX, pageY] = (t === -1 || l === -1) ? getProps(e, 'pageX', 'pageY') : [l, t];
    let effect = document.createElement('div');
    effect.className = 'effect';
    let zoomColor = '#108BE3';
    if (nightMode)
      zoomColor = '#48AAF0';
    effect.style.borderColor = zoomColor;
    effect.style.left = pageX + 'px';
    effect.style.top = pageY + 'px';
    document.body.appendChild(effect);
    setTimeout(() => document.body.removeChild(effect), 500);
  }

  function switchBtn() {
    btnSwitchEl.addEventListener('click', () => {
      let { lightMode } = state;
      drag.updateMode(lightMode);
      btn.updateMode(lightMode);
      myGraph.updateMode(lightMode);
      previewGraph && previewGraph.updateMode(lightMode);
      state.lightMode = !lightMode;
      let zoomColor = '#108BE3';
      if (zoomed) {
        if (lightMode)
          zoomColor = '#48AAF0';
      } else {
        if (!lightMode)
          zoomColor = '#000';
        else
          zoomColor = '#fff';
      }
      if (svgPath) svgPath.setAttribute('fill', zoomColor);
      titleEl.style.color = zoomColor;
    })
  }

  if (!disableMarker) {
    drag.makeDraggable(
      markerEl, // element to make draggable
      previewEl.getBoundingClientRect().left, // left barrier
      previewEl.offsetWidth, // width of place to drag within
      zoomed ? 50 : 12, // min width between markers
      12, // width of left and right details
      70, // drag circle size
      state,
      suffixId,
      myGraphUpdater.updater,
      null,
      !zoomed ? setPos : null,// callback
      !zoomed && initScale,
      !state.lightMode,
    );
  }
  if (!disableBtns) {
    btn.drawButtons(
      additionalAxis || data.lines.length === 1,
      data, // data set
      btnBoxEl, // parent div
      state,
      suffixId,
      data.lines.length !== 1 && setActiveBtns,
      activeBtns,
      !state.lightMode,
      startTapAnim,
      endAnim,
      myGraphUpdater.updateLines, // callbacks
      previewGraphUpdater && previewGraphUpdater.updateLines,
    );
  }
  switchBtn();
  myGraphUpdater.draw();
  previewGraphUpdater && previewGraphUpdater.draw();
}


