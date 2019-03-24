import {findClosestValueIndex} from "../util";

const xmlns = "http://www.w3.org/2000/svg";
export const FONT_SIZE_COEF = 2;
const createSVGElement = tag => document.createElementNS(xmlns, tag)


export const createSVGTable = function (options) {
  const tableElement = createSVGElement('svg');
  let data, scale;
  let isNight = !options.colors.lightMode;
  let pageX = -1;
  tableElement.setAttribute('style', 'position: absolute; top: 0; left: 0');
  tableElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  tableElement.setAttribute('width', options.width);
  tableElement.setAttribute('preserveAspectRatio', 'none');
  tableElement.addEventListener('click', (e) => {
    pageX = e.pageX;
    refresh();
  });

  function clickOutOfChart(e){
    let cordsTable = tableElement.getBoundingClientRect();
    if(e.pageX < cordsTable.left || e.pageX > cordsTable.left + cordsTable.width ||
      e.pageY < tableElement.pageY || e.pageY > tableElement.pageY + cordsTable.height) {
      pageX = -1;
      refresh();
    }
  }
  function refresh() {
    tableElement.innerHTML = '';
    if(pageX === -1 || !data.lines.length) {
      document.removeEventListener('click', clickOutOfChart);
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
    let XValue = `${date.getDay()}, ${date.getMonth()} ${date.getDate()}`;
    XValue = date.toDateString().split(' ').slice(0, 3);
    XValue = XValue[0] + ', ' + XValue[1] + ' ' + XValue[2];
    let YValues = data.lines.map(line => ({ label: line.name, value: line.values[realInd], color: line.color }));


    let transf = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height }, false, true);
    transf.setScale(scale);
    mouseOffset = transf.transformX(data.x[realInd]);


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
    data.lines.forEach((y,i)=> {
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
    let top = 100;
    while(top < options.height){
    if(yxs.find(y=>y >= top -5 && y <= top+5+80)){
      top += 20;
    }else{
      break;
    }
    if(top +50 > options.height)
      top = 100;
    }
    let width = 120;
    width += (yxs.length - 2)*50;

    let left = mouseOffset - 50 < 10 ? 10 : mouseOffset - 50;
    left = left+width > options.width ? options.width - width : left;


    const rectElement = createSVGElement('rect');
    rectElement.setAttribute('x', left);
    rectElement.setAttribute('y', top);
    rectElement.setAttribute('rx', 8);
    rectElement.setAttribute('ry', 8);
    rectElement.setAttribute('width', width);
    rectElement.setAttribute('height', 80);
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
      const yvalElement = createSVGElement('text');
      yvalElement.setAttribute('x', left + 11 + i * 50);
      yvalElement.setAttribute('y', top + 45);
      yvalElement.setAttribute('font-weight', 'bold');
      yvalElement.setAttribute('fill', y.color);
      yvalElement.innerHTML = y.value;
      tableElement.appendChild(yvalElement);
      const ynameElement = createSVGElement('text');
      ynameElement.setAttribute('x', left + 11 + i * 50);
      ynameElement.setAttribute('y', top + 68);
      ynameElement.setAttribute('fill', y.color);
      ynameElement.innerHTML = y.label;
      tableElement.appendChild(ynameElement);



    });
    document.addEventListener('click', clickOutOfChart);
    //document.addEventListener('mousedown', clickOutOfChart);
  }

  function updateMode(Night) {
    isNight = Night;
    refresh();
  }

  function setData(newData) {
    data = newData;
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
