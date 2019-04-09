import {findClosestValueIndex} from "../util";

const xmlns = "http://www.w3.org/2000/svg";
export const FONT_SIZE_COEF = 2;
const createSVGElement = tag => document.createElementNS(xmlns, tag)
function getProps(e, ...props) {
  let res = [];
  if (e[props[0]]) {
    props.forEach(x => res.push(e[x]))
  }else {
    let touches = e.touches || e.targetTouches || e.changedTouches || e.originalEvent.touches || e.originalEvent.targetTouches;
    let touch = touches[0];
    props.forEach(x => {
      res.push(touch[x]);
    })
  }
  return res;
}

export const createSVGTable = function (options) {
  const tableElement = createSVGElement('svg');
  let data, scale;
  let boxWidth = 100;
  let isNight = !options.colors.lightMode;
  let pageX = -1;
  let pageY = -1;
  let type = options.type;
  let transf = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height }, false, true);
  tableElement.setAttribute('style', 'position: absolute; top: 0; left: 0');
  tableElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  tableElement.setAttribute('width', options.width);
  tableElement.setAttribute('cursor', 'crosshair');
  tableElement.setAttribute('preserveAspectRatio', 'none');
  tableElement.addEventListener('mousemove', (e) => {
    pageX = e.pageX;
    pageY = e.pageY;
    refresh();
  });
  tableElement.addEventListener('touchmove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  });
  function clickOutOfChart(e){
    let cordsTable = tableElement.getBoundingClientRect();
    if(e.pageX < cordsTable.left || e.pageX > cordsTable.left + cordsTable.width ||
      e.pageY < cordsTable.top + window.pageYOffset || e.pageY > cordsTable.top + cordsTable.height + window.pageYOffset) {
      close();
    }
  }
  function close(){
    pageX = -1;
    refresh();
  }
  function refresh() {
    tableElement.innerHTML = '';
    if(pageX === -1 || !data.lines.length) {
      document.removeEventListener('mousemove', clickOutOfChart);
      document.removeEventListener('touchend', close);
      return;
    }

    let mouseOffset = pageX - tableElement.getBoundingClientRect().left;

    let widthX = scale.maxX - scale.minX;
    let cur = widthX / options.width * (mouseOffset);
    let timeS = cur + scale.minX;
    let realInd = findClosestValueIndex(data.x, timeS);
    if (Math.abs(data.x[realInd] - timeS) > Math.abs(data.x[realInd - 1] - timeS)) {
      realInd--;
    }

    let date = new Date(data.x[realInd]);
    let XValue;
    XValue = date.toDateString().split(' ').slice(0, 3);
    XValue = XValue[0] + ', ' + XValue[1] + ' ' + XValue[2];
    let YValues = data.lines.map(line => ({ label: line.name, value: line.values[realInd], color: line.color }));



    transf.setScale(scale);
    mouseOffset = transf.transformX(data.x[realInd]);


    const diff = Math.abs(transf.transformX(data.x[realInd+1 >= data.x.length ? realInd-1 : realInd+1]) - mouseOffset);


    if(type !== 'stacked') {


      const verticalAxis = createSVGElement('line');
      verticalAxis.setAttribute('x1', mouseOffset);
      verticalAxis.setAttribute('y1', 0);
      verticalAxis.setAttribute('x2', mouseOffset);
      verticalAxis.setAttribute('y2', options.height);
      verticalAxis.setAttribute('stroke', isNight ? options.colors.vertAxisNight : options.colors.vertAxisDay);
      verticalAxis.setAttribute('vector-effect', 'non-scaling-stroke');
      verticalAxis.setAttribute('stroke-width', '1');
      verticalAxis.setAttribute('fill', 'none');
      tableElement.appendChild(verticalAxis);
      let yxs = [];
      data.lines.forEach((y, i) => {
        let yPx = transf.transformY(data.lines[i].values[realInd]);
        const circlElement = createSVGElement('circle');
        circlElement.setAttribute('cx', mouseOffset);
        circlElement.setAttribute('cy', yPx);
        circlElement.setAttribute('r', 6);
        circlElement.setAttribute('stroke', y.color);
        circlElement.setAttribute('stroke-width', 2);
        circlElement.setAttribute('fill', isNight ? options.colors.night1 : options.colors.day1);
        tableElement.appendChild(circlElement);
        yxs.push(yPx);
      });
    }else{
      let sum = YValues.reduce((ac,c)=>ac+c.value, 0);
      YValues.push(({color: isNight ? '#fff' : '#000', label: 'All', value: sum}));

      const rectElement = createSVGElement('rect');
      rectElement.setAttribute('x', 0);
      rectElement.setAttribute('y', 0);
      rectElement.setAttribute('width', mouseOffset);
      rectElement.setAttribute('height', options.height);
      rectElement.setAttribute('fill', '#777');
      rectElement.setAttribute('opacity', 0.3);
      tableElement.appendChild(rectElement);
        const rectElement2 = createSVGElement('rect');
        rectElement2.setAttribute('x', mouseOffset + diff);
        rectElement2.setAttribute('y', 0);
        let width2 = options.width - mouseOffset - diff;
        rectElement2.setAttribute('width', width2 < 0 ? 0 : width2);
        rectElement2.setAttribute('height', options.height);
        rectElement2.setAttribute('fill', '#777');
        rectElement2.setAttribute('opacity', 0.3);
        tableElement.appendChild(rectElement2);
      const rectElement3 = createSVGElement('rect');
      rectElement3.setAttribute('x', mouseOffset);
      rectElement3.setAttribute('y', 0);
      rectElement3.setAttribute('opacity', 0.3);
      rectElement3.setAttribute('width', diff);
      let width3 = transf.transformY(sum);
      rectElement3.setAttribute('height', width3 < 0 ? 0 : width3);
      rectElement3.setAttribute('fill', '#777');
      tableElement.appendChild(rectElement3);
    }
    let top = 70;
    let left = mouseOffset - 50 < 20 ? 20 : mouseOffset - 50;
    if(type === 'stacked') {
      if(mouseOffset < options.width/2){
        left = mouseOffset + diff;
      }else{
        left = mouseOffset - 130;
      }
    }
    left = left+170 > options.width ? options.width -170 : left;


    const rectElement = createSVGElement('rect');
    rectElement.setAttribute('x', left);
    rectElement.setAttribute('y', top);
    rectElement.setAttribute('rx', 8);
    rectElement.setAttribute('ry', 8);
    rectElement.setAttribute('width', boxWidth);
    rectElement.setAttribute('height', 30 + 23*YValues.length);
    rectElement.setAttribute('fill', isNight ? options.colors.tableNight : options.colors.tableDay);
    rectElement.setAttribute('style', "filter:url(#shadow);")
    tableElement.appendChild(rectElement);

    const dropShadow = createSVGElement('feDropShadow');
    dropShadow.setAttribute('stdDeviation', 3);
    dropShadow.setAttribute('dx', '0');
    dropShadow.setAttribute('dy', '0');


    const filter = createSVGElement('filter');
    filter.setAttribute('id', 'shadow');

    filter.appendChild(dropShadow);


    const defs = createSVGElement('defs');
    defs.appendChild(filter);
    tableElement.appendChild(defs);



    const xvalElement = createSVGElement('text');
    xvalElement.setAttribute('x', left + 11);
    xvalElement.setAttribute('y', top + 23);
    xvalElement.setAttribute('fill', isNight ? '#fff' : '#222222');
    xvalElement.setAttribute('font-weight', 'bold');
    xvalElement.innerHTML = XValue;
    tableElement.appendChild(xvalElement);


    YValues.forEach((y, i) => {
      if(data.percentage){
        const ynameElement = createSVGElement('text');
        tableElement.appendChild(ynameElement);
        ynameElement.setAttribute('x', left + 10);
        ynameElement.setAttribute('y', top + 45);
        ynameElement.setAttribute('font-size', 14);
        ynameElement.setAttribute('font-weight', 'bold');
        ynameElement.setAttribute('fill', isNight ? '#fff' : '#000');
        ynameElement.innerHTML = `${data.percentage[i].values[realInd]}%`;
      }
      const ynameElement = createSVGElement('text');
      tableElement.appendChild(ynameElement);
      ynameElement.setAttribute('x', left + 40);
      ynameElement.setAttribute('y', top + 45);
      ynameElement.setAttribute('fill', isNight ? '#fff' : '#000');
      ynameElement.innerHTML = y.label;

      const yvalElement = createSVGElement('text');
      tableElement.appendChild(yvalElement);
      yvalElement.setAttribute('y', top + 45);
      yvalElement.setAttribute('font-weight', 'bold');
      yvalElement.setAttribute('fill', y.color);
      yvalElement.innerHTML = y.value;
      let curWidth = yvalElement.getBBox().width;
      yvalElement.setAttribute('x', left + boxWidth - 10 - curWidth);
      top += 23;
    });



    document.addEventListener('mousemove', clickOutOfChart);
    document.addEventListener('touchend', close);
  }

  function updateMode(Night) {
    isNight = Night;
    refresh();
  }

  function setData(newData) {
    data = newData;
    boxWidth = new Date(data.x[0]).toDateString().split(' ').slice(0, 3).join(' ').length * 10 + 30;
    if(type === 'percentaged')
      boxWidth += 30;
    refresh();
  }

  function setScale(newScale) {
    scale = newScale;
    refresh();
  }

  return {
    updateMode,
    setData,
    setScale,
    element: tableElement,
  };
};


const createTransformer = ({ minX, maxX, minY, maxY }, swapX, swapY) => {
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
