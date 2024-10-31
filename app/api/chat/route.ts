import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { messages } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('API key is missing');
      return new NextResponse(
        JSON.stringify({ error: 'API key is not configured' }),
        { status: 500, headers }
      );
    }

    const requestBody = JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: requestBody
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('API Response Error:', responseData);
      return new NextResponse(
        JSON.stringify({
          error: 'Deepseek API error',
          details: responseData.error || 'Unknown error'
        }),
        { status: response.status, headers }
      );
    }

    if (!responseData.choices?.[0]?.message) {
      console.error('Invalid API Response:', responseData);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid response format from API' }),
        { status: 500, headers }
      );
    }

    return new NextResponse(
      JSON.stringify(responseData),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    );
  }
}
