'use client'

import { useState, FormEvent } from 'react'
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage: Message = { role: 'user', content: input }
    setChatHistory(prevHistory => [...prevHistory, newMessage])
    setInput('') // 立即清空输入框

    try {
      let apiResponse = null;
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          // 修改 API 路径
          const apiPath = '/botfreechat/api/chat';
          apiResponse = await axios.post(apiPath, {
            messages: [...chatHistory, newMessage],
          }, {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          break;
        } catch (retryError) {
          retryCount++;
          console.log(`Retry attempt ${retryCount}`);
          if (retryCount === maxRetries) throw retryError;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!apiResponse?.data?.choices?.[0]?.message) {
        throw new Error('Invalid response format');
      }

      const aiResponse: Message = apiResponse.data.choices[0].message;
      setChatHistory(prevHistory => [...prevHistory, aiResponse]);
    } catch (error) {
      console.error('Error details:', error);
      let errorMessage = '抱歉，发生了错误。';
      
      if (axios.isAxiosError(error)) {
        errorMessage += ` ${error.message}`;
        if (error.response?.data?.error) {
          errorMessage += ` (${error.response.data.error})`;
        }
      }

      setChatHistory(prevHistory => [...prevHistory, {
        role: 'assistant',
        content: errorMessage
      }]);
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
          </div>
          
          <form onSubmit={handleSubmit} className={styles.inputContainer}>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={styles.userInput} 
              placeholder="输入您的问题..."
            />
            <button type="submit" className={styles.sendButton}>发送</button>
          </form>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>由先进AI技术驱动</p>
      </footer>
    </div>
  )
}
