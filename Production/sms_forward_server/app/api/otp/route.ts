import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/redis';
import { isValidPhone } from '@/lib/utils';
import type { PostOTPRequest, PostOTPResponse, SMSData } from '@/lib/types';

const SMS_TTL = 3600; // 1 hour in seconds

/**
 * POST /api/otp
 * Accepts phone and message; stores the full message (no OTP extraction). Sync HTTP only.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PostOTPRequest = await request.json();

    if (!body.phone || body.message === undefined || body.message === null) {
      return NextResponse.json(
        { error: 'Missing required fields: phone and message' },
        { status: 400 }
      );
    }

    const message = String(body.message).trim();
    if (!message) {
      return NextResponse.json(
        { error: 'Message must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!isValidPhone(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const kv = getKVClient();
    const smsData: SMSData = {
      message,
      createdAt: Date.now(),
      used: false,
    };

    const key = `sms:${body.phone}`;

    try {
      await kv.setex(key, SMS_TTL, smsData);
    } finally {
      if ('quit' in kv && typeof kv.quit === 'function') {
        await kv.quit().catch(() => {});
      }
    }

    const response: PostOTPResponse = { status: 'stored' };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
