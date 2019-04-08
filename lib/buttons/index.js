export const btnMaster = function () {
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
          btn.style.backgroundColor = 'transparent';
          btn.style.color = b.color;
          circleWrapper.style.display = 'none';
        } else {
          btn.style.backgroundColor = b.color;
          btn.style.color = '#fff';
          circleWrapper.style.display = 'block';
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
      btn.style.borderColor = b.color;
      btn.style.backgroundColor = b.color;
      btn.style.color = '#fff';
      btn.style.width = `${b.name.length*7 + 50}px`;
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
      // const borderColor = isNight ? '#344658' : '#e6ecf0';
      // btnElems.forEach(b=>{
      //   b.style.borderColor = borderColor;
      // })
      // bgPreview.style.backgroundColor = isNight ? colors.night2 : colors.day2;
      // bgElem.style.backgroundColor = isNight ? colors.night1 : colors.day1;
    }
  })
};
