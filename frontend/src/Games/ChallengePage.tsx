import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, LogOut } from "lucide-react";
import { useRecording } from "./RecordingContext";
import challengeData from "../../src/data/challenges.json";

interface ChallengePageProps {
  onCompleteChallenge: (data: any) => void;
  currentChallengeIndex: number;
  onExit?: () => void;
}

type Challenge = {
  id: number;
  type: string;
  content: string;
  title: string;
  description: string;
  mediaUrl?: string;
  completed: boolean;
};

export default function ChallengePage({ 
  onCompleteChallenge, 
  currentChallengeIndex,
  onExit 
}: ChallengePageProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const { toast } = useToast();
  const { startRecording, stopRecording } = useRecording();
  
  const currentChallengeData: Challenge = challengeData[currentChallenge] || challengeData[0];

  // Load challenge data
  useEffect(() => {
    const loadedChallenges = challengeData.map((item: any) => ({
      ...item,
      completed: false,
    }));
    setChallenges(loadedChallenges);
  }, []);

  // Update current challenge when index changes
  useEffect(() => {
    setCurrentChallenge(currentChallengeIndex);
  }, [currentChallengeIndex]);

  // Start recording for video/audio challenges
  useEffect(() => {
    if (
      currentChallengeData &&
      (currentChallengeData.type === "video" || currentChallengeData.type === "audio")
    ) {
      startRecording(currentChallengeData.type);
    }
  }, [currentChallengeData, startRecording]);

  const handleNext = () => {
    onCompleteChallenge(currentChallengeData);
  };

  const handleExit = () => {
    if (onExit) {
      stopRecording();
      onExit();
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="max-w-xl mx-auto mb-0">
        <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 relative min-h-[64px]">
          <div className="inline-flex items-center px-3 py-2 rounded-full border border-[#F5BF21] bg-[#FFF8E5] shadow-sm text-brown-800 font-semibold text-sm">
            <div className="relative w-5 h-5 mr-2 ">
              <img
                src="/img/goldcoin.png"
                alt="Gold Coin"
                className="w-full h-full flip-animation transform-gpu"
              />
            </div>
            {currentChallengeData.id * 2} Coins
            <style>
              {`
                .flip-animation {
                  animation: flip 3s linear infinite;
                  transform-style: preserve-3d;
                }
                @keyframes flip {
                  0% { transform: rotateY(0deg); }
                  100% { transform: rotateY(360deg); }
                }
              `}
            </style>
          </div>

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center leading-tight">
            <h2 className="text-base font-bold text-foreground mt-4">
              {currentChallengeData.title}
            </h2>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              {currentChallengeData.type === "video"
                ? "Watch it"
                : currentChallengeData.type === "audio"
                ? "Listen to it"
                : "Check it out"}
            </p>
          </div>

          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleExit}
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 animate-fade-in">
        <div className="space-y-4">
          {currentChallengeData.type === "video" && currentChallengeData.mediaUrl ? (
            <div className="w-full max-w-xl">
              <video
                controls
                className="w-full rounded-lg shadow-lg"
                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23000'/%3E%3Ctext x='400' y='225' font-family='Arial' font-size='24' fill='white' text-anchor='middle'%3EFunny Animal Video%3C/text%3E%3C/svg%3E"
              >
                <source src={currentChallengeData.mediaUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          ) : currentChallengeData.type === "image" && currentChallengeData.mediaUrl ? (
            <div className="w-full max-w-xl aspect-video">
              <img
                src={currentChallengeData.mediaUrl}
                alt={currentChallengeData.title}
                className="w-full h-full rounded-lg shadow-lg object-cover"
              />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-lg border border-primary/20 max-w-2xl">
              <p className="text-lg text-foreground leading-relaxed text-center">
                {currentChallengeData.content}
              </p>
            </div>
          )}

          <div className="absolute top-1/2 -right-10 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20"
            >
              <ArrowRight className="w-6 h-6 text-primary" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
