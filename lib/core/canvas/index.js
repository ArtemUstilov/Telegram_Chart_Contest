export const createCanvasGraph = (element) => {
  let data = [];
  let elem = element;
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
      const ctx = elem.getContext("2d");
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
      const start = dataX.findIndex(x => x >= scale.minX);
      let end = -1;
      for(let i = dataX.length-1; i >= 0; i--) {
        if (dataX[i] <= scale.maxX) {
          end = i;
          break;
        }
      }
      return { x: dataX.slice(start, end+1), y: dataY.slice(start, end+1) };
    },
    drawChart(dataX, dataY, color) {
      const ctx = elem.getContext("2d");
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const dataFragment = this.getScaleSegmentX(dataX, dataY);

      let nextX, nextY;
      dataFragment.x.forEach((x,i) => {
        nextX = this.normalizeX(x);
        nextY = this.normalizeY(dataFragment.y[i]);
        //ctx.fillRect(nextX - 5, nextY - 5, 10, 10);
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      })

      ctx.stroke();
    }
  });
}

