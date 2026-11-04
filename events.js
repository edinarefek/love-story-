// Список событий вашей истории любви

const EVENTS_DATA = [
  {
    id: 1,
    date: "2023-07-23",
    displayDate: "23 июля 2023",
    title: "Первые сообщения о встрече",
    label: "Начало",
    description: "«А я в огромной кофте! — Ну еще не вечер... — Я тут». Тот самый судьбоносный момент на набережной.",
    image: "assets/images/event-1.jpg",
    tag: "Первая встреча"
  },
  {
    id: 2,
    date: "2023-08-09",
    displayDate: "9 августа 2023",
    title: "Совместная игра",
    label: "Катки вместе",
    description: "Наши катки в Mobile Legends: «наказание» и «Миротворец». Тогда мы ещё не фоткались вместе, а просто по-тихому фоткали друг друга.",
    image: "assets/images/event-2.jpg",
    tag: "Первые дни"
  },
  {
    id: 3,
    date: "2023-08-16",
    displayDate: "16 августа 2023",
    title: "Та самая футболка",
    label: "Подарок",
    description: "Футболка, которую ты мне подарила после того, как сбежала от друзей с концерта ради меня.",
    image: "assets/images/event-3b.jpg",
    extraImage: "assets/images/event-3a.jpg",
    tag: "Подарок"
  },
  {
    id: 4,
    date: "",
    displayDate: "",
    title: "Романтическая прогулка",
    label: "Мы рядом",
    description: "Один из наших самых нежных моментов вместе с букетом цветов и объятиями.",
    image: "assets/images/event-walk.jpg",
    tag: "Прогулка"
  },
  {
    id: 5,
    date: "2025-10-26",
    displayDate: "26 октября 2025",
    title: "Предложение",
    label: "Она сказала Да",
    description: "Она была без ума от колечка, ей безумно понравилось, и она чувствовала себя немножко неловко, когда я делал ей предложение на людях в дождевиках в горах.",
    image: "assets/images/event-proposal.jpg",
    tag: "Помолвка"
  },
  {
    id: 6,
    date: "2026-07-24",
    displayDate: "24 июля 2026",
    title: "День нашей свадьбы",
    label: "Семья",
    description: "Самый красивый и главный день, когда мы стали мужем и женой.",
    image: "assets/images/event-wedding.jpg",
    tag: "Свадьба"
  }
];

// Дата старта отсчёта отношений (23 июля 2023 года)
const RELATIONSHIP_START_DATE = new Date("2023-07-23T00:00:00");
