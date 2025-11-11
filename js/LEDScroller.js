// Wrap the core React logic in a self-executing function for stability and scope isolation
(function() {
  const e = React.createElement;
  // IMPORTANT: Destructure React.memo here for optimization
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
  // Longer text needs a smaller font to fit on small screens
  function calculateFontSize(text) {
      if (!text) return '10vw';
      const baseSize = 25; // Base vw size for very short text
      const minSize = 6;  // Minimum vw size
      // Formula: baseSize - (length * reduction_factor). Clamped between baseSize and minSize.
      const fontSize = Math.max(minSize, baseSize - (text.length * 0.5));
      return fontSize + 'vw';
  }

  // --- LED Scroller Display Component (MEMOIZED) ---
  const LEDScrollerDisplay = memo(function LEDScrollerDisplay({ text, speed, color, blinkEnabled, onHideScroller }) {
    const scrollerRef = useRef(null);
    const [scrollerText, setScrollerText] = useState(text || 'DRACOiNC');

    // 1. Calculate Duration and Font Size
    const fontSize = calculateFontSize(scrollerText);
    const characters = scrollerText.length;
    // Speed: 1 (fastest) to 10 (slowest). Duration: 1s (fast) to 15s (slow)
    // Formula: duration = 1s + (speed * 1.5) + (characters / 5)
    // The duration is dynamically tied to both speed and length for a consistent *feel*.
    const scrollDuration = (1 + (speed * 1.5) + (characters / 5)).toFixed(2) + 's'; 

    useEffect(() => {
        // Update the scroller text when the prop changes
        setScrollerText(text || 'DRACOiNC');
    }, [text]);

    // 2. Dynamic Scroll Animation Setup (using CSS Variable)
    useEffect(() => {
        const scrollerElement = scrollerRef.current;
        if (scrollerElement) {
            // Set the scroll-duration CSS variable to control the animation
            scrollerElement.style.setProperty('--scroll-duration', scrollDuration);
            
            // To prevent a flicker/jump when duration changes, restart the animation
            // by toggling the class.
            scrollerElement.classList.remove('led-text');
            // Force a reflow/repaint to ensure the class removal takes effect immediately
            void scrollerElement.offsetWidth; 
            scrollerElement.classList.add('led-text');
        }
        // No cleanup needed because we're not inserting/deleting global CSS rules.
    }, [scrollDuration]); 

    // 3. Render
    return (
      e('div', { className: 'scroller-full' }, 
        // Close button at the top-right
        e('button', {
          onClick: onHideScroller,
          style: {
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 20,
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            padding: '8px 15px',
            cursor: 'pointer',
          }
        }, 'X'),

        e('div', { className: 'scroll-track' },
          // The led-text div is the element that scrolls
          e('div', { 
            ref: scrollerRef,
            className: 'led-text' + (blinkEnabled ? ' animate-blink' : ''),
            // Set the dynamic styles directly
            style: {
              color: color,
              fontSize: fontSize,
              // Add a glow effect matching the color
              textShadow: '0 0 10px ' + color + ', 0 0 20px ' + color,
              // Set the initial position (off-screen right)
              transform: 'translateX(100%)', 
            }
          }, scrollerText)
        )
      )
    );
  });
  
  // --- Main Application Component ---
  function App() {
    const [scrollerSettings, setScrollerSettings] = useState(() => {
        // Initial state loaded from localStorage, or defaults
        try {
            const savedSettings = localStorage.getItem('ledScrollerSettings');
            return savedSettings ? JSON.parse(savedSettings) : {
                text: 'DRACOiNC TECHS',
                speed: 5, // 1 to 10
                color: COLOR_OPTIONS[0].hex, // Red
                blinkEnabled: false,
                showScroller: false,
                // Add a setting for the theme toggle (default to false/dark)
                isLightMode: document.documentElement.classList.contains('light')
            };
        } catch (error) {
            console.error("Could not load settings from localStorage", error);
            return {
                text: 'DRACOiNC TECHS',
                speed: 5,
                color: COLOR_OPTIONS[0].hex,
                blinkEnabled: false,
                showScroller: false,
                isLightMode: document.documentElement.classList.contains('light')
            };
        }
    });
    
    // Splash Screen State Machine: 'SHOWING' -> 'FADING_OUT' -> 'HIDDEN'
    const [splashPhase, setSplashPhase] = useState('SHOWING');

    // 1. Splash Screen Lifecycle Management (The Fix for Abrupt Exit)
    useEffect(() => {
        if (splashPhase === 'SHOWING') {
            const SHOW_DURATION = 1500; // Time to display the splash screen
            const FADE_DURATION = 300;  // Time for the CSS fade-out animation

            // Step 1: Wait for the initial display time
            const showTimer = setTimeout(() => {
                setSplashPhase('FADING_OUT'); // Trigger CSS fade
            }, SHOW_DURATION);

            // Step 2: Wait for the fade animation to complete
            const fadeTimer = setTimeout(() => {
                setSplashPhase('HIDDEN'); // Hide (unmount) the component
            }, SHOW_DURATION + FADE_DURATION);

            // Cleanup function for useEffect (runs on unmount or before re-run)
            return () => {
                clearTimeout(showTimer);
                clearTimeout(fadeTimer);
            };
        }
    }, [splashPhase]);


    // 2. Save state to localStorage whenever settings change
    useEffect(() => {
        try {
            // Only save the user-configurable settings, not runtime flags like 'showScroller'
            const { showScroller, isLightMode, ...settingsToSave } = scrollerSettings;
            localStorage.setItem('ledScrollerSettings', JSON.stringify(settingsToSave));
            
            // Apply theme class to <html> and <body> (for global CSS variables)
            const html = document.documentElement;
            const body = document.body;
            if (scrollerSettings.isLightMode) {
                html.classList.add('light');
                body.classList.add('light');
                localStorage.setItem('led_theme', 'light');
            } else {
                html.classList.remove('light');
                body.classList.remove('light');
                localStorage.setItem('led_theme', 'dark');
            }

        } catch (error) {
            console.error("Could not save settings to localStorage", error);
        }
    }, [scrollerSettings]);

    // --- State Handler Functions ---

    const handleInputChange = useCallback((field) => (event) => {
        let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        if (field === 'speed') value = Number(value); // Convert range to number
        
        setScrollerSettings(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const handleColorChange = useCallback((hex) => {
        setScrollerSettings(prev => ({
            ...prev,
            color: hex
        }));
    }, []);
    
    const handleThemeToggle = useCallback(() => {
        setScrollerSettings(prev => ({
            ...prev,
            isLightMode: !prev.isLightMode
        }));
    }, []);

    const handleShowScroller = useCallback(() => {
        // Prevent showing the scroller if the text is empty or just whitespace
        if (!scrollerSettings.text.trim()) {
             alert("Please enter a message to display!");
             return;
        }
        setScrollerSettings(prev => ({ ...prev, showScroller: true }));
    }, [scrollerSettings.text]);

    const handleHideScroller = useCallback(() => {
        setScrollerSettings(prev => ({ ...prev, showScroller: false }));
    }, []);


    // --- Input Screen Component ---
    function InputScreen() {
      // Memoized component for the input form
      return (
        e('div', { className: 'card' },
          // 1. Header and Theme Toggle
          e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            e('h2', { style: { margin: 0, fontSize: '1.5rem' } }, 'LED Scroller Setup'),
            e('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                e('label', { htmlFor: 'themeToggle', style: { marginBottom: 0, cursor: 'pointer' } }, scrollerSettings.isLightMode ? '☀️ Light' : '🌙 Dark'),
                e('label', { className: 'toggle-switch' },
                    e('input', { 
                        type: 'checkbox', 
                        id: 'themeToggle', 
                        checked: scrollerSettings.isLightMode,
                        onChange: handleThemeToggle
                    }),
                    e('span', { className: 'slider' })
                )
            )
          ),
          
          // 2. Text Input
          e('div', null,
            e('label', { htmlFor: 'textInput' }, 'Message Text'),
            e('input', {
              type: 'text',
              id: 'textInput',
              placeholder: 'Enter your message...',
              value: scrollerSettings.text,
              onChange: handleInputChange('text')
            })
          ),

          // 3. Speed Slider
          e('div', null,
            e('label', { htmlFor: 'speedRange' }, 'Speed: ' + scrollerSettings.speed),
            e('input', {
              type: 'range',
              id: 'speedRange',
              min: 1,
              max: 10,
              value: scrollerSettings.speed,
              onChange: handleInputChange('speed')
            }),
            e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' } },
              e('span', null, 'Fast'),
              e('span', null, 'Slow')
            )
          ),

          // 4. Color Picker
          e('div', null,
            e('label', null, 'LED Color'),
            e('div', { className: 'color-picker-container' },
              COLOR_OPTIONS.map(option =>
                e('div', {
                  key: option.name,
                  className: 'color-option' + (scrollerSettings.color === option.hex ? ' selected' : ''),
                  style: { backgroundColor: option.hex },
                  onClick: () => handleColorChange(option.hex)
                })
              )
            )
          ),
          
          // 5. Blink Toggle
          e('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' } },
              e('label', { htmlFor: 'blinkToggle', style: { margin: 0 } }, 'Blink Effect'),
              e('label', { className: 'toggle-switch' },
                  e('input', { 
                      type: 'checkbox', 
                      id: 'blinkToggle', 
                      checked: scrollerSettings.blinkEnabled,
                      onChange: handleInputChange('blinkEnabled')
                  }),
                  e('span', { className: 'slider' })
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
      splashPhase !== 'HIDDEN' ? e('div', { 
        id: 'splash',
        className: splashPhase === 'FADING_OUT' ? 'splash-fade-out' : ''
      }, e('h1', {style: {fontFamily: '"Press Start 2P"', color: 'var(--accent)'}}, 'LED Scroller by DRACOiNC Techs')) : null, 
      
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
