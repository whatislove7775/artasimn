/* Каталог. Чтобы поменять товар — правь этот файл.
   photos: путь до фото (можно .jpg/.png — просто положи файлы в assets/products/)
   category: 'jewellery' | 'clothes'
   group: 't-shirts' | 'jeans' | 'rings' | 'bracelets' | 'other'   */

window.PRODUCTS = [
  {
    slug: 'ring-braid',
    title: "ring ‘braid’",
    price: 16400,
    category: 'jewellery',
    group: 'rings',
    sizes: ['16', '17', '18', '19'],
    description:
      'серебро 925, ручная работа. вес ~9 г. каждое кольцо отливается и патинируется вручную, поэтому фактура плетения уникальна.',
    photos: [
      'assets/products/ring-braid-1.svg',
      'assets/products/ring-braid-2.svg',
      'assets/products/ring-braid-3.svg'
    ]
  },
  {
    slug: 'tee-print',
    title: "t-shirt ‘print’",
    price: 8900,
    category: 'clothes',
    group: 't-shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    description:
      'безрукавка, 100% хлопок 240 г/м², oversize. принт — шелкография, стирка при 30°.',
    photos: [
      'assets/products/tee-print-1.svg',
      'assets/products/tee-print-2.svg',
      'assets/products/tee-print-3.svg'
    ]
  },
  {
    slug: 'ring-classic',
    title: "ring ‘classic’",
    price: 18700,
    category: 'jewellery',
    group: 'rings',
    sizes: ['16', '17', '18', '19'],
    description:
      'серебро 925, ручная работа. крест-пазл, матовая полировка. вес ~12 г. срок изготовления 5–14 дней.',
    photos: [
      'assets/products/ring-classic-1.svg',
      'assets/products/ring-classic-2.svg',
      'assets/products/ring-classic-3.svg'
    ]
  },
  {
    slug: 'keychain',
    title: 'keychain',
    price: 4200,
    category: 'jewellery',
    group: 'other',
    sizes: ['one size'],
    description: 'карабин из нержавеющей стали, фигурка и кольца в комплекте.',
    photos: [
      'assets/products/keychain-1.svg',
      'assets/products/keychain-2.svg',
      'assets/products/keychain-3.svg'
    ]
  },
  {
    slug: 'cap',
    title: "cap ‘washed’",
    price: 6300,
    category: 'clothes',
    group: 'other',
    sizes: ['one size'],
    description: 'кепка, хлопок, ручная выварка и потёртости. регулируемый ремешок.',
    photos: [
      'assets/products/cap-1.svg',
      'assets/products/cap-2.svg',
      'assets/products/cap-3.svg'
    ]
  },
  {
    slug: 'sweatshirt',
    title: "sweatshirt ‘cross’",
    price: 13500,
    category: 'clothes',
    group: 't-shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'свитшот, футер трёхнитка, вышивка на груди, укороченный крой.',
    photos: [
      'assets/products/sweatshirt-1.svg',
      'assets/products/sweatshirt-2.svg',
      'assets/products/sweatshirt-3.svg'
    ]
  }
];

window.INFO_PAGES = {
  'about': {
    title: 'о создателе',
    body: 'artasimn — независимый проект: украшения из серебра 925 и одежда малыми партиями. всё делается вручную, без перепродажи и без масс-маркета.'
  },
  'privacy': {
    title: 'политика конфиденциальности',
    body: 'мы собираем только те данные, которые нужны для оформления и доставки заказа: имя, телефон, e-mail и адрес. данные не передаются третьим лицам, кроме служб доставки и платёжного провайдера.'
  },
  'offer': {
    title: 'оферта',
    body: 'настоящий документ является публичной офертой. оформление заказа на сайте означает согласие с условиями продажи, сроками изготовления и правилами возврата.'
  },
  'info': {
    title: 'инфо',
    body: 'доставка по россии и миру. срок изготовления украшений 5–14 дней. по вопросам — почта на странице «о создателе».'
  }
};
