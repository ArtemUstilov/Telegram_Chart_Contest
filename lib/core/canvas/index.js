export const createCanvasGraph = (elem) => {
  return function core() {
    let data = {};
    let elem;
    let scale = {};

    function setData(dataVal) {
      data = Object.assign({}, dataVal);
    }

    function getData() {
      return data;
    }

    function setScale(scaleVal) {
      scale = Object.assign({}, scaleVal);
    }
     function getScale(){
      return scale;
    }
    function refresh() {
      const width = elem.width;
      const height = elem.height;
      const ctx = elem.getContext("2d");
      const minXInd = data.values.x.findIndex(x=>x >= scale.minX);
      const maxXInd = data.values.x.reverse().findIndex(x => x <= scale.maxX);
      const coefX = width / (scale.maxX-scale.minX);
      const coefY = height / (scale.maxY-scale.minY);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(data.values.x[minXInd]*coefX, data.values.y[minXInd]*coefY);
      for(let i = minXInd; i <= maxXInd; i++){
        let nextX = data.values.x[minXInd]*coefX;
        let nextY = data.values.y[minXInd]*coefY;
        ctx.lineTo(nextX, nextY);
        ctx.moveTo(nextX, nextY);
      }
      ctx.restore();
      ctx.stroke();
    }
  }
}

