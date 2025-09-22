import { Layout } from "@/components/Layout";
import { FileText, Download, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import axios from "../pages/axiosInstance";

type Summary = {
  window: { type: "weekly" | "monthly"; start: string; end: string };
  engagement: { total_reactions: number; total_emotions: number; active_days: number };
  emotions_breakdown: Record<string, number>;
  modes_breakdown: Record<string, number>;
};

function getCurrentWeekRange() {
  const d = new Date();
  const day = d.getDay() || 7;
  const monday = new Date(d);
  if (day !== 1) monday.setDate(d.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const startISO = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
  const endISO = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

  const dayNum = (date: Date) => pad(date.getDate());
  const monthShort = (date: Date) => date.toLocaleString(undefined, { month: "short" });
  const pretty = `${monthShort(monday)} ${dayNum(monday)}-${dayNum(sunday)}`;
  return { startISO, endISO, pretty };
}

function getCurrentMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const monthParam = `${y}-${pad(m)}`;
  const pretty = d.toLocaleString(undefined, { month: "long", year: "numeric" });
  return { monthParam, pretty };
}

function emotionsPercentSummary(breakdown: Record<string, number>) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (!total) return "No data";
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const top2 = entries.slice(0, 2);
  const perc = (v: number) => Math.round((v / total) * 100);
  return top2.map(([k, v]) => `${perc(v)}% ${k}`).join(", ");
}

const Reports = () => {
  const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = stored ? JSON.parse(stored) : null;
  const userId = localStorage.getItem("userId") || currentUser?.id;

  const { startISO: weekStartISO, pretty: prettyWeek } = getCurrentWeekRange();
  const { monthParam, pretty: prettyMonth } = getCurrentMonth();

  const [weekly, setWeekly] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Summary | null>(null);

  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // Existing PDF downloaders (weekly/monthly) – unchanged if you already added programmatic download
  const downloadWeekly = async () => {
    try {
      if (!userId) return;
      const url = `${base}/api/reports/games/weekly.pdf?user_id=${userId}&week_start=${weekStartISO}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`Weekly HTTP ${res.status}`);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `challenge-weekly-${weekStartISO}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Weekly PDF download error:", e);
    }
  };

  const downloadMonthly = async () => {
    try {
      if (!userId) return;
      const url = `${base}/api/reports/games/monthly.pdf?user_id=${userId}&month=${monthParam}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`Monthly HTTP ${res.status}`);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `challenge-monthly-${monthParam}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Monthly PDF download error:", e);
    }
  };

  // Generate Full Report (comprehensive)
  const downloadFullReport = async () => {
    try {
      if (!userId) return;
      // Use current week window for full report; you can switch to month if you prefer.
      const url = `${base}/api/reports/games/full.pdf?user_id=${userId}&week_start=${weekStartISO}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`Full HTTP ${res.status}`);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `challenge-full-${weekStartISO}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error("Full PDF download error:", e);
    }
  };

  useEffect(() => {
    if (!userId) {
      console.warn("Reports: No userId found in localStorage.user");
      return;
    }
    (async () => {
      try {
        const [w, m] = await Promise.all([
          axios.get(`/api/reports/games/weekly`, { params: { user_id: userId, week_start: weekStartISO } }),
          axios.get(`/api/reports/games/monthly`, { params: { user_id: userId, month: monthParam } }),
        ]);
        setWeekly(w.data);
        setMonthly(m.data);
      } catch (e: any) {
        console.error("Reports fetch error:", e?.response?.status, e?.response?.data || e?.message);
        setWeekly(null);
        setMonthly(null);
      }
    })();
  }, [userId, weekStartISO, monthParam]);

  const weeklyEmotionSummary = weekly ? emotionsPercentSummary(weekly.emotions_breakdown) : "Loading...";
  const monthlyEmotionSummary = monthly ? emotionsPercentSummary(monthly.emotions_breakdown) : "Loading...";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Behavioral Reports</h1>
              <p className="text-muted-foreground">Comprehensive summaries of your assessments and progress</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Weekly Summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Weekly Summary</h3>
              <Badge variant="secondary">{prettyWeek}</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Emotional stability: {weeklyEmotionSummary}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" onClick={downloadWeekly}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </Card>

          {/* Monthly Assessment */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Monthly Assessment</h3>
              <Badge variant="default">{prettyMonth}</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Overall progress: {monthlyEmotionSummary}</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" onClick={downloadMonthly}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </Card>
        </div>

        <Card className="p-6 mt-8 bg-gradient-warm">
          <div className="text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Comprehensive Assessment Report</h3>
            <p className="text-muted-foreground mb-4">
              Get a detailed analysis of your behavioral patterns, emotional growth, and personalized recommendations for continued development.
            </p>
            <Button className="bg-gradient-hero hover:shadow-glow" onClick={downloadFullReport}>
              Generate Full Report
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
