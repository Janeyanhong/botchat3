'use client'

import { useState, FormEvent, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import styles from '../styles/Home.module.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [input, setInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    window.addEventListener('error', (e) => {
      if (e.message.includes('tracking') || e.message.includes('snowflake')) {
        e.preventDefault();
        return false;
      }
    });

    return () => {
      window.removeEventListener('error', () => {});
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const newMessage: Message = { role: 'user', content: input }
    setChatHistory(prevHistory => [...prevHistory, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const response = await axios.post('/api/chat', {
        messages: [...chatHistory, newMessage],
      }, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      clearTimeout(timeout);

      if (response.data.choices?.[0]?.message) {
        const aiResponse: Message = response.data.choices[0].message;
        setChatHistory(prevHistory => [...prevHistory, aiResponse]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error details:', error);
      let errorMessage = '抱歉，发生了错误。';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_CANCELED') {
          errorMessage = '请求超时，请重试。';
        } else {
          errorMessage += ` ${error.message}`;
          if (error.response?.data?.error) {
            errorMessage += ` (${error.response.data.error})`;
          }
        }
      }

      setChatHistory(prevHistory => [...prevHistory, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>BotChat</h1>
        
        <div className={styles.chatContainer}>
          <div className={styles.chatOutput}>
            {chatHistory.map((msg, index) => (
              <div key={index} className={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </div>
            ))}
            {isLoading && (
              <div className={styles.aiMessage}>
                <p>正在思考...</p>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className={styles.inputContainer}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.userInput} 
              placeholder="输入您的问题..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className={styles.sendButton}
              disabled={isLoading}
            >
              {isLoading ? '发送中...' : '发送'}
            </button>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>由先进AI技术驱动</p>
      </footer>
    </div>
  )
}
