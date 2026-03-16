export interface SMSRecord {
  date: string;
  time: string;
  name: string;
  amount: number;
}

export interface POSRecord {
  id: string;
  storeName: string;
  name: string;
  amount: number;
}

export interface MatchResult {
  storeName: string;
  posName: string;
  posAmount: number | null;
  smsName: string;
  smsAmount: number | null;
  smsDate: string;
  smsTime: string;
  status: "matched" | "unmatched";
}
