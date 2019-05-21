import {formatValue} from "../format";
import {createSVGElement, createTransformer} from "../util";

export const FONT_SIZE_COEF = 2;


export const createSVGAxis = function (options) {
  const { xFormatter, yFormatter } = options;
  const axisElement = createSVGElement('svg');
  const labelsElement = createSVGElement('svg');
  let transformer = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height + (options.enlarge || 0) }, false, true);
  let isNight = options.nightMode;
  let NightMode = false;
  let prev = window.innerWidth;

  window.addEventListener('resize', () => {
    if(Math.abs(prev = window.innerWidth) < 50)return;
    prev = window.innerWidth;

    options.width = window.innerWidth*0.94;
    axisElement.setAttribute('width', options.width);
    labelsElement.setAttribute('width', options.width);
    transformer = createTransformer({ minX: 0, maxX: options.width, minY: 0, maxY: options.height + (options.enlarge || 0)}, false, true);
    refresh();
  }, false);
  axisElement.setAttribute('style', `position: absolute; top: 0; left: 0; z-index: ${options.fill ? -100 : 0}; opacity: ${options.fill ? 1 : 0.2}`);
  axisElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF*2);
  axisElement.setAttribute('width', options.width);
  axisElement.setAttribute('preserveAspectRatio', 'none');
  axisElement.setAttribute('preserveAspectRatio', 'none');
  const labelsScaleElement = createSVGElement('g');
  labelsElement.appendChild(labelsScaleElement);
  labelsElement.setAttribute('style', 'position: absolute; top: 0; left: 0; font-weight: bold;');
  labelsElement.setAttribute('height', options.height + options.fontSize * FONT_SIZE_COEF*2);
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
  if(isNight){
    textColor = options.colors.textAxisNight;
    axisColor = options.colors.axisNight;
  }else{
    textColor = options.colors.textAxisDay;
    axisColor = options.colors.axisDay;
  }
  let type2Colors = [];
  const refresh = function refresh() {
    const { minX, maxX, minY, maxY, sMaxY } = scale;
    if(!maxY){
      transformer.setScale({...scale, maxY: sMaxY});
    }else{
      transformer.setScale(scale);
    }
    let xAxis = xFormatter.format(minX, maxX);
    let yAxis = yFormatter.format(minY, maxY !== null ? maxY : sMaxY);
    if(!xAxis || !yAxis) return;
    let suffixForRightLabels;
    const { labels: xLabels, step: xStep } = xAxis;
    const { labels: yLabels, step: yStep } = yAxis;
    axisScaleElement.innerHTML = '';
    labelsScaleElement.innerHTML = '';
    yLabels.forEach(({ value, label }, i) => {
      const lineElement = createSVGElement('line');
      lineElement.setAttribute('x1', transformer.transformX(minX));
      lineElement.setAttribute('x2', transformer.transformX(maxX));
      let plus = options.enlarge ? 0 : options.fontSize * FONT_SIZE_COEF;
      lineElement.setAttribute('y1', transformer.transformY(value)+ plus);
      lineElement.setAttribute('y2', transformer.transformY(value)+ plus);
      lineElement.setAttribute('stroke', axisColor);
      lineElement.setAttribute('vector-effect', 'non-scaling-stroke');
      lineElement.setAttribute('stroke-width', '1');
      lineElement.setAttribute('fill', 'none');
      axisScaleElement.appendChild(lineElement);
      if(maxY) {
        const textElement = createSVGElement('text');
        textElement.setAttribute('x', transformer.transformX(minX) + 5);
        textElement.setAttribute('y', transformer.transformY(value) - 5 + plus);
        if(i === yLabels.length-1 && options.enlarge){
          textElement.setAttribute('y', transformer.transformY(value) + 16 + plus);
        }
        textElement.innerHTML = label;
        textElement.style.fontWeight = 'bold';
        textElement.setAttribute('font-size', 12);
        let color = type2Colors[0] || textColor;
        textElement.setAttribute('fill', NightMode ? (type2Colors[0] ? '#5199df' : color) : color);
        labelsScaleElement.appendChild(textElement);
      }
      if(sMaxY && (!maxY || sMaxY/maxY < 0.5)) {
        const textRightElement = createSVGElement('text');
        textRightElement.setAttribute('y', transformer.transformY(value) -5 + options.fontSize * FONT_SIZE_COEF);
        textRightElement.setAttribute('font-size', 12);
        textRightElement.style.fontWeight = 'bold';
        let val = formatValue((value / (maxY || sMaxY)) * sMaxY, suffixForRightLabels);
        textRightElement.innerHTML = val.label;
        suffixForRightLabels = val.suffix;
        let color = type2Colors[type2Colors.length-1] || textColor;
        textRightElement.setAttribute('fill', NightMode ? (options.colors[color] || color) : color);
        labelsScaleElement.appendChild(textRightElement);
        textRightElement.setAttribute('x', transformer.transformX(maxX) - textRightElement.getBBox().width - 5);
      }
    });
    xLabels.forEach(({ value, label }) => {
      const textElement = createSVGElement('text');
      textElement.setAttribute('x', transformer.transformX(value));
      textElement.setAttribute('y', transformer.realHeight + options.fontSize * FONT_SIZE_COEF  /2 * (options.enlarge ? 1 : 3));
      textElement.setAttribute('text-anchor', 'middle');
      textElement.setAttribute('dominant-baseline', 'middle');
      textElement.innerHTML = label;
      textElement.style.fontWeight = '800';
      textElement.setAttribute('font-size', 12);
      textElement.setAttribute('fill', textColor);
      labelsScaleElement.appendChild(textElement);
    });


  };

  function setType2Colors(colors){
    type2Colors = colors;
    refresh();
  }
  function updateMode(night){
    NightMode = night;
    if(night){
      textColor = options.colors.textAxisNight;
      axisColor = options.colors.axisNight;
    }else{
      textColor = options.colors.textAxisDay;
      axisColor = options.colors.axisDay;
    }
    refresh();
  }
  function fade() {
    for(let i = 0; i < 10; i++){
      setTimeout(() =>     axisElement.style.opacity = '' + (1 - i/10), i*100);
      setTimeout(() =>     labelsElement.style.opacity = '' + (1 - i/10), i*100);
    }
  }
  return {
    setScale,
    getScale,
    refresh,
    setType2Colors,
    updateMode,
    axisElement,
    labelsElement,
    fade
  };
};


