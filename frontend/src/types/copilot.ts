export interface ChatMessageRequest {
  message: string;
}

export interface ChatMessageResponse {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  metrics_snapshot?: Record<string, any>;
  suggested_queries?: string[];
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessageResponse[];
  total: number;
}
