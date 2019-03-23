export const dragMaster = (function () {
  let dragObject;
  let mouseOffset;
  let leftEdge;
  let rightEdge;
  let markerWidth;
  let offsetWidth;
  let clientWidth;
  let dragObjWidth;
  let bgElem;
  let dragCirc;
  let circleSize;
  let dragHandler;
  let minWidth;
  let min = 0;
  let max = 1;
  let normalizedWidth = 1;

  const getPageX = (e) => e.pageX ? e.pageX : e.touches ? e.touches[0].pageX : null;


  function mouseUp() {
    dragObject = null;
    // dragCirc.style.width = '0';
    // dragCirc.style.height = '0';
    dragCirc.style.transform = 'scale(0)';
    document.onmousemove = null;
    document.onmouseup = null;
    document.ontouchstart = null;
    document.ontouchend = null;
    document.ontouchmove = null;
    document.ondragstart = null;
    document.body.onselectstart = null
  }

  // TODO replace width & translate  drag circle animation to transform: scale

  const dragCircleRightUpd = (width) => dragCirc.style.left = (dragObject.offsetLeft + width - circleSize / 2 + markerWidth * 3 / 2) + 'px';
  const dragCircleLeftUpd = (left) => dragCirc.style.left = (left - circleSize / 2 + markerWidth / 2) + 'px';
  const dragCircleMoveUpd = (left) => dragCirc.style.left = (left + dragObject.offsetWidth / 2 - circleSize / 2) + 'px';

  function stretchRight(e) {
    let pageX = getPageX(e);
    let width =  pageX - dragObject.offsetLeft - leftEdge;
    width = dragObject.offsetLeft + width > clientWidth ? clientWidth - dragObject.offsetLeft : width;
    width = width <= minWidth ? minWidth : width;
    updatePos(width);
    dragCircleRightUpd(width);
  }

  function updatePos(width, left) {
    if (left) {
      min = left / clientWidth;
      dragObject.style.left = left + 'px';
      bgElem.style.left = left + markerWidth + 'px';
    }
    if (width) {
      normalizedWidth = width / clientWidth;
      dragObject.style.width = width + 'px';
      bgElem.style.width = width+ markerWidth + 'px';
    }
    max = min + normalizedWidth;
    if (typeof dragHandler === 'function') {
      dragHandler(min, max);
    }
  }

  function stretchLeft(e) {
    let pageX = getPageX(e);
    let left = Math.round(pageX - leftEdge < 0 ? 0 : pageX - leftEdge);
    let width = dragObject.offsetLeft + dragObject.clientWidth - left;
    if (width <= minWidth) {
      width = minWidth
      left = dragObject.offsetLeft + dragObject.offsetWidth - markerWidth*2 - minWidth;
    }
    console.log(dragObject.clientLeft, dragObject.offsetLeft);
    updatePos(width, left);
    dragCircleLeftUpd(left);
  }

  function mouseMove(e) {
    let pageX = getPageX(e);
    let d = pageX - mouseOffset;
    let r = offsetWidth - dragObject.offsetWidth;
    d = d < 0 ? 0 : d;
    d = d > r ? r : d;
    updatePos(null, d);
    dragCircleMoveUpd(d);
  }

  const isLeftCorner = () => dragObject.clientWidth <= minWidth && dragObject.offsetLeft <= 1;
  const isRightCorner = () => dragObject.clientWidth <= minWidth && dragObject.offsetLeft + dragObject.offsetWidth - markerWidth*2 >= clientWidth-1;
  const touchedRight = (pageX) => pageX - dragObject.getBoundingClientRect().right >= -2-markerWidth;
  const touchedLeft = (pageX) => pageX - dragObject.getBoundingClientRect().left <= 2+markerWidth;
  function mouseDown(e) {
    let pageX = getPageX(e);
    dragObject = document.getElementById('marker');
    dragCirc.style.transform = 'scale(1)';
    console.log(pageX - dragObject.getBoundingClientRect().left , - markerWidth)
    mouseOffset = pageX - dragObject.offsetLeft;
    dragObjWidth = dragObject.clientWidth;


    if(isLeftCorner()) {
      console.log('LEFT CORNER')
      document.onmousemove = stretchRight;
      document.ontouchmove = stretchRight;
      dragCircleRightUpd(dragObject.clientWidth);
    } else if (isRightCorner()){
      console.log('RIGHTCORNER')
      document.onmousemove = stretchLeft;
      document.ontouchmove = stretchLeft;
      dragCircleLeftUpd(dragObject.offsetLeft);
    }else if(touchedRight(pageX)) {
      document.onmousemove = stretchRight;
      document.ontouchmove = stretchRight;
      dragCircleRightUpd(dragObject.clientWidth);
    } else if (touchedLeft(pageX)) {
      document.onmousemove = stretchLeft;
      document.ontouchmove = stretchLeft;
      dragCircleLeftUpd(dragObject.offsetLeft);
    } else {
      document.onmousemove = mouseMove;
      document.ontouchmove = mouseMove;
      dragCircleMoveUpd(dragObject.offsetLeft);
    }
    document.onmouseup = mouseUp;
    document.ontouchend = mouseUp;
    document.ondragstart = function () {return false};
    document.body.onselectstart = function () {return false};

  }

  return {
    makeDraggable: function (element, left, width, minW, markersWidth, bgEl, size, onDrag) {
      element.parentNode.onmousedown = mouseDown;
      element.parentNode.ontouchstart = mouseDown;
      leftEdge = left;
      rightEdge = left + width;
      minWidth = minW;
      markerWidth = markersWidth;
      offsetWidth = width;
      bgElem = bgEl;
      clientWidth = offsetWidth - markerWidth * 2;
      dragHandler = onDrag;
      circleSize = size;
      // create animation circle
      dragCirc = document.createElement('div');
      dragCirc.id = 'dragCircle';
      dragCirc.style.width = size+'px';
      dragCirc.style.height = size+'px';
      element.parentNode.appendChild(dragCirc);
    }
  }
})();
