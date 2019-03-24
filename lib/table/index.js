import {findClosestValueIndex} from "../util";

const xmlns = "http://www.w3.org/2000/svg";
export const FONT_SIZE_COEF = 2;
const createSVGElement = tag => document.createElementNS(xmlns, tag)


export const createSVGTable = function (options) {
  const tableElement = createSVGElement('svg');
  let data, scale;
  tableElement.setAttribute('style', 'position: absolute; top: 0; left: 0');
  tableElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  tableElement.setAttribute('width', options.width);
  tableElement.setAttribute('preserveAspectRatio', 'none');
  tableElement.addEventListener('click', (e) => {
    tableElement.innerHTML = '';
    console.log(data, scale);
    let indStart = findClosestValueIndex(data.x, scale.minX);
    let indEnd = findClosestValueIndex(data.x, scale.maxX);
    let mouseOffset = e.pageX - tableElement.getBoundingClientRect().left;
    console.log(indStart, indEnd);

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
    let YValues = data.lines.map(line=>({label:line.name, value: line.values[realInd]}));

    console.log(XValue);
    console.log(YValues);



    const rectElement = createSVGElement('rect');
    rectElement.setAttribute('x', mouseOffset - 50);
    rectElement.setAttribute('y', 100);
    rectElement.setAttribute('width', 100);
    rectElement.setAttribute('height', 100);
    rectElement.setAttribute('stroke', 'black');
    rectElement.setAttribute('fill', 'white');
    tableElement.appendChild(rectElement);

    const xvalElement = createSVGElement('text');
    xvalElement.setAttribute('x', 100);
    xvalElement.setAttribute('y', 50);
    xvalElement.setAttribute('fill', 'black');
    xvalElement.innerHTML = XValue;

    rectElement.appendChild(xvalElement);


  });

  function updateMode(isNight) {

  }

  function setData(newData) {
    data = newData;
  }

  function setScale(newScale) {
    scale = newScale;
  }

  return {
    updateMode,
    setData,
    setScale,
    element: tableElement,
  };
};
