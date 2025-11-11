// Wrap the core React logic in a self-executing function for stability and scope isolation
(function() {
  const e = React.createElement;
  // IMPORTANT: Destructure React.memo, useRef here for optimization
  const { useState, useEffect, useCallback, memo, useRef } = React; 

  // --- Constants ---
  const COLOR_OPTIONS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'White', hex: '#FFFFFF' },
  ];

  // --- Utility Functions ---

  // Helper function to calculate contrast color for buttons
  function contrast(hex){
      if(!hex) return '#fff';
      var c = hex.replace('#','');
      var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,6),16);
      var brightness = (r*299 + g*587 + b*114) / 1000;
      return brightness > 150 ? '#000' : '#fff';
  }

  // Helper to calculate optimal font size (vw) based on text length
  function calculateFontSize(text) {
      if (!text) return '9vw';
      const baseSize = 14; // Max vw size for short text on desktop
      const minSize = 6;  // Minimum vw size
      // Linear reduction based on length, clamped to reasonable limits
      const fontSize = Math.max(minSize, baseSize - (text.length * 0.45));
      return fontSize + 'vw';
  }

  // --- LED Scroller Display Component (MEMOIZED) ---
  const LEDScrollerDisplay = memo(function LEDScrollerDisplay({ text, speed, color, blinkEnabled, onHideScroller }){
    const scrollerRef = useRef(null);
    const scrollerText = text || 'DRACOiNC';

    // Map speed (1-10) to duration (slowest 20s to fastest 5s)
    // Formula: duration = 20s - (speed * 1.5)
    // Dynamic adjustment to make it feel responsive to the speed slider.
    const durationSeconds = (20 - (speed * 1.5)).toFixed(2) + 's'; 
    const fontSize = calculateFontSize(scrollerText);

    // CRITICAL: Use useEffect to set the CSS variables and properties
    useEffect(() => {
        const scrollerElement = scrollerRef.current;
        if (scrollerElement) {
            // 1. Set the CSS variable for animation duration
            scrollerElement.style.setProperty('--scroll-duration', durationSeconds);
            
            // 2. Set the dynamic styles (color, glow, font size)
            scrollerElement.style.color = color;
            scrollerElement.style.fontSize = fontSize;
            scrollerElement.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;

            // Optional: Restart animation if duration changes to apply immediately
            // This is more of a hack than a fix, but ensures smooth update
            scrollerElement.style.animation = 'none';
            // Force a reflow
            void scrollerElement.offsetWidth;
            scrollerElement.style.animation = null; // Re-enable the CSS animation
        }
    }, [durationSeconds, color, fontSize]);


    // 3. Render
    return e('div', { className: 'scroller-full' },
        e('div', { className: 'scroll-track' },
          e('div', { 
            ref: scrollerRef,
            // The led-text class now contains the static animation rule
            className: 'led-text' + (blinkEnabled ? ' animate-blink' : ''),
          },
            // CRITICAL FIX: Duplicate the text at least three times to ensure
            // the full loop effect is seamless and responsive
            e('span', { style: { paddingRight: '40px' } }, scrollerText.toUpperCase()),
            e('span', { style: { paddingRight: '40px' } }, scrollerText.toUpperCase()),
            e('span', { style: { paddingRight: '40px' } }, scrollerText.toUpperCase())
          )
        ),
      // Exit Button positioned at the bottom center
      e('button', { 
        onClick: onHideScroller,
        className: 'button-primary', 
        style: { 
          // Custom styles for scroller exit button
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
      }, 'Exit Scroller')
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

        // Load theme from body class set in index.html
        var isDark = !document.body.classList.contains('light');
        setDarkMode(isDark);
        
        return {
          text: localStorage.getItem('led_message') || 'DRACOiNC TECHS',
          speed: Number(localStorage.getItem('led_speed')) || 5,
          color: localStorage.getItem('led_color') || COLOR_OPTIONS[0].hex,
          blinkEnabled: storedBlink, 
          showScroller: false
        };
      } catch(e) {
        return { text: 'DRACOiNC TECHS', speed: 5, color: COLOR_OPTIONS[0].hex, blinkEnabled: false, showScroller: false };
      }
    });

    // 1. Initial Theme Setup and Splash Screen
    useEffect(function(){
      // Splash screen fade-out timer
      var t = setTimeout(function(){ setShowSplash(false); }, 1500); // 1.5s total display
      return function(){ clearTimeout(t); };
    }, []);

    // 2. Theme Persistence
    useEffect(function(){
      try {
        var html = document.documentElement;
        var body = document.body;
        if(darkMode){ 
          body.classList.remove('light'); 
          html.classList.remove('light');
          localStorage.setItem('led_theme','dark'); 
        } else { 
          body.classList.add('light'); 
          html.classList.add('light');
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
          e('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
            e('span', { style: { color: 'var(--text-main)', fontSize: '14px', fontWeight: '500' } }, darkMode ? '🌙 Dark' : '☀️ Light'),
            e('label', { className: 'toggle-switch' },
                e('input', { 
                    type: 'checkbox', 
                    id: 'themeToggle', 
                    checked: !darkMode, // Checkbox is checked for Light Mode
                    onChange: function(){ setDarkMode(!darkMode); }
                }),
                e('label', { htmlFor: 'themeToggle', style: { marginBottom: 0 } })
            )
          )
        ),
        
        e('div', { className: 'card' },
          e('div', { className: 'header' }, 
            e('h2', { style: { color: 'var(--text-main)', fontSize: '1.5rem' } }, 'LED Scroller Configuration')
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
                      // Add border to distinguish selected color in light mode
                      border: scrollerSettings.color === opt.hex ? '3px solid var(--accent)' : '3px solid rgba(255,255,255,0.06)',
                      boxShadow: scrollerSettings.color === opt.hex ? `0 0 10px ${opt.hex}` : '0 6px 12px rgba(2,6,23,0.6)', 
                      transform: scrollerSettings.color === opt.hex ? 'scale(1.15)' : 'scale(1)',
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
            e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' } }, 
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
      showSplash ? e('div', { id: 'splash' }, e('h1', { style: { fontFamily: '"Press Start 2P"' } }, 'LED Scroller')) : null, 
      
      // Switch between display and input screens
      scrollerSettings.showScroller 
        ? e(LEDScrollerDisplay, {
            text: scrollerSettings.text,
            speed: scrollerSettings.speed,
            color: scrollerSettings.color,
            blinkEnabled: scrollerSettings.blinkEnabled,
            onHideScroller: handleHideScroller
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
