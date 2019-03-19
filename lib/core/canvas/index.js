export const createCanvasGraph = (element) => {
  let data = [];
  let elem = element;
  let scale = {};
  let coefX, coefY;
  let right = element.width/100*97.5;
  let left = element.width/100*2.5;
  let bottom = element.height/100*97.5;
  let top = element.height/100*2.5;
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
      const ctx = elem.getContext("2d");
      ctx.clearRect(left,top ,width, height);
      for (let i = 0; i < data.length; i++) {
        this.drawChart(data[i].values.x, data[i].values.y, data[i].color);
      }
    },
    normalizeX(x){
      return left + width-(x - scale.minX) * coefX;
    },
    normalizeY(y){
      return top + height-(y - scale.minY) * coefY;
    },
    getScaleSegmentX(dataX, dataY){
      const start = dataX.findIndex(x => x >= scale.minX);
      let end = -1;
      for(let i = dataX.length-1; i >= 0; i--) {
        if (dataX[i] <= scale.maxX) {
          end = dataX[i];
          break;
        }
      }
      return { x: dataX.slice(start, end+1), y: dataY.slice(start, end+1) };
    },
    drawChart(dataX, dataY, color) {
      const ctx = elem.getContext("2d");
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();

      const data = this.getScaleSegmentX(dataX, dataY);

      let nextX, nextY;
      data.x.forEach((x,i) => {
        nextX = this.normalizeX(x);
        nextY = this.normalizeY(dataY[i]);
        //ctx.fillRect(nextX - 5, nextY - 5, 10, 10);
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      })

      ctx.stroke();
    }
  });
}

