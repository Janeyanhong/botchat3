import { NextResponse } from 'next/server';

export const runtime = 'edge';

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

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
      cf: {
        cacheTtl: 0,
        cacheEverything: false
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorData}`);
    }

    const data = await response.json();
    console.log('Received response from Deepseek API:', data);

    if (!data || !data.choices) {
      throw new Error('Invalid response format from Deepseek API');
    }

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  } catch (error: unknown) {
    console.error('API Error:', error);

    const errorResponse = {
      error: 'Error calling Deepseek API',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };

    return new NextResponse(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  }
}
