import {createSVGElement, createTransformer, findClosestValueIndex, getProps} from "../util";
export const FONT_SIZE_COEF = 2;



export const createSVGTable = function (options) {
  let data, scale, chart, mouseOffset, boxWidth;
  let isNight = !options.colors.lightMode;
  let pageX = -1;
  let pageY = -1;
  let type = options.type;
  let transf = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height }, false, true);

  const tableElement = createSVGElement('svg');
  tableElement.setAttribute('style', 'position: absolute; top: 0; left: 0');
  tableElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  tableElement.setAttribute('width', options.width);
  tableElement.setAttribute('cursor', 'crosshair');
  tableElement.setAttribute('preserveAspectRatio', 'none');
  tableElement.addEventListener('mousemove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  }, false);
  tableElement.addEventListener('touchmove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  },  {passive: true});

  const leftShadow = createSVGElement('polygon');
  const rightShadow = createSVGElement('polygon');
  const verticalAxis = createSVGElement('line');

  const rectElement = createSVGElement('rect');
  rectElement.setAttribute('rx', 8);
  rectElement.setAttribute('ry', 8);
  rectElement.setAttribute('style', "filter:url(#shadow);");

  const dropShadow = createSVGElement('feDropShadow');
  dropShadow.setAttribute('stdDeviation', 3);
  dropShadow.setAttribute('dx', '0');
  dropShadow.setAttribute('dy', '0');

  const filter = createSVGElement('filter');
  filter.setAttribute('id', 'shadow');
  filter.appendChild(dropShadow);

  const defs = createSVGElement('defs');
  defs.appendChild(filter);

  const xvalElement = createSVGElement('text');
  xvalElement.setAttribute('font-weight', 'bold');
  let yElements = [];

  tableElement.appendChild(leftShadow);
  tableElement.appendChild(rightShadow);
  tableElement.appendChild(verticalAxis);
  tableElement.appendChild(rectElement);
  tableElement.appendChild(defs);
  tableElement.appendChild(xvalElement);

  function clearTable(){
    verticalAxis.setAttribute('stroke', 'transparent');
    rectElement.setAttribute('width', 0);
    leftShadow.setAttribute('points', '0 0');
    rightShadow.setAttribute('points', '0 0');
    xvalElement.innerHTML = '';
    yElements.forEach(y=>{
      y.name.innerHTML = '';
      y.val.innerHTML = '';
      if(y.perc)y.perc.innerHTML = '';
      if(y.circ){
        y.circ.setAttribute('stroke', 'transparent');
        y.circ.setAttribute('fill', 'transparent');
      }
    })
  }

  function clickOutOfChart(e) {
    let cordsTable = tableElement.getBoundingClientRect();
    let pagex, pageY;
    [pagex, pageY] = getProps(e, 'pageX', 'pageY');
    if (pagex < cordsTable.left || pagex > cordsTable.left + cordsTable.width ||
      pageY < cordsTable.top + window.pageYOffset || pageY > cordsTable.top + cordsTable.height + window.pageYOffset) {
      close();
    }
  }

  function close() {
    pageX = -1;
    clearTable();
    refresh();
  }

  function getValues(){
    let timeS = (scale.maxX - scale.minX) / options.width * (pageX - tableElement.getBoundingClientRect().left) + scale.minX;
    let realInd = findClosestValueIndex(data.x, timeS);
    if (Math.abs(data.x[realInd] - timeS) > Math.abs(data.x[realInd - 1] - timeS)) {
      realInd--;
    }
    transf.setScale(scale);
    mouseOffset = transf.transformX(data.x[realInd]);

    let date = new Date(data.x[realInd]).toDateString().split(' ');
    let XValue = date[0] + ', ' + date[1] + ' ' + date[2];

    let YValues = data.lines.map(line => ({ label: line.name, value: line.values[realInd], color: line.color }));

    const diff = Math.abs(transf.transformX(data.x[realInd + 1 >= data.x.length ? realInd - 1 : realInd + 1]) - mouseOffset);
    return { XValue, YValues, diff, realInd };
  }
  function shadowPoints(diff){
    let points = Object.values(chart.points);
    let pointsForLeftShadow = "";
    let pointsForRightShadow = "";
    let normalizeMouseOffset = mouseOffset/options.width*100;
    pointsForLeftShadow += `${0},${options.height} `;

    let ind = points.findIndex(p => p.x > normalizeMouseOffset+0.5);
    let nWidth = options.width/100, nHeight = options.height/100;
    pointsForLeftShadow += ' ' + points.slice(0, ind).map(p => `${p.x * nWidth},${p.y*nHeight}`).join(' ') + ' ';
    pointsForRightShadow += ' ' + points.slice(ind, points.length).map(p => `${p.x * nWidth},${p.y*nHeight}`).join(' ') + ' ';

    pointsForLeftShadow += `${mouseOffset},${options.height}`;
    pointsForRightShadow += `${mouseOffset+diff},${options.height} `;
    return [pointsForLeftShadow, pointsForRightShadow];
  }
  function drawVerticalLine(){
    verticalAxis.setAttribute('x1', mouseOffset);
    verticalAxis.setAttribute('y1', 0);
    verticalAxis.setAttribute('x2', mouseOffset);
    verticalAxis.setAttribute('y2', options.height);
    verticalAxis.setAttribute('stroke', isNight ? options.colors.vertAxisNight : options.colors.vertAxisDay);
    verticalAxis.setAttribute('vector-effect', 'non-scaling-stroke');
    verticalAxis.setAttribute('stroke-width', '1');
    verticalAxis.setAttribute('fill', 'none');
  }
  function drawShadow(YValues, diff){
    let sum = YValues.reduce((ac, c) => ac + c.value, 0);
    if(data.lines.length > 1) YValues.push({value: sum, label: 'All'});
    let pp = shadowPoints(diff);
    leftShadow.setAttribute('points', pp[0]);
    leftShadow.setAttribute('fill', 'rgba(0,0,0,0.4)');
    rightShadow.setAttribute('points', pp[1]);
    rightShadow.setAttribute('fill', 'rgba(0,0,0,0.4)');
  }
  function getTablePos(diff){
    let top = 70;
    let left;
    if (type === 'stacked') {
      if (mouseOffset < options.width / 2) {
        left = mouseOffset + diff;
      } else {
        left = mouseOffset - 130;
      }
    }else{
      left = mouseOffset - 50 < 20 ? 20 : mouseOffset - 50;
      left = left + 170 > options.width ? options.width - 170 : left;
    }
    return {left, top};
  }
  function drawValues(YValues, top, left, XValue, realInd){
    xvalElement.setAttribute('x', left + 10);
    xvalElement.setAttribute('y', top + 23);
    xvalElement.innerHTML = XValue;
    xvalElement.setAttribute('fill', isNight ? '#fff' : '#222222');
    rectElement.setAttribute('x', left);
    rectElement.setAttribute('y', top);
    rectElement.setAttribute('width', boxWidth);
    rectElement.setAttribute('height', 30 + 23 * YValues.length);
    rectElement.setAttribute('fill', isNight ? options.colors.tableNight : options.colors.tableDay);
    let leftOffset = data.percentage ? 30 : 0;
    let yxs = [];
    YValues.forEach((y, i) => {
      if (data.percentage) {
        yElements[i].perc.setAttribute('x', left + 10);
        yElements[i].perc.setAttribute('y', top + 45);
        yElements[i].perc.setAttribute('fill', isNight ? '#fff' : '#000');
        yElements[i].perc.innerHTML = `${data.percentage[i].values[realInd]}%`;
      }else if(type !== 'stacked'){
        if(scale.sMaxY){
          if(i === 1){
            transf.setScale({...scale, maxY: scale.sMaxY});
          }else{
            transf.setScale(scale);
          }
        }
        let yPx = transf.transformY(data.lines[i].values[realInd]);
        yElements[i].circ.setAttribute('cx', mouseOffset);
        yElements[i].circ.setAttribute('cy', yPx);
        yElements[i].circ.setAttribute('stroke', y.color);
        yElements[i].circ.setAttribute('r', 6);
        yElements[i].circ.setAttribute('stroke-width', 2);
        yElements[i].circ.setAttribute('fill', isNight ? options.colors.night1 : options.colors.day1);
        yxs.push(yPx);
      }
      yElements[i].name.setAttribute('x', left + 10 + leftOffset);
      yElements[i].name.setAttribute('y', top + 45);
      yElements[i].name.setAttribute('fill', isNight ? '#fff' : '#000');
      yElements[i].name.innerHTML = y.label;
      yElements[i].val.setAttribute('y', top + 45);
      yElements[i].val.setAttribute('font-weight', 'bold');
      yElements[i].val.setAttribute('fill', y.color);
      yElements[i].val.innerHTML = y.value;
      let curWidth = yElements[i].val.getBBox().width;
      yElements[i].val.setAttribute('x', left + boxWidth - 10 - curWidth);
      top += 23;
    });
  }
  function refresh() {
    if (pageX === -1 || !data.lines.length) {
      document.removeEventListener('mousedown', clickOutOfChart, false);
      document.removeEventListener('touchstart', clickOutOfChart,  {passive: true});
      return;
    }
    const { XValue, YValues, diff, realInd } = getValues();

    if (type === 'stacked') {
      drawShadow(YValues, diff);
    } else {
      drawVerticalLine();
    }
    let {left, top } = getTablePos(diff);
    drawValues(YValues, top, left, XValue, realInd);

    document.addEventListener('mousedown', clickOutOfChart, false);
    document.addEventListener('touchstart', clickOutOfChart,  {passive: true});
  }

  function updateMode(Night) {
    isNight = Night;
    refresh();
  }
  function setField(polygon){
    chart = polygon;
  }
  function updateElements(){
    yElements = new Array(data.lines.length).fill(0).map(_ => ({perc: 0, name: 0, val: 0}));
    data.lines.forEach((y, i) => {
      if (data.percentage) {
        yElements[i].perc = createSVGElement('text');
        yElements[i].perc.setAttribute('font-size', 14);
        yElements[i].perc.setAttribute('font-weight', 'bold');
        yElements[i].perc.setAttribute('fill', isNight ? '#fff' : '#000');
        tableElement.appendChild(yElements[i].perc);
      }
      if(type !== 'stacked') {
        yElements[i].circ = createSVGElement('circle');
        tableElement.insertBefore(yElements[i].circ, rectElement);
      }
      yElements[i].name = createSVGElement('text');
      yElements[i].name.setAttribute('fill', isNight ? '#fff' : '#000');

      yElements[i].val = createSVGElement('text');
      yElements[i].val.setAttribute('font-weight', 'bold');
      yElements[i].val.setAttribute('fill', y.color);
      tableElement.appendChild(yElements[i].name);
      tableElement.appendChild(yElements[i].val);
    });
    if(type === 'stacked' && data.lines.length > 1){
      let elem = createSVGElement('text');
      elem.setAttribute('fill', isNight ? '#fff' : '#000');
      let val = createSVGElement('text');
      val.setAttribute('font-weight', 'bold');
      val.setAttribute('fill', isNight ? '#fff' : '#000');
      yElements.push({name: elem, val: val});
      tableElement.appendChild(elem);
      tableElement.appendChild(val);
    }
    boxWidth = new Date(data.x[0]).toDateString().split(' ').slice(0, 3).join(' ').length * 10 + 30;
    if (type === 'percentaged')
      boxWidth += 30;
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

  return {
    updateMode,
    setData,
    setField,
    setScale,
    element: tableElement,
  };
};



