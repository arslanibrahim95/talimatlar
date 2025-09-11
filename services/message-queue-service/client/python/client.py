import json
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
import requests
from dataclasses import dataclass, asdict


@dataclass
class Message:
    id: str
    topic: str
    payload: Dict[str, Any]
    priority: int
    retry_count: int
    max_retries: int
    created_at: str
    scheduled_at: Optional[str] = None
    expires_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class MessageRequest:
    topic: str
    payload: Dict[str, Any]
    priority: int = 5
    max_retries: int = 3
    scheduled_at: Optional[str] = None
    expires_at: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class MessageResponse:
    id: str
    status: str
    message: str
    timestamp: str


@dataclass
class ConsumeRequest:
    topic: str
    consumer: str
    count: int = 1
    block_time: int = 1000


@dataclass
class ConsumeResponse:
    success: bool
    messages: List[Message]
    count: int
    message: str


@dataclass
class QueueStats:
    topic: str
    total_messages: int
    pending_messages: int
    processed_messages: int
    failed_messages: int
    consumers: int


@dataclass
class HealthResponse:
    status: str
    service: str
    timestamp: int
    version: str
    uptime: str
    redis_status: str


class MessageQueueClient:
    """Client for interacting with the Message Queue Service"""
    
    def __init__(self, base_url: str, timeout: int = 30):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'MessageQueueClient/1.0'
        })

    def _make_request(self, endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to the message queue service"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=self.timeout)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, timeout=self.timeout)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, timeout=self.timeout)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    def publish(self, request: MessageRequest) -> MessageResponse:
        """Publish a message to a topic"""
        data = asdict(request)
        response = self._make_request('/api/v1/messages/publish', 'POST', data)
        return MessageResponse(**response)

    def publish_bulk(self, messages: List[MessageRequest]) -> Dict[str, Any]:
        """Publish multiple messages"""
        data = {'messages': [asdict(msg) for msg in messages]}
        return self._make_request('/api/v1/messages/publish-bulk', 'POST', data)

    def consume(self, request: ConsumeRequest) -> ConsumeResponse:
        """Consume messages from a topic"""
        data = asdict(request)
        response = self._make_request('/api/v1/messages/consume', 'POST', data)
        
        # Convert messages to Message objects
        messages = [Message(**msg) for msg in response['messages']]
        response['messages'] = messages
        
        return ConsumeResponse(**response)

    def acknowledge(self, message_id: str, topic: str, consumer: str) -> MessageResponse:
        """Acknowledge a message"""
        data = {'topic': topic, 'consumer': consumer}
        response = self._make_request(f'/api/v1/messages/{message_id}/ack', 'POST', data)
        return MessageResponse(**response)

    def negative_acknowledge(self, message_id: str, topic: str, consumer: str, retry: bool = False) -> MessageResponse:
        """Negative acknowledge a message"""
        data = {'topic': topic, 'consumer': consumer, 'retry': retry}
        response = self._make_request(f'/api/v1/messages/{message_id}/nack', 'POST', data)
        return MessageResponse(**response)

    def get_message_status(self, message_id: str) -> MessageResponse:
        """Get message status"""
        response = self._make_request(f'/api/v1/messages/{message_id}/status')
        return MessageResponse(**response)

    def list_topics(self) -> List[str]:
        """List all topics"""
        response = self._make_request('/api/v1/topics')
        return response['topics']

    def get_topic_stats(self, topic: str) -> QueueStats:
        """Get topic statistics"""
        response = self._make_request(f'/api/v1/topics/{topic}/stats')
        return QueueStats(**response['stats'])

    def create_topic(self, topic: str) -> Dict[str, Any]:
        """Create a new topic"""
        data = {'topic': topic}
        return self._make_request('/api/v1/topics', 'POST', data)

    def delete_topic(self, topic: str) -> Dict[str, Any]:
        """Delete a topic"""
        return self._make_request(f'/api/v1/topics/{topic}', 'DELETE')

    def get_overall_stats(self) -> Dict[str, Any]:
        """Get overall statistics"""
        response = self._make_request('/api/v1/stats')
        return response['stats']

    def get_consumer_stats(self) -> Dict[str, Any]:
        """Get consumer statistics"""
        return self._make_request('/api/v1/stats/consumers')

    def health_check(self) -> HealthResponse:
        """Check service health"""
        response = self._make_request('/health')
        return HealthResponse(**response)


class MessageQueueUtils:
    """Utility functions for common message patterns"""
    
    @staticmethod
    def create_notification_message(
        recipient: str,
        title: str,
        message: str,
        message_type: str = 'inapp',
        priority: int = 5
    ) -> MessageRequest:
        """Create a notification message"""
        return MessageRequest(
            topic='notifications',
            payload={
                'recipient': recipient,
                'title': title,
                'message': message,
                'type': message_type,
            },
            priority=priority,
            metadata={
                'created_by': 'system',
                'category': 'notification',
            }
        )

    @staticmethod
    def create_audit_message(
        action: str,
        user_id: str,
        resource: str,
        details: Optional[Dict[str, Any]] = None
    ) -> MessageRequest:
        """Create an audit log message"""
        if details is None:
            details = {}
            
        return MessageRequest(
            topic='audit',
            payload={
                'action': action,
                'user_id': user_id,
                'resource': resource,
                'details': details,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            },
            priority=3,
            metadata={
                'created_by': 'system',
                'category': 'audit',
            }
        )

    @staticmethod
    def create_document_processing_message(
        document_id: str,
        operation: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> MessageRequest:
        """Create a document processing message"""
        if metadata is None:
            metadata = {}
            
        return MessageRequest(
            topic='document_processing',
            payload={
                'document_id': document_id,
                'operation': operation,
                'metadata': metadata,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            },
            priority=7,
            max_retries=5,
            metadata={
                'created_by': 'system',
                'category': 'document',
            }
        )

    @staticmethod
    def create_user_activity_message(
        user_id: str,
        activity: str,
        details: Optional[Dict[str, Any]] = None
    ) -> MessageRequest:
        """Create a user activity message"""
        if details is None:
            details = {}
            
        return MessageRequest(
            topic='user_activity',
            payload={
                'user_id': user_id,
                'activity': activity,
                'details': details,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            },
            priority=2,
            metadata={
                'created_by': 'system',
                'category': 'analytics',
            }
        )

    @staticmethod
    def create_scheduled_message(
        topic: str,
        payload: Dict[str, Any],
        scheduled_at: datetime,
        priority: int = 5
    ) -> MessageRequest:
        """Create a scheduled message"""
        return MessageRequest(
            topic=topic,
            payload=payload,
            priority=priority,
            scheduled_at=scheduled_at.isoformat(),
            metadata={
                'created_by': 'system',
                'category': 'scheduled',
            }
        )

    @staticmethod
    def create_instruction_assignment_message(
        instruction_id: str,
        personnel_id: str,
        assigned_by: str,
        priority: str = 'medium'
    ) -> MessageRequest:
        """Create an instruction assignment message"""
        priority_map = {'low': 3, 'medium': 5, 'high': 7, 'urgent': 9}
        
        return MessageRequest(
            topic='instruction_assignments',
            payload={
                'instruction_id': instruction_id,
                'personnel_id': personnel_id,
                'assigned_by': assigned_by,
                'priority': priority,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            },
            priority=priority_map.get(priority, 5),
            metadata={
                'created_by': 'system',
                'category': 'instruction',
            }
        )

    @staticmethod
    def create_compliance_check_message(
        check_type: str,
        entity_id: str,
        entity_type: str,
        details: Optional[Dict[str, Any]] = None
    ) -> MessageRequest:
        """Create a compliance check message"""
        if details is None:
            details = {}
            
        return MessageRequest(
            topic='compliance_checks',
            payload={
                'check_type': check_type,
                'entity_id': entity_id,
                'entity_type': entity_type,
                'details': details,
                'timestamp': datetime.now(timezone.utc).isoformat(),
            },
            priority=6,
            metadata={
                'created_by': 'system',
                'category': 'compliance',
            }
        )


class MessageQueueConsumer:
    """Base class for message queue consumers"""
    
    def __init__(self, client: MessageQueueClient, topic: str, consumer_name: str):
        self.client = client
        self.topic = topic
        self.consumer_name = consumer_name
        self.running = False

    def start(self, poll_interval: int = 1):
        """Start consuming messages"""
        self.running = True
        print(f"Starting consumer for topic '{self.topic}' with name '{self.consumer_name}'")
        
        while self.running:
            try:
                consume_request = ConsumeRequest(
                    topic=self.topic,
                    consumer=self.consumer_name,
                    count=1,
                    block_time=1000
                )
                
                response = self.client.consume(consume_request)
                
                if response.messages:
                    for message in response.messages:
                        try:
                            self.process_message(message)
                            # Acknowledge successful processing
                            self.client.acknowledge(message.id, self.topic, self.consumer_name)
                        except Exception as e:
                            print(f"Error processing message {message.id}: {str(e)}")
                            # Negative acknowledge for retry
                            self.client.negative_acknowledge(
                                message.id, self.topic, self.consumer_name, retry=True
                            )
                else:
                    time.sleep(poll_interval)
                    
            except Exception as e:
                print(f"Error in consumer loop: {str(e)}")
                time.sleep(poll_interval)

    def stop(self):
        """Stop consuming messages"""
        self.running = False
        print(f"Stopping consumer for topic '{self.topic}'")

    def process_message(self, message: Message):
        """Override this method to implement message processing logic"""
        raise NotImplementedError("Subclasses must implement process_message method")


# Example usage and testing
if __name__ == "__main__":
    # Example usage
    client = MessageQueueClient("http://localhost:8008")
    
    # Health check
    health = client.health_check()
    print(f"Service health: {health.status}")
    
    # Create and publish a message
    message = MessageQueueUtils.create_notification_message(
        recipient="user@example.com",
        title="Test Notification",
        message="This is a test message",
        message_type="email"
    )
    
    response = client.publish(message)
    print(f"Published message: {response.id}")
    
    # List topics
    topics = client.list_topics()
    print(f"Available topics: {topics}")
