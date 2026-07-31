/* ARTASIMN — статический магазин, без сборки. */
(() => {
  const app = document.getElementById('app');
  const PRODUCTS = window.PRODUCTS;
  const INFO = window.INFO_PAGES;

  const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const byId = slug => PRODUCTS.find(p => p.slug === slug);

  /* ---------- хранилище ---------- */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  const basket = {
    all: () => store.get('artasimn.basket'),
    add(slug, size) {
      const items = basket.all();
      const hit = items.find(i => i.slug === slug && i.size === size);
      if (hit) hit.qty++; else items.push({ slug, size, qty: 1 });
      store.set('artasimn.basket', items); syncCount();
    },
    remove(i) { const items = basket.all(); items.splice(i, 1); store.set('artasimn.basket', items); syncCount(); }
  };
  const marks = {
    all: () => store.get('artasimn.bookmarks'),
    has: slug => marks.all().includes(slug),
    toggle(slug) {
      const items = marks.all();
      const i = items.indexOf(slug);
      if (i > -1) items.splice(i, 1); else items.push(slug);
      store.set('artasimn.bookmarks', items);
      return i === -1;
    }
  };
  function syncCount() {
    const n = basket.all().reduce((s, i) => s + i.qty, 0);
    document.getElementById('basket-count').textContent = n;
  }

  /* ---------- вид: с моделями / только товар ---------- */
  let view = localStorage.getItem('artasimn.view') || 'products';
  const setView = v => {
    view = v; localStorage.setItem('artasimn.view', v);
    document.getElementById('view-models').classList.toggle('is-active', v === 'models');
    document.getElementById('view-products').classList.toggle('is-active', v === 'products');
    render();
  };
  document.getElementById('view-models').onclick = () => setView('models');
  document.getElementById('view-products').onclick = () => setView('products');
  // «с моделями» — второй кадр товара, «только товар» — первый
  const cover = p => (view === 'models' && p.photos[1]) ? p.photos[1] : p.photos[0];

  /* ---------- меню shop all ---------- */
  const shopAll = document.getElementById('shop-all');
  const shopSub = document.getElementById('shop-sub');
  const shopChev = document.getElementById('shop-all-chev');
  shopAll.onclick = () => {
    const open = shopSub.hidden;
    shopSub.hidden = !open;
    shopChev.textContent = open ? '>' : '∨';
    shopAll.setAttribute('aria-expanded', String(open));
  };

  /* ---------- маршруты ---------- */
  const route = () => {
    const h = location.hash.replace(/^#\/?/, '');
    const [a, b] = h.split('/');
    return { a: a || '', b: b || '' };
  };

  function render() {
    const { a, b } = route();
    app.innerHTML = '';
    document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('is-active'));

    if (a === 'product') return renderProduct(b);
    if (a === 'basket') return renderBasket();
    if (a === 'bookmarks') return renderBookmarks();
    if (a === 'p') return renderInfo(b);

    let list = PRODUCTS;
    if (a === 'c') {
      list = PRODUCTS.filter(p => p.category === b);
      const link = document.querySelector(`.nav__link[data-cat="${b}"]`);
      if (link) link.classList.add('is-active');
    }
    if (a === 'g') list = PRODUCTS.filter(p => p.group === b);
    renderCatalog(list);
  }

  /* ---------- каталог ---------- */
  function renderCatalog(list) {
    const grid = document.createElement('div');
    grid.className = 'catalog';

    if (!list.length) {
      grid.style.display = 'block';
      grid.innerHTML = '<p class="plain empty">здесь пока пусто</p>';
    }

    list.forEach(p => {
      const card = document.createElement('a');
      card.className = 'card';
      card.href = `#/product/${p.slug}`;
      card.innerHTML = `
        <div class="card__frame">
          <img src="${cover(p)}" alt="${p.title}">
          <div class="card__zones">${p.photos.map(() => '<span></span>').join('')}</div>
        </div>
        <div class="card__meta">
          <div class="dots">${p.photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
          <div class="card__title">${p.title}</div>
          <div class="card__price">${money(p.price)}</div>
        </div>`;

      // наведение на левую/среднюю/правую часть карточки листает фото
      const img = card.querySelector('img');
      const dots = [...card.querySelectorAll('.dots i')];
      card.querySelectorAll('.card__zones span').forEach((zone, i) => {
        zone.onmouseenter = () => {
          img.src = p.photos[i];
          dots.forEach((d, j) => d.classList.toggle('on', i === j));
        };
      });
      card.onmouseleave = () => {
        img.src = cover(p);
        dots.forEach((d, j) => d.classList.toggle('on', j === 0));
      };
      card.onmouseenter = () => setSideBookmark(p.slug);
      grid.appendChild(card);
    });

    app.appendChild(grid);
    mountSideBookmark(list[0] && list[0].slug);
  }

  /* закладка у правого края: сохраняет товар, на который навёл */
  let sideSlug = null;
  function mountSideBookmark(initial) {
    const btn = document.createElement('button');
    btn.className = 'side-bookmark';
    btn.id = 'side-bookmark';
    btn.title = 'в закладки';
    btn.innerHTML = '<img src="assets/icons/bookmark.svg" alt="">';
    btn.onclick = () => { if (sideSlug) { marks.toggle(sideSlug); paintSideBookmark(); } };
    app.appendChild(btn);
    setSideBookmark(initial);
  }
  function setSideBookmark(slug) { sideSlug = slug || sideSlug; paintSideBookmark(); }
  function paintSideBookmark() {
    const btn = document.getElementById('side-bookmark');
    if (btn) btn.classList.toggle('is-on', !!sideSlug && marks.has(sideSlug));
  }

  /* ---------- страница товара ---------- */
  function renderProduct(slug) {
    const start = Math.max(0, PRODUCTS.findIndex(p => p.slug === slug));
    const wrap = document.createElement('div');
    wrap.className = 'pdp';

    PRODUCTS.forEach(p => wrap.appendChild(productSection(p)));
    app.appendChild(wrap);

    // открыть на нужном товаре
    wrap.scrollTop = wrap.children[start].offsetTop - wrap.children[0].offsetTop;
    syncHash(wrap);
  }

  function productSection(p) {
    const sec = document.createElement('section');
    sec.className = 'pdp__item';
    sec.dataset.slug = p.slug;
    sec.innerHTML = `
      <div class="gallery">
        <div class="gallery__track">
          ${p.photos.map(src => `<img src="${src}" alt="${p.title}" draggable="false">`).join('')}
        </div>
        <div class="dots">${p.photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
        <button class="gallery__arrow gallery__arrow--prev" aria-label="назад">&#8249;</button>
        <button class="gallery__arrow gallery__arrow--next" aria-label="вперёд">&#8250;</button>
      </div>
      <div class="pdp__info">
        <div class="pdp__title">${p.title}</div>
        <div class="pdp__price">${money(p.price)}</div>
        <div class="pdp__sizes-label">size</div>
        <div class="sizes">${p.sizes.map(s => `<button data-size="${s}">${s}</button>`).join('')}</div>
        <div class="disclosure">
          <button class="disclosure__btn">description <span class="chev">∨</span></button>
          <div class="disclosure__body" hidden>${p.description}</div>
        </div>
        <button class="add">+ add to basket</button>
      </div>`;

    /* --- горизонтальная лента фото --- */
    const track = sec.querySelector('.gallery__track');
    const dots = [...sec.querySelectorAll('.dots i')];
    const go = i => track.scrollTo({ left: track.clientWidth * i, behavior: 'smooth' });
    const index = () => Math.round(track.scrollLeft / track.clientWidth);

    track.addEventListener('scroll', () => {
      const i = index();
      dots.forEach((d, j) => d.classList.toggle('on', i === j));
    }, { passive: true });

    sec.querySelector('.gallery__arrow--prev').onclick = () => go(Math.max(0, index() - 1));
    sec.querySelector('.gallery__arrow--next').onclick = () => go(Math.min(p.photos.length - 1, index() + 1));

    // трекпад: горизонтальный жест листает фото, вертикальный — товары
    sec.querySelector('.gallery').addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.stopPropagation();
        track.scrollLeft += e.deltaX;
      }
    }, { passive: true });

    // перетаскивание мышью
    let down = false, x0 = 0, l0 = 0;
    track.addEventListener('pointerdown', e => {
      down = true; x0 = e.clientX; l0 = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', e => {
      if (!down) return;
      track.scrollLeft = l0 - (e.clientX - x0);
    });
    const up = () => { if (down) { down = false; go(index()); } };
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);

    /* --- размеры / описание / корзина --- */
    let size = null;
    sec.querySelectorAll('.sizes button').forEach(b => {
      b.onclick = () => {
        size = b.dataset.size;
        sec.querySelectorAll('.sizes button').forEach(o => o.classList.toggle('on', o === b));
      };
    });
    const disc = sec.querySelector('.disclosure__btn');
    const body = sec.querySelector('.disclosure__body');
    disc.onclick = () => {
      body.hidden = !body.hidden;
      disc.querySelector('.chev').textContent = body.hidden ? '∨' : '∧';
    };
    const add = sec.querySelector('.add');
    add.onclick = () => {
      if (!size) {
        add.textContent = 'выбери размер';
        setTimeout(() => { add.textContent = '+ add to basket'; }, 1400);
        return;
      }
      basket.add(p.slug, size);
      add.textContent = '+ добавлено';
      add.classList.add('is-done');
      setTimeout(() => { add.textContent = '+ add to basket'; add.classList.remove('is-done'); }, 1400);
    };
    return sec;
  }

  // адрес в строке браузера следует за вертикальным скроллом товаров
  function syncHash(wrap) {
    let tick = null;
    wrap.addEventListener('scroll', () => {
      clearTimeout(tick);
      tick = setTimeout(() => {
        const i = Math.round(wrap.scrollTop / wrap.clientHeight);
        const sec = wrap.children[i];
        if (!sec) return;
        const next = `#/product/${sec.dataset.slug}`;
        if (location.hash !== next) history.replaceState(null, '', next);
      }, 90);
    }, { passive: true });
  }

  /* ---------- корзина / закладки / тексты ---------- */
  function renderBasket() {
    const items = basket.all();
    const box = document.createElement('div');
    box.className = 'plain';
    const total = items.reduce((s, i) => s + (byId(i.slug)?.price || 0) * i.qty, 0);
    box.innerHTML = `<h1>корзина</h1>` + (items.length
      ? items.map((i, n) => {
          const p = byId(i.slug); if (!p) return '';
          return `<div class="row">
            <img src="${p.photos[0]}" alt="">
            <a href="#/product/${p.slug}">${p.title}</a>
            <span>${i.size} × ${i.qty}</span>
            <span>${money(p.price * i.qty)}</span>
            <button class="rm" data-i="${n}">убрать</button>
          </div>`;
        }).join('') + `<div class="total">итого ${money(total)}</div>`
      : `<p class="empty">пусто</p>`);
    box.querySelectorAll('.rm').forEach(b => b.onclick = () => { basket.remove(+b.dataset.i); render(); });
    app.appendChild(box);
  }

  function renderBookmarks() {
    const list = marks.all().map(byId).filter(Boolean);
    if (!list.length) {
      const box = document.createElement('div');
      box.className = 'plain';
      box.innerHTML = '<h1>закладки</h1><p class="empty">пусто</p>';
      app.appendChild(box);
      return;
    }
    renderCatalog(list);
  }

  function renderInfo(key) {
    const page = INFO[key];
    const box = document.createElement('div');
    box.className = 'plain';
    box.innerHTML = page
      ? `<h1>${page.title}</h1><p>${page.body}</p>`
      : '<h1>404</h1><p class="empty">страница не найдена</p>';
    app.appendChild(box);
  }

  /* ---------- старт ---------- */
  window.addEventListener('hashchange', () => {
    const { a } = route();
    // при скролле внутри карточек hash меняем сами — перерисовывать не нужно
    if (a === 'product' && document.querySelector('.pdp')) return;
    render();
  });
  syncCount();
  setView(view);
})();
