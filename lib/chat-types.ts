export type OrderStatus = 'new' | 'active' | 'closed';
export type ChatMessage = {
  id: number;
  sender: 'customer' | 'admin';
  body: string;
  createdAt: number;
};
export type Conversation = {
  id: string;
  customerName: string;
  contact: string;
  reference: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  customerReadId: number;
  adminReadId: number;
};
export type ChatThread = {
  conversation: Conversation;
  messages: ChatMessage[];
  hasEarlier: boolean;
};
export type ConversationPreview = Conversation & {
  lastMessage: string;
  unread: number;
};
export const statusLabels: Record<OrderStatus, string> = {
  new: 'Nova encomenda',
  active: 'Em conversa',
  closed: 'Finalizada',
};
