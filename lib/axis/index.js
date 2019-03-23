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

export const createSVGAxis = function (parent, options) {
  const { xFormatter, yFormatter } = options;
  const axisElement = createSVGElement('svg');
  const transformer = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height }, false, true)
  axisElement.setAttribute('style', 'position: absolute; top: 0');
  axisElement.setAttribute('height', options.height);
  axisElement.setAttribute('width', options.width);
  axisElement.setAttribute('preserveAspectRatio', 'none');
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
    let xAxis = xFormatter.format(minX, maxX);
    let yAxis = yFormatter.format(minY, maxY);
    if(!xAxis || !yAxis) return;
    const { labels: xLabels, step: xStep } = xAxis;
    const { labels: yLabels, step: yStep } = yAxis;
    console.log(minX, maxX);
    console.log(minY, maxY);
    console.log(xLabels, yLabels);
    axisScaleElement.innerHTML = '';
    yLabels.forEach(({ value, label }) => {
      const lineElement = createSVGElement('line');
      lineElement.setAttribute('x1', transformer.transformX(minX));
      lineElement.setAttribute('x2', transformer.transformX(maxX));
      lineElement.setAttribute('y1', transformer.transformY(value));
      lineElement.setAttribute('y2', transformer.transformY(value));
      lineElement.setAttribute('stroke', 'gray');
      lineElement.setAttribute('vector-effect', 'non-scaling-stroke');
      lineElement.setAttribute('stroke-width', '0.5');
      lineElement.setAttribute('fill', 'none');
      axisScaleElement.appendChild(lineElement);
      const textElement = createSVGElement('text');
      textElement.setAttribute('x', transformer.transformX(minX + width * 0.05));
      textElement.setAttribute('y', transformer.transformY(value + yStep * 0.05));
      textElement.innerHTML = label;
      axisScaleElement.appendChild(textElement);
    });
    xLabels.forEach(({ value, label }) => {
      const textElement = createSVGElement('text');
      textElement.setAttribute('x', transformer.transformX(value));
      textElement.setAttribute('y', transformer.transformY(minY + height * 0.05));
      textElement.setAttribute('text-anchor', 'middle');
      textElement.innerHTML = label;
      axisScaleElement.appendChild(textElement);
    });


  };

  parent.appendChild(axisElement);
  return {
    setScale,
    getScale,
    refresh,
  };
};
