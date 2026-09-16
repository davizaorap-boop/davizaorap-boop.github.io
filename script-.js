(function () {
  var wrap = document.getElementById('toggleWrap');
  var pill = document.getElementById('togglePill');
  var buttons = wrap.querySelectorAll('.toggle-btn');
  var panels = {
    videos: document.getElementById('videos'),
    fotos: document.getElementById('fotos')
  };

  function movePill(btn) {
    var wrapRect = wrap.getBoundingClientRect();
    var btnRect = btn.getBoundingClientRect();
    pill.style.width = btnRect.width + 'px';
    pill.style.transform = 'translateX(' + (btnRect.left - wrapRect.left - 4) + 'px)';
  }

  function setActive(target) {
    buttons.forEach(function (btn) {
      var isActive = btn.dataset.target === target;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      if (isActive) movePill(btn);
    });

    Object.keys(panels).forEach(function (key) {
      panels[key].classList.toggle('is-active', key === target);
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setActive(btn.dataset.target);
    });
  });

  window.addEventListener('resize', function () {
    var activeBtn = wrap.querySelector('.toggle-btn.active');
    if (activeBtn) movePill(activeBtn);
  });

  // Estado inicial
  setActive('videos');
})();
