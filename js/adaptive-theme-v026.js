// adaptive-theme-v026.js
(function(){
  function toHexFromRgbString(rgb){
    if(!rgb) return null;
    try{
      if(rgb.indexOf('#')===0) return rgb;
      var nums = rgb.replace(/rgba?\(|\)|\s/g,'').split(',');
      if(nums.length<3) return null;
      var r = parseInt(nums[0]), g = parseInt(nums[1]), b = parseInt(nums[2]);
      return "#"+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
    }catch(e){ return null; }
  }
  function contrast(hex){
    if(!hex) return '#fff';
    var c = hex.replace('#','');
    var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    var brightness = (r*299 + g*587 + b*114) / 1000;
    return brightness > 150 ? '#000' : '#fff';
  }
  function fixLabelAssociations(){
    document.querySelectorAll('.form-row').forEach(function(row, idx){
      var label = row.querySelector('label');
      if(!label) return;
      var control = row.querySelector('input, textarea, select, [role="group"]');
      if(control){
        if(!control.id) control.id = 'formctrl-' + idx;
        try{ label.htmlFor = control.id; label.setAttribute('for', control.id); }catch(e){}
      }
    });
  }
  function applyThemeVisuals(){
    var isLight = document.documentElement.classList.contains('light') || document.body.classList.contains('light');
    if(isLight) document.body.style.background = '#f3f4f6'; else document.body.style.background = '';
    var labelColor = isLight ? '#111827' : '#e6eef8';
    document.querySelectorAll('.form-row label').forEach(function(l){ l.style.color = labelColor; });
    document.querySelectorAll('.form-row textarea, .form-row input').forEach(function(i){
      i.style.background = isLight ? '#fff' : '#1f2937';
      i.style.color = isLight ? '#111827' : '#e6eef8';
      i.style.borderColor = isLight ? '#e5e7eb' : '#374151';
    });
    document.querySelectorAll('.scroller-full').forEach(function(s){
      if(isLight){ s.style.background = '#f7fafc'; s.style.color = '#0b1220'; } else { s.style.background = '#000'; s.style.color = '#fff'; }
      var tint = s.querySelector('.__led_tint'); if(tint) tint.remove();
      var stored = localStorage.getItem('led_color');
      if(stored){
        var div = document.createElement('div');
        div.className = '__led_tint';
        div.style.position = 'absolute';
        div.style.inset = '0';
        div.style.pointerEvents = 'none';
        // use 25% alpha by appending 40 to hex if hex length==7
        var bg = stored;
        if(stored.length===7) bg = stored + '40';
        div.style.background = 'linear-gradient(180deg, ' + bg + ', ' + bg + ')';
        div.style.mixBlendMode = 'overlay';
        s.style.position = s.style.position || 'relative';
        s.appendChild(div);
      }
    });
  }
  function applyLedColor(color){
    if(!color) return;
    if(color.indexOf('rgb')===0) color = toHexFromRgbString(color);
    document.querySelectorAll('.led-text, .led-preview, .display-screen .led-text').forEach(function(el){
      el.style.color = color;
      el.style.textShadow = '0 0 6px ' + color + ', 0 0 12px rgba(0,0,0,0.25)';
    });
    var btn = document.querySelector('.button-primary');
    if(btn){ btn.style.backgroundColor = color; btn.style.color = contrast(color); }
    document.querySelectorAll('.exit-btn').forEach(function(b){ b.style.backgroundColor = color; b.style.color = contrast(color); });
  }
  function restorePrefs(){
    try{
      var theme = localStorage.getItem('led_theme');
      if(theme==='light'){ document.documentElement.classList.add('light'); document.body.classList.add('light'); }
      else if(theme==='dark'){ document.documentElement.classList.remove('light'); document.body.classList.remove('light'); }
      var msg = localStorage.getItem('led_message');
      var speed = localStorage.getItem('led_speed');
      var color = localStorage.getItem('led_color');
      var txt = document.getElementById('marqueeText');
      if(txt && msg) txt.value = msg;
      var s = document.getElementById('speedRange');
      if(s && speed) s.value = speed;
      if(color) applyLedColor(color);
    }catch(e){}
    applyThemeVisuals();
  }
  function attachPersistence(){
    document.addEventListener('input', function(e){
      if(e.target && e.target.id === 'marqueeText') localStorage.setItem('led_message', e.target.value);
      if(e.target && e.target.id === 'speedRange') localStorage.setItem('led_speed', e.target.value);
    }, true);
    document.addEventListener('click', function(e){
      var t = e.target;
      if(t && t.matches && (t.matches('[data-led-color]') || t.classList.contains('color-btn'))){
        var color = t.getAttribute('data-led-color') || t.getAttribute('value') || t.style.backgroundColor;
        if(color && color.indexOf('rgb')===0){ var nums = color.replace(/rgba?\(|\)|\s/g,'').split(','); color = "#" + ((1<<24) + (parseInt(nums[0])<<16) + (parseInt(nums[1])<<8) + parseInt(nums[2])).toString(16).slice(1); }
        if(color){ localStorage.setItem('led_color', color); applyLedColor(color); applyThemeVisuals(); }
        document.querySelectorAll('[data-led-color]').forEach(function(b){ b.classList.remove('selected'); });
        try{ t.classList.add('selected'); }catch(e){}
      }
      if(t && (t.id==='theme-toggle' || t.classList.contains('theme-toggle'))){
        setTimeout(function(){ var isLight = document.documentElement.classList.contains('light') || document.body.classList.contains('light'); localStorage.setItem('led_theme', isLight ? 'light' : 'dark'); applyThemeVisuals(); }, 120);
      }
    }, true);
  }
  document.addEventListener('DOMContentLoaded', function(){
    try{ fixLabelAssociations(); attachPersistence(); restorePrefs(); var obs = new MutationObserver(function(){ applyThemeVisuals(); }); obs.observe(document.body, { attributes: true }); setTimeout(applyThemeVisuals, 80); }catch(e){ console.error('adaptive-theme-v026 init error', e); }
  });
})();