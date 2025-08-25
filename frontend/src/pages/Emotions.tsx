import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { environment } from "../../environment";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, Heart, TrendingUp } from "lucide-react";

const NODE_API_URL = environment.NODE_API_URL_GET_EMOTION;

const COLORS = ["#8884d8", "#82ca9d"];

const emotionCategories = {
  joy: [
    "Happy", "Excited", "Calm", "Grateful", "Hopeful", "Curious",
    "Confident", "Proud", "Energetic", "Peaceful", "Inspired",
    "Relieved", "Joyful", "Loved", "Determined", "Surprised",
  ],
  sadness: [
    "Sad", "Anxious", "Confused", "Frustrated", "Disappointed",
    "Nervous", "Lonely", "Overwhelmed", "Worried", "Guilty", "Bored",
  ],
};

const EMOTION_MAP: Record<string, "joy" | "sadness" | null> = {};
Object.entries(emotionCategories).forEach(([category, emotions]) => {
  emotions.forEach((e) => {
    EMOTION_MAP[e.toLowerCase()] = category as "joy" | "sadness";
  });
});

const Emotions = () => {
  const [emotionData, setEmotionData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [trend, setTrend] = useState<string>("Stable");
  const [note, setNote] = useState<string>("No significant changes");
  const [todayMood, setTodayMood] = useState<string>("Neutral");

  useEffect(() => {
    const getWeeklyTrend = async () => {
      const userid = localStorage.getItem("userId");
      if (!userid) return;

      const saveRes = await fetch(`${NODE_API_URL}?userid=${userid}`);
      const responseData = await saveRes.json();
      const rawUserData = responseData.user || [];

      const formatDate = (isoDate: string) => {
        const d = new Date(isoDate);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      };

      const dateEmotionMap: { [date: string]: { joy: number; sadness: number } } = {};
      let totalJoy = 0;
      let totalSadness = 0;

      rawUserData.forEach((entry: any) => {
        const dateStr = formatDate(entry.date);
        if (!dateEmotionMap[dateStr]) {
          dateEmotionMap[dateStr] = { joy: 0, sadness: 0 };
        }

        entry.emotions.split(",").forEach((e: string) => {
          const rawEmotion = e.split(":")[1]?.trim().toLowerCase();
          const mapped = EMOTION_MAP[rawEmotion] || null;

          if (mapped === "joy") {
            dateEmotionMap[dateStr].joy += 1;
            totalJoy++;
          }
          if (mapped === "sadness") {
            dateEmotionMap[dateStr].sadness += 1;
            totalSadness++;
          }
        });
      });

      const emotionDataNew = Object.entries(dateEmotionMap).map(([date, { joy, sadness }]) => ({
        date,
        joy,
        sadness,
      }));

      setEmotionData(emotionDataNew);
      setPieData([
        { name: "Joy", value: totalJoy },
        { name: "Sadness", value: totalSadness },
      ]);

      // Today's mood (last date)
      if (emotionDataNew.length > 0) {
        const latest = emotionDataNew[emotionDataNew.length - 1];
        setTodayMood(latest.joy >= latest.sadness ? "Optimistic" : "Low");
      }

      // Trend calculation
      if (emotionDataNew.length > 1) {
        const last = emotionDataNew[emotionDataNew.length - 1];
        const prev = emotionDataNew[emotionDataNew.length - 2];

        if (last.joy > prev.joy) {
          setTrend("Upward");
          setNote("Positive emotions are increasing");
        } else if (last.joy < prev.joy) {
          setTrend("Downward");
          setNote("Positive emotions are decreasing");
        } else {
          setTrend("Stable");
          setNote("No significant changes");
        }
      }
    };

    getWeeklyTrend();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Emotion Dashboard</h1>
              <p className="text-muted-foreground">
                Visualize and track your emotional patterns over time
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-gradient-warm">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Today's Mood</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{todayMood}</p>
            <p className="text-sm text-muted-foreground">
              {todayMood === "Optimistic"
                ? "Feeling positive and hopeful"
                : "Feeling low and reflective"}
            </p>
          </Card>

          <Card className="p-6 bg-gradient-calm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Weekly Trend</h3>
            </div>
            <p className="text-2xl font-bold text-primary">{trend}</p>
            <p className="text-sm text-muted-foreground">{note}</p>
          </Card>
        </div>

        {/* Line Chart */}
        <Card className="p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Joy Barometer Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="joy" stroke={COLORS[0]} name="Joy" />
                <Line type="monotone" dataKey="sadness" stroke={COLORS[1]} name="Sadness" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Overall Joy Barometer</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Emotions;
