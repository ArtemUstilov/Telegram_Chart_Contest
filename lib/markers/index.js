export const dragMaster = function () {
  let dragObject;
  let mouseOffset;
  let leftEdge;
  let rightEdge;
  let mWidth;
  let offsetWidth;
  let clientWidth;
  let dragObjWidth;
  let bgElem;
  let dragCirc;
  let circleSize;
  let dragHandler;
  let min = 0;
  let max = 1;
  let normalizedWidth = 1;
  let minWidth;
  let bgPreview;
  let colors;
  let suffixID;
  let bgPreviewActive;
  function getMouseOffset(target, pgX, pgY) {
    const docPos = { x: target.offsetLeft, y: target.offsetTop };
    return { x: pgX - docPos.x, y: pgY - docPos.y }
  }

  function mouseUp() {
    dragCirc.style.transform = 'scale(0)';
    document.onmousemove = null;
    document.onmouseup = null;
    document.ontouchstart = null;
    document.ontouchend = null;
    document.ontouchmove = null;
    document.ondragstart = null;
    document.body.onselectstart = null
  }

  const dragCircleRightUpd = (width) => dragCirc.style.left = (dragObject.offsetLeft + width - circleSize / 2 + mWidth * 3 / 2) + 'px';
  const dragCircleLeftUpd = (left) => dragCirc.style.left = (left - circleSize / 2 + mWidth / 2) + 'px';
  const dragCircleMoveUpd = (d) => {
    dragCirc.style.left = (d + dragObject.offsetWidth / 2 - circleSize / 2) + 'px';
  }

  function stretchRight(e) {
    let { pageX } = getProps(e, 'pageX');
    let width = pageX - dragObject.offsetLeft - leftEdge;
    if (dragObject.offsetLeft + width > clientWidth) {
      width = clientWidth - dragObject.offsetLeft;
    }
    width = width < minWidth ? minWidth : width;
    updatePos(width);
    dragCircleRightUpd(width);
  }

  function updatePos(width, left) {
    if (left !== undefined) {
      min = left / clientWidth;
      dragObject.style.left = left + 'px';
      if (bgElem) {
        bgElem.style.left = left + 'px';
      }
    }
    if (width !== undefined) {
      normalizedWidth = width / clientWidth;
      dragObject.style.width = width + 'px';
      if (bgElem) {
        bgElem.style.width = width+ mWidth*2 + 'px';
      }
    }
    max = min + normalizedWidth;
    if (typeof dragHandler === 'function') {
      dragHandler(min, max);
    }
  }

  function stretchLeft(e) {
    let { pageX } = getProps(e, 'pageX');
    let left = pageX - leftEdge < 0 ? 0 : pageX - leftEdge;
    let width = dragObject.offsetLeft + dragObject.offsetWidth - mWidth*2 - left;
    if (width <= minWidth) {
      width = minWidth;
      left = dragObject.offsetLeft + dragObject.offsetWidth - mWidth * 2 - width;
    }
    updatePos(width, left);
    dragCircleLeftUpd(left);
  }

  function mouseMove(e) {
    let { pageX } = getProps(e, 'pageX');
    let d = pageX - mouseOffset.x;

    let r = offsetWidth - dragObject.offsetWidth;
    d = d < 0 ? 0 : d;
    d = d > r ? r : d;
    updatePos(undefined, d);
    dragCircleMoveUpd(d);
  }

  function getProps(e, ...props) {
    let res = {};
    if (e[props[0]]) {
      props.forEach(x => res[x] = e[x])
    } else if (e.touches) {
      props.forEach(x => {
        res[x] = e.touches[0][x]
      })
    }
    return res;
  }

  const isLeftCorner = () => dragObject.clientWidth <= minWidth && dragObject.offsetLeft <= 1;
  const isRightCorner = () => dragObject.clientWidth <= minWidth && dragObject.offsetLeft + dragObject.offsetWidth - mWidth*2 >= clientWidth-1;

  function mouseOver(e){
    let { pageX, pageY } = getProps(e, 'pageX', 'pageY');
    const x = pageX - this.getBoundingClientRect().left;
    dragObject = document.getElementById('marker'+suffixID);
    if (x > dragObject.offsetLeft + mWidth * 2 && x < dragObject.offsetLeft + dragObject.clientWidth) {
      dragObject.style.cursor = 'move';
    }else{
      dragObject.style.cursor = 'w-resize';
    }
  }
  function mouseDown(e) {
    let { pageX, pageY } = getProps(e, 'pageX', 'pageY');
    console.log(suffixID)
    dragObject = document.getElementById('marker'+suffixID);

    dragCirc.style.transform = 'scale(1)';
    mouseOffset = getMouseOffset(dragObject, pageX, pageY);
    dragObjWidth = dragObject.clientWidth;
    const x = pageX - this.getBoundingClientRect().left;
    if(isLeftCorner()) {
      document.onmousemove = stretchRight;
      document.ontouchmove = stretchRight;
      dragCircleRightUpd(dragObject.clientWidth);
    } else if (isRightCorner()){

      document.onmousemove = stretchLeft;
      document.ontouchmove = stretchLeft;
      dragCircleLeftUpd(dragObject.offsetLeft);
    }else
    if (x > dragObject.offsetLeft + dragObject.clientWidth) {
      document.onmousemove = stretchRight;
      document.ontouchmove = stretchRight;

      dragCircleRightUpd(dragObject.clientWidth);
    } else if (x < dragObject.offsetLeft + mWidth * 2) {
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
    makeDraggable: function (element, left, width, minW, markersWidth, size, colorsState, suffixId, onDrag) {
      element.parentNode.onmousedown = mouseDown;
      element.parentNode.ontouchstart = mouseDown;
      element.parentNode.onmousemove = mouseOver;
      element.parentNode.firstChild.style.borderRadius = '5px';
      leftEdge = element.getBoundingClientRect().left;
      rightEdge = left + width;
      mWidth = markersWidth;
      dragObject = element;
      offsetWidth = width;
      minWidth = minW;
      suffixID = suffixId;clientWidth = offsetWidth - mWidth * 2;
      bgPreview = document.createElement('div');
      bgPreview.setAttribute('id', 'bg-preview'+suffixId);
      bgPreview.classList.add('bg-preview');
      let elemLeft = document.createElement('div');
      let elemRight = document.createElement('div');
      elemLeft.classList.add('border-elem');
      elemLeft.classList.add('elem-left');
      elemRight.classList.add('border-elem');
      elemRight.classList.add('elem-right');

      bgElem = document.createElement('div');
      bgElem.classList.add('bg-preview-active');
      bgElem.setAttribute('id', 'bg-preview-active'+suffixId);

      element.appendChild(elemLeft);
      element.appendChild(elemRight);
      dragCirc = document.createElement('div');
      dragCirc.id = 'dragCircle'+suffixId;
      dragCirc.classList.add('dragCircle');
      dragCirc.style.width = size+'px';
      dragCirc.style.height = size+'px';
      element.parentNode.appendChild(dragCirc);
      element.parentNode.insertBefore(bgPreview, dragCirc);
      element.parentNode.insertBefore(bgElem, dragCirc);
      circleSize = size;
      dragHandler = onDrag;
      colors = colorsState;
    },
    updateMode: function(isNight){
      dragObject.style.borderColor = isNight ? '#40566b' : '#ddeaf3';
      bgPreview.style.backgroundColor = isNight ? colors.night2 : colors.day2;
      bgElem.style.backgroundColor = isNight ? colors.night1 : colors.day1;
    }
  }
};
