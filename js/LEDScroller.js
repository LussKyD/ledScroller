const e = React.createElement;
const { useState, useEffect, useCallback } = React;

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
    var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    var brightness = (r*299 + g*587 + b*114) / 1000;
    return brightness > 150 ? '#000' : '#fff';
}


/**
 * The main component that manages the app state and switches between
 * the Input Screen and the Scroller Display.
 * It now handles all theme and persistence logic.
 */
function App(){
  const [darkMode, setDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [errorMessage, setErrorMessage] = useState(''); // New state for error messages
  
  // Initialize state with values from localStorage, falling back to defaults
  const [scrollerSettings, setScrollerSettings] = useState(function(){
    try {
      return {
        text: localStorage.getItem('led_message') || 'Hello World!',
        speed: Number(localStorage.getItem('led_speed')) || 5,
        color: localStorage.getItem('led_color') || '#EF4444',
        showScroller: false
      };
    } catch(e) {
      return { text: 'Hello World!', speed: 5, color: '#EF4444', showScroller: false };
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
    
    // Set splash screen timer
    var t = setTimeout(function(){ setShowSplash(false); }, 1200);
    return function(){ clearTimeout(t); };
  }, []);

  // 2. Theme Persistence (Sync body class and localStorage whenever darkMode changes)
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
      localStorage.setItem('led_color', scrollerSettings.color);
    } catch(e) { /* ignore */ }
  }, [scrollerSettings.text, scrollerSettings.speed, scrollerSettings.color]);


  var handleChange = useCallback(function(name, value){
    setScrollerSettings(function(prev){
      var copy = Object.assign({}, prev);
      copy[name] = value;
      // Clear error message if text input is modified
      if(name === 'text' && value.trim().length > 0) setErrorMessage('');
      return copy;
    });
  }, []);

  var handleShowScroller = useCallback(function(){
    if(scrollerSettings.text.trim().length > 0){
      setScrollerSettings(function(prev){ return Object.assign({}, prev, { showScroller: true }); });
    } else { 
      // FIX: Replaced alert() with state-based error message
      setErrorMessage('Please enter text for the scroller.');
    }
  }, [scrollerSettings.text]);

  var handleHideScroller = useCallback(function(){ 
    setScrollerSettings(function(prev){ return Object.assign({}, prev, { showScroller: false }); }); 
  }, []);

  // --- LED Scroller Display Component ---
  function LEDScrollerDisplay(){
    var text = scrollerSettings.text;
    var speed = scrollerSettings.speed;
    var color = scrollerSettings.color;
    // Map speed (1-10) to duration (23s-5s). Lower speed value means longer duration.
    var durationSeconds = 25 - (speed * 2); 

    // We inject CSS styles for keyframes and custom variables using React's element creation.
    // This allows us to use dynamic values from state for a smooth animation update.
    var styleTag = e('style', null, "\n        /* Keyframes for infinite loop scroll */\n        @keyframes infinite-scroll { from { transform: translateX(100%);} to { transform: translateX(-100%);} }\n        \n        /* Apply animation properties */\n        .animate-scroller { animation: infinite-scroll " + durationSeconds + "s linear infinite; white-space:nowrap; }\n        \n        /* Dot-Matrix Simulation CSS - Enhanced for dot appearance */\n        .led-text { \n          color: " + color + "; \n          font-family: 'Inter', monospace; \n          /* Text shadow simulates the LED glow/blur */\n          text-shadow: 0 0 4px " + color + ", 0 0 8px " + color + ", 0 0 16px rgba(0,0,0,0.5); \n          font-weight: 900; \n          font-size: 9vw; /* Responsive font size */\n          letter-spacing: 0.12em; /* Increase spacing for dot-like effect */\n        }\n        \n        /* Media query to ensure visibility on small screens */\n        @media (max-width:600px){.led-text{font-size:14vw;letter-spacing:0.08em}}\n      ");

    return e('div', { className: 'scroller-full' },
      styleTag,
      e('div', { className: 'scroll-track' },
        e('div', { className: 'animate-scroller led-text py-4 px-2' },
          // Text is duplicated (three times) to ensure seamless infinite loop visual
          e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
          e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
          e('span', null, text.toUpperCase() )
        )
      ),
      // Exit Button positioned at the bottom center
      e('button', { 
        onClick: handleHideScroller, 
        className: 'button-primary exit-btn', // Added exit-btn for dedicated styling
        style: { 
          marginTop: '18px', 
          width: 'auto', 
          padding: '10px 18px', 
          background: color, // Set color dynamically from state
          color: contrast(color), // Set contrast text color
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10 
        } 
      }, 'Exit Config')
    );
  }

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
        
        // 2. Error Message (REPLACED ALERT)
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
          e('label', { htmlFor: 'colorPick' }, 'LED Color'),
          e('div', { id: 'colorPick', className: 'color-pick', role: 'group', 'aria-label': 'LED color options' },
            COLOR_OPTIONS.map(function(opt){
              return e('button', {
                key: opt.hex,
                className: 'color-btn',
                title: opt.name,
                onClick: function(){ handleChange('color', opt.hex); },
                // Inline styles for visual selection indicator
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
            // Set accent color for slider thumb
            style: { accentColor: scrollerSettings.color }
          }),
          e('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: darkMode ? '#9ca3af' : '#6b7280' } }, 
            e('span', null, 'Slow (1)'),
            e('span', null, 'Fast (10)')
          )
        ),

        // 5. Action Button
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
    scrollerSettings.showScroller ? e(LEDScrollerDisplay) : e(InputScreen)
  );
}

var rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(React.createElement(App));
// Cleaned up redundant code previously added by fix scripts
// The theme logic is now fully contained within the React component lifecycle.
