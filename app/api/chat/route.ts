import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

export const runtime = 'edge'; // 使用 Edge Runtime
export const maxDuration = 300; // 设置最大执行时间为300秒

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

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        timeout: 120 // 添加超时设置
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 120000, // 120秒超时
        validateStatus: (status) => status < 500 // 只对500以上的错误抛出异常
      }
    );

    return NextResponse.json(response.data, { headers });
  } catch (error) {
    console.error('API Error:', error);

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
        { status, headers }
      );
    }

    return NextResponse.json(
      { error: String(error) },
      { status: 500, headers }
    );
  }
}
