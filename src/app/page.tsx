"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseSMS, parseExcelPaste } from "@/lib/parser";
import { matchRecords } from "@/lib/matcher";
import { SMSRecord, POSRecord, MatchResult } from "@/lib/types";

export default function Home() {
  const [smsText, setSmsText] = useState("");
  const [smsData, setSmsData] = useState<SMSRecord[]>([]);
  const [posData, setPosData] = useState<POSRecord[]>([]);
  const [posStoreName, setPosStoreName] = useState("");
  const [posName, setPosName] = useState("");
  const [posAmount, setPosAmount] = useState("");
  const [excelText, setExcelText] = useState("");
  const [excelStoreName, setExcelStoreName] = useState("");
  const [showExcel, setShowExcel] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasMatched, setHasMatched] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("all");

  const handleParseSMS = () => {
    const parsed = parseSMS(smsText);
    if (parsed.length === 0) return;
    setSmsData((prev) => [...prev, ...parsed]);
    setSmsText("");
  };

  const handleRemoveSMS = (idx: number) => {
    setSmsData((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddPOS = () => {
    const store = posStoreName.trim();
    const name = posName.trim();
    const amount = parseInt(posAmount.replace(/,/g, ""), 10);
    if (!store || !name || isNaN(amount)) return;
    setPosData([
      ...posData,
      { id: crypto.randomUUID(), storeName: store, name, amount },
    ]);
    setPosName("");
    setPosAmount("");
  };

  const handleRemovePOS = (id: string) => {
    setPosData(posData.filter((p) => p.id !== id));
  };

  const handleParseExcel = () => {
    const store = excelStoreName.trim();
    if (!store) return;
    const parsed = parseExcelPaste(excelText, store);
    setPosData([...posData, ...parsed]);
    setExcelText("");
    setExcelStoreName("");
    setShowExcel(false);
  };

  const handleMatch = () => {
    const matched = matchRecords(posData, smsData);
    setResults(matched);
    setHasMatched(true);
    setSelectedDate("all");
  };

  // 날짜 목록 추출
  const availableDates = useMemo(() => {
    const dates = new Set<string>();
    results.forEach((r) => {
      if (r.smsDate && r.smsDate !== "-") dates.add(r.smsDate);
    });
    return Array.from(dates).sort();
  }, [results]);

  // 날짜 필터링된 결과
  const filteredResults = useMemo(() => {
    if (selectedDate === "all") return results;
    return results.filter((r) => r.smsDate === selectedDate);
  }, [results, selectedDate]);

  const matched = filteredResults.filter((r) => r.status === "matched");
  const unmatched = filteredResults.filter((r) => r.status === "unmatched");
  const matchedTotal = matched.reduce(
    (s, r) => s + (r.posAmount ?? r.smsAmount ?? 0),
    0
  );

  // 매장별 통계
  const storeStats = useMemo(() => {
    const stores = new Map<
      string,
      { count: number; matchedCount: number; total: number }
    >();
    filteredResults.forEach((r) => {
      if (r.storeName === "-") return;
      const prev = stores.get(r.storeName) || {
        count: 0,
        matchedCount: 0,
        total: 0,
      };
      prev.count++;
      if (r.status === "matched") {
        prev.matchedCount++;
        prev.total += r.posAmount ?? 0;
      }
      stores.set(r.storeName, prev);
    });
    return stores;
  }, [filteredResults]);

  const renderTable = (data: MatchResult[]) => {
    if (data.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-10">
          결과가 없습니다
        </p>
      );
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>매장</TableHead>
              <TableHead>은행 이름</TableHead>
              <TableHead className="text-right">은행 금액</TableHead>
              <TableHead>POS 이름</TableHead>
              <TableHead className="text-right">POS 금액</TableHead>
              <TableHead>입금 시간</TableHead>
              <TableHead>상태</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                <TableCell className="font-medium">{r.storeName}</TableCell>
                <TableCell className="font-medium">{r.smsName}</TableCell>
                <TableCell className="text-right font-mono">
                  {r.smsAmount != null
                    ? `${r.smsAmount.toLocaleString()}원`
                    : "-"}
                </TableCell>
                <TableCell className="font-medium">{r.posName}</TableCell>
                <TableCell className="text-right font-mono">
                  {r.posAmount != null
                    ? `${r.posAmount.toLocaleString()}원`
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.smsTime}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "matched" ? "default" : "destructive"
                    }
                  >
                    {r.status === "matched" ? "매칭" : "미매칭"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-center mb-8">
          POS 계좌이체 매칭
        </h1>

        {/* 입력 패널 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 은행 문자 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">은행 문자 붙여넣기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                placeholder={`문자 복붙 후 "추가" 버튼 — 여러 번 나눠서 추가 가능\n\n[Web발신]\n부산03/13 17:51 101204644***6 임숙희 입금8,000`}
                className="h-28 font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={handleParseSMS} disabled={!smsText.trim()}>
                  추가
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSmsData([])}
                  disabled={smsData.length === 0}
                >
                  전체 삭제
                </Button>
                {smsData.length > 0 && (
                  <Badge variant="secondary" className="ml-auto self-center">
                    {smsData.length}건
                  </Badge>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1">
                {smsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    문자를 붙여넣고 추가하세요
                  </p>
                ) : (
                  smsData.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted text-sm"
                    >
                      <span>
                        <span className="text-muted-foreground mr-2">
                          {s.date} {s.time}
                        </span>
                        {s.name}{" "}
                        <span className="font-mono text-muted-foreground">
                          {s.amount.toLocaleString()}원
                        </span>
                      </span>
                      <button
                        onClick={() => handleRemoveSMS(i)}
                        className="text-xs text-destructive hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* POS 데이터 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">POS 계좌이체 데이터</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={posStoreName}
                  onChange={(e) => setPosStoreName(e.target.value)}
                  placeholder="매장명"
                  className="w-28 shrink-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      document.getElementById("pos-name-input")?.focus();
                    }
                  }}
                />
                <Input
                  id="pos-name-input"
                  value={posName}
                  onChange={(e) => setPosName(e.target.value)}
                  placeholder="이름"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      document.getElementById("pos-amount-input")?.focus();
                    }
                  }}
                />
                <Input
                  id="pos-amount-input"
                  value={posAmount}
                  onChange={(e) => setPosAmount(e.target.value)}
                  placeholder="금액"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddPOS();
                  }}
                />
                <Button onClick={handleAddPOS}>추가</Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExcel(!showExcel)}
                >
                  엑셀 붙여넣기
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPosData([])}
                >
                  전체 삭제
                </Button>
                {posData.length > 0 && (
                  <Badge variant="secondary" className="ml-auto self-center">
                    {posData.length}건
                  </Badge>
                )}
              </div>
              {showExcel && (
                <div className="space-y-2">
                  <Input
                    value={excelStoreName}
                    onChange={(e) => setExcelStoreName(e.target.value)}
                    placeholder="매장명 (필수)"
                  />
                  <Textarea
                    value={excelText}
                    onChange={(e) => setExcelText(e.target.value)}
                    placeholder="엑셀에서 이름/금액 복사 후 붙여넣기 (탭 구분)"
                    className="h-24 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleParseExcel}
                    disabled={!excelStoreName.trim()}
                  >
                    엑셀 파싱
                  </Button>
                </div>
              )}
              <div className="max-h-44 overflow-y-auto space-y-1">
                {posData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    POS 데이터를 추가하세요
                  </p>
                ) : (
                  posData.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted text-sm"
                    >
                      <span>
                        <Badge variant="outline" className="mr-2 text-xs">
                          {p.storeName}
                        </Badge>
                        {p.name}{" "}
                        <span className="font-mono text-muted-foreground">
                          {p.amount.toLocaleString()}원
                        </span>
                      </span>
                      <button
                        onClick={() => handleRemovePOS(p.id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 매칭 버튼 */}
        <div className="flex justify-center mb-8">
          <Button
            size="lg"
            onClick={handleMatch}
            disabled={posData.length === 0 && smsData.length === 0}
          >
            매칭 실행
          </Button>
        </div>

        {/* 날짜 필터 */}
        {hasMatched && availableDates.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">
              날짜:
            </span>
            <Button
              variant={selectedDate === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDate("all")}
            >
              전체
            </Button>
            {availableDates.map((date) => (
              <Button
                key={date}
                variant={selectedDate === date ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDate(date)}
              >
                {date}
              </Button>
            ))}
          </div>
        )}

        {/* 통계 */}
        {hasMatched && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">
                  {filteredResults.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">전체 건수</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {matched.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">매칭 성공</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-destructive">
                  {unmatched.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">미매칭</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold font-mono">
                  {matchedTotal.toLocaleString()}원
                </div>
                <p className="text-xs text-muted-foreground mt-1">매칭 총액</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 매장별 통계 */}
        {hasMatched && storeStats.size > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {Array.from(storeStats.entries()).map(([store, stat]) => (
              <Card key={store}>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-sm font-semibold mb-1">{store}</p>
                  <div className="text-lg font-bold font-mono">
                    {stat.total.toLocaleString()}원
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stat.matchedCount}/{stat.count}건 매칭
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 결과 테이블 */}
        {hasMatched && (
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">
                    전체 ({filteredResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="matched">
                    매칭 ({matched.length})
                  </TabsTrigger>
                  <TabsTrigger value="unmatched">
                    미매칭 ({unmatched.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {renderTable(filteredResults)}
                </TabsContent>
                <TabsContent value="matched" className="mt-4">
                  {renderTable(matched)}
                </TabsContent>
                <TabsContent value="unmatched" className="mt-4">
                  {renderTable(unmatched)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
