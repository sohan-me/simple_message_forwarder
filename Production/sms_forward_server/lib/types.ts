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
  otp: string;
}

