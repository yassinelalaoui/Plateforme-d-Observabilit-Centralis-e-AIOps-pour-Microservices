export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface Order {
  id: string;
  userId: string;
  description: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrdersResponse {
  orders: Order[];
}
