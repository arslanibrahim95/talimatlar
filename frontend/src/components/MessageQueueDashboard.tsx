import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { 
  MessageSquare, 
  Send, 
  Download, 
  Activity, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  topic: string;
  payload: Record<string, any>;
  priority: number;
  retry_count: number;
  max_retries: number;
  created_at: string;
  status?: string;
}

interface QueueStats {
  topic: string;
  total_messages: number;
  pending_messages: number;
  processed_messages: number;
  failed_messages: number;
  consumers: number;
}

interface TopicInfo {
  name: string;
  stats: QueueStats;
}

const MessageQueueDashboard: React.FC = () => {
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({
    topic: '',
    payload: '',
    priority: 5
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockTopics: TopicInfo[] = [
      {
        name: 'notifications',
        stats: {
          topic: 'notifications',
          total_messages: 1250,
          pending_messages: 45,
          processed_messages: 1180,
          failed_messages: 25,
          consumers: 3
        }
      },
      {
        name: 'audit',
        stats: {
          topic: 'audit',
          total_messages: 3420,
          pending_messages: 12,
          processed_messages: 3400,
          failed_messages: 8,
          consumers: 2
        }
      },
      {
        name: 'document_processing',
        stats: {
          topic: 'document_processing',
          total_messages: 890,
          pending_messages: 23,
          processed_messages: 850,
          failed_messages: 17,
          consumers: 4
        }
      },
      {
        name: 'user_activity',
        stats: {
          topic: 'user_activity',
          total_messages: 5670,
          pending_messages: 8,
          processed_messages: 5650,
          failed_messages: 12,
          consumers: 2
        }
      }
    ];

    setTopics(mockTopics);
  }, []);

  const handlePublishMessage = async () => {
    if (!newMessage.topic || !newMessage.payload) {
      setError('Topic and payload are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setNewMessage({ topic: '', payload: '', priority: 5 });
      
      // Refresh topics
      // In real implementation, this would refresh the data
      
    } catch (err) {
      setError('Failed to publish message');
    } finally {
      setLoading(false);
    }
  };

  const handleConsumeMessages = async (topic: string) => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock messages
      const mockMessages: Message[] = [
        {
          id: 'msg_1',
          topic: topic,
          payload: { message: 'Test message 1', type: 'info' },
          priority: 5,
          retry_count: 0,
          max_retries: 3,
          created_at: new Date().toISOString(),
          status: 'pending'
        },
        {
          id: 'msg_2',
          topic: topic,
          payload: { message: 'Test message 2', type: 'warning' },
          priority: 7,
          retry_count: 1,
          max_retries: 3,
          created_at: new Date().toISOString(),
          status: 'processing'
        }
      ];

      setMessages(mockMessages);
      
    } catch (err) {
      setError('Failed to consume messages');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800';
    if (priority >= 6) return 'bg-orange-100 text-orange-800';
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Message Queue Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor and manage message queues across all services
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Topics
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {topics.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Send className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {topics.reduce((sum, topic) => sum + topic.stats.total_messages, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Messages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {topics.reduce((sum, topic) => sum + topic.stats.pending_messages, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Consumers
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {topics.reduce((sum, topic) => sum + topic.stats.consumers, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="topics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="publish">Publish Message</TabsTrigger>
          <TabsTrigger value="consume">Consume Messages</TabsTrigger>
        </TabsList>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <Card key={topic.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{topic.name.replace('_', ' ')}</span>
                    <Badge variant="outline">{topic.stats.consumers} consumers</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
                        <p className="text-lg font-semibold">{topic.stats.total_messages.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                        <p className="text-lg font-semibold text-yellow-600">{topic.stats.pending_messages}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Processed</p>
                        <p className="text-lg font-semibold text-green-600">{topic.stats.processed_messages.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                        <p className="text-lg font-semibold text-red-600">{topic.stats.failed_messages}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                        <span className="text-sm font-medium">
                          {((topic.stats.processed_messages / topic.stats.total_messages) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(topic.stats.processed_messages / topic.stats.total_messages) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Publish Message Tab */}
        <TabsContent value="publish" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publish New Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Topic
                </label>
                <Input
                  value={newMessage.topic}
                  onChange={(e) => setNewMessage({ ...newMessage, topic: e.target.value })}
                  placeholder="e.g., notifications, audit, document_processing"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority (1-10)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newMessage.priority}
                  onChange={(e) => setNewMessage({ ...newMessage, priority: parseInt(e.target.value) })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payload (JSON)
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  rows={6}
                  value={newMessage.payload}
                  onChange={(e) => setNewMessage({ ...newMessage, payload: e.target.value })}
                  placeholder='{"message": "Hello World", "type": "info"}'
                />
              </div>
              
              <Button 
                onClick={handlePublishMessage} 
                disabled={loading || !newMessage.topic || !newMessage.payload}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish Message
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Consume Messages Tab */}
        <TabsContent value="consume" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consume Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Topic
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  <option value="">Select a topic...</option>
                  {topics.map((topic) => (
                    <option key={topic.name} value={topic.name}>
                      {topic.name} ({topic.stats.pending_messages} pending)
                    </option>
                  ))}
                </select>
              </div>
              
              <Button 
                onClick={() => handleConsumeMessages(selectedTopic)} 
                disabled={loading || !selectedTopic}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Consuming...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Consume Messages
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Messages List */}
          {messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Consumed Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border border-gray-200 rounded-lg p-4 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.status)}
                          <span className="font-medium text-sm">{message.id}</span>
                          <Badge className={getPriorityColor(message.priority)}>
                            Priority {message.priority}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Topic: <span className="font-medium">{message.topic}</span>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(message.payload, null, 2)}
                        </pre>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>Retries: {message.retry_count}/{message.max_retries}</span>
                        <div className="space-x-2">
                          <Button size="sm" variant="outline">Acknowledge</Button>
                          <Button size="sm" variant="outline">Retry</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessageQueueDashboard;
