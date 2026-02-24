/** Stored in Redis per phone: full message, no OTP extraction */
export interface SMSData {
  message: string;
  createdAt: number;
  used: boolean;
}

export interface PostOTPRequest {
  phone: string;
  message: string;
}

export interface PostOTPResponse {
  status: 'stored';
}

/** GET /api/sms/[number] response shape */
export interface GetSMSResponse {
  ok: boolean;
  count: number;
  messages: Array<{ message: string }>;
  checkedAt: string; // ISO 8601
}

