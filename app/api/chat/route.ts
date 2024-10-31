import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { messages } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('API key is missing');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500, headers }
      );
    }

    console.log('Sending request to Deepseek API with messages:', messages);

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000, // 减少超时时间到30秒
        validateStatus: null // 允许所有状态码
      }
    );

    console.log('Received response from Deepseek API:', response.data);

    if (!response.data || !response.data.choices) {
      throw new Error('Invalid response format from Deepseek API');
    }

    return NextResponse.json(response.data, { headers });
  } catch (error) {
    console.error('Detailed API Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    if (error instanceof AxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message;
      
      return NextResponse.json(
        {
          error: 'Error calling Deepseek API',
          status,
          message: errorMessage,
          details: error.response?.data
        },
        { status: 500, headers } // 始终返回500状态码以保持一致性
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500, headers }
    );
  }
}
