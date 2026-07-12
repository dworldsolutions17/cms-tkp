import { useState, useEffect } from 'react';
import { MessageCircle, Eye, Loader, RefreshCw, User, Bot } from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/ui/Pagination';

interface ChatMessage {
  id: number;
  sessionId: string;
  customerId?: number;
  customerName?: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  sessionId: string;
  lastMsg: string;
  msgCount: number;
  custName: string | null;
  custId: number | null;
}

const ChatHistory = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchConversations();
  }, [currentPage]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/chat/conversations', { params: { page: currentPage, limit: pageSize } });
      const body = response.data;
      const payload = body?.data || body;
      setConversations(Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : []);
      setTotalPages(payload?.meta?.totalPages || body?.meta?.totalPages || 1);
      setTotalItems(payload?.meta?.total || body?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewConversation = async (sessionId: string) => {
    setSelectedConversation(sessionId);
    setLoadingMessages(true);
    try {
      const response = await api.get(`/chat/conversations/${sessionId}`);
      const payload = response.data?.data || response.data;
      setMessages(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat History</h1>
          <p className="text-gray-600">View AI assistant conversations with customers</p>
        </div>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {selectedConversation ? (
        <div>
          <button
            onClick={() => setSelectedConversation(null)}
            className="mb-4 flex items-center gap-2 text-primary hover:underline text-sm"
          >
            &larr; Back to conversations
          </button>
          <div className="bg-white rounded-lg shadow border border-gray-100">
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
              <h2 className="font-semibold text-gray-900">Conversation: {selectedConversation}</h2>
            </div>
            <div className="p-6 max-h-[600px] overflow-y-auto space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-gray-500 py-12">No messages found</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="max-w-[70%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-100 text-blue-900 rounded-br-md'
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-2">{formatDate(msg.createdAt)}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Session</th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Messages</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Last Message</th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <Loader className="w-6 h-6 text-primary animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : conversations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-500">
                        <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        No conversations yet
                      </td>
                    </tr>
                  ) : (
                    conversations.map((conv) => (
                      <tr key={conv.sessionId} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {conv.custName || 'Guest'}
                              </p>
                              {conv.custId && (
                                <p className="text-xs text-gray-500">ID: {conv.custId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          {conv.sessionId?.slice(0, 16)}...
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {conv.msgCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(conv.lastMsg)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => viewConversation(conv.sessionId)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="View conversation"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
