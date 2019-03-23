const xmlns = "http://www.w3.org/2000/svg";
const MAX_RANGE = 100;
const createSVGElement = tag => document.createElementNS(xmlns, tag)

const createTransformer = ({ minX, maxX, minY, maxY }, swapX, swapY) => {
  const realScale = { minX, maxX, minY, maxY };
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
  return { transformX, transformY, setScale };
};

export const createSVGAxis = function (element, xAxisFormatter, yAxisFormatter) {
  const axisElement = createSVGElement('svg');
  const transformer = createTransformer({ minX: 0, maxX: element.clientWidth, minY: 0, maxY: element.clientHeight }, false, true)
  axisElement.setAttributeNS(null, 'style', 'position: absolute');
  axisElement.setAttributeNS(null, 'height', element.clientHeight);
  axisElement.setAttributeNS(null, 'width', element.clientWidth);
  axisElement.setAttributeNS(null, 'preserveAspectRatio', 'none');
  const axisScaleElement = createSVGElement('g');
  axisElement.appendChild(axisScaleElement);
  let scale = { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  const setScale = function setData(newScale) {
    transformer.setScale(newScale);
    scale = newScale;
  };
  const getScale = function getScale() {
    return scale;
  };

  const refresh = function refresh() {
    const { minX, maxX, minY, maxY } = scale;    
    const width = maxX - minX;
    const height = maxY - minY;
    const { labels: xLabels, step: xStep } = xAxisFormatter.format(minX, maxX);
    const { labels: yLabels, step: yStep } = yAxisFormatter.format(minY, maxY);
    console.log(minX, maxX);
    console.log(minY, maxY);
    console.log(xLabels, yLabels);
    axisScaleElement.innerHTML = '';
    yLabels.forEach(({ value, label }) => {
      const lineElement = createSVGElement('line');
      lineElement.setAttributeNS(null, 'x1', transformer.transformX(minX));
      lineElement.setAttributeNS(null, 'x2', transformer.transformX(maxX));
      lineElement.setAttributeNS(null, 'y1', transformer.transformY(value));
      lineElement.setAttributeNS(null, 'y2', transformer.transformY(value));
      lineElement.setAttributeNS(null, 'stroke', 'gray');
      lineElement.setAttributeNS(null, 'vector-effect', 'non-scaling-stroke');
      lineElement.setAttributeNS(null, 'stroke-width', '0.5');
      lineElement.setAttributeNS(null, 'fill', 'none');
      axisScaleElement.appendChild(lineElement);
      const textElement = createSVGElement('text');
      textElement.setAttributeNS(null, 'x', transformer.transformX(minX + width * 0.05));
      textElement.setAttributeNS(null, 'y', transformer.transformY(value + yStep * 0.05));
      textElement.innerHTML = label;
      axisScaleElement.appendChild(textElement);
    });
    xLabels.forEach(({ value, label }) => {
      const textElement = createSVGElement('text');
      textElement.setAttributeNS(null, 'x', transformer.transformX(value));
      textElement.setAttributeNS(null, 'y', transformer.transformY(minY + height * 0.05));
      textElement.setAttributeNS(null, 'text-anchor', 'middle');
      textElement.innerHTML = label;
      axisScaleElement.appendChild(textElement);
    });


  };

  element.appendChild(axisElement);
  return {
    setScale,
    getScale,
    refresh,
  };
};
