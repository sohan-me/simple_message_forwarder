export interface OTPData {
  otp: string;
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

export interface GetOTPResponse {
  ok: boolean;
  count: number;
  messages: Array<{ otp: string }>;
  checkedAt: string; // ISO 8601
}

