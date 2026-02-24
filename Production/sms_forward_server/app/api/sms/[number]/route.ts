import { NextRequest, NextResponse } from 'next/server';
import { getKVClient } from '@/lib/redis';
import { isValidPhone } from '@/lib/utils';
import type { GetSMSResponse, SMSData } from '@/lib/types';

const SMS_TTL = 3600; // 1 hour in seconds

/**
 * GET /api/sms/[number]
 * Sync HTTP only (no WebSockets). Returns { ok, count, messages, checkedAt }.
 * If an unused message exists for the number, it is returned in messages and marked as used.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ number: string }> }
): Promise<NextResponse> {
  const checkedAt = new Date().toISOString();

  try {
    const { number } = await context.params;

    if (!number || !isValidPhone(number)) {
      return NextResponse.json(
        { ok: true, count: 0, messages: [], checkedAt } satisfies GetSMSResponse,
        { status: 200 }
      );
    }

    const kv = getKVClient();
    const key = `sms:${number}`;

    try {
      const data = await kv.get<SMSData>(key);

      if (!data) {
        return NextResponse.json(
          { ok: true, count: 0, messages: [], checkedAt } satisfies GetSMSResponse,
          { status: 200 }
        );
      }

      const smsData = data as SMSData;

      if (typeof smsData.message !== 'string' || typeof smsData.used !== 'boolean') {
        return NextResponse.json(
          { ok: true, count: 0, messages: [], checkedAt } satisfies GetSMSResponse,
          { status: 200 }
        );
      }

      if (smsData.used) {
        return NextResponse.json(
          { ok: true, count: 0, messages: [], checkedAt } satisfies GetSMSResponse,
          { status: 200 }
        );
      }

      smsData.used = true;
      await kv.setex(key, SMS_TTL, smsData);

      const response: GetSMSResponse = {
        ok: true,
        count: 1,
        messages: [{ message: smsData.message }],
        checkedAt,
      };
      return NextResponse.json(response, { status: 200 });
    } finally {
      if ('quit' in kv && typeof kv.quit === 'function') {
        await kv.quit().catch(() => {});
      }
    }
  } catch (error) {
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
