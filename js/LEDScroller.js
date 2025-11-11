// Wrap the core React logic in a self-executing function for stability and scope isolation
(function() {
  const e = React.createElement;
  // IMPORTANT: Destructure React.memo here for optimization
  const { useState, useEffect, useCallback, memo } = React; 

  // Define the available scrolling colors and their hex codes
  const COLOR_OPTIONS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'White', hex: '#FFFFFF' },
  ];

  // Helper function to calculate contrast color for buttons
  function contrast(hex){
      if(!hex) return '#fff';
      var c = hex.replace('#','');
      var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,6),16);
      var brightness = (r*299 + g*587 + b*114) / 1000;
      return brightness > 150 ? '#000' : '#fff';
  }

  // --- LED Scroller Display Component (MEMOIZED) ---
  // This component is now wrapped in memo() to prevent re-renders unless
  // text, speed, color, or blinkEnabled props change.
  const LEDScrollerDisplay = memo(function LEDScrollerDisplay({ text, speed, color, blinkEnabled, onHideScroller }){
    
    // Map speed (1-10) to duration (27s-7s). 
    var durationSeconds = 27 - (speed * 2); 
    
    // Conditional CSS Class for Blink
    var scrollerClasses = 'animate-scroller led-text py-4 px-2';
    if(blinkEnabled) { scrollerClasses += ' animate-blink'; }

    // Dynamic style tag generation to update keyframes/colors
    var styleTag = e('style', null, "\n        /* Keyframes for infinite loop scroll */\n        @keyframes infinite-scroll { from { transform: translateX(100%);} to { transform: translateX(-100%);} }\n        \n        /* Apply animation properties */\n        .animate-scroller { animation: infinite-scroll " + durationSeconds + "s linear infinite; white-space:nowrap; }\n        \n        /* Dot-Matrix Simulation CSS - Enhanced for dot appearance */\n        .led-text { \n          color: " + color + "; \n          font-family: 'Press Start 2P', monospace; \n          text-shadow: 0 0 4px " + color + ", 0 0 8px " + color + ", 0 0 16px rgba(0,0,0,0.5); \n          font-weight: 400; \n          font-size: 9vw; \n          letter-spacing: 0.12em; \n        }\n        \n        /* Media query to ensure visibility on small screens */\n        @media (max-width:600px){.led-text{font-size:14vw;letter-spacing:0.08em}}\n      ");

    return e('div', { className: 'scroller-full' },
      styleTag,
      e('div', { className: 'scroll-track' },
        e('div', { className: scrollerClasses },
          // Text is duplicated (three times) to ensure seamless infinite loop visual
          e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
          e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
          e('span', null, text.toUpperCase() )
        )
      ),
      // Exit Button positioned at the bottom center
      e('button', { 
        onClick: onHideScroller, // Use passed prop handler
        className: 'button-primary exit-btn', 
        style: { 
          marginTop: '18px', 
          width: 'auto', 
          padding: '10px 18px', 
          background: color, 
          color: contrast(color), 
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10 
        } 
      }, 'Exit Config')
    );
  }, 
  // Custom comparison function for memo: only re-render if key props change
  (prevProps, nextProps) => {
    return (
      prevProps.text === nextProps.text &&
      prevProps.speed === nextProps.speed &&
      prevProps.color === nextProps.color &&
      prevProps.blinkEnabled === nextProps.blinkEnabled
    );
  });


  /**
   * The main component that manages the app state and switches between
   * the Input Screen and the Scroller Display.
   */
  function App(){
    const [darkMode, setDarkMode] = useState(true);
    const [showSplash, setShowSplash] = useState(true);
    const [errorMessage, setErrorMessage] = useState(''); 
    
    // Initialize state with values from localStorage, falling back to defaults
    const [scrollerSettings, setScrollerSettings] = useState(function(){
      try {
        var storedBlink = localStorage.getItem('led_blink') === '1';

        return {
          text: localStorage.getItem('led_message') || 'Hello World!',
          speed: Number(localStorage.getItem('led_speed')) || 5,
          color: localStorage.getItem('led_color') || '#EF4444',
          blinkEnabled: storedBlink, 
          showScroller: false
        };
      } catch(e) {
        return { text: 'Hello World!', speed: 5, color: '#EF4444', blinkEnabled: false, showScroller: false };
      }
    });

    // 1. Initial Theme Setup and Splash Screen
    useEffect(function(){
      try {
        var stored = localStorage.getItem('led_theme');
        var isDark = stored !== 'light';
        setDarkMode(isDark);
        if(!isDark) document.body.classList.add('light');
      } catch(e){ /* ignore storage errors */ }
      
      var t = setTimeout(function(){ setShowSplash(false); }, 1200);
      return function(){ clearTimeout(t); };
    }, []);

    // 2. Theme Persistence
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

    // 3. Persist Scroller Settings on change
    useEffect(function(){
      try {
        localStorage.setItem('led_message', scrollerSettings.text);
        localStorage.setItem('led_speed', scrollerSettings.speed);
        localStorage.setItem('led_blink', scrollerSettings.blinkEnabled ? '1' : '0');
        localStorage.setItem('led_color', scrollerSettings.color);
      } catch(e) { /* ignore */ }
    }, [scrollerSettings.text, scrollerSettings.speed, scrollerSettings.color, scrollerSettings.blinkEnabled]);


    var handleChange = useCallback(function(name, value){
      setScrollerSettings(function(prev){
        var copy = Object.assign({}, prev);
        copy[name] = value;
        if(name === 'text' && value.trim().length > 0) setErrorMessage('');
        return copy;
      });
    }, []);

    var handleToggleBlink = useCallback(function(){
        setScrollerSettings(function(prev){ return Object.assign({}, prev, { blinkEnabled: !prev.blinkEnabled }); });
    }, []);

    var handleShowScroller = useCallback(function(){
      if(scrollerSettings.text.trim().length > 0){
        setScrollerSettings(function(prev){ return Object.assign({}, prev, { showScroller: true }); });
      } else { 
        setErrorMessage('Please enter text for the scroller.');
      }
    }, [scrollerSettings.text]);

    var handleHideScroller = useCallback(function(){ 
      setScrollerSettings(function(prev){ return Object.assign({}, prev, { showScroller: false }); }); 
    }, []);

    // --- Input Configuration Screen Component ---
    function InputScreen(){
      return e('div', { className: 'app-center' },
        // Theme Toggle button (Top Right)
        e('div', { className: 'top-right' },
          e('button', { 
            onClick: function(){ setDarkMode(!darkMode); }, 
            className: 'button-primary theme-toggle', 
            'aria-pressed': !darkMode, 
            title: 'Toggle theme' ,
            style: { width: 'auto', padding: '10px 18px', background: darkMode ? '#1f2937' : '#e5e7eb', color: darkMode ? '#e6eef8' : '#111827' }
          }, darkMode ? '☀️ Light' : '🌙 Dark')
        ),
        
        e('div', { className: 'card' },
          e('div', { className: 'header' }, 
            e('h2', { style: { color: darkMode ? '#e6eef8' : '#0b1220' } }, 'LED Scroller Configuration')
          ),
          
          // 1. Text Input
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'marqueeText' }, 'Marquee Message'),
            e('textarea', { 
              id: 'marqueeText', 
              value: scrollerSettings.text, 
              onInput: function(ev){ handleChange('text', ev.target.value); }, 
              placeholder: 'Enter the text to scroll...' 
            })
          ),
          
          // 2. Error Message
          errorMessage && e('div', { 
            className: 'error-message', 
            style: { 
              padding: '12px', 
              borderRadius: '8px', 
              background: '#fee2e2', 
              color: '#991b1b', 
              marginBottom: '16px',
              fontWeight: 'bold'
            } 
          }, errorMessage),

          // 3. Color Selector
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'colorPickContainer' }, 'LED Color'), 
            e('div', { 
              id: 'colorPickContainer', 
              className: 'color-pick', 
              role: 'group', 
              'aria-label': 'LED color options' 
            },
              COLOR_OPTIONS.map(function(opt){
                return e('button', {
                  key: opt.hex,
                  className: 'color-btn',
                  title: opt.name,
                  onClick: function(){ handleChange('color', opt.hex); },
                  style: { 
                      background: opt.hex, 
                      boxShadow: scrollerSettings.color === opt.hex ? '0 0 10px '+opt.hex : '0 6px 12px rgba(2,6,23,0.6)', 
                      transform: scrollerSettings.color === opt.hex ? 'scale(1.15)' : 'scale(1)',
                      borderColor: scrollerSettings.color === opt.hex ? '#4f46e5' : 'rgba(255,255,255,0.06)'
                  }
                });
              })
            )
          ),

          // 4. Speed Slider
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'speedRange' }, 'Scroll Speed: ' + scrollerSettings.speed + ' (Scale 1-10)'),
            e('input', { 
              id: 'speedRange', 
              type: 'range', 
              min: 1, 
              max: 10, 
              value: scrollerSettings.speed, 
              onInput: function(e){ handleChange('speed', Number(e.target.value)); }, 
              className: 'range',
              style: { accentColor: scrollerSettings.color }
            }),
            e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' } }, 
              e('span', null, 'Slow (1)'),
              e('span', null, 'Fast (10)')
            )
          ),

          // 5. Blink Feature Toggle
          e('div', { className: 'form-row' },
              e('div', { className: 'toggle-switch-container' },
                  e('span', { className: 'toggle-label' }, 'Enable Blink/Flash Effect'),
                  e('div', { className: 'toggle-switch' },
                      e('input', { 
                          type: 'checkbox', 
                          id: 'blinkToggle', 
                          checked: scrollerSettings.blinkEnabled,
                          onChange: handleToggleBlink 
                      }),
                      e('label', { htmlFor: 'blinkToggle' })
                  )
              )
          ),


          // 6. Action Button
          e('div', null,
            e('button', { 
              onClick: handleShowScroller, 
              className: 'button-primary',
              style: { background: scrollerSettings.color, color: contrast(scrollerSettings.color) } 
            }, 'Show Scroller')
          )
        )
      );
    }

    // Main rendering logic to switch between views
    return e(React.Fragment, null, 
      // Splash screen logic
      showSplash ? e('div', { id: 'splash' }, e('h1', null, 'LED Scroller by DRACOiNC Techs')) : null, 
      
      // Switch between display and input screens
      scrollerSettings.showScroller 
        ? e(LEDScrollerDisplay, { // Pass props to the memoized component
            text: scrollerSettings.text,
            speed: scrollerSettings.speed,
            color: scrollerSettings.color,
            blinkEnabled: scrollerSettings.blinkEnabled,
            onHideScroller: handleHideScroller // Pass the function down
          }) 
        : e(InputScreen)
    );
  }

  var rootEl = document.getElementById('root');
  // Initialize the React Root
  if(rootEl && typeof ReactDOM.createRoot === 'function'){
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
  } else if (rootEl) {
      ReactDOM.render(React.createElement(App), rootEl);
  }

})(); // End of self-executing function
