import {createSVGElement, createTransformer, findClosestValueIndex, getProps} from "../util";

export const FONT_SIZE_COEF = 2;

export const createSVGTable = function (options, onZoom, parent) {
  let data, scale, chart, mouseOffset, prevInd, realInd, drawShadow, removeShadow, start;
  let isNight = options.nightMode;
  let pageX = -1;
  let pageY = -1;
  let type = options.type;
  let transf = createTransformer({ minX: 10, maxX: options.width+10, minY: options.fontSize * FONT_SIZE_COEF, maxY: options.height+options.fontSize * FONT_SIZE_COEF }, false, true);
  let prev = window.innerWidth;

  const tableElement = createSVGElement('svg');
  tableElement.style.transition = 'all 0.5s';
  tableElement.style.webkitTransition = 'all 0.5s';
  window.addEventListener('resize', () => {
    if(Math.abs(prev = window.innerWidth) < 50)return;
    prev = window.innerWidth;

    options.width = window.innerWidth*0.94;
    clearTable();
    tableElement.setAttribute('width', options.width + 20);
    transf = createTransformer({ minX: 10, maxX: options.width+10, minY: options.fontSize * FONT_SIZE_COEF, maxY: options.height+options.fontSize * FONT_SIZE_COEF }, false, true);
    refresh();
  }, false);
  tableElement.style.position = 'absolute';
  tableElement.style.top = '0px';
  tableElement.style.left = '-10px';
  tableElement.classList.add('table-wrapper');
  tableElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF*3/2);
  tableElement.setAttribute('width', options.width + 20);
  tableElement.setAttribute('preserveAspectRatio', 'none');
  tableElement.addEventListener('mousemove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  }, false);
  tableElement.addEventListener('touchmove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  }, { passive: true });

  document.addEventListener('mousedown', clickOutOfChart, false);
  document.addEventListener('touchstart', clickOutOfChart, { passive: true });

  const verticalAxis = createSVGElement('rect');
  if(window.innerWidth > 500)verticalAxis.style.transition = 'all 0.2s';

  const rectElement = document.createElement('div');
  rectElement.className = 'table';
  rectElement.style.display = 'none';

  if(!options.zoomed)rectElement.addEventListener('click', () => {
    onZoom(new Date(data.x[realInd]));
  }, false);
  const xBox = document.createElement('div');
  xBox.className = 'table-box';
  xBox.style.fontWeight = 'bold';
  const xVal = document.createElement('p');
  xBox.appendChild(xVal);
  const arrow = document.createElement('div');
  arrow.className = 'arrow';
  xBox.appendChild(arrow);
  if(options.zoomed){
    arrow.style.visibility = 'hidden';
  }else{
    options.startTapAnim(rectElement);
    rectElement.style.cursor = 'pointer';
  }
  xBox.className = 'table-box';
  rectElement.appendChild(xBox);
  let yBoxes = [];


  let yElements = [];

  tableElement.appendChild(verticalAxis);

  parent.appendChild(tableElement);
  parent.appendChild(rectElement);

  function clearTable() {
    verticalAxis.setAttribute('stroke', 'transparent');
    rectElement.style.display = 'none';
    yElements.forEach(y => {
      if (y.circ) {
        y.circ.setAttribute('stroke', 'transparent');
        y.circ.setAttribute('fill', 'transparent');
      }
    });
    if(removeShadow) removeShadow();
  }

  function clickOutOfChart(e) {
    let cordsTable = tableElement.getBoundingClientRect();
    start = false;
    let pagex, pageY;
    [pagex, pageY] = getProps(e, 'pageX', 'pageY');
    if (pagex < cordsTable.left || pagex > cordsTable.left + cordsTable.width ||
      pageY < cordsTable.top + window.pageYOffset || pageY > cordsTable.top + cordsTable.height + window.pageYOffset) {
      close();
    }
  }

  function close() {
    pageX = -1;
    start = false;
    clearTable();
    refresh();
  }

  function getValues() {
    let timeS = (scale.maxX - scale.minX) / (options.width+20) * (pageX - tableElement.getBoundingClientRect().left) + scale.minX;
    realInd = findClosestValueIndex(data.x, timeS);
    if (Math.abs(data.x[realInd] - timeS) > Math.abs(data.x[realInd - 1] - timeS)) {
      realInd--;
    }
    if(data.percentage){
      if(data.x[realInd] > scale.maxX){
        realInd--;
      }
      if(data.x[realInd] < scale.minX){
        realInd++;
      }
      }

    transf.setScale(scale);
    mouseOffset = transf.transformX(data.x[realInd]);
    let XValue;
      if(options.zoomed){
        let date = new Date(data.x[realInd]).toLocaleTimeString().split(' ');
        let time = date[0];
        let t = time.split(':');
        if(date[1] === 'PM'){
          if(+t[0] !== 12) {
            t[0] = +t[0] + 12;
          }else{
            t[0] = +t[0] - 12;
          }

        }else if(+t[0] === 12) {
          t[0] = +t[0] - 12;
        }
        time = t.slice(0,2).join(':');
        XValue = time;
        if(!options.isType4){
          let date = new Date(data.x[realInd]).toDateString().split(' ');
          XValue += ' ' + date[0] + ', ' + date[1] + ' ' + date[2];
        }
    }else{
      let date = new Date(data.x[realInd]).toDateString().split(' ');
      XValue = date[0] + ', ' + date[1] + ' ' + date[2] + ' ' + date[3];
    }
    const diff = Math.abs(transf.transformX(data.x[realInd + 1 >= data.x.length ? realInd - 1 : realInd + 1]) - mouseOffset);
    return { XValue, diff, realInd };
  }

  function shadow(diff, realInd) {
    let normalizeMouseOffset = (mouseOffset-10) / (options.width) * 100;
    let normalizeDiff = diff / (options.width+10) * 100;
    if(drawShadow) drawShadow(normalizeDiff, normalizeMouseOffset, realInd);
  }

  function drawVerticalLine() {
    verticalAxis.setAttribute('x', mouseOffset || 0);
    verticalAxis.setAttribute('y', data.percentage ? 0 : options.fontSize * FONT_SIZE_COEF/2);
    verticalAxis.setAttribute('width', 0.5);
    verticalAxis.setAttribute('height', options.height + (data.percentage ? options.fontSize * FONT_SIZE_COEF : options.fontSize * FONT_SIZE_COEF/2));
    verticalAxis.setAttribute('vector-effect', 'non-scaling-stroke');
    verticalAxis.setAttribute('stroke-width', '1');
    verticalAxis.setAttribute('fill', 'none');
    verticalAxis.setAttribute('stroke', isNight ? options.colors.vertAxisNight : options.colors.vertAxisDay);
  }

  function getTablePos(diff) {
    let mouseY = pageY - (tableElement.getBoundingClientRect().top + window.pageYOffset);

    let top = 50;
    if(mouseY > options.height/2)
      top = options.height/2;
    let left = mouseOffset;
    if(mouseOffset > options.width/2){
      left = mouseOffset - (rectElement.clientWidth || 200) - diff;
      if(data.percentage) left += diff/2;
    }
    return { left, top };
  }

  function drawValues(top, left, XValue, realInd) {
    rectElement.style.display = 'block';
    xVal.innerText = XValue;
    rectElement.style.top = top + 'px';
    let allValues = 0;
    data.lines.forEach((l, i) => {
      allValues += +l.values[realInd];
      const el = yBoxes[i].elem;
      el.lastChild.innerText = l.values[realInd];
      el.lastChild.style.color = isNight ? (options.colors[l.color] || l.color) : l.color;
      if (data.percentage) {
        el.firstChild.innerText = `${data.percentage[i].values[realInd]}%`;
      }
      if (scale.sMaxY) {
        if (i === 1) {
          transf.setScale({ ...scale, maxY: scale.sMaxY });
        } else {
          transf.setScale(scale);
        }
      }
      if (type !== 'stacked') {
        let yPx = transf.transformY(data.lines[i].values[realInd]);
        yElements[i].circ.setAttribute('cx', mouseOffset || 0);
        yElements[i].circ.setAttribute('cy', yPx || 0);
        yElements[i].circ.setAttribute('r', 4);
        yElements[i].circ.setAttribute('fill', isNight ? options.colors.night1 : options.colors.day1);
        yElements[i].circ.setAttribute('display', 'block');
        let color = isNight ? (options.colors[l.color] || l.color) : l.color;
        yElements[i].circ.setAttribute('stroke', color);
      }
    });
    if (yBoxes[yBoxes.length - 1].key === 'All')
      yBoxes[yBoxes.length - 1].elem.lastChild.innerText = allValues;
    rectElement.style.left = left + 'px';
    rectElement.style.backgroundColor = isNight ? options.colors.tableNight : options.colors.tableDay;
    rectElement.style.top = top + 'px';
  }

  function refresh() {
    if (pageX === -1 || !data.lines.length) {
      return;
    }
    const { XValue, diff, realInd } = getValues();
    if(diff <= 0) return;
    prevInd = realInd;
    if (type === 'stacked') {
      shadow(diff, realInd);
    } else {
      drawVerticalLine();
    }
    let { left, top } = getTablePos(diff);
    drawValues(top, left, XValue, realInd);

  }

  function updateMode(Night) {
    isNight = Night;
    refresh();
    }

  function setField(polygon, cb, cb2) {
    chart = polygon;
    drawShadow = cb;
    removeShadow = cb2;
  }

  function updateElements() {
    yElements = new Array(data.lines.length).fill(0).map(_ => ({ perc: 0, name: 0, val: 0 }));
    data.lines.forEach(l => {
      if (!yBoxes.find(b => b.key === l.name)) {
        let box = document.createElement('div');
        box.className = 'table-box';
        let yLabel = document.createElement('p');
        let yValue = document.createElement('p');
        if (data.percentage) {
          let yPercent = document.createElement('p');
          box.appendChild(yPercent);
        }
        yLabel.innerText = l.name;
        box.appendChild(yLabel);
        box.appendChild(yValue);
        yBoxes.push({ elem: box, key: l.name });
        rectElement.appendChild(box);
      }
    });
    if (data.lines.length < yBoxes.length) {
      let exclude = yBoxes.filter(b => !data.lines.find(l => l.name === b.key)).map(b => {
        rectElement.removeChild(b.elem);
        return b;
      });
      yBoxes = yBoxes.filter(y => !exclude.includes(y));
    }
    if (type === 'stacked' && data.lines.length > 1) {
      let box = document.createElement('div');
      box.className = 'table-box';
      let yLabel = document.createElement('p');
      let yValue = document.createElement('p');
      yLabel.innerText = 'All';
      box.appendChild(yLabel);
      box.appendChild(yValue);
      yBoxes.push({ elem: box, key: 'All' });
      rectElement.appendChild(box);
    }

    data.lines.forEach((y, i) => {
      if (type !== 'stacked') {
        yElements[i].circ = createSVGElement('circle');
        yElements[i].circ.setAttribute('display', 'none');
        yElements[i].circ.setAttribute('stroke-width', 1);
        if(window.innerWidth > 500)yElements[i].circ.style.transition = 'all 0.2s';
        tableElement.appendChild(yElements[i].circ);
      }
    });
    refresh();
  }

  function setData(newData) {
    data = newData;
    updateElements();
  }

  function setScale(newScale) {
    scale = newScale;
    refresh();
  }
  function fade() {
    for(let i = 0; i < 10; i++){
      setTimeout(() =>     {
        tableElement.style.opacity = '' + (1 - i/10);
        rectElement.style.opacity = '' + (1 - i/10);
        }, i*100);
    }
  }
  refresh();
  return {
    updateMode,
    setData,
    setField,
    setScale,
    fade,
  };
};



