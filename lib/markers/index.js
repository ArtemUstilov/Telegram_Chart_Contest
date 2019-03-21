export const dragMaster = (function () {
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

  function getMouseOffset(target, pgX, pgY) {
    const docPos = { x: target.offsetLeft, y: target.offsetTop };
    return { x: pgX - docPos.x, y: pgY - docPos.y }
  }

  function mouseUp() {
    dragObject = null;
    dragCirc.style.width = '0';
    dragCirc.style.height = '0';
    dragCirc.style.transform = 'translateY(35px) translateX(35px)';
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
  const dragCircleMoveUpd = (d) => dragCirc.style.left = (d + dragObject.offsetWidth / 2 - circleSize / 2) + 'px';

  function stretchRight(e) {
    let { pageX } = getProps(e, 'pageX');
    let width = pageX - dragObject.offsetLeft - leftEdge;
    if (dragObject.offsetLeft + width > clientWidth) {
      width = clientWidth - dragObject.offsetLeft;
    }
    width = width < 0 ? 0 : width;
    updatePos(width);
    dragCircleRightUpd(width);
  }

  function updatePos(width, left) {
    if (left !== undefined) {
      min = left / clientWidth;
      dragObject.style.left = left + 'px';
      if (bgElem) {
         bgElem.style.left = left + mWidth + 'px';
      }
    }
    if (width !== undefined) {
      normalizedWidth = width / clientWidth;
      dragObject.style.width = width + 'px';
      if (bgElem) {
        bgElem.style.width = width+ mWidth + 'px';
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
    let width = dragObject.offsetLeft + dragObject.clientWidth - left;
    if (width < 1) {
      width = 0;
      left = dragObject.offsetLeft + dragObject.offsetWidth - mWidth * 2;
    }
    updatePos(width, left);
    dragCircleLeftUpd(left);
  }

  function mouseMove(e) {
    console.time('mousemove');
    let { pageX } = getProps(e, 'pageX');

    let d = pageX - mouseOffset.x;
    let r = offsetWidth - dragObject.offsetWidth;
    d = d < 0 ? 0 : d;
    d = d > r ? r : d;
    updatePos(undefined, d);
    dragCircleMoveUpd(d);
    console.timeEnd('mousemove');
    console.timeStamp('mousemove');
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

  function mouseDown(e) {
    console.time('mousedown');
    let { pageX, pageY } = getProps(e, 'pageX', 'pageY');
    dragObject = this.childNodes[6];
    // console.log(dragObject)
    dragCirc.style.width = '70px';
    dragCirc.style.height = '70px';
    dragCirc.style.transform = 'translateY(0) translateX(0)';
    mouseOffset = getMouseOffset(dragObject, pageX, pageY);
    dragObjWidth = dragObject.clientWidth;
    const x = pageX - this.getBoundingClientRect().left;
    // console.log(x)

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
    document.ondragstart = function () {
    };
    document.body.onselectstart = function () {
    };

    console.timeEnd('mousedown');
    console.timeStamp('mousedown');
  }

  return {
    makeDraggable: function (element, left, width, markersWidth, bgEl, dragCircle, size, onDrag) {
      element.parentNode.onmousedown = mouseDown;
      element.parentNode.ontouchstart = mouseDown;
      leftEdge = left;
      rightEdge = left + width;
      mWidth = markersWidth;
      offsetWidth = width;
      bgElem = bgEl
      clientWidth = offsetWidth - mWidth * 2;
      dragCirc = dragCircle;
      circleSize = size;
      dragHandler = onDrag;
    }
  }
})();
