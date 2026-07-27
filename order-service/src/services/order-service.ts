import type { Order, OrdersResponse } from '../models/order.js';
import type { OrderRepository } from '../repositories/order-repository.js';

export class DatastoreUnavailableError extends Error {}

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}
  async getOrders(): Promise<OrdersResponse> {
    try {
      const orders: Order[] = await this.repository.findAll();
      return { orders };
    } catch (error) {
      throw new DatastoreUnavailableError('Order datastore is unavailable', { cause: error });
    }
  }
}
