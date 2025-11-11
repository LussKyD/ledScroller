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
    var r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    var brightness = (r*299 + g*587 + b*114) / 1000;
    // Lower threshold for better contrast on lighter colors
    return brightness > 180 ? '#000' : '#fff'; 
  }
  
  // Ensures labels are properly associated with inputs for accessibility
  function fixLabelAssociations(){
    document.querySelectorAll('.form-row').forEach(function(row, idx){
      var label = row.querySelector('label');
      if(!label) return;
      var control = row.querySelector('input, textarea, select, [role="group"]');
      if(control){
        if(!control.id) control.id = 'formctrl-' + idx;
        if(!label.getAttribute('for')) label.setAttribute('for', control.id);
        
        // Ensure initial color selection button is marked 'selected'
        if(control.id === 'colorGroup'){
            var storedColor = localStorage.getItem('led_color') || '#EF4444';
            control.querySelectorAll('[data-led-color]').forEach(function(b){
                b.classList.remove('selected');
                if (b.getAttribute('data-led-color') === storedColor) {
                    b.classList.add('selected');
                }
            });
        }
      }
    });
  }
  
  // Applies the user's selected LED color to the "Show Scroller" button
  function applyLedColor(color){
    if(!color) return;
    if(color.indexOf('rgb')===0) color = toHexFromRgbString(color);
    
    // Target the primary "Show Scroller" button
    var btn = document.querySelector('.show-scroller-btn');
    if(btn){ 
      btn.style.backgroundColor = color; 
      btn.style.color = contrast(color); 
    }
  }

  // Set up listeners for color selection and theme toggle
  function attachListeners(){
    document.addEventListener('click', function(e){
      var t = e.target;
      
      // Handle color button selection style and button coloring
      if(t && t.matches && (t.matches('[data-led-color]') || t.classList.contains('color-btn'))){
        var color = t.getAttribute('data-led-color') || t.getAttribute('value') || t.style.backgroundColor;
        
        if(color){ 
          // Update the button color immediately based on the new selection
          applyLedColor(color); 
        }
        
        // Update selection class
        document.querySelectorAll('[data-led-color]').forEach(function(b){ b.classList.remove('selected'); });
        try{ t.classList.add('selected'); }catch(e){}
      }
      
      // Theme toggle is handled by React, but we re-apply button color when the theme changes
      if(t && t.classList.contains('theme-toggle')){
        // Use a timeout to ensure React has updated localStorage before reading the color
        setTimeout(function(){ 
            applyLedColor(localStorage.getItem('led_color') || '#4f46e5'); 
        }, 120);
      }
    }, true);
  }

  // --- END NON-REACT UTILITY FUNCTIONS ---


  // --- BEGIN REACT APP ---

  function App(){
    // FIX: Initialize state with localStorage values or defaults
    const [darkMode, setDarkMode] = useState(function(){
      try {
        var stored = localStorage.getItem('led_theme');
        // Default to dark mode if nothing is set
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
      
      // 1. Implement 3-second delay state
      const [isScrolling, setIsScrolling] = useState(false);
      useEffect(function(){
          setIsScrolling(false); // Reset when component mounts
          const delayTimer = setTimeout(function(){
              setIsScrolling(true);
          }, 3000); // 3 second delay
          return function(){ clearTimeout(delayTimer); };
      }, [text, speed, color]); // Rerun effect if settings change

      // Calculate duration: 25s for speed=1, 5s for speed=10.
      const durationSeconds = 25 - (speed * 2);
      const animationClass = isScrolling ? 'animate-scroller' : 'paused';

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
          e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
        );
      }
      
      // Render the scroller
      return e('div', { className: 'scroller-full' },
        styleTag,
        e('div', { className: 'scroll-track-container' }, // New container for LED grid look
            e('div', { className: 'scroll-track' },
                // Only apply animation class after the delay
                e('div', { className: `${animationClass} led-text`, style: { '--scroller-duration': durationSeconds + 's' } },
                    // Text is repeated three times to ensure continuous scrolling
                    e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
                    e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
                    e('span', null, text.toUpperCase() )
                )
            )
        ),
        // Exit config button
        e('button', { onClick: handleHideScroller, className: 'button-primary exit-config-btn', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
      );
    }

    function InputScreen(){
        const currentColor = scrollerSettings.color;
        
        // 2. Dynamic Scrollbar/Range Input Styling (Adaptable Speed Slider)
        const scrollbarStyleTag = e('style', { dangerouslySetInnerHTML: {
            __html: `
                /* Thumb Color */
                input[type="range"]::-webkit-slider-thumb {
                    background: ${currentColor};
                }
                input[type="range"]::-moz-range-thumb {
                    background: ${currentColor};
                }
                /* Optional: Color the track slightly */
                input[type="range"]::-webkit-slider-runnable-track {
                    background: ${currentColor}33; 
                }
                input[type="range"]::-moz-range-track {
                    background: ${currentColor}33; 
                }
            `
        }});

      return e('div', { className: 'app-center' },
        scrollbarStyleTag, // Inject dynamic range input styles here
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

  // --- END REACT APP ---

  // Initialize React
  var rootEl = document.getElementById('root');
  ReactDOM.createRoot(rootEl).render(React.createElement(App));
  
  // FIX: Run non-React DOM manipulation after React mounts for button contrast and accessibility
  document.addEventListener('DOMContentLoaded', function(){
    try{ 
      // 1. Fix accessibility IDs/labels
      fixLabelAssociations(); 
      // 2. Attach listeners for dynamic button styling
      attachListeners(); 
      
      // 3. Re-apply button color after React has rendered (using the persisted color)
      // This is crucial for the "Show Scroller" button adaptation
      setTimeout(function(){ 
        applyLedColor(localStorage.getItem('led_color') || '#EF4444');
      }, 500);
    }catch(e){ console.error('Combined JS init error', e); }
  });
})();
