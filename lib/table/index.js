import {findClosestValueIndex} from "../util";

const xmlns = "http://www.w3.org/2000/svg";
export const FONT_SIZE_COEF = 2;
const createSVGElement = tag => document.createElementNS(xmlns, tag)
function getProps(e, ...props) {
  let res = [];
  if (e[props[0]]) {
    props.forEach(x => res[x] = e[x])
  } else if (e.touches) {
    props.forEach(x => {
      res.push(e.touches[0][x]);
    })
  }
  return res;
}

export const createSVGTable = function (options) {
  const tableElement = createSVGElement('svg');
  let data, scale;
  let isNight = !options.colors.lightMode;
  let pageX = -1;
  let pageY = -1;


  let widthRect = 0;

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
    let top = 70;

    let width = 130;

    let left = mouseOffset - 50 < 20 ? 20 : mouseOffset - 50;
    left = left+170 > options.width ? options.width -170 : left;


    const rectElement = createSVGElement('rect');
    rectElement.setAttribute('x', left);
    rectElement.setAttribute('y', top);
    rectElement.setAttribute('rx', 8);
    rectElement.setAttribute('ry', 8);
    rectElement.setAttribute('width', widthRect);

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


    let boxWidth = 0;

    const xvalElement = createSVGElement('text');
    xvalElement.setAttribute('x', left + 11);
    xvalElement.setAttribute('y', top + 23);
    xvalElement.setAttribute('fill', isNight ? '#fff' : '#222222');
    xvalElement.setAttribute('font-weight', 'bold');
    xvalElement.innerHTML = XValue;
    tableElement.appendChild(xvalElement);
    boxWidth = Math.max(boxWidth, xvalElement.getBBox().width + 20);

    let leftoffset = 0;
    YValues.forEach((y, i) => {

      const yvalElement = createSVGElement('text');
      yvalElement.setAttribute('x', left + 10 + leftoffset);
      yvalElement.setAttribute('y', top + 45);
      yvalElement.setAttribute('font-weight', 'bold');
      yvalElement.setAttribute('fill', y.color);
      yvalElement.innerHTML = y.value;
      tableElement.appendChild(yvalElement);

      boxWidth = Math.max(boxWidth, yvalElement.getBBox().width * 2 + 30);

      const ynameElement = createSVGElement('text');
      ynameElement.setAttribute('x', left + 10 + leftoffset);
      ynameElement.setAttribute('y', top + 68);
      ynameElement.setAttribute('fill', y.color);
      ynameElement.innerHTML = y.label;

      tableElement.appendChild(ynameElement);

      if(i%2 === 0){
        leftoffset = 10 + Math.max(ynameElement.getBBox().width, yvalElement.getBBox().width);
      }else{
        top += 50;
        leftoffset = 0;
      }
      i++;

    });

    rectElement.setAttribute('height', 30 + 50*Math.ceil(YValues.length/2));
    rectElement.setAttribute('width', boxWidth);

    document.addEventListener('mousemove', clickOutOfChart);
    document.addEventListener('touchend', close);
  }

  function updateMode(Night) {
    isNight = Night;
    refresh();
  }

  function setData(newData) {
    data = newData;
    widthRect = (data.lines.reduce((ac, line) => {
      const max = line.values.reduce((ac, v) => ac < v ? v : ac, 0);
      return max > ac ? max : ac;
    }, 0)+'').length * 10 + 70;
    console.log(widthRect);
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
