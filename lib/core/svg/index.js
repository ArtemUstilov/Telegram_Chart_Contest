const createGraph = function (element) {
  let data = [];
  let scale = { minX: -1, maxX: 1, minY: -1, maxY: 1 };
  const setData = function setData(newData) {
    data = newData;
  };
  const getData = function getData() {
    return data;
  };
  const setScale = function setData(newScale) {
    scale = newScale;
  };
  const getScale = function getScale() {
    return scale;
  };
  const refresh = function refresh() {
    
  };

  return {
    setData,
    getData,
    setScale,
    getScale,
    refresh
  }
};

module.exports = { createGraph };