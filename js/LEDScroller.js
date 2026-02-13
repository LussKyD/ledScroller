(function(){
  const e = React.createElement;
  const { useState, useEffect, useCallback } = React;

  const APP_VERSION = 'v0.3.0';

  function getSearchParams(){
    var s = typeof location !== 'undefined' && location.search ? location.search.slice(1) : '';
    if (!s) return null;
    var o = {};
    s.split('&').forEach(function(p){
      var kv = p.split('=');
      if (kv.length >= 2) o[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1].replace(/\+/g, ' '));
    });
    return o;
  }

  function buildShareUrl(settings){
    var base = typeof location !== 'undefined' ? (location.origin + location.pathname) : '';
    var p = [];
    if (settings.text) p.push('message=' + encodeURIComponent(settings.text));
    if (settings.color) p.push('color=' + encodeURIComponent(settings.color.replace('#','')));
    if (settings.speed != null) p.push('speed=' + settings.speed);
    if (settings.blink) p.push('blink=1');
    if (settings.mode && settings.mode !== 'scroll') p.push('mode=' + settings.mode);
    return p.length ? base + '?' + p.join('&') : base;
  }

  function parseHex(val){
    if (!val || typeof val !== 'string') return null;
    var c = val.replace('#','').trim();
    if (/^[0-9A-Fa-f]{6}$/.test(c)) return '#' + c;
    if (/^[0-9A-Fa-f]{3}$/.test(c)) return '#' + c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    return null;
  }

  const COLOR_OPTIONS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'White', hex: '#FFFFFF' },
  ];

  const PRESET_MESSAGES = [
    { label: 'Welcome', text: 'WELCOME' },
    { label: "We're Open", text: "WE'RE OPEN" },
    { label: 'Back in 5', text: 'BACK IN 5 MIN' },
    { label: 'Sale', text: 'SALE' },
  ];

  // --- BEGIN NON-REACT UTILITY FUNCTIONS (For Button Contrast & Accessibility) ---

  // Converts RGB string to HEX (useful if browser returns RGB for color style)
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
  
  // Calculates white or black text color for maximum contrast
  function contrast(hex){
    if(!hex) return '#fff';
    var c = hex.replace('#','');
    var r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
    var brightness = (r*299 + g*587 + b*114) / 1000;
    return brightness > 180 ? '#000' : '#fff';
  }

  // Build CSS text-shadow value for LED glow (no dynamic style injection)
  function buildLedGlow(color){
    if (color === '#FFFFFF' || color === '#fff') return '0 0 2px #fff, 0 0 4px #fff, 0 0 6px #fff';
    return '0 0 6px ' + color + ', 0 0 10px ' + color + ', 0 0 12px ' + color + ', 0 0 16px ' + color + ', 0 0 20px ' + color;
  }

  // --- END NON-REACT UTILITY FUNCTIONS ---


  // --- BEGIN REACT APP ---

  function App(){
    const [storageAvailable, setStorageAvailable] = useState(true);
    const [darkMode, setDarkMode] = useState(function(){
      try {
        var stored = localStorage.getItem('led_theme');
        return stored === 'light' ? false : true;
      } catch(e) { return true; }
    });
    const [showSplash, setShowSplash] = useState(true);
    const [scrollerSettings, setScrollerSettings] = useState(function(){
      var url = getSearchParams();
      var defaults = {
        text: 'Hello World!',
        speed: 5,
        color: '#EF4444',
        blink: false,
        mode: 'scroll',
        showScroller: false
      };
      try {
        defaults.text = localStorage.getItem('led_message') || defaults.text;
        defaults.speed = Number(localStorage.getItem('led_speed')) || defaults.speed;
        defaults.color = localStorage.getItem('led_color') || defaults.color;
        defaults.blink = localStorage.getItem('led_blink') === 'true';
        defaults.mode = localStorage.getItem('led_mode') || 'scroll';
      } catch(e) {}
      if (url) {
        if (url.message != null) defaults.text = url.message;
        if (url.color != null) defaults.color = url.color.charAt(0) === '#' ? url.color : '#' + url.color;
        if (url.speed != null) defaults.speed = Math.min(10, Math.max(1, Number(url.speed) || 5));
        if (url.blink === '1' || url.blink === 'true') defaults.blink = true;
        if (url.mode === 'static') defaults.mode = 'static';
      }
      return defaults;
    });

    useEffect(function(){
      try {
        localStorage.setItem('_led_test', '');
        localStorage.removeItem('_led_test');
      } catch(e) { setStorageAvailable(false); }
    }, []);

    useEffect(function(){
      document.title = 'LED Scroller by DRACOiNC Techs ' + APP_VERSION;
    }, []);

    useEffect(function(){
      var t = setTimeout(function(){ setShowSplash(false); }, 1200);
      return function(){ clearTimeout(t); };
    }, []);

    useEffect(function(){
      if(darkMode){
        document.body.classList.remove('light');
        document.documentElement.classList.remove('light');
        if(storageAvailable) try { localStorage.setItem('led_theme','dark'); } catch(e){}
      } else {
        document.body.classList.add('light');
        document.documentElement.classList.add('light');
        if(storageAvailable) try { localStorage.setItem('led_theme','light'); } catch(e){}
      }
    }, [darkMode, storageAvailable]);

    var handleChange = useCallback(function(name, value){
      if(storageAvailable) {
        try {
          if(name === 'text') localStorage.setItem('led_message', value);
          if(name === 'speed') localStorage.setItem('led_speed', value);
          if(name === 'color') localStorage.setItem('led_color', value);
          if(name === 'blink') localStorage.setItem('led_blink', value ? 'true' : 'false');
          if(name === 'mode') localStorage.setItem('led_mode', value);
        } catch(e) { /* ignore */ }
      }
      setScrollerSettings(function(prev){
        var copy = Object.assign({}, prev);
        copy[name] = value;
        return copy;
      });
    }, [storageAvailable]);

    var handleShowScroller = useCallback(function(){
      // Reset scroll position on showing the scroller
      var track = document.querySelector('.scroll-track');
      if(track) track.scrollLeft = 0;
      
      setScrollerSettings(function(prev){
        return Object.assign({}, prev, { showScroller: true });
      });
    }, []);

    var handleHideScroller = useCallback(function(){
      setScrollerSettings(function(prev){
        return Object.assign({}, prev, { showScroller: false });
      });
    }, []);

    useEffect(function(){
      if (!scrollerSettings.showScroller) return;
      function onKey(e){ if (e.key === 'Escape') handleHideScroller(); }
      window.addEventListener('keydown', onKey);
      return function(){ window.removeEventListener('keydown', onKey); };
    }, [scrollerSettings.showScroller, handleHideScroller]);

    function LEDScrollerDisplay(){
      const { text, speed, color, blink, mode } = scrollerSettings;
      const isStatic = mode === 'static';
      const [isScrolling, setIsScrolling] = useState(false);
      useEffect(function(){
          if (isStatic) return;
          setIsScrolling(false);
          const delayTimer = setTimeout(function(){ setIsScrolling(true); }, 3000);
          return function(){ clearTimeout(delayTimer); };
      }, [text, speed, color, isStatic]);

      const durationSeconds = 25 - (speed * 2);
      const animationClass = isScrolling ? 'animate-scroller' : 'paused';
      const ledClass = blink ? animationClass + ' led-text led-blink' : animationClass + ' led-text';
      const containerStyle = { '--led-color': color, '--led-glow': buildLedGlow(color) };

      if (!text.trim()) {
        return e('div', { className: 'scroller-full' },
          e('h1', { style: { color: 'white' } }, 'No Message Input.'),
          e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
        );
      }

      if (isStatic) {
        return e('div', { className: 'scroller-full scroller-static' },
          e('div', { className: 'scroll-track-container scroll-track-container--static', style: containerStyle },
            e('div', { className: 'scroll-track scroll-track--static' },
              e('div', { className: 'led-text led-text--static' }, text.toUpperCase())
            )
          ),
          e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config (Esc)')
        );
      }

      return e('div', { className: 'scroller-full' },
        e('div', { className: 'scroll-track-container', style: containerStyle },
            e('div', { className: 'scroll-track' },
                e('div', { className: ledClass, style: { '--scroller-duration': durationSeconds + 's' } },
                    e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
                    e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
                    e('span', null, text.toUpperCase() )
                )
            )
        ),
        e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config (Esc)')
      );
    }

    function InputScreen(){
        const currentColor = scrollerSettings.color;
        const cardStyle = { '--range-thumb-color': currentColor, '--range-track-color': currentColor + '33' };
        const showScrollerBtnStyle = { backgroundColor: currentColor, color: contrast(currentColor) };
        const [copyFeedback, setCopyFeedback] = useState(false);
        const [hexInput, setHexInput] = useState(currentColor.replace('#',''));

        function handleCopyLink(){
          var url = buildShareUrl(scrollerSettings);
          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function(){ setCopyFeedback(true); setTimeout(function(){ setCopyFeedback(false); }, 2000); }).catch(function(){});
          }
        }

        function handleHexBlur(){
          var hex = parseHex(hexInput);
          if (hex) handleChange('color', hex);
          else setHexInput(currentColor.replace('#',''));
        }

      return e('div', { className: 'app-center' },
        e('div', { className: 'top-right' },
          e('button', {
            onClick: function(){ setDarkMode(!darkMode); },
            className: 'button-primary theme-toggle',
            'aria-pressed': !darkMode,
            title: 'Toggle theme'
          }, darkMode ? '☀️ Light' : '🌙 Dark')
        ),
        e('div', { className: 'card', style: cardStyle },
          e('div', { className: 'header' },
            e('h1', { style: { fontSize: '24px', fontWeight: '900', color: 'var(--accent)' } }, 'LED Scroller Config')
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'marqueeText' }, 'Marquee Message:'),
            e('textarea', {
              id: 'marqueeText',
              value: scrollerSettings.text,
              onChange: function(ev){ handleChange('text', ev.target.value); },
              placeholder: 'Enter your message here...'
            })
          ),
          e('div', { className: 'form-row form-row--presets' },
            e('span', { className: 'presets-label' }, 'Quick:'),
            PRESET_MESSAGES.map(function(p){
              return e('button', {
                key: p.label,
                type: 'button',
                className: 'preset-btn',
                onClick: function(){ handleChange('text', p.text); }
              }, p.label);
            })
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'colorGroup' }, 'LED Color:'),
            e('div', { id: 'colorGroup', className: 'color-pick', role: 'group' },
              COLOR_OPTIONS.map(function(opt){
                return e('button', {
                  key: opt.hex,
                  type: 'button',
                  className: 'color-btn' + (scrollerSettings.color === opt.hex ? ' selected' : ''),
                  style: { backgroundColor: opt.hex },
                  title: opt.name,
                  'data-led-color': opt.hex,
                  onClick: function(){ handleChange('color', opt.hex); setHexInput(opt.hex.replace('#','')); }
                });
              })
            ),
            e('div', { className: 'hex-row' },
              e('label', { htmlFor: 'hexInput' }, 'Or hex:'),
              e('input', {
                id: 'hexInput',
                type: 'text',
                className: 'hex-input',
                value: hexInput,
                onChange: function(ev){ setHexInput(ev.target.value); },
                onBlur: handleHexBlur,
                onKeyDown: function(ev){ if (ev.key === 'Enter') handleHexBlur(); },
                placeholder: 'EF4444',
                maxLength: 7
              })
            )
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'modeGroup' }, 'Display:'),
            e('div', { id: 'modeGroup', className: 'mode-toggle', role: 'group' },
              e('button', {
                type: 'button',
                className: 'mode-btn' + (scrollerSettings.mode === 'scroll' ? ' selected' : ''),
                onClick: function(){ handleChange('mode', 'scroll'); }
              }, 'Scroll'),
              e('button', {
                type: 'button',
                className: 'mode-btn' + (scrollerSettings.mode === 'static' ? ' selected' : ''),
                onClick: function(){ handleChange('mode', 'static'); }
              }, 'Static')
            )
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'blinkCheck', style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } },
              e('input', {
                id: 'blinkCheck',
                type: 'checkbox',
                checked: !!scrollerSettings.blink,
                onChange: function(ev){ handleChange('blink', ev.target.checked); }
              }),
              'Blink effect'
            )
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'speedRange' }, 'Scroll Speed: ' + scrollerSettings.speed),
            e('input', {
              id: 'speedRange',
              type: 'range',
              min: 1, max: 10,
              value: scrollerSettings.speed,
              onInput: function(ev){ handleChange('speed', Number(ev.target.value)); },
              className: 'range'
            })
          ),
          e('div', { className: 'form-row form-row--actions' },
            e('button', { type: 'button', onClick: handleCopyLink, className: 'button-secondary' }, copyFeedback ? 'Copied!' : 'Copy link'),
            e('button', { onClick: handleShowScroller, className: 'button-primary show-scroller-btn', style: showScrollerBtnStyle }, 'Show Scroller')
          )
        )
      );
    }

    return e(React.Fragment, null,
      showSplash ? e('div', {
        id: 'splash',
        onClick: function(){ setShowSplash(false); },
        onTouchStart: function(){ setShowSplash(false); },
        role: 'button',
        'aria-label': 'Dismiss splash'
      }, e('h1', null, 'LED Scroller by DRACOiNC Techs')) : null,
      !storageAvailable ? e('div', { className: 'storage-notice' }, 'Preferences won\'t be saved (private browsing?)') : null,
      scrollerSettings.showScroller ? e(LEDScrollerDisplay) : e(InputScreen),
      e('footer', { className: 'app-footer' }, 'LED Scroller by DRACOiNC Techs ' + APP_VERSION)
    );
  }

  // --- END REACT APP ---

  var rootEl = document.getElementById('root');
  ReactDOM.createRoot(rootEl).render(React.createElement(App));
})();
