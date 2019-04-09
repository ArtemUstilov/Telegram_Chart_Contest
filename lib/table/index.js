import {findClosestValueIndex} from "../util";

const xmlns = "http://www.w3.org/2000/svg";
export const FONT_SIZE_COEF = 2;
const createSVGElement = tag => document.createElementNS(xmlns, tag);
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
function getProps(e, ...props) {
  let res = [];
  if (e[props[0]]) {
    props.forEach(x => res.push(e[x]))
  } else {
    let touches =
      e.touches ||
      e.targetTouches ||
      e.changedTouches ||
      e.originalEvent.touches ||
      e.originalEvent.targetTouches;
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
  let boxWidth = 0;
  let isNight = !options.colors.lightMode;
  let pageX = -1;
  let pageY = -1;
  let mouseOffset;
  let type = options.type;
  let transf = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height }, false, true);

  tableElement.setAttribute('style', 'position: absolute; top: 0; left: 0');
  tableElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  tableElement.setAttribute('width', options.width);
  tableElement.setAttribute('cursor', 'crosshair');
  tableElement.setAttribute('preserveAspectRatio', 'none');
  tableElement.addEventListener('mousemove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  });
  tableElement.addEventListener('touchmove', (e) => {
    [pageX, pageY] = getProps(e, 'pageX', 'pageY');
    refresh();
  });
  const leftShadow = createSVGElement('rect');
  const rightShadow = createSVGElement('rect');
  const topShadow = createSVGElement('rect');

  tableElement.appendChild(leftShadow);
  tableElement.appendChild(rightShadow);
  tableElement.appendChild(topShadow);
  const verticalAxis = createSVGElement('line');
  tableElement.appendChild(verticalAxis);

  const rectElement = createSVGElement('rect');
  rectElement.setAttribute('rx', 8);
  rectElement.setAttribute('ry', 8);
  rectElement.setAttribute('style', "filter:url(#shadow);");
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

  xvalElement.setAttribute('font-weight', 'bold');
  tableElement.appendChild(xvalElement);

  let yElements = [];



















  function clickOutOfChart(e) {
    let cordsTable = tableElement.getBoundingClientRect();
    if (e.pageX < cordsTable.left || e.pageX > cordsTable.left + cordsTable.width ||
      e.pageY < cordsTable.top + window.pageYOffset || e.pageY > cordsTable.top + cordsTable.height + window.pageYOffset) {
      close();
    }
  }

  function close() {
    pageX = -1;
    refresh();
  }

  function refresh() {
    if (pageX === -1 || !data.lines.length) {
      document.removeEventListener('mousemove', clickOutOfChart);
      document.removeEventListener('touchend', close);
      return;
    }

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


    if (type !== 'stacked') {
      verticalAxis.setAttribute('x1', mouseOffset);
      verticalAxis.setAttribute('y1', 0);
      verticalAxis.setAttribute('x2', mouseOffset);
      verticalAxis.setAttribute('y2', options.height);
      verticalAxis.setAttribute('stroke', isNight ? options.colors.vertAxisNight : options.colors.vertAxisDay);
      verticalAxis.setAttribute('vector-effect', 'non-scaling-stroke');
      verticalAxis.setAttribute('stroke-width', '1');
      verticalAxis.setAttribute('fill', 'none');

    } else {
      let sum = YValues.reduce((ac, c) => ac + c.value, 0);
      YValues.push(({ color: isNight ? '#fff' : '#000', label: 'All', value: sum }));
      leftShadow.setAttribute('x', 0);
      leftShadow.setAttribute('y', 0);
      leftShadow.setAttribute('width', mouseOffset);
      leftShadow.setAttribute('height', options.height);
      leftShadow.setAttribute('fill', '#777');
      leftShadow.setAttribute('opacity', 0.3);
      rightShadow.setAttribute('x', mouseOffset + diff);
      rightShadow.setAttribute('y', 0);
      let width2 = options.width - mouseOffset - diff;
      rightShadow.setAttribute('width', width2 < 0 ? 0 : width2);
      rightShadow.setAttribute('height', options.height);
      rightShadow.setAttribute('fill', '#777');
      rightShadow.setAttribute('opacity', 0.3);
      topShadow.setAttribute('x', mouseOffset);
      topShadow.setAttribute('y', 0);
      topShadow.setAttribute('opacity', 0.3);
      topShadow.setAttribute('width', diff);
      let width3 = transf.transformY(sum);
      topShadow.setAttribute('height', width3 < 0 ? 0 : width3);
      topShadow.setAttribute('fill', '#777');
    }

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
        let yPx = transf.transformY(data.lines[i].values[realInd]);
        yElements[i].circ.setAttribute('cx', mouseOffset);
        yElements[i].circ.setAttribute('cy', yPx);
        yElements[i].circ.setAttribute('stroke', y.color);
        yElements[i].circ.setAttribute('stroke-width', 2);
        yElements[i].circ.setAttribute('fill', isNight ? options.colors.night1 : options.colors.day1);
        yxs.push(yPx);
      }
      try {
        yElements[i].name.setAttribute('x', left + 10 + leftOffset);
        yElements[i].name.setAttribute('y', top + 45);
        yElements[i].name.setAttribute('fill', isNight ? '#fff' : '#000');
        yElements[i].name.innerHTML = y.label;
      }catch(e){
        console.log(e)
      }
      yElements[i].val.setAttribute('y', top + 45);
      yElements[i].val.setAttribute('font-weight', 'bold');
      yElements[i].val.setAttribute('fill', y.color);
      yElements[i].val.innerHTML = y.value;
      let curWidth = yElements[i].val.getBBox().width;
      yElements[i].val.setAttribute('x', left + boxWidth - 10 - curWidth);
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
        yElements[i].circ.setAttribute('r', 6);
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
    if(type === 'stacked'){
      let elem = createSVGElement('text');
      elem.setAttribute('fill', isNight ? '#fff' : '#000');
      let val = createSVGElement('text');
      val.setAttribute('font-weight', 'bold');
      val.setAttribute('fill', isNight ? '#fff' : '#000');
      yElements.push({name: elem, val: val});
    }
    boxWidth = new Date(data.x[0]).toDateString().split(' ').slice(0, 3).join(' ').length * 10 + 30;
    if (type === 'percentaged')
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



