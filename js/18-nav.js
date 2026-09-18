/* ===== Shared Page Navigation ===== */
(function () {
  const PAGES = [
    { href: 'index.html',        key: 'index',        icon: 'ankh',  label: 'Home'  },
    { href: 'game.html',         key: 'game',         icon: 'sword', label: 'Duel'  },
    { href: 'deck-builder.html', key: 'deck-builder', icon: 'deck',  label: 'Deck'  },
    { href: 'packs.html',        key: 'packs',        icon: 'cards', label: 'Packs' },
  ];

  function currentKey() {
    const file = (location.pathname.split('/').pop() || 'index.html')
                   .replace(/\.html?$/i, '');
    return file || 'index';
  }

  function build() {
    if (document.querySelector('.page-nav')) return;
    const cur = currentKey();
    const nav = document.createElement('nav');
    nav.className = 'page-nav';
    nav.setAttribute('aria-label', 'Primary');
    PAGES.forEach(p => {
      const a = document.createElement('a');
      a.href = p.href;
      a.className = 'nav-btn' + (p.key === cur ? ' active' : '');
      a.setAttribute('aria-current', p.key === cur ? 'page' : 'false');
      a.innerHTML = `<span class="nav-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="#${p.icon}"></use></svg></span><span>${p.label}</span>`;
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();