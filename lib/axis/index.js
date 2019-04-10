import {formatValue} from "../format";
import {createSVGElement, createTransformer} from "../util";

export const FONT_SIZE_COEF = 2;


export const createSVGAxis = function (options) {
  const { xFormatter, yFormatter } = options;
  const axisElement = createSVGElement('svg');
  const labelsElement = createSVGElement('svg');

  const transformer = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height }, false, true)
  axisElement.setAttribute('style', 'position: absolute; top: 0; left: 0; z-index: -100');
  axisElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  axisElement.setAttribute('width', options.width);
  axisElement.setAttribute('preserveAspectRatio', 'none');
  const labelsScaleElement = createSVGElement('g');
  labelsElement.appendChild(labelsScaleElement);
  labelsElement.setAttribute('style', 'position: absolute; top: 0; left: 0');
  labelsElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF);
  labelsElement.setAttribute('width', options.width);
  labelsElement.setAttribute('preserveAspectRatio', 'none');
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
  let textColor = options.colors.textAxisDay;
  let axisColor = options.colors.axisDay;
  let type2Colors = [];
  const refresh = function refresh() {
    const { minX, maxX, minY, maxY, sMaxY } = scale;
    const width = maxX - minX;
    const height = maxY - minY;
    let xAxis = xFormatter.format(minX, maxX);
    let yAxis = yFormatter.format(minY, maxY);
    if(!xAxis || !yAxis) return;
    const { labels: xLabels, step: xStep } = xAxis;
    const { labels: yLabels, step: yStep } = yAxis;
    axisScaleElement.innerHTML = '';
    labelsScaleElement.innerHTML = '';
    yLabels.forEach(({ value, label }, i) => {
      const lineElement = createSVGElement('line');
      lineElement.setAttribute('x1', transformer.transformX(minX));
      lineElement.setAttribute('x2', transformer.transformX(maxX));
      lineElement.setAttribute('y1', transformer.transformY(value));
      lineElement.setAttribute('y2', transformer.transformY(value));
      lineElement.setAttribute('stroke', axisColor);
      lineElement.setAttribute('vector-effect', 'non-scaling-stroke');
      lineElement.setAttribute('stroke-width', '1.5');
      lineElement.setAttribute('fill', 'none');
      axisScaleElement.appendChild(lineElement);
      const textElement = createSVGElement('text');
      textElement.setAttribute('x', transformer.transformX(minX));
      textElement.setAttribute('y', transformer.transformY(value + 5));
      textElement.innerHTML = label;
      textElement.setAttribute('fill', type2Colors[0] || textColor);
      labelsScaleElement.appendChild(textElement);
      if(sMaxY) {
        const textRightElement = createSVGElement('text');
        textRightElement.setAttribute('x', transformer.transformX(maxX) - 50);
        textRightElement.setAttribute('y', transformer.transformY(value + 5));
        textRightElement.innerHTML = formatValue((value / (yLabels.length *yStep)) * sMaxY).label;
        textRightElement.setAttribute('fill', type2Colors[1] || textColor);
        labelsScaleElement.appendChild(textRightElement);
      }
    });
    xLabels.forEach(({ value, label }) => {
      const textElement = createSVGElement('text');
      textElement.setAttribute('x', transformer.transformX(value));
      textElement.setAttribute('y', transformer.realHeight + options.fontSize * FONT_SIZE_COEF / 2);
      textElement.setAttribute('text-anchor', 'middle');
      textElement.setAttribute('dominant-baseline', 'middle');
      textElement.innerHTML = label;
      textElement.setAttribute('fill', textColor);
      labelsScaleElement.appendChild(textElement);
    });


  };

  function setType2Colors(colors){
    type2Colors = colors;
    refresh();
  }
  function updateMode(isNight){
    if(isNight){
      textColor = options.colors.textAxisNight;
      axisColor = options.colors.axisNight;
    }else{
      textColor = options.colors.textAxisDay;
      axisColor = options.colors.axisDay;
    }
    refresh();
  }
  return {
    setScale,
    getScale,
    refresh,
    setType2Colors,
    updateMode,
    axisElement,
    labelsElement
  };
};


