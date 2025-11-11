(function(){
  const e = React.createElement;
  const { useState, useEffect, useCallback } = React;

  const COLOR_OPTIONS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'White', hex: '#FFFFFF' },
  ];

  function App(){
    // FIX: Initialize state with localStorage values or defaults
    const [darkMode, setDarkMode] = useState(function(){
      try {
        var stored = localStorage.getItem('led_theme');
        // Default to dark mode if nothing is set or stored value is invalid
        return stored === 'light' ? false : true; 
      } catch(e) { return true; }
    });
    const [showSplash, setShowSplash] = useState(true);
    const [scrollerSettings, setScrollerSettings] = useState(function(){
      try {
        return {
          // Persistence added here
          text: localStorage.getItem('led_message') || 'Hello World!', 
          speed: Number(localStorage.getItem('led_speed')) || 5,      
          color: localStorage.getItem('led_color') || '#EF4444',      
          showScroller: false
        };
      } catch(e) {
        return { text: 'Hello World!', speed: 5, color: '#EF4444', showScroller: false };
      }
    });

    // Theme initialization (handles the splash screen fade)
    useEffect(function(){
      var t = setTimeout(function(){ setShowSplash(false); }, 1200);
      return function(){ clearTimeout(t); };
    }, []);

    // FIX: Centralized theme sync logic
    useEffect(function(){
      try {
        if(darkMode){ 
          document.body.classList.remove('light'); 
          document.documentElement.classList.remove('light');
          localStorage.setItem('led_theme','dark'); 
        } else { 
          document.body.classList.add('light'); 
          document.documentElement.classList.add('light');
          localStorage.setItem('led_theme','light'); 
        }
      } catch(e){ /* ignore */ }
    }, [darkMode]);

    // FIX: Centralized persistence logic for all settings
    var handleChange = useCallback(function(name, value){
      try {
        if(name === 'text') localStorage.setItem('led_message', value);
        if(name === 'speed') localStorage.setItem('led_speed', value);
        if(name === 'color') localStorage.setItem('led_color', value);
      } catch(e) { /* ignore */ }

      setScrollerSettings(function(prev){
        var copy = Object.assign({}, prev);
        copy[name] = value;
        return copy;
      });
    }, []);

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
      const { text, speed, color } = scrollerSettings;

      // Calculate duration: 25s for speed=1, 5s for speed=10.
      const durationSeconds = 25 - (speed * 2);

      // Dynamically generated style tag for LED glow
      const styleTag = e('style', { dangerouslySetInnerHTML: {
        __html: `
          .led-text { 
            color: ${color}; 
            /* Text shadow scaled down for white to prevent excessive blurring */
            text-shadow: 
              ${color === '#FFFFFF' ? '0 0 2px, 0 0 4px, 0 0 6px' : '0 0 6px, 0 0 10px, 0 0 12px, 0 0 16px, 0 0 20px'};
          }
        `
      }});

      if (!text.trim()) {
        return e('div', { className: 'scroller-full' }, 
          e('h1', { style: { color: 'white' } }, 'No Message Input.'),
          e('button', { onClick: handleHideScroller, className: 'button-primary', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
        );
      }
      
      // Render the scroller
      return e('div', { className: 'scroller-full' },
        styleTag,
        e('div', { className: 'scroll-track' },
          e('div', { className: 'animate-scroller led-text', style: { '--scroller-duration': durationSeconds + 's' } },
            // Text is repeated three times to ensure continuous scrolling
            e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
            e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
            e('span', null, text.toUpperCase() )
          )
        ),
        // Exit config button
        e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
      );
    }

    function InputScreen(){
      return e('div', { className: 'app-center' },
        e('div', { className: 'top-right' },
          e('button', { 
            onClick: function(){ setDarkMode(!darkMode); }, 
            className: 'button-primary theme-toggle',
            'aria-pressed': !darkMode, 
            title: 'Toggle theme' 
          }, darkMode ? '☀️ Light' : '🌙 Dark')
        ),
        e('div', { className: 'card' },
          e('div', { className: 'header' }, 
            e('h1', { style: { fontSize: '24px', fontWeight: '900', color: 'var(--accent)' } }, 'LED Scroller Config')
          ),
          
          // Marquee Message Input
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'marqueeText' }, 'Marquee Message:'),
            e('textarea', { 
              id: 'marqueeText', 
              value: scrollerSettings.text, 
              onChange: function(e){ handleChange('text', e.target.value); }, 
              placeholder: 'Enter your message here...' 
            })
          ),

          // LED Color Selection
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

          // Scroll Speed Range
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'speedRange' }, 'Scroll Speed: ' + scrollerSettings.speed),
            e('input', { 
              id: 'speedRange', 
              type: 'range', 
              min: 1, max: 10, 
              value: scrollerSettings.speed, 
              onInput: function(e){ handleChange('speed', Number(e.target.value)); }, 
              className: 'range' 
            })
          ),

          // Show Scroller Button
          e('div', null,
            e('button', { onClick: handleShowScroller, className: 'button-primary show-scroller-btn' }, 'Show Scroller')
          )
        )
      );
    }

    return e(React.Fragment, null, 
      showSplash ? e('div', { id: 'splash' }, e('h1', null, 'LED Scroller by DRACOiNC Techs')) : null, 
      scrollerSettings.showScroller ? e(LEDScrollerDisplay) : e(InputScreen)
    );
  }

  var rootEl = document.getElementById('root');
  ReactDOM.createRoot(rootEl).render(React.createElement(App));
})();
