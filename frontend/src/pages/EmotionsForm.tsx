import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight,Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react"; 
import { environment } from "../../environment";
import { useEffect } from "react";
const emotions = [
  { id: 1, name: "Happy", emoji: "😊" },
  { id: 2, name: "Sad", emoji: "😢" },
  { id: 3, name: "Angry", emoji: "😠" },
  { id: 4, name: "Excited", emoji: "🤩" },
  { id: 5, name: "Anxious", emoji: "😰" },
  { id: 6, name: "Calm", emoji: "😌" },
  { id: 7, name: "Confused", emoji: "😕" },
  { id: 8, name: "Grateful", emoji: "🙏" },
  { id: 9, name: "Frustrated", emoji: "😤" },
  { id: 10, name: "Hopeful", emoji: "🌈" },
  { id: 11, name: "Disappointed", emoji: "😞" },
  { id: 12, name: "Curious", emoji: "🧐" },
  { id: 13, name: "Confident", emoji: "😎" },
  { id: 14, name: "Nervous", emoji: "😬" },
  { id: 15, name: "Proud", emoji: "🥹" },
  { id: 16, name: "Lonely", emoji: "😔" },
  { id: 17, name: "Energetic", emoji: "⚡️" },
  { id: 18, name: "Peaceful", emoji: "🕊️" },
  { id: 19, name: "Overwhelmed", emoji: "🥴" },
  { id: 20, name: "Inspired", emoji: "💡" },
  { id: 21, name: "Relieved", emoji: "😮‍💨" },
  { id: 22, name: "Worried", emoji: "😟" },
  { id: 23, name: "Joyful", emoji: "😁" },
  { id: 24, name: "Guilty", emoji: "😳" },
  { id: 25, name: "Surprised", emoji: "😲" },
  { id: 26, name: "Bored", emoji: "🥱" },
  { id: 27, name: "Loved", emoji: "❤️" },
  { id: 28, name: "Determined", emoji: "💪" },
];

const NODE_API_URL = environment.NODE_API_URL_EMOTION;
const EmotionsForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const reactionData = location.state as { 
    challengeId: number; 
    challengeTitle: string; 
    currentChallenge: number;
    reactionData: any;
  } | null;
  
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);

  const toggleEmotion = (emotionId: number) => {
    setSelectedEmotions(prev => 
      prev.includes(emotionId) 
        ? prev.filter(id => id !== emotionId)
        : [...prev, emotionId]
    );
  };
  const selectedEmotionNames = emotions
      .filter(emotion => selectedEmotions.includes(emotion.id))
      .map(emotion => emotion.name);


  const handleSave = async () => {
    if (selectedEmotions.length === 0) {
      toast({
        title: "No Emotions Selected",
        description: "Please select at least one emotion before continuing.",
        variant: "destructive",
      });
      return;
    }
    else {
        const saveRes = await fetch(NODE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: reactionData?.challengeId, emotions: selectedEmotionNames.join(", ") }),
        });
        if (!saveRes.ok) throw new Error("DB save failed");
      }

      toast({ title: "Reaction Saved!", description: "Your reaction has been saved successfully." });

    // Here you would normally save to MySQL via Node API
    // For now, we'll simulate the process
    
    toast({
      title: "Emotions Saved!",
     // description: `Selected emotions: ${selectedEmotionNames.join(", ")}`,
    });

    // Navigate back to challenge page to continue with next challenge
    navigate("/challenge", { state: { fromEmotion: true, currentChallenge: reactionData?.challengeId } });
  };

  const handleByeBye = () => {
    toast({
      title: "Thank you for participating!",
      // description: `You completed`,
    });
    navigate("/");
  };

  const handleBack = () => {
    navigate("/reaction", { state: reactionData });
  };

  useEffect(() => {
    if (!reactionData?.challengeId) {
      // Redirect if Emotion form was accessed directly
      navigate("/challenge", { replace: true });
    }
  }, [reactionData, navigate]);

  if (!reactionData?.challengeId) {
    return null; // Prevent UI flash before redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-2">
    {/* {header} */}
 {/* Header */}
<div className="max-w-xl mx-auto mb-0">
  <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 relative min-h-[64px]">

    {/* Left - Back Button */}
    <div className="inline-flex items-center px-3 py-2 rounded-full bg-yellow-400/90 shadow-sm text-brown-800 font-semibold text-sm">
                <div className="relative w-5 h-5 mr-2">
                  <img
                    src="/img/goldcoin.png"
                    alt="Gold Coin"
                    className="w-full h-full flip-animation transform-gpu"
                  />
                </div>
                {reactionData?.challengeId * 2 } Coins

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
        How are you feeling?
      </h2>
      <p className="text-xs text-muted-foreground mt-0.124">
        Feel free to add more than one emotion.
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



      {/* Main Content */}
      <div className="max-w-xl mx-auto relative">
  <Card className="  animate-fade-in">
    <div >
      {/* Emotions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {emotions.map((emotion) => {
          const isSelected = selectedEmotions.includes(emotion.id);
          return (
            <Button
  key={emotion.id}
  variant={isSelected ? "default" : "outline"}
  onClick={() => toggleEmotion(emotion.id)}
  className={`!m-0 h-14  flex flex-col items-center  transition-all duration-300 hover:scale-105 ${
    isSelected
      ? "bg-gradient-to-br from-primary to-primary-glow shadow-md transform scale-105"
      : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
  }`}
>
  <div
    className={` flex items-center justify-center text-base rounded-full ${
      isSelected
        ? "animate-bounce-subtle bg-primary text-white"
        : "bg-muted text-foreground"
    }`}
  >
    {emotion.emoji}
  </div>
  <span
    className={`text-xs font-medium ${
      isSelected ? "text-primary-foreground" : "text-foreground"
    }`}
  >
    {emotion.name}
  </span>
</Button>

          );
        })}
      </div>
    </div>

    {/* Navigation Divider */}
    <div className="flex justify-center items-center mt-6 " />

    {/* Left Arrow */}
    <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleBack}
        className="h-10 w-10 rounded-full   hover:bg-primary/20"
      >
        <ArrowLeft className="w-4 h-4 text-primary" />
      </Button>
    </div>

    {/* Right Arrow */}
    <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleSave}
        disabled={selectedEmotions.length === 0}
        className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 disabled:opacity-30"
      >
        <ArrowRight className="w-6 h-6 text-primary" />
      </Button>
    </div>
  </Card>
</div>

    </div>
  );
};

export default EmotionsForm;