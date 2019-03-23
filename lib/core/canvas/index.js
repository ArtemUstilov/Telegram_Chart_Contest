import {findClosestValueIndex} from "../../util";

export const createCanvasGraph = (parent, w, h, id) => {
  let data = [];
  let element = document.createElement('canvas');
  element.setAttribute('width', w);
  element.setAttribute('height', h);
  element.setAttribute('id', id);
  console.log(w, h, element);
  parent.insertBefore(element, parent.firstChild);
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
    },
    setCoef(){
      coefX = width / (scale.maxX - scale.minX);
      coefY = height / (scale.maxY - scale.minY);
    },
    getScale() {
      return scale;
    },
    refresh() {
      const ctx = element.getContext("2d");
      ctx.clearRect(left,top ,width, height);
      for (let i = 0; i < data.lines.length; i++) {
        this.drawChart(data.x, data.lines[i].values, data.lines[i].color);
      }
    },
    normalizeX(x){
      return left + (x - scale.minX) * coefX;
    },
    normalizeY(y){
      return top + height - (y - scale.minY) * coefY;
    },
    getScaleSegmentX(dataX, dataY){
      let start = findClosestValueIndex(dataX, scale.minX);
      let end = findClosestValueIndex(dataX, scale.maxX);
      if(start>2)start-=2;
      return { start, end };
    },
    drawChart(dataX, dataY, color) {
      const ctx = element.getContext("2d");
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const {start, end} = this.getScaleSegmentX(dataX, dataY);
      let nextX, nextY;
      for(let i = start; i <= end; i++){
        nextX = this.normalizeX(dataX[i]);
        nextY = this.normalizeY(dataY[i]);
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      }
      ctx.stroke();
    }
  });
}

