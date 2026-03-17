/**
 * Curated royalty-free barbershop photos from Unsplash.
 * All images are free for commercial use under the Unsplash License.
 * https://unsplash.com/license
 */

export interface StockPhoto {
  id: string;
  url: string;
  label: string;
  category: 'action' | 'tools' | 'interior' | 'result';
  credit: string;
}

// Using Unsplash source URLs — stable, CDN-backed, free for commercial use
export const STOCK_PHOTOS: StockPhoto[] = [
  {
    id: 'barber-action-1',
    url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=1200&h=1200&fit=crop&q=80',
    label: 'Barber giving a fade',
    category: 'action',
    credit: 'Unsplash',
  },
  {
    id: 'barber-action-2',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&h=1200&fit=crop&q=80',
    label: 'Barber at work',
    category: 'action',
    credit: 'Unsplash',
  },
  {
    id: 'barber-action-3',
    url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&h=1200&fit=crop&q=80',
    label: 'Precision haircut',
    category: 'action',
    credit: 'Unsplash',
  },
  {
    id: 'shop-interior-1',
    url: 'https://images.unsplash.com/photo-1585747860019-8031ae2facb8?w=1200&h=1200&fit=crop&q=80',
    label: 'Barbershop interior',
    category: 'interior',
    credit: 'Unsplash',
  },
  {
    id: 'shop-interior-2',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=1200&h=1200&fit=crop&q=80',
    label: 'Barber chair',
    category: 'interior',
    credit: 'Unsplash',
  },
  {
    id: 'tools-1',
    url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=1200&h=1200&fit=crop&q=80',
    label: 'Barber tools closeup',
    category: 'tools',
    credit: 'Unsplash',
  },
  {
    id: 'tools-2',
    url: 'https://images.unsplash.com/photo-1582771013716-000cf56d3bd5?w=1200&h=1200&fit=crop&q=80',
    label: 'Clippers and scissors',
    category: 'tools',
    credit: 'Unsplash',
  },
  {
    id: 'result-1',
    url: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&h=1200&fit=crop&q=80',
    label: 'Fresh fade result',
    category: 'result',
    credit: 'Unsplash',
  },
  {
    id: 'result-2',
    url: 'https://images.unsplash.com/photo-1519019121204-8e27e7bf1c43?w=1200&h=1200&fit=crop&q=80',
    label: 'Clean cut portrait',
    category: 'result',
    credit: 'Unsplash',
  },
  {
    id: 'barber-action-4',
    url: 'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=1200&h=1200&fit=crop&q=80',
    label: 'Beard trim',
    category: 'action',
    credit: 'Unsplash',
  },
];
