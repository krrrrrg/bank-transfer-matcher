import { SMSRecord, POSRecord, MatchResult } from "./types";

export function matchRecords(
  posData: POSRecord[],
  smsData: SMSRecord[]
): MatchResult[] {
  const results: MatchResult[] = [];
  const usedSMS = new Set<number>();

  // POS 기준 매칭
  for (const pos of posData) {
    let foundIdx: number | null = null;
    for (let i = 0; i < smsData.length; i++) {
      if (usedSMS.has(i)) continue;
      if (smsData[i].name === pos.name && smsData[i].amount === pos.amount) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx !== null) {
      usedSMS.add(foundIdx);
      const sms = smsData[foundIdx];
      results.push({
        storeName: pos.storeName,
        posName: pos.name,
        posAmount: pos.amount,
        smsName: sms.name,
        smsAmount: sms.amount,
        smsDate: sms.date,
        smsTime: `${sms.date} ${sms.time}`,
        status: "matched",
      });
    } else {
      results.push({
        storeName: pos.storeName,
        posName: pos.name,
        posAmount: pos.amount,
        smsName: "-",
        smsAmount: null,
        smsDate: "-",
        smsTime: "-",
        status: "unmatched",
      });
    }
  }

  // 매칭 안 된 은행 문자
  for (let i = 0; i < smsData.length; i++) {
    if (usedSMS.has(i)) continue;
    results.push({
      storeName: "-",
      posName: "-",
      posAmount: null,
      smsName: smsData[i].name,
      smsAmount: smsData[i].amount,
      smsDate: smsData[i].date,
      smsTime: `${smsData[i].date} ${smsData[i].time}`,
      status: "unmatched",
    });
  }

  return results;
}
