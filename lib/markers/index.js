import { getProps } from "../util";

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
  let dragHandler, dragHandler2;
  let setP;
  let min = 0;
  let max = 1;
  let normalizedWidth = 1;
  let minWidth;
  let bgPreview;
  let colors;
  let suffixID;
  let isNight;
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
    let [ pageX ] = getProps(e, 'pageX');
    let width = pageX - dragObject.offsetLeft - leftEdge;
    if (dragObject.offsetLeft + width > clientWidth) {
      width = clientWidth - dragObject.offsetLeft;
    }
    width = width < minWidth ? minWidth : width;
    updatePos(width);
    dragCircleRightUpd(width);
  }

  function updatePos(width, left) {
    setP && setP(width, left);
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
    if (typeof dragHandler2 === 'function') {
      dragHandler2(min, max);
    }
  }

  function stretchLeft(e) {
    let [ pageX ] = getProps(e, 'pageX');
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
    let [ pageX ] = getProps(e, 'pageX');
    let d = pageX - mouseOffset.x;

    let r = offsetWidth - dragObject.offsetWidth;
    d = d < 0 ? 0 : d;
    d = d > r ? r : d;
    updatePos(undefined, d);
    dragCircleMoveUpd(d);
  }



  const isLeftCorner = () => dragObject.clientWidth <= minWidth && dragObject.offsetLeft <= 1;
  const isRightCorner = () => dragObject.clientWidth <= minWidth && dragObject.offsetLeft + dragObject.offsetWidth - mWidth*2 >= clientWidth-1;

  function mouseOver(e){
    let [ pageX ] = getProps(e, 'pageX', 'pageY');
    const x = pageX - this.getBoundingClientRect().left;
    dragObject = document.getElementById('marker'+suffixID);
    if (x > dragObject.offsetLeft + mWidth * 2 && x < dragObject.offsetLeft + dragObject.clientWidth) {
      dragObject.style.cursor = 'move';
    }else{
      dragObject.style.cursor = 'w-resize';
    }
  }
  function mouseDown(e) {
    let [ pageX, pageY ] = getProps(e, 'pageX', 'pageY');
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
      if(x > dragObject.offsetLeft + dragObject.clientWidth + mWidth + 50){
        let d = x - dragObject.clientLeft - dragObject.clientWidth/2;
        let r = offsetWidth - dragObject.offsetWidth;
        d = d < 0 ? 0 : d;
        d = d > r ? r : d;
        updatePos(undefined, d);
      }else {
        document.onmousemove = stretchRight;
        document.ontouchmove = stretchRight;

        dragCircleRightUpd(dragObject.clientWidth);
      }
    } else if (x < dragObject.offsetLeft + mWidth * 2) {
      if(x < dragObject.offsetLeft - 50){
        let d = x - dragObject.clientLeft - dragObject.clientWidth/2;
        let r = offsetWidth - dragObject.offsetWidth;
        d = d < 0 ? 0 : d;
        d = d > r ? r : d;
        updatePos(undefined, d);
      }else {
        document.onmousemove = stretchLeft;
        document.ontouchmove = stretchLeft;

        dragCircleLeftUpd(dragObject.offsetLeft);
      }
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
    makeDraggable: function (element, left, width, minW, markersWidth, size, colorsState, suffixId, onDrag, onDrag2, setPos, initScale, nightMode) {
      element.parentNode.onmousedown = mouseDown;
      element.parentNode.ontouchstart = mouseDown;
      element.parentNode.onmousemove = mouseOver;
      element.parentNode.firstChild.style.borderRadius = '5px';
      leftEdge = element.parentNode.getBoundingClientRect().left;

      rightEdge = left + width;
      setP = setPos;
      mWidth = markersWidth;
      dragObject = element;
      offsetWidth = width;
      minWidth = minW;
      suffixID = suffixId;
      isNight = nightMode;
      clientWidth = offsetWidth - mWidth * 2;
      bgPreview = document.createElement('div');
      bgPreview.setAttribute('id', 'bg-preview'+suffixId);
      bgPreview.classList.add('bg-preview');
      bgPreview.style.width = width+'px';
      let elemLeft = document.createElement('div');
      let elemRight = document.createElement('div');
      elemLeft.classList.add('border-elem');
      elemLeft.classList.add('elem-left');
      elemRight.classList.add('border-elem');
      elemRight.classList.add('elem-right');
      let prev = window.innerWidth;

      window.addEventListener('resize', () => {
        if(Math.abs(prev = window.innerWidth) < 50)return;
        prev = window.innerWidth;

        offsetWidth = window.innerWidth*0.94;
        rightEdge = left + offsetWidth;
        clientWidth = offsetWidth - mWidth*2;
        updatePos(clientWidth/8, clientWidth/8*7);
        bgPreview.style.width = offsetWidth + 'px';
      }, false);
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
      dragHandler2 = onDrag2;
      colors = colorsState;
      // if(initScale && initScale[0] < 10){
      //   initScale[0] = 100;
      // }
      if(!initScale || !initScale[0] || !initScale[1]){
        updatePos((width-markersWidth*2)/7, (width-markersWidth*2)/7*6);
      }else{
        updatePos(...initScale);
      }
      if(isNight !== undefined) {
        if (dragObject) dragObject.style.borderColor = isNight ? '#56626d' : '#c0d1e1';
        if (bgPreview) {
          bgPreview.style.backgroundColor = isNight ? '#304259' : '#E2EEF9';
          bgPreview.style.opacity = '0.6';
        }
        if (bgElem) bgElem.style.backgroundColor = isNight ? colors.night1 : colors.day1;
      }
    },
    updateMode: function(night){
      if(dragObject) dragObject.style.borderColor = night ? '#56626d' : '#c0d1e1';
      if(bgPreview) bgPreview.style.backgroundColor = night ? '#304259' : '#E2EEF9';
      if(bgElem) bgElem.style.backgroundColor = night ? colors.night1 : colors.day1;
    }
  }
};
