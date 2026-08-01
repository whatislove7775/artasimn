/* ARTASIMN — статический магазин, без сборки. */
(() => {
  const app = document.getElementById('app');
  const PRODUCTS = window.PRODUCTS;
  const INFO = window.INFO_PAGES;

  const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const byId = slug => PRODUCTS.find(p => p.slug === slug);
  // размер показываем только когда он есть из чего выбирать
  const hasSizes = p => p.sizes.length > 1;

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
      store.set('artasimn.basket', items);
    },
    remove(i) { const items = basket.all(); items.splice(i, 1); store.set('artasimn.basket', items); },
    clear() { store.set('artasimn.basket', []); }
  };
  const favourites = {
    all: () => store.get('artasimn.favourites'),
    has: slug => favourites.all().includes(slug),
    toggle(slug) {
      const items = favourites.all();
      const i = items.indexOf(slug);
      if (i > -1) items.splice(i, 1); else items.push(slug);
      store.set('artasimn.favourites', items);
      return i === -1;
    },
    remove(slug) {
      const items = favourites.all().filter(s => s !== slug);
      store.set('artasimn.favourites', items);
    }
  };

  /* оформление заказа: пока без бэкенда — заказ сохраняется локально */
  function placeOrder(items) {
    const orders = store.get('artasimn.orders');
    orders.push({ at: new Date().toISOString(), items });
    store.set('artasimn.orders', orders);
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
    // футер — только на главной
    document.getElementById('foot').hidden = !(a === '' || a === 'c' || a === 'g');
    document.querySelectorAll('.nav__link').forEach(l => l.classList.remove('is-active'));

    if (a === 'product') return renderProduct(b);
    if (a === 'basket') return renderBasket();
    if (a === 'favourites') return renderFavourites();
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
          <div class="photo" role="img" aria-label="${p.title}"></div>
          <div class="card__zones">${p.photos.map(() => '<span></span>').join('')}</div>
          <button class="card__mark" aria-label="в избранное" title="в избранное">
            <img src="bookmark.svg" alt="">
          </button>
        </div>
        <div class="card__meta">
          <div class="dots">${p.photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
          <div class="card__title">${p.title}</div>
          <div class="card__price">${money(p.price)}</div>
        </div>`;

      // наведение на левую/среднюю/правую часть карточки листает фото
      const photo = card.querySelector('.photo');
      const show = src => { photo.style.backgroundImage = `url("${encodeURI(src)}")`; };
      show(cover(p));
      const dots = [...card.querySelectorAll('.dots i')];
      card.querySelectorAll('.card__zones span').forEach((zone, i) => {
        zone.onmouseenter = () => {
          show(p.photos[i]);
          dots.forEach((d, j) => d.classList.toggle('on', i === j));
        };
      });
      card.onmouseleave = () => {
        show(cover(p));
        dots.forEach((d, j) => d.classList.toggle('on', j === 0));
      };

      // иконка в углу фото — избранное: чёрная, когда товар добавлен
      const mark = card.querySelector('.card__mark');
      mark.classList.toggle('is-on', favourites.has(p.slug));
      mark.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        mark.classList.toggle('is-on', favourites.toggle(p.slug));
      };
      grid.appendChild(card);
    });

    app.appendChild(grid);
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
          ${p.photos.map(src => `<div class="gallery__slide photo" role="img" aria-label="${p.title}"
             style="background-image:url('${encodeURI(src)}')"></div>`).join('')}
        </div>
        <div class="dots">${p.photos.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>
        <button class="gallery__arrow gallery__arrow--prev" aria-label="назад">&#8249;</button>
        <button class="gallery__arrow gallery__arrow--next" aria-label="вперёд">&#8250;</button>
      </div>
      <div class="pdp__info">
        <div class="pdp__title">${p.title}</div>
        <div class="pdp__price">${money(p.price)}</div>
        ${hasSizes(p) ? `
        <div class="pdp__sizes-label">size</div>
        <div class="sizes">${p.sizes.map(s => `<button data-size="${s}">${s}</button>`).join('')}</div>` : ''}
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
    let size = hasSizes(p) ? null : p.sizes[0];
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
        flash(add, 'выбери размер', '+ add to basket');
        return;
      }
      basket.add(p.slug, size);
      flash(add, '+ добавлено', '+ add to basket');
    };
    return sec;
  }

  function flash(btn, text, back) {
    btn.textContent = text;
    btn.classList.add('is-done');
    setTimeout(() => { btn.textContent = back; btn.classList.remove('is-done'); }, 1400);
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

  /* ---------- корзина ---------- */
  function renderBasket() {
    const items = basket.all();
    const box = document.createElement('div');
    box.className = 'plain';
    const total = items.reduce((s, i) => s + (byId(i.slug)?.price || 0) * i.qty, 0);

    box.innerHTML = `<h1>корзина</h1>` + (items.length
      ? items.map((i, n) => {
          const p = byId(i.slug); if (!p) return '';
          return `<div class="row">
            <div class="row__photo photo" style="background-image:url('${encodeURI(p.photos[0])}')" role="img" aria-label="${p.title}"></div>
            <a class="row__title" href="#/product/${p.slug}">${p.title}</a>
            <span>${hasSizes(p) ? i.size + ' × ' : '× '}${i.qty}</span>
            <span>${money(p.price * i.qty)}</span>
            <button class="rm" data-i="${n}">убрать</button>
          </div>`;
        }).join('') +
        `<div class="total">итого ${money(total)}</div>
         <button class="order" id="order-all">order — заказать всё</button>`
      : `<p class="empty">пусто</p>`);

    box.querySelectorAll('.rm').forEach(b => b.onclick = () => { basket.remove(+b.dataset.i); render(); });
    const orderAll = box.querySelector('#order-all');
    if (orderAll) orderAll.onclick = () => {
      placeOrder(basket.all());
      basket.clear();
      render();
      const done = document.createElement('p');
      done.className = 'done';
      done.textContent = 'заказ оформлен — мы свяжемся с вами';
      app.querySelector('.plain').appendChild(done);
    };
    app.appendChild(box);
  }

  /* ---------- избранное ---------- */
  function renderFavourites() {
    const list = favourites.all().map(byId).filter(Boolean);
    const box = document.createElement('div');
    box.className = 'plain';

    box.innerHTML = `<h1>избранное</h1>` + (list.length
      ? list.map(p => `<div class="row">
            <div class="row__photo photo" style="background-image:url('${encodeURI(p.photos[0])}')" role="img" aria-label="${p.title}"></div>
            <a class="row__title" href="#/product/${p.slug}">${p.title}</a>
            <span>${money(p.price)}</span>
            <button class="order order--row" data-order="${p.slug}">order</button>
            <button class="rm" data-rm="${p.slug}">убрать</button>
          </div>`).join('') +
        `<button class="order" id="fav-to-basket">отправить всё в корзину</button>`
      : `<p class="empty">пусто</p>`);

    // заказать один товар из избранного
    box.querySelectorAll('[data-order]').forEach(b => b.onclick = () => {
      const p = byId(b.dataset.order);
      placeOrder([{ slug: p.slug, size: p.sizes[0], qty: 1 }]);
      flash(b, 'заказано', 'order');
    });
    box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { favourites.remove(b.dataset.rm); render(); });

    const toBasket = box.querySelector('#fav-to-basket');
    if (toBasket) toBasket.onclick = () => {
      list.forEach(p => basket.add(p.slug, p.sizes[0]));
      flash(toBasket, 'в корзине', 'отправить всё в корзину');
    };
    app.appendChild(box);
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
  setView(view);
})();
