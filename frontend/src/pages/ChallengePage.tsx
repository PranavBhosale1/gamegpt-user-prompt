import { useState, useEffect } from "react";
import { LogOut, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import challengeData from "../../src/data/challenges.json";
import { Trophy } from "lucide-react";


type Challenge = {
  id: number;
  type: string;
  content: string;
  title: string;
  description: string;
  mediaUrl?: string;
  completed: boolean;
};

const ChallengePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [goldCount, setGoldCount] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // ✅ Load challenge data from JSON
  useEffect(() => {
    const loadedChallenges = challengeData.map((item: any) => ({
      ...item,
      completed: false,
    }));
    setChallenges(loadedChallenges);
  }, []);

  // ✅ Handle returning from Emotion
  // ✅ Handle returning from Emotion and mark the previous challenge as completed
useEffect(() => {
  if (location.state?.fromEmotion && challenges.length > 0) {
    const resumedChallenge = location.state.currentChallenge ?? 0;

    // Mark the previous challenge as completed
    const updated = [...challenges];
    if (!updated[resumedChallenge].completed) {
      updated[resumedChallenge].completed = true;
      setChallenges(updated);
    }

    // Move to the next challenge
    setCurrentChallenge(Math.min(resumedChallenge, challenges.length - 1));

    // Clear navigation state so it doesn't repeat
    window.history.replaceState({}, document.title);
  }
}, [location.state, challenges]);


  const completedChallenges = challenges.filter((c) => c.completed).length;
  const currentChallengeData = challenges[currentChallenge];

  // ✅ Update gold count when challenges are completed
  useEffect(() => {
    setGoldCount(completedChallenges * 2);
  }, [completedChallenges]);

  const handleCompleteChallenge = () => {
    const updatedChallenges = [...challenges];
    if (!updatedChallenges[currentChallenge].completed) {
      updatedChallenges[currentChallenge].completed = true;
      setChallenges(updatedChallenges);
    }
  };

  const handleNext = () => {
    //handleCompleteChallenge();
    navigate("/reaction", {
      state: {
        challengeId: currentChallengeData.id,
        challengeTitle: currentChallengeData.title,
        currentChallenge: currentChallenge,
        fromChallenge: true,
      },
    });
  };

  const handlePrevious = () => {
    if (currentChallenge > 0) {
      setCurrentChallenge((prev) => prev - 1);
    }
  };

  const handleNextChallenge = () => {
    handleNext();
  };

  const handleByeBye = () => {
    toast({
      title: "Thank you for participating!",
    });
    navigate("/");
  };

  // ✅ Guard if data is still loading
  if (!challenges.length || !currentChallengeData) {
    return (
      <div className="text-center mt-10 text-muted-foreground">
        Loading challenge...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-0">
        <div className="flex items-center  justify-between px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 relative min-h-[64px]">
          {/* Left - Reset Button */}
          <div className="inline-flex items-center px-3 py-2 rounded-full bg-yellow-400/90 shadow-sm text-brown-800 font-semibold text-sm">
                <div className="relative w-5 h-5 mr-2">
                  <img
                    src="/img/goldcoin.png"
                    alt="Gold Coin"
                    className="w-full h-full flip-animation transform-gpu"
                  />
                </div>
                {currentChallengeData.id * 2 } Coins

                <style>
                  {`
                    .flip-animation {
                      animation: flip 1s linear infinite;
                      transform-style: preserve-3d;
                    }

                    @keyframes flip {
                      0% {
                        transform: rotateY(0deg);
                      }
                      100% {
                        transform: rotateY(360deg);
                      }
                    }
                  `}
                </style>
              </div>


          {/* Center - Title and Subtitle */}
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

          {/* Right - Logout Button */}
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={handleByeBye}
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Challenge Content */}
      <div className="max-w-xl mx-auto relative">
        <Card className="p-2 bg-card/20 backdrop-blur-sm border-border/20 animate-fade-in">
          <div>
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
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -left-10 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentChallenge === 0}
              className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 disabled:opacity-30"
            >
              <ArrowLeft className="w-6 h-6 text-primary" />
            </Button>
          </div>

          <div className="absolute top-1/2 -right-10 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextChallenge}
              className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20"
            >
              <ArrowRight className="w-6 h-6 text-primary" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChallengePage;
