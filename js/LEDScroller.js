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

    useEffect(function(){ var t = setTimeout(function(){ setShowSplash(false); }, 1200); return function(){ clearTimeout(t); }; }, []);

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

      var styleTag = e('style', null, "\n        @keyframes infinite-scroll { from { transform: translateX(100%);} to { transform: translateX(-100%);} }\n        .animate-scroller { animation: infinite-scroll " + durationSeconds + "s linear infinite; white-space:nowrap; }\n        .led-text { color: " + color + "; text-shadow: 0 0 6px " + color + ", 0 0 12px " + color + "; }\n      ");

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
          e('button', { onClick: function(){ setDarkMode(!darkMode); }, className: 'button-primary', style: { background: darkMode ? '#111827' : '#4f46e5' } }, darkMode ? '☀️ Light' : '🌙 Dark')
        ),
        e('div', { className: 'card' },
          e('div', { className: 'header' }, e('h2', null, 'LED Scroller Configuration')),
          e('div', { className: 'form-row' },
            e('label', null, 'Marquee Message'),
            e('textarea', { value: scrollerSettings.text, onInput: function(ev){ handleChange('text', ev.target.value); }, placeholder: 'Enter the text to scroll...' })
          ),
          e('div', { className: 'form-row' },
            e('label', null, 'LED Color'),
            e('div', { className: 'color-pick' },
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
            e('label', null, 'Scroll Speed: ' + scrollerSettings.speed),
            e('input', { type: 'range', min: 1, max: 10, value: scrollerSettings.speed, onInput: function(e){ handleChange('speed', Number(e.target.value)); }, className: 'range' })
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