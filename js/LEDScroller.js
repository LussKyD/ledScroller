(function(){
  const e = React.createElement;
  const { useState, useEffect, useCallback } = React;

  const APP_VERSION = 'v0.2.8';

  const COLOR_OPTIONS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'White', hex: '#FFFFFF' },
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
      try {
        return {
          text: localStorage.getItem('led_message') || 'Hello World!',
          speed: Number(localStorage.getItem('led_speed')) || 5,
          color: localStorage.getItem('led_color') || '#EF4444',
          blink: localStorage.getItem('led_blink') === 'true',
          showScroller: false
        };
      } catch(e) {
        return { text: 'Hello World!', speed: 5, color: '#EF4444', blink: false, showScroller: false };
      }
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

    function LEDScrollerDisplay(){
      const { text, speed, color, blink } = scrollerSettings;
      const [isScrolling, setIsScrolling] = useState(false);
      useEffect(function(){
          setIsScrolling(false);
          const delayTimer = setTimeout(function(){ setIsScrolling(true); }, 3000);
          return function(){ clearTimeout(delayTimer); };
      }, [text, speed, color]);

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

      return e('div', { className: 'scroller-full' },
        e('div', { className: 'scroll-track-container', style: containerStyle },
            e('div', { className: 'scroll-track' },
                e('div', { className: ledClass, style: { '--scroller-duration': durationSeconds + 's' } }, /* duration on animated element */
                    e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
                    e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
                    e('span', null, text.toUpperCase() )
                )
            )
        ),
        e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
      );
    }

    function InputScreen(){
        const currentColor = scrollerSettings.color;
        const cardStyle = { '--range-thumb-color': currentColor, '--range-track-color': currentColor + '33' };
        const showScrollerBtnStyle = { backgroundColor: currentColor, color: contrast(currentColor) };

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
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'colorGroup' }, 'LED Color:'),
            e('div', { id: 'colorGroup', className: 'color-pick', role: 'group' },
              COLOR_OPTIONS.map(function(opt){
                return e('button', {
                  key: opt.hex,
                  className: 'color-btn' + (scrollerSettings.color === opt.hex ? ' selected' : ''),
                  style: { backgroundColor: opt.hex },
                  title: opt.name,
                  'data-led-color': opt.hex,
                  onClick: function(){ handleChange('color', opt.hex); }
                });
              })
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
          e('div', null,
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
