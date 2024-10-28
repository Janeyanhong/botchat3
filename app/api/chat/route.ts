import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

export async function POST(request: Request) {
  // 添加 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { messages } = await request.json();
    
    // 检查环境变量
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('API key is missing');
      throw new Error('API key is not configured');
    }

    let apiResponse = null;
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        apiResponse = await axios.post(
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
            timeout: 60000
          }
        );
        break; // 如果请求成功，跳出循环
      } catch (retryError) {
        retryCount++;
        if (retryCount === maxRetries) throw retryError;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!apiResponse) {
      throw new Error('Failed to get response after retries');
    }

    return NextResponse.json(apiResponse.data, { headers });
  } catch (error) {
    console.error('API Error:', error);

    if (error instanceof AxiosError) {
      return NextResponse.json(
        {
          error: 'Error calling Deepseek API',
          status: error.response?.status,
          message: error.message,
          details: error.response?.data
        },
        { status: error.response?.status || 500, headers }
      );
    }

    return NextResponse.json(
      { error: String(error) },
      { status: 500, headers }
    );
  }
}
