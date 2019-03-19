export const createCanvasGraph = (element) => {
  let data = [];
  let elem = element;
  let scale = {};
  let coefX, coefY;

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
      coefX = elem.width / (scale.maxX - scale.minX);
      coefY = elem.height / (scale.maxY - scale.minY);
    },
    getScale() {
      return scale;
    },
    refresh() {
      for (let i = 0; i < data.length; i++) {
        this.drawChart(data[i].values.x, data[i].values.y, data[i].color);
      }
    },
    normalizeX(x){
      return elem.width-(x - scale.minX) * coefX;
    },
    normalizeY(y){
      return elem.height-(y - scale.minY) * coefY;
    },
    getScaleSegmentX(dataX, dataY){
      const start = dataX.findIndex(x => x >= scale.minX);
      const end = dataX.length - dataX.reverse().findIndex(x => x <= scale.maxX) - 1;
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
        ctx.fillRect(nextX - 5, nextY - 5, 10, 10);
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      })

      ctx.stroke();
    }
  });
}

