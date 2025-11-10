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
    const [darkMode, setDarkMode] = useState(true);
    const [showSplash, setShowSplash] = useState(true);
    const [scrollerSettings, setScrollerSettings] = useState({
      text: 'Hello World!',
      speed: 5,
      color: '#EF4444',
      showScroller: false
    });

    // initialize theme from localStorage
    useEffect(function(){
      try {
        var stored = localStorage.getItem('led_theme');
        if(stored === 'light'){ setDarkMode(false); document.body.classList.add('light'); }
        else { setDarkMode(true); document.body.classList.remove('light'); }
      } catch(e){ /* ignore storage errors */ }
      var t = setTimeout(function(){ setShowSplash(false); }, 1200);
      return function(){ clearTimeout(t); };
    }, []);

    // sync body class and localStorage whenever darkMode changes
    useEffect(function(){
      try {
        if(darkMode){ document.body.classList.remove('light'); localStorage.setItem('led_theme','dark'); }
        else { document.body.classList.add('light'); localStorage.setItem('led_theme','light'); }
      } catch(e){ /* ignore */ }
    }, [darkMode]);

    var handleChange = useCallback(function(name, value){
      setScrollerSettings(function(prev){
        var copy = Object.assign({}, prev);
        copy[name] = value;
        return copy;
      });
    }, []);

    var handleShowScroller = useCallback(function(){
      if(scrollerSettings.text.trim().length > 0){
        setScrollerSettings(function(prev){ return Object.assign({}, prev, { showScroller: true }); });
      } else { alert('Please enter text for the scroller.'); }
    }, [scrollerSettings.text]);

    var handleHideScroller = useCallback(function(){ setScrollerSettings(function(prev){ return Object.assign({}, prev, { showScroller: false }); }); }, []);

    function LEDScrollerDisplay(){
      var text = scrollerSettings.text;
      var speed = scrollerSettings.speed;
      var color = scrollerSettings.color;
      var durationSeconds = 25 - (speed * 2);

      var styleTag = e('style', null, "\n        @keyframes infinite-scroll { from { transform: translateX(100%);} to { transform: translateX(-100%);} }\n        .animate-scroller { animation: infinite-scroll " + durationSeconds + "s linear infinite; white-space:nowrap; }\n        .led-text { color: " + color + "; text-shadow: 0 0 6px " + color + ", 0 0 12px rgba(0,0,0,0.2); }\n      ");

      return e('div', { className: 'scroller-full' },
        styleTag,
        e('div', { className: 'scroll-track' },
          e('div', { className: 'animate-scroller led-text', style: { '--scroller-duration': durationSeconds + 's' } },
            e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
            e('span', { style: { marginRight: '20vw' } }, text.toUpperCase() ),
            e('span', null, text.toUpperCase() )
          )
        ),
        e('button', { onClick: handleHideScroller, className: 'button-primary', style: { marginTop: '18px', width: 'auto', padding: '10px 18px', background:'#ef4444' } }, 'Exit Config')
      );
    }

    function InputScreen(){
      return e('div', { className: 'app-center' },
        e('div', { className: 'top-right' },
          e('button', { onClick: function(){ setDarkMode(!darkMode); }, className: 'button-primary', 'aria-pressed': !darkMode, title: 'Toggle theme' }, darkMode ? '☀️ Light' : '🌙 Dark')
        ),
        e('div', { className: 'card' },
          e('div', { className: 'header' }, e('h2', null, 'LED Scroller Configuration')),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'marqueeText' }, 'Marquee Message'),
            e('textarea', { id: 'marqueeText', value: scrollerSettings.text, onInput: function(ev){ handleChange('text', ev.target.value); }, placeholder: 'Enter the text to scroll...' })
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'colorPick' }, 'LED Color'),
            e('div', { id: 'colorPick', className: 'color-pick', role: 'group', 'aria-label': 'LED color options' },
              COLOR_OPTIONS.map(function(opt){
                return e('button', {
                  key: opt.hex,
                  className: 'color-btn',
                  title: opt.name,
                  onClick: function(){ handleChange('color', opt.hex); },
                  style: { background: opt.hex, borderColor: scrollerSettings.color === opt.hex ? '#4f46e5' : 'rgba(255,255,255,0.06)', transform: scrollerSettings.color === opt.hex ? 'scale(1.05)' : 'none' }
                });
              })
            )
          ),
          e('div', { className: 'form-row' },
            e('label', { htmlFor: 'speedRange' }, 'Scroll Speed: ' + scrollerSettings.speed),
            e('input', { id: 'speedRange', type: 'range', min: 1, max: 10, value: scrollerSettings.speed, onInput: function(e){ handleChange('speed', Number(e.target.value)); }, className: 'range' })
          ),
          e('div', null,
            e('button', { onClick: handleShowScroller, className: 'button-primary' }, 'Show Scroller')
          )
        )
      );
    }

    return e(React.Fragment, null, showSplash ? e('div', { id: 'splash' }, e('h1', null, 'LED Scroller by DRACOiNC Techs')) : null, scrollerSettings.showScroller ? e(LEDScrollerDisplay) : e(InputScreen));
  }

  var rootEl = document.getElementById('root');
  ReactDOM.createRoot(rootEl).render(React.createElement(App));
})();
// Enhanced adaptive theme support for LED Scroller Config UI
document.querySelectorAll('.form-row label, .form-row span').forEach(el => {
  el.style.color = document.body.classList.contains('dark-mode') ? '#ddd' : '#222';
});

const updateScrollerTheme = () => {
  const scroller = document.querySelector('.scroller-display');
  if (scroller) {
    scroller.style.background = document.body.classList.contains('dark-mode') ? '#111' : '#f5f5f5';
    scroller.style.color = document.body.classList.contains('dark-mode') ? '#eee' : '#000';
  }
};

document.querySelector('.theme-toggle')?.addEventListener('click', updateScrollerTheme);
updateScrollerTheme();
