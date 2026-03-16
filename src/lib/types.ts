export interface SMSRecord {
  date: string;
  time: string;
  name: string;
  amount: number;
}

export interface POSRecord {
  id: string;
  name: string;
  amount: number;
}

export interface MatchResult {
  posName: string;
  posAmount: number | null;
  smsName: string;
  smsAmount: number | null;
  smsTime: string;
  status: "matched" | "unmatched";
}
