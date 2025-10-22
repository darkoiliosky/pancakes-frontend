export interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  ingredients?: string[];
  restaurant_id?: number;
}
