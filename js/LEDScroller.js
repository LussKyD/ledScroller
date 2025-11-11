// Wrap the core React logic in a self-executing function for stability and scope isolation
(function() {
  const e = React.createElement;
  // IMPORTANT: Destructure React.memo here for optimization
  const { useState, useEffect, useCallback, memo } = React; 

  // --- Utility Functions ---

  // Define the available scrolling colors and their hex codes
  const COLOR_OPTIONS = [
    { name: 'Red', hex: '#EF4444' },
    { name: 'Green', hex: '#10B981' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Yellow', hex: '#F59E0B' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Purple', hex: '#8B5CF6' }
  ];

  // Helper function to calculate contrast color for buttons
  function contrast(hex){
      if(!hex) return '#fff';
      var c = hex.replace('#','');
      var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,6),16);
      var brightness = (r*299 + g*587 + b*114) / 1000;
      return brightness > 150 ? '#000' : '#fff';
  }

  // Helper to read initial state from localStorage
  function getInitialState() {
    const defaultState = {
      text: 'HELLO WORLD!',
      speed: 50,
      color: COLOR_OPTIONS[0].hex,
      blinkEnabled: false,
      showScroller: false,
    };
    try {
      const savedText = localStorage.getItem('scroller_text');
      const savedSpeed = localStorage.getItem('scroller_speed');
      const savedColor = localStorage.getItem('scroller_color');
      const savedBlink = localStorage.getItem('scroller_blink') === 'true';

      return {
        text: savedText || defaultState.text,
        speed: savedSpeed ? parseInt(savedSpeed, 10) : defaultState.speed,
        color: savedColor || defaultState.color,
        blinkEnabled: savedBlink,
        showScroller: defaultState.showScroller
      };
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      return defaultState;
    }
  }
  
  // Helper to set CSS variables (used for theming)
  function setCssVar(name, value){
    try{ document.documentElement.style.setProperty(name, value); }catch(e){}
  }

  // --- LED Scroller Display Component (MEMOIZED) ---
  const LEDScrollerDisplay = memo(function LEDScrollerDisplay({ text, speed, color, blinkEnabled, onHideScroller }) {
    const scrollerRef = React.useRef(null);
    const textRef = React.useRef(null);
    const [fontSize, setFontSize] = useState(10); // Start with a default, will be calculated
    const [animationDuration, setAnimationDuration] = useState(10);

    // Function to calculate optimal font size and animation duration
    const calculateMetrics = useCallback(() => {
        const scrollerEl = scrollerRef.current;
        const textEl = textRef.current;
        if (!scrollerEl || !textEl) return;

        // 1. Calculate optimal font size (responsive to screen height)
        const trackHeight = scrollerEl.offsetHeight;
        // Estimate a reasonable font size based on height (e.g., 80% of height)
        const newFontSize = Math.min(trackHeight * 0.8, window.innerWidth * 0.2); // Cap based on width too
        textEl.style.fontSize = `${newFontSize}px`;
        setFontSize(newFontSize);

        // 2. Calculate animation duration based on content length and speed setting
        const trackWidth = scrollerEl.offsetWidth;
        const textWidth = textEl.scrollWidth;

        // Animation distance is the text width plus the screen width
        const distance = textWidth + trackWidth;
        
        // Speed is between 1 (Slowest) and 100 (Fastest).
        // Let's map it to an actual duration: slowest (speed=1) might be 60s, fastest (speed=100) might be 5s.
        // Duration (in seconds) = MaxDuration - (Speed / 100) * (MaxDuration - MinDuration)
        const maxDuration = 60; // seconds for speed 1
        const minDuration = 4; // seconds for speed 100
        const normalizedSpeed = speed / 100; // 0.01 to 1.0
        const speedFactor = maxDuration - (normalizedSpeed * (maxDuration - minDuration));
        
        // Final duration scales with content length: (distance / trackWidth) * speedFactor
        const finalDuration = (distance / trackWidth) * speedFactor;
        
        textEl.style.animationDuration = `${finalDuration}s`;
        setAnimationDuration(finalDuration);

    }, [text, speed]);

    // Apply color and glow effect
    useEffect(() => {
        setCssVar('--led-color', color);
        if (textRef.current) {
            textRef.current.style.color = color;
            // The glow is controlled via CSS text-shadow using the currentColor
            // textRef.current.style.textShadow = `0 0 ${fontSize * 0.08}px, 0 0 ${fontSize * 0.1}px`;
        }
        
    }, [color, fontSize]);

    // Setup animation and recalculate metrics on mount, text/speed/window resize
    useEffect(() => {
        let animationStyle = '';
        if (scrollerRef.current) {
            // Apply infinite scroll animation via CSS keyframes/animation
            animationStyle = `scroll-x ${animationDuration}s linear infinite`;
            scrollerRef.current.style.animation = animationStyle;
        }

        // Apply text content and spacing/font style
        if (textRef.current) {
            textRef.current.textContent = text + ' '; // Add padding at the end for clean looping
            textRef.current.className = `led-text ${blinkEnabled ? 'animate-blink' : ''}`;
        }
        
        // Define CSS keyframes dynamically for scrolling animation
        // FIX: Safely retrieve the local stylesheet by ID
        const styleSheetEl = document.getElementById('dynamic-keyframe-style'); 
        const styleSheet = styleSheetEl ? styleSheetEl.sheet : null;
        
        // Bail out if we can't find the dedicated sheet (to prevent SecurityError)
        if (!styleSheet) {
            console.error("Could not find dedicated stylesheet for keyframe injection.");
            return;
        }

        const keyframesName = 'scroll-x';
        
        // Remove existing keyframes to prevent conflicts/duplicates
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            if (styleSheet.cssRules[i].name === keyframesName) {
                styleSheet.deleteRule(i);
                break;
            }
        }
        
        // Add new keyframes
        // Check if refs are available before accessing scrollWidth/offsetWidth
        if (textRef.current && scrollerRef.current) {
            const textWidth = textRef.current.scrollWidth;
            const trackWidth = scrollerRef.current.offsetWidth;
            const keyframeRule = 
                `@keyframes ${keyframesName} {
                    0% { transform: translateX(${trackWidth}px); }
                    100% { transform: translateX(-${textWidth}px); }
                }`;
            styleSheet.insertRule(keyframeRule, styleSheet.cssRules.length);
        }

        calculateMetrics();

        // Recalculate on window resize
        window.addEventListener('resize', calculateMetrics);
        return () => window.removeEventListener('resize', calculateMetrics);
        
    }, [text, speed, blinkEnabled, calculateMetrics, animationDuration]);


    // Render the Scroller View
    return e('div', { className: 'scroller-full' },
      e('style', null, `
        .led-text { 
          letter-spacing: ${fontSize * 0.06}px;
          text-shadow: 0 0 ${fontSize * 0.04}px, 0 0 ${fontSize * 0.06}px;
        }
      `),
      e('button', { className: 'hide-button', onClick: onHideScroller }, 'Back'),
      e('div', { className: 'scroll-track', ref: scrollerRef },
        e('span', { ref: textRef, className: `led-text ${blinkEnabled ? 'animate-blink' : ''}` }, text)
      )
    );
  });


  // --- Input Screen Component ---
  function InputScreen({ scrollerSettings, setScrollerSettings, handleShowScroller }) {
    
    // Handler for text input (including textarea for multi-line)
    const handleTextChange = useCallback((e) => {
      const newText = e.target.value.toUpperCase();
      setScrollerSettings(prev => ({ ...prev, text: newText }));
      localStorage.setItem('scroller_text', newText);
    }, [setScrollerSettings]);

    // Handler for speed slider
    const handleSpeedChange = useCallback((e) => {
      const newSpeed = parseInt(e.target.value, 10);
      setScrollerSettings(prev => ({ ...prev, speed: newSpeed }));
      localStorage.setItem('scroller_speed', newSpeed.toString());
    }, [setScrollerSettings]);

    // Handler for color buttons/input
    const handleColorChange = useCallback((newColor) => {
      setScrollerSettings(prev => ({ ...prev, color: newColor }));
      localStorage.setItem('scroller_color', newColor);
    }, [setScrollerSettings]);

    // Handler for blink toggle
    const handleBlinkToggle = useCallback((e) => {
      const isChecked = e.target.checked;
      setScrollerSettings(prev => ({ ...prev, blinkEnabled: isChecked }));
      localStorage.setItem('scroller_blink', isChecked.toString());
    }, [setScrollerSettings]);

    // Memoize the color button group for performance
    const ColorButtonGroup = React.useMemo(() => e('div', { className: 'color-pick' },
        COLOR_OPTIONS.map((opt) => e('button', {
            key: opt.hex,
            className: `color-btn ${scrollerSettings.color === opt.hex ? 'selected' : ''}`,
            style: { backgroundColor: opt.hex, border: scrollerSettings.color === opt.hex ? `3px solid ${contrast(opt.hex)}` : 'none' },
            onClick: () => handleColorChange(opt.hex)
        })),
        e('input', { // Custom color picker
            key: 'custom-color',
            type: 'color',
            id: 'customColor',
            value: scrollerSettings.color,
            onChange: (e) => handleColorChange(e.target.value)
        })
    ), [scrollerSettings.color, handleColorChange]);

    const ThemeToggle = () => {
      const [isLight, setIsLight] = useState(document.documentElement.classList.contains('light'));

      useEffect(() => {
        const obs = new MutationObserver(() => {
          setIsLight(document.documentElement.classList.contains('light'));
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
      }, []);

      const toggleTheme = () => {
        const newIsLight = !isLight;
        document.documentElement.classList.toggle('light', newIsLight);
        document.body.classList.toggle('light', newIsLight);
        localStorage.setItem('led_theme', newIsLight ? 'light' : 'dark');
        setIsLight(newIsLight);
      };

      return e('div', { className: 'theme-toggle-container' },
        e('button', { className: 'theme-toggle', onClick: toggleTheme, id: 'theme-toggle' },
          e('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            isLight
              ? [ // Sun icon for light mode (suggesting toggle to dark)
                  e('circle', { key: 'sun-c', cx: "12", cy: "12", r: "5" }),
                  e('line', { key: 'sun-l1', x1: "12", y1: "1", x2: "12", y2: "3" }),
                  e('line', { key: 'sun-l2', x1: "12", y1: "21", x2: "12", y2: "23" }),
                  e('line', { key: 'sun-l3', x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }),
                  e('line', { key: 'sun-l4', x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }),
                  e('line', { key: 'sun-l5', x1: "1", y1: "12", x2: "3", y2: "12" }),
                  e('line', { key: 'sun-l6', x1: "21", y1: "12", x2: "23", y2: "12" }),
                  e('line', { key: 'sun-l7', x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }),
                  e('line', { key: 'sun-l8', x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" })
                ]
              : [ // Moon icon for dark mode (suggesting toggle to light)
                  e('path', { key: 'moon-p', d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
                ]
          ),
          e('span', { className: 'theme-toggle-text' }, isLight ? 'Dark Mode' : 'Light Mode')
        )
      );
    };

    // Render the Input/Config View
    return e(React.Fragment, null,
      e(ThemeToggle),
      e('div', { className: 'app-container' },
        e('div', { className: 'config-card' },
          e('h2', { style: { marginTop: 0, marginBottom: '24px' } }, 'LED Scroller Configuration'),

          // 1. Text Input
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'scrollerText' }, 'Message Text (A-Z, 0-9, Symbols)'),
            e('textarea', {
              id: 'scrollerText',
              rows: 3,
              maxLength: 250,
              value: scrollerSettings.text,
              onChange: handleTextChange,
              placeholder: 'Type your scrolling message here...'
            })
          ),

          // 2. Speed Slider
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'scrollerSpeed' }, `Scrolling Speed: ${scrollerSettings.speed}%`),
            e('input', {
              id: 'scrollerSpeed',
              type: 'range',
              min: 1,
              max: 100,
              step: 1,
              value: scrollerSettings.speed,
              onChange: handleSpeedChange
            })
          ),

          // 3. Color Selection
          e('div', { className: 'form-row' },
            e('label', null, 'LED Color'),
            ColorButtonGroup // Insert memoized color picker
          ),
          
          // 4. Blink Toggle
          e('div', { className: 'form-row' },
            e('div', { className: 'toggle-switch' },
              e('label', { htmlFor: 'blinkToggle' }, 'Blink Effect'),
              e('label', { className: 'switch' },
                e('input', {
                  id: 'blinkToggle',
                  type: 'checkbox',
                  checked: scrollerSettings.blinkEnabled,
                  onChange: handleBlinkToggle
                }),
                e('span', { className: 'slider' })
              )
            )
          ),


          // 5. Action Button
          e('div', null,
            e('button', { 
              onClick: handleShowScroller, 
              className: 'button-primary',
              style: { 
                background: scrollerSettings.color, 
                color: contrast(scrollerSettings.color) 
              } 
            }, 'Show Scroller')
          )
        )
      )
    );
  }


  // --- Main App Component ---
  function App() {
    const [scrollerSettings, setScrollerSettings] = useState(getInitialState);
    const [showSplash, setShowSplash] = useState(true);

    // Effect to hide splash screen after a short delay
    useEffect(() => {
      const timer = setTimeout(() => setShowSplash(false), 1200);
      return () => clearTimeout(timer);
    }, []);

    // Handlers
    const handleShowScroller = useCallback(() => {
      setScrollerSettings(prev => ({ ...prev, showScroller: true }));
    }, []);

    const handleHideScroller = useCallback(() => {
      setScrollerSettings(prev => ({ ...prev, showScroller: false }));
    }, []);

    // Main rendering logic to switch between views
    return e(React.Fragment, null, 
      // Splash screen logic (optional, fades out quickly)
      showSplash ? e('div', { 
          id: 'splash', 
          style: {
            position: 'fixed', inset: 0, background: 'var(--bg-main)', 
            color: 'var(--text-main)', display: 'flex', justifyContent: 'center', 
            alignItems: 'center', zIndex: 999, transition: 'opacity 1s ease-out',
            opacity: showSplash ? 1 : 0, fontFamily: 'Inter, sans-serif'
          }
        }, e('h1', null, 'LED Scroller by DRACOiNC Techs')) : null, 
      
      // Switch between display and input screens
      scrollerSettings.showScroller 
        ? e(LEDScrollerDisplay, { 
            text: scrollerSettings.text,
            speed: scrollerSettings.speed,
            color: scrollerSettings.color,
            blinkEnabled: scrollerSettings.blinkEnabled,
            onHideScroller: handleHideScroller
          }) 
        : e(InputScreen, {
            scrollerSettings: scrollerSettings,
            setScrollerSettings: setScrollerSettings,
            handleShowScroller: handleShowScroller
          })
    );
  }

  var rootEl = document.getElementById('root');
  // Initialize the React Root
  if(rootEl && typeof ReactDOM.createRoot === 'function'){
      ReactDOM.createRoot(rootEl).render(React.createElement(App));
  } else if (rootEl) {
      // Fallback for older React versions if necessary, though 18+ is assumed
      ReactDOM.render(React.createElement(App), rootEl);
  }

})(); // End self-executing function
