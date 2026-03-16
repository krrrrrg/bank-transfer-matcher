"use client";

import { useState } from "react";
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
  const [posName, setPosName] = useState("");
  const [posAmount, setPosAmount] = useState("");
  const [excelText, setExcelText] = useState("");
  const [showExcel, setShowExcel] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [hasMatched, setHasMatched] = useState(false);

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
    const name = posName.trim();
    const amount = parseInt(posAmount.replace(/,/g, ""), 10);
    if (!name || isNaN(amount)) return;
    setPosData([...posData, { id: crypto.randomUUID(), name, amount }]);
    setPosName("");
    setPosAmount("");
  };

  const handleRemovePOS = (id: string) => {
    setPosData(posData.filter((p) => p.id !== id));
  };

  const handleParseExcel = () => {
    const parsed = parseExcelPaste(excelText);
    setPosData([...posData, ...parsed]);
    setExcelText("");
    setShowExcel(false);
  };

  const handleMatch = () => {
    const matched = matchRecords(posData, smsData);
    setResults(matched);
    setHasMatched(true);
  };

  const matched = results.filter((r) => r.status === "matched");
  const unmatched = results.filter((r) => r.status === "unmatched");
  const matchedTotal = matched.reduce(
    (s, r) => s + (r.posAmount ?? r.smsAmount ?? 0),
    0
  );

  const renderTable = (data: MatchResult[]) => {
    if (data.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-10">
          결과가 없습니다
        </p>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>POS 이름</TableHead>
            <TableHead className="text-right">POS 금액</TableHead>
            <TableHead>은행 이름</TableHead>
            <TableHead className="text-right">은행 금액</TableHead>
            <TableHead>입금 시간</TableHead>
            <TableHead>상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="font-medium">{r.posName}</TableCell>
              <TableCell className="text-right font-mono">
                {r.posAmount != null
                  ? `${r.posAmount.toLocaleString()}원`
                  : "-"}
              </TableCell>
              <TableCell className="font-medium">{r.smsName}</TableCell>
              <TableCell className="text-right font-mono">
                {r.smsAmount != null
                  ? `${r.smsAmount.toLocaleString()}원`
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
                  <Textarea
                    value={excelText}
                    onChange={(e) => setExcelText(e.target.value)}
                    placeholder="엑셀에서 이름/금액 복사 후 붙여넣기 (탭 구분)"
                    className="h-24 text-sm"
                  />
                  <Button size="sm" onClick={handleParseExcel}>
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

        {/* 통계 */}
        {hasMatched && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-primary">
                  {results.length}
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

        {/* 결과 테이블 */}
        {hasMatched && (
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">
                    전체 ({results.length})
                  </TabsTrigger>
                  <TabsTrigger value="matched">
                    매칭 ({matched.length})
                  </TabsTrigger>
                  <TabsTrigger value="unmatched">
                    미매칭 ({unmatched.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  {renderTable(results)}
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
