// import createGraph from '../../lib/core/canvas/index';
function createGraph(element) {
  let data = [];
  let elem = element;
  let scale = {};
  return ({
    setData(dataVal) {
      data = dataVal;
    },
    getData() {
      return data;
    },
    setScale(scaleVal) {
      scale = Object.assign({}, scaleVal);
    },
    getScale() {
      return scale;
    },
    refresh() {
      for (let i = 0; i < data.length; i++) {
        this.drawGraph(data[i].values.x, data[i].values.y, data[i].color);
      }
    },
    drawGraph(dataX, dataY, color) {
      const width = elem.width;
      const height = elem.height;
      const ctx = elem.getContext("2d");
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      const minXInd = dataX.findIndex(x => x >= scale.minX);
      const maxXInd = dataX.length - dataX.reverse().findIndex(x => x <= scale.maxX) - 1;
      const coefX = width / (scale.maxX - scale.minX);
      const coefY = height / (scale.maxY - scale.minY);

      ctx.moveTo(width-dataX[minXInd] * coefX, height-dataY[minXInd] * coefY);
      ctx.fillRect(width-dataX[minXInd] * coefX - 5, height-dataY[minXInd] * coefY - 5, 10, 10);

      for (let i = minXInd + 1; i <= maxXInd; i++) {
        let nextX = width-dataX[i] * coefX;
        let nextY = height- dataY[i] * coefY;
        ctx.fillRect(nextX - 5, nextY - 5, 10, 10);
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      }
      ctx.stroke();
    }
  });
}

function example() {
  let elem = document.getElementById('canvas');
  const graph = createGraph(elem);

  const data = [
    { name: 'BlaBla', color: '#FF0000', values: { x: [1, 2, 3], y: [1, 2, 3] } },
    { name: 'HaHa', color: '#00FF00', values: { x: [1, 2, 3], y: [3, 1, 2] } },
  ];

  const scale = { minX: 0, maxX: 4, minY: 0, maxY: 4 };

  graph.setData(data);
  graph.setScale(scale);
  graph.refresh();
}

document.addEventListener("DOMContentLoaded", function (event) {
  example();
});
