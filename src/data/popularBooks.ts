export interface PopularBook {
  id: string;
  title: string;
  author: string;
  cover: string;
}

export const POPULAR_BOOKS: PopularBook[] = [
  {
    id: '1',
    title: 'Atomic Habits',
    author: 'James Clear',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg'
  },
  {
    id: '2',
    title: 'Rich Dad Poor Dad',
    author: 'Robert Kiyosaki',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388211242i/69571.jpg'
  },
  {
    id: '3',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg'
  },
  {
    id: '4',
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1463241782i/30186948.jpg'
  },
  {
    id: '5',
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen Covey',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1421842784i/36072.jpg'
  },
  {
    id: '6',
    title: 'How to Win Friends and Influence People',
    author: 'Dale Carnegie',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1442726934i/4865.jpg'
  },
  {
    id: '7',
    title: 'Deep Work',
    author: 'Cal Newport',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1447957962i/25744928.jpg'
  },
  {
    id: '8',
    title: "Can't Hurt Me",
    author: 'David Goggins',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1536184191i/41721428.jpg'
  },
  {
    id: '9',
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1465761302i/28257707.jpg'
  },
  {
    id: '10',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329310i/23692271.jpg'
  }
];

export const INTEREST_CATEGORIES = [
  'Love',
  'Business',
  'Habits',
  'Self-Improvement',
  'Psychology',
  'Productivity',
  'Finance',
  'Philosophy',
  'History',
  'Science'
];
