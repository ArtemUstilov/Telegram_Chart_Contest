import { findClosestValueIndex } from "../../util";
import { dateFormatter, numberFormatter } from '../../format';
import { createSVGAxis, FONT_SIZE_COEF } from "../../axis";

const createOptions = (parent, options) => Object.assign({}, {
  width: parent.clientWidth,
  height: parent.clientHeight,
  id: 'canvas-graph',
  xFormatter: dateFormatter(5),
  yFormatter: numberFormatter(10),
  createAxis: false,
  fontSize: 16,
}, options);

export const createCanvasGraph = (parent, customOptions) => {
  const options = createOptions(parent, customOptions);
  let element = document.createElement('canvas');
  element.setAttribute('width', options.width);
  element.setAttribute('height', options.height);
  element.setAttribute('id', options.id);
  console.log(options.width, options.height, element);
  parent.insertBefore(element, parent.firstChild);

  let axis;
  if (options.createAxis) {
    axis = createSVGAxis(options);
    element.setAttribute('style', `margin-bottom: ${options.fontSize * FONT_SIZE_COEF}px`); // does not work using element.style
    parent.insertBefore(axis.element, element.nextSibling);
  }
  let data = [];
  let scale = {};
  let coefX, coefY;
  let right = element.width;
  let left = 0;
  let bottom = element.height;
  let top = 0;
  let width = right - left;
  let height = bottom - top;
  return ({
    setData(dataVal) {
      data = dataVal;
    },
    getData() {
      return data;
    },
    setScale(scaleVal) {
      scale = scaleVal;
      this.setCoef();
      if (axis) {
        axis.setScale(scaleVal);
      }
    },
    setCoef() {
      coefX = width / (scale.maxX - scale.minX);
      coefY = height / (scale.maxY - scale.minY);
    },
    getScale() {
      return scale;
    },
    refresh() {
      if (axis) {
        axis.refresh();
      }
      const ctx = element.getContext("2d");
      ctx.clearRect(left, top, width, height);
      for (let i = 0; i < data.lines.length; i++) {
        this.drawChart(data.x, data.lines[i].values, data.lines[i].color);
      }
    },
    normalizeX(x) {
      return left + (x - scale.minX) * coefX;
    },
    normalizeY(y) {
      return top + height - (y - scale.minY) * coefY;
    },
    getScaleSegmentX(dataX) {
      let start = findClosestValueIndex(dataX, scale.minX);
      let end = findClosestValueIndex(dataX, scale.maxX);
      if (start > 2) start -= 2;
      return { start, end };
    },
    drawChart(dataX, dataY, color) {
      const ctx = element.getContext("2d");
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const { start, end } = this.getScaleSegmentX(dataX);
      let nextX, nextY;
      for (let i = start; i <= end; i++) {
        nextX = this.normalizeX(dataX[i]);
        nextY = this.normalizeY(dataY[i]);
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      }
      ctx.stroke();
    },
    updateMode(isNight) {
      if (axis) {
        axis.updateMode(isNight);
      }
    },
  });
}

