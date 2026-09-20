export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  children?: Category[];
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceCzk: number | string;
  stock: number;
  images: string[];
  isActive: boolean;
  categoryId?: string;
  category?: { id: string; name: string; slug: string };
  createdAt: string;
}

export interface MilitaryUnit {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  _count?: { orders: number };
  createdAt?: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCzk: number | string;
  product?: { id: string; slug: string; images: string[] };
}

export interface Payment {
  id: string;
  orderId: string;
  amountCzk: number | string;
  status: PaymentStatus;
  qrPayload: string;
  fioTransactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalCzk: number | string;
  donationAmount: number | string;
  variableSymbol: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  note?: string;
  militaryUnitId?: string;
  militaryUnit?: { id: string; name: string } | null;
  fundsUsed: boolean;
  confirmationSentAt?: string | null;
  items: OrderItem[];
  payment?: Payment;
  createdAt: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt?: string | null;
}
