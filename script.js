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

  // ==========================================================================
  // Descoberta automática dos arquivos na pasta "midia" do repositório
  // ==========================================================================
  // Usa a API pública do GitHub para listar o que está dentro da pasta.
  // Funciona sem login porque só lê repositórios públicos. O dono do site
  // (você) continua sendo o único que consegue ADICIONAR arquivos, porque
  // só quem tem acesso de escrita ao repositório consegue subir algo nele.

  var PASTA_MIDIA = 'midia';
  var EXTENSOES_VIDEO = ['mp4', 'webm', 'ogg', 'ogv', 'mov', 'm4v'];
  var EXTENSOES_FOTO = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];

  function detectarRepositorio() {
    var host = window.location.hostname; // ex.: usuario.github.io
    var owner = host.split('.')[0];
    var partes = window.location.pathname.split('/').filter(Boolean);
    // Página de projeto (usuario.github.io/nome-do-repo/...) -> usa o 1º pedaço do caminho.
    // Página raiz (usuario.github.io/) -> o repositório se chama igual ao host.
    var repo = partes.length > 0 ? partes[0] : host;
    return { owner: owner, repo: repo };
  }

  function extensao(nome) {
    var partes = nome.split('.');
    return partes.length > 1 ? partes.pop().toLowerCase() : '';
  }

  function tipoPorArquivo(nome) {
    var ext = extensao(nome);
    if (EXTENSOES_VIDEO.indexOf(ext) !== -1) return 'video';
    if (EXTENSOES_FOTO.indexOf(ext) !== -1) return 'foto';
    return null;
  }

  function tituloPorArquivo(nome) {
    var semExtensao = nome.replace(/\.[^/.]+$/, '');
    var comEspacos = semExtensao.replace(/[-_]+/g, ' ').trim();
    return comEspacos.charAt(0).toUpperCase() + comEspacos.slice(1);
  }

  function buscarArquivosDaPasta() {
    var repo = detectarRepositorio();
    var url = 'https://api.github.com/repos/' + repo.owner + '/' + repo.repo + '/contents/' + PASTA_MIDIA;

    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (resp) {
        if (!resp.ok) return []; // pasta ainda não existe ou está vazia
        return resp.json();
      })
      .then(function (lista) {
        if (!Array.isArray(lista)) return [];
        return lista
          .filter(function (item) { return item.type === 'file'; })
          .map(function (item) {
            var tipo = tipoPorArquivo(item.name);
            if (!tipo) return null;
            return { tipo: tipo, titulo: tituloPorArquivo(item.name), arquivo: item.path };
          })
          .filter(Boolean);
      })
      .catch(function () { return []; });
  }

  // ---- Renderização ----

  function criarCard(item) {
    var tpl = document.getElementById('video-card');
    var node = tpl.content.cloneNode(true);
    var thumb = node.querySelector('.media-thumb');
    var titulo = node.querySelector('.media-title');
    titulo.textContent = item.titulo || '';

    if (item.tipo === 'video' && item.embed) {
      thumb.classList.add('is-embed');
      var iframe = document.createElement('iframe');
      iframe.src = item.embed;
      iframe.loading = 'lazy';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      thumb.appendChild(iframe);
    } else if (item.tipo === 'video') {
      var video = document.createElement('video');
      video.src = item.arquivo;
      if (item.capa) video.poster = item.capa;
      video.controls = true;
      video.preload = 'metadata';
      thumb.appendChild(video);
    } else {
      var img = document.createElement('img');
      img.src = item.arquivo;
      img.alt = item.titulo || '';
      img.loading = 'lazy';
      thumb.appendChild(img);
    }
    return node;
  }

  function renderPainel(target, tipo, itens) {
    target.innerHTML = '';
    var doTipo = itens.filter(function (item) { return item.tipo === tipo; });

    if (doTipo.length === 0) {
      var emptyTpl = document.getElementById(tipo === 'video' ? 'empty-videos' : 'empty-fotos');
      target.appendChild(emptyTpl.content.cloneNode(true));
      return;
    }

    var grid = document.createElement('div');
    grid.className = 'media-grid';
    doTipo.forEach(function (item) { grid.appendChild(criarCard(item)); });
    target.appendChild(grid);
  }

  buscarArquivosDaPasta().then(function (encontrados) {
    var manuais = Array.isArray(window.CONTEUDO) ? window.CONTEUDO : [];
    var todos = encontrados.concat(manuais);

    document.querySelectorAll('.panel-target').forEach(function (el) {
      renderPainel(el, el.dataset.type, todos);
    });
  });

  // Estado inicial do alternador
  setActive('videos');
})();
