// adaptive-theme-v025.js
// v0.2.5: persistent theme, LED color/message/speed persistence, fix label for/id mismatches,
// smart color logic: text color uses LED color, background uses theme (soft gray in light)

(function(){
  // contrast helper
  function contrast(hex){
    if(!hex) return '#fff';
    var c = hex.replace('#','');
    var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    var brightness = (r*299 + g*587 + b*114) / 1000;
    return brightness > 150 ? '#000' : '#fff';
  }

  // Ensure label 'for' matches id of control inside .form-row
  function fixLabelAssociations(){
    document.querySelectorAll('.form-row').forEach(function(row, idx){
      var label = row.querySelector('label');
      if(!label) return;
      // find an input/textarea/select inside the same form-row
      var control = row.querySelector('input, textarea, select, [role="group"]');
      if(control){
        // if control has no id, assign one
        if(!control.id){
          control.id = 'formctrl-' + (control.name || control.type || idx) + '-' + idx;
        }
        // set label htmlFor (for attribute) to control id
        label.htmlFor = control.id;
        // Also set proper DOM attribute for older browsers
        label.setAttribute('for', control.id);
      }
    });
  }

  // Apply theme visuals to form elements and scroller area
  function applyThemeVisuals(){
    var isLight = document.documentElement.classList.contains('light') || document.body.classList.contains('light');
    // soft gray bg for light mode
    if(isLight){
      document.body.style.background = '#f3f4f6';
    } else {
      document.body.style.background = '';
    }

    // labels and inputs
    var labelColor = isLight ? '#111827' : '#e6eef8';
    document.querySelectorAll('.form-row label').forEach(function(l){ l.style.color = labelColor; });
    document.querySelectorAll('.form-row textarea, .form-row input').forEach(function(i){
      i.style.background = isLight ? '#fff' : '#1f2937';
      i.style.color = isLight ? '#111827' : '#e6eef8';
      i.style.borderColor = isLight ? '#e5e7eb' : '#374151';
    });

    // scroller area
    document.querySelectorAll('.scroller-full').forEach(function(s){
      if(isLight){
        s.style.background = '#f7fafc'; // soft light gray
        s.style.color = '#0b1220';
      } else {
        s.style.background = '#000';
        s.style.color = '#fff';
      }
    });
  }

  // Apply LED color to text and button, but keep background theme-driven
  function applyLedColor(color){
    if(!color) return;
    // apply to scroller text
    document.querySelectorAll('.led-text, .led-preview, .display-screen .led-text').forEach(function(el){
      el.style.color = color;
      el.style.textShadow = '0 0 6px ' + color + ', 0 0 12px rgba(0,0,0,0.25)';
    });
    // apply to primary action button
    var btn = document.querySelector('.button-primary');
    if(btn){
      btn.style.backgroundColor = color;
      btn.style.color = contrast(color);
    }
    // apply exit button background if present
    document.querySelectorAll('.exit-btn').forEach(function(b){ b.style.backgroundColor = color; b.style.color = contrast(color); });
  }

  // Persistence: save on relevant interactions
  function attachPersistence(){
    document.addEventListener('input', function(e){
      if(e.target && e.target.id === 'marqueeText') localStorage.setItem('led_message', e.target.value);
      if(e.target && e.target.id === 'speedRange') localStorage.setItem('led_speed', e.target.value);
    }, true);

    document.addEventListener('click', function(e){
      var t = e.target;
      // color buttons may have data-led-color attribute or inline background style
      if(t && t.matches && (t.matches('[data-led-color]') || t.classList.contains('color-btn'))){
        var color = t.getAttribute('data-led-color') || t.style.backgroundColor || t.getAttribute('value') || t.getAttribute('data-color');
        // normalize rgb() to hex if needed (basic)
        if(color && color.indexOf('rgb') === 0){
          // parse rgb(r,g,b)
          var nums = color.replace(/rgba?\(|\)|\s/g,'').split(',');
          if(nums.length >= 3){
            var r = parseInt(nums[0]), g = parseInt(nums[1]), b = parseInt(nums[2]);
            color = "#" + ((1<<24) + (r<<16) + (g<<8) + b).toString(16).slice(1);
          }
        }
        if(color){
          localStorage.setItem('led_color', color);
          applyLedColor(color);
        }
        // mark selection class
        document.querySelectorAll('[data-led-color]').forEach(function(b){ b.classList.remove('selected'); });
        t.classList.add('selected');
      }
      // theme toggle
      if(t && (t.id === 'theme-toggle' || t.classList.contains('theme-toggle'))){
        setTimeout(function(){
          var isLight = document.documentElement.classList.contains('light') || document.body.classList.contains('light');
          localStorage.setItem('led_theme', isLight ? 'light' : 'dark');
          applyThemeVisuals();
        }, 120);
      }
    }, true);
  }

  // Restore preferences on load
  function restorePrefs(){
    try {
      var msg = localStorage.getItem('led_message');
      var color = localStorage.getItem('led_color');
      var speed = localStorage.getItem('led_speed');
      var theme = localStorage.getItem('led_theme');
      if(theme === 'light'){ document.documentElement.classList.add('light'); document.body.classList.add('light'); }
      else if(theme === 'dark'){ document.documentElement.classList.remove('light'); document.body.classList.remove('light'); }

      // set inputs if exist
      var txt = document.getElementById('marqueeText');
      if(txt && msg) txt.value = msg;
      var s = document.getElementById('speedRange');
      if(s && speed) s.value = speed;

      // mark color buttons and apply
      if(color){
        var found = document.querySelectorAll('[data-led-color]');
        found.forEach(function(b){
          if(b.getAttribute('data-led-color') === color) b.classList.add('selected');
        });
        applyLedColor(color);
      } else {
        // if no stored color, try to detect currently selected
        var cur = document.querySelector('[data-led-color].selected');
        if(cur){
          var c = cur.getAttribute('data-led-color');
          applyLedColor(c);
        }
      }
    } catch(e){}
    applyThemeVisuals();
  }

  // Initialize: fix labels, attach persistence, restore prefs, apply visuals
  document.addEventListener('DOMContentLoaded', function(){
    fixLabelAssociations();
    attachPersistence();
    restorePrefs();
    // observe mutations to keep adaptations when SPA updates DOM
    var obs = new MutationObserver(function(){ fixLabelAssociations(); applyThemeVisuals(); });
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    // periodic apply as safety
    setInterval(function(){ applyThemeVisuals(); }, 600);
  });

})();
