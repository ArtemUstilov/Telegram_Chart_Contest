import {createSVGElement, getProps} from "../util";

export const btnMaster = function () {
  let buttons;
  let btnElems = [];
  let data, setA;
  let parentElem;
  let startT, endT;
  let callBacks;
  let NightMode = false;
  let state;
  let disable;
  let recieved;
  function format(data) {
    return data.lines.map(line => ({ color: line.color, name: line.name }));
  }

  let btnsState = {};

  function initState() {
    if(!Object.values(btnsState).length){
      buttons.forEach(l => {
        btnsState[l.name] = true;
      })
    }

  }

  function updateLines() {
    return ({
      ...data,
      lines: data.lines.filter(line => btnsState[line.name]),
    })
  }

  function draw() {
    buttons = buttons.map(b => {
      let name = document.createElement('p');
      name.innerText = b.name;

      let circleWrapper = createSVGElement("svg");
      circleWrapper.setAttribute('width', 13);
      circleWrapper.setAttribute('height', 13);
      circleWrapper.setAttribute('fill', '#fff');

      circleWrapper.setAttribute('viewBox', '0 0 26 26');
    // circleWrapper.setAttribute('enable-background',"new 0 0 26 26");
    let pathH = createSVGElement('path');
      pathH.setAttribute('d','m.3,14c-0.2-0.2-0.3-0.5-0.3-0.7s0.1-0.5 0.3-0.7l1.4-1.4c0.4-0.4 1-0.4 1.4,0l.1,.1 5.5,5.9c0.2,0.2 0.5,0.2 0.7,0l13.4-13.9h0.1v-8.88178e-16c0.4-0.4 1-0.4 1.4,0l1.4,1.4c0.4,0.4 0.4,1 0,1.4l0,0-16,16.6c-0.2,0.2-0.4,0.3-0.7,0.3-0.3,0-0.5-0.1-0.7-0.3l-7.8-8.4-.2-.3z');
    circleWrapper.classList.add('btn-circle-wrapper');
      circleWrapper.appendChild(pathH);

      let btn = document.createElement('button');
      btnElems.push(btn);
      let color = NightMode ? (state[b.color] || b.color) : b.color;
      if (!btnsState[b.name]) {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = color;
        circleWrapper.style.visibility = 'hidden';
      } else {
          btn.style.backgroundColor = color;
          btn.style.color = '#fff';
          circleWrapper.style.visibility = 'visible';
        }
      function lastChart(){
        return btnsState[b.name] && buttons.filter(b => btnsState[b.opt.name]).length < 2;
      }
      function onclick(e) {
        e.preventDefault();
        if(lastChart()){
          // setTimeout(() => btn.classList.add('disable-btn'), 10);
          return;
        }
        let [pageX, pageY] = getProps(e, 'pageX', 'pageY');
        tap(pageY, pageX);
        btn.style.opacity = '1';
        btnsState[b.name] = !btnsState[b.name];
        let color = NightMode ? (state[b.color] || b.color) :b.color;
        if (!btnsState[b.name]) {
          btn.style.backgroundColor = 'transparent';
          btn.style.color = color;
          circleWrapper.style.visibility = 'hidden';
        } else {
          btn.style.backgroundColor = color;
          btn.style.color = '#fff';
          circleWrapper.style.visibility = 'visible';
        }
        let newData = updateLines();
        setA && setA(btnsState);
        if(buttons.filter(b => btnsState[b.opt.name]).length < 2){
          let bb = buttons.find(b => btnsState[b.opt.name]);
          bb.element.style.opacity = '0.7';
          bb.element.style.cursor = 'default';
        }else{
          buttons.forEach(bb => {
            bb.element.style.opacity = '1';
            bb.element.style.cursor = 'pointer';
          })
        }
        callBacks
          .forEach(cb=>cb(newData));
      }
      let timer;
      function asyncDisableAll(e){
        e.preventDefault();
        timer = setTimeout(()=>{
          buttons.filter(t => t.opt.name !== b.name).forEach(t => {
            btnsState[t.opt.name] = false;
            t.element.style.backgroundColor = 'transparent';
            let color = NightMode ? (state[t.opt.color] || t.opt.color) : t.opt.color;
            t.element.style.color = color;
            t.crc.style.visibility = 'hidden';
          });
          btn.style.opacity = '0.7';
          btn.style.cursor = 'default';
          let color = NightMode ? (state[b.color] || b.color) :b.color;
          btn.style.backgroundColor = color;
          btn.style.color = '#fff';
          circleWrapper.style.visibility = 'visible';
          btnsState[b.name] = true;
          let newData = updateLines();
          callBacks
            .forEach(cb=>cb(newData));
        }, 1000);
      }
      function approveDisabling(e){
        e.preventDefault();
        clearTimeout(timer);
      }
      btn.className = 'check-btn';
      btn.onclick = onclick;
      btn.onmousedown = asyncDisableAll;
      btn.onmouseup = approveDisabling;
      btn.ontouchstart = asyncDisableAll;
      btn.ontouchend = (e) =>{
        approveDisabling(e);
        onclick(e);
      };
      btn.style.borderColor = b.color;
      btn.style.backgroundColor = b.color;
      btn.style.color = '#fff';
      btn.appendChild(circleWrapper);
      btn.appendChild(name);
      if(!disable){
        let color = NightMode ? (state[b.color] || b.color) :b.color;
        if (!btnsState[b.name]) {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = color;
        circleWrapper.style.visibility = 'hidden';
      } else {
        btn.style.backgroundColor = color;
        btn.style.color = '#fff';
        circleWrapper.style.visibility = 'visible';
      }
      }
      parentElem.appendChild(btn);
      return {element: btn, opt: b, crc: circleWrapper};
    });
    if(!disable) {
      let newData = updateLines();
      setA && setA(btnsState);
      callBacks
        .forEach(cb => cb(newData));
    }
  }
  function tap(t, l) {
    let effect = document.createElement('div');
    effect.className = 'effect';
    let zoomColor = '#108BE3';
    if (NightMode)
      zoomColor = '#48AAF0';
    effect.style.borderColor = zoomColor;
    effect.style.left = l + 'px';
    effect.style.top = t + 'px';
    document.body.appendChild(effect);
    setTimeout(() => document.body.removeChild(effect), 500);
  }
  return ({
    drawButtons: (disableInit, d, parent, colorsState, suffixId, setActive, initStateBtn, initMode, startTap, endTap, ...cbs) => {
      disable = disableInit;
      buttons = format(d);
      btnsState = initStateBtn || [];
      setA = setActive;
      startT = startTap;
      endT = endTap;
      recieved = initStateBtn;
      initState();
      state = {...colorsState, '#4BD964': '#5ab34d', '#FE3C30': '#cf5d57', '#108BE3': '#4681bb'};
      data = d;
      callBacks = cbs.filter(cb=>typeof cb === 'function');
      parentElem = parent;
      NightMode = !!initMode;
      draw();
    },
    getState(){
      return btnsState;
},
    updateMode: function(isNight){
      NightMode = !!isNight;
      if(buttons) buttons.forEach(b=>{
        let color = NightMode ? (state[b.opt.color] || b.opt.color) : b.opt.color;
        b.element.style.borderColor = color;

        if(b.element.style.backgroundColor !== 'transparent'){
          b.element.style.backgroundColor = color;
        }else{
          b.element.style.color = color;
        }
      })
      // bgPreview.style.backgroundColor = isNight ? colors.night2 : colors.day2;
      // bgElem.style.backgroundColor = isNight ? colors.night1 : colors.day1;
    }
  })
};
function getCenter(elem) {
  const box = elem.getBoundingClientRect();
  const body = document.body;
  const docEl = document.documentElement;
  const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
  const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;
  const clientTop = docEl.clientTop || body.clientTop || 0;
  const clientLeft = docEl.clientLeft || body.clientLeft || 0;
  const top = box.top + scrollTop - clientTop;
  const left = box.left + scrollLeft - clientLeft;
  return {
    top: top + elem.clientHeight/3,
    left: left + elem.clientWidth/3
  };
}
