import { NextResponse } from 'next/server';

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
        'Authorization': `Bearer ${apiKey}`,
        ...headers
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Deepseek API:', data);

    if (!data || !data.choices) {
      throw new Error('Invalid response format from Deepseek API');
    }

    return NextResponse.json(data, { headers });
  } catch (error: unknown) {
    console.error('API Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Error calling Deepseek API',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500, headers }
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
