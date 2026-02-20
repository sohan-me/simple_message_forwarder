import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/redis';
import { extractOTP, isValidPhone } from '@/lib/utils';
import type { PostOTPRequest, PostOTPResponse, GetOTPResponse, OTPData } from '@/lib/types';

const OTP_TTL = 120; // 2 minutes in seconds

/**
 * POST /api/otp
 * Accepts phone and message, extracts OTP, and stores it in Vercel KV
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PostOTPRequest = await request.json();

    // Validate request body
    if (!body.phone || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: phone and message' },
        { status: 400 }
      );
    }

    // Validate phone number
    if (!isValidPhone(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Extract OTP from message
    const otp = extractOTP(body.message);
    if (!otp) {
      return NextResponse.json(
        { error: 'No valid OTP found in message (must be 4-8 digits)' },
        { status: 400 }
      );
    }

    // Store OTP in Redis
    const kv = getKVClient();
    const otpData: OTPData = {
      otp,
      createdAt: Date.now(),
      used: false,
    };

    const key = `otp:${body.phone}`;
    
    try {
      // Set with TTL of 2 minutes (120 seconds)
      await kv.setex(key, OTP_TTL, otpData);
    } finally {
      // Clean up connection in serverless environment
      if ('quit' in kv && typeof kv.quit === 'function') {
        await kv.quit().catch(() => {
          // Ignore quit errors
        });
      }
    }

    const response: PostOTPResponse = { status: 'stored' };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Handle KV connection errors
    if (error instanceof Error) {
      // Use the detailed error message from getKVClient
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/otp?phone=123456789
 * Retrieves OTP from Vercel KV, marks it as used, and returns it
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get('phone');

    // Validate phone parameter
    if (!phone) {
      return NextResponse.json(
        { error: 'Missing required parameter: phone' },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Fetch OTP from Redis
    const kv = getKVClient();
    const key = `otp:${phone}`;
    
    try {
      // Get OTP data
      const data = await kv.get<OTPData>(key);

      // If not found, return 404
      if (!data) {
        return NextResponse.json(
          { error: 'OTP not found or expired' },
          { status: 404 }
        );
      }

      // Data is already parsed from JSON
      const otpData = data as OTPData;

      // Validate data structure
      if (!otpData.otp || typeof otpData.used !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid OTP data format' },
          { status: 500 }
        );
      }

      // Check if already used
      if (otpData.used) {
        return NextResponse.json(
          { error: 'OTP already used' },
          { status: 404 }
        );
      }

      // Mark as used and update Redis
      otpData.used = true;
      await kv.setex(key, OTP_TTL, otpData);

      const response: GetOTPResponse = { otp: otpData.otp };
      return NextResponse.json(response, { status: 200 });
    } finally {
      // Clean up connection in serverless environment (after all operations)
      if ('quit' in kv && typeof kv.quit === 'function') {
        await kv.quit().catch(() => {
          // Ignore quit errors
        });
      }
    }
  } catch (error) {
    // Handle KV connection errors
    if (error instanceof Error) {
      // Use the detailed error message from getKVClient
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

