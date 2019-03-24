export const btnMaster = (function () {
  let buttons;
  let btnElems = [];
  let data;
  let parentElem;
  let callBacks;
  let state;
  function format(data) {
    return data.lines.map(line => ({ color: line.color, name: line.name }));
  }

  let btnsState = {};

  function initState() {
    buttons.forEach(l => {
      btnsState[l.name] = true;
    })
  }

  function updateLines() {
    return ({
      ...data,
      lines: data.lines.filter(line => btnsState[line.name]),
    })
  }

  function draw() {
    buttons.forEach(b => {
      let name = document.createElement('p');
      name.innerText = b.name;

      let circleWrapper = document.createElement("div");
      let circle = document.createElement("div");
      circle.className = 'btn-circle';
      circle.style.borderColor = b.color;

      circleWrapper.className = 'btn-circle-wrapper';
      let anim = document.createElement("div");
      anim.className = 'animate';
      let btn = document.createElement('button');
      btnsState[b.name] = true;
      btnElems.push(btn);
      function onclick(e) {
        e.preventDefault();
        btnsState[b.name] = !btnsState[b.name];
        anim.classList.add('clicked');
        if (!btnsState[b.name]) {
          circle.style.height = '24px';
          circle.style.width = '24px';
          circle.style.borderWidth = '1px';
        } else {
          circle.style.height = '0';
          circle.style.width = '0';
          circle.style.borderWidth = '13px';
        }
        let newData = updateLines();
        callBacks
          .forEach(cb=>cb(newData));
        setTimeout(()=>anim.classList.remove('clicked'), 700);
      }

      btn.className = 'check-btn';
      btn.onclick = onclick;
      btn.ontouchstart = onclick;
      btn.style.gridArea = `span 40 / span ${Math.ceil(b.name.length * 1.1 + 11)}`;
      btn.style.backgroundColor =
      circleWrapper.appendChild(circle);
      btn.appendChild(circleWrapper);
      btn.appendChild(name);
      btn.appendChild(anim);
      parentElem.appendChild(btn);
    })
  }

  return ({
    drawButtons: (d, parent, colorsState, suffixId, ...cbs) => {
      buttons = format(d);
      initState();
      state = colorsState;
      data = d;
      callBacks = cbs.filter(cb=>typeof cb === 'function');
      parentElem = parent;
      draw();
    },
    updateMode: function(isNight){
      const borderColor = isNight ? '#344658' : '#e6ecf0';
      btnElems.forEach(b=>{
        b.style.borderColor = borderColor;
      })
      // bgPreview.style.backgroundColor = isNight ? colors.night2 : colors.day2;
      // bgElem.style.backgroundColor = isNight ? colors.night1 : colors.day1;
    }
  })
})();
