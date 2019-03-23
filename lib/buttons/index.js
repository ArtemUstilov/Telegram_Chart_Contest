export const btnMaster = (function () {
  let buttons;
  let data;
  let parentElem;
  let callBacks;

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
      lines: data.lines.reduce((ac, line) => {
        if (btnsState[line.name])
          ac.push(line);
        return ac;
      }, [])
    })
  }

  function draw() {
    buttons.forEach(b => {
      let name = document.createElement('p');
      name.innerText = b.name;

      let circle = document.createElement("div");
      circle.className = 'btn-circle';
      circle.style.backgroundColor = b.color;
      circle.style.borderColor = b.color;

      let anim = document.createElement("div");
      anim.className = 'animate';

      let btn = document.createElement('button');
      btnsState[b.name] = true;

      function onclick(e) {
        btnsState[b.name] = !btnsState[b.name];

        e.preventDefault();
        anim.classList.remove('clicked');
        let c = document.createElement("div");
        c.className = 'animate';
        c.classList.add('clicked');
        btn.removeChild(anim);
        btn.appendChild(c);
        anim = c;
        if (!btnsState[b.name]) {
          circle.style.backgroundColor = 'white';
        } else {
          circle.style.backgroundColor = b.color;
        }
        let newData = updateLines();
        callBacks
          .forEach(cb=>cb(newData));
      }

      btn.className = 'check-btn';
      btn.onclick = onclick;
      btn.ontouchstart = onclick;
      btn.style.gridArea = `span 40 / span ${Math.ceil(b.name.length * 0.9 + 9)}`;
      btn.appendChild(circle);
      btn.appendChild(name);
      btn.appendChild(anim);
      parentElem.appendChild(btn);
    })
  }

  return ({
    drawButtons: (d, parent, ...cbs) => {
      buttons = format(d);
      initState();
      data = d;
      callBacks = cbs.filter(cb=>typeof cb === 'function');
      parentElem = parent;
      draw();
    }
  })
})();
