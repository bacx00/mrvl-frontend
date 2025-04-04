import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    // Fetch initial messages
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(err => console.error('Failed to load messages', err));

    // Setup Pusher (Laravel Echo) for real-time updates
    window.Pusher = Pusher;
    window.Echo = new Echo({
      broadcaster: 'pusher',
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
      wsHost: process.env.NEXT_PUBLIC_PUSHER_HOST || `ws-${process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER}.pusher.com`,
      wsPort: process.env.NEXT_PUBLIC_PUSHER_PORT || 80,
      wssPort: process.env.NEXT_PUBLIC_PUSHER_PORT || 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss']
    });
    window.Echo.channel('chat')
      .listen('.ChatMessageCreated', (e) => {
        setMessages(prev => [...prev, {
          user: { name: e.username },
          message: e.message,
          created_at: e.timestamp
        }]);
      });
    return () => {
      if (window.Echo) {
        window.Echo.disconnect();
      }
    };
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ message })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Failed to send message');
      } else {
        setMessage('');
      }
    } catch (err) {
      console.error('Error sending message', err);
      setError('Failed to send message');
    }
  };

  return (
    <div>
      <h2>Live Chat</h2>
      <div className="mb-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <strong>{msg.user.name}: </strong><span>{msg.message}</span>
            <div className="text-muted small">{new Date(msg.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input 
            type="text" 
            className="form-control"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="btn btn-primary">Send</button>
        </div>
      </form>
    </div>
  );
}