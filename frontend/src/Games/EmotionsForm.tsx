import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle, Loader, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EMOTIONS } from "@/lib/constants";
import { environment } from "../../environment";
import { useRecording } from "./RecordingContext";

const S3_UPLOAD_URL = environment.S3_UPLOAD_URL;
const NODE_API_URL = environment.NODE_API_URL_EMOTION;

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

const emotionCategories = {
  joy: [
    "Happy", "Excited", "Calm", "Grateful", "Hopeful", "Curious",
    "Confident", "Proud", "Energetic", "Peaceful", "Inspired",
    "Relieved", "Joyful", "Loved", "Determined", "Surprised"
  ],
  sadness: [
    "Sad", "Anxious", "Confused", "Frustrated", "Disappointed",
    "Nervous", "Lonely", "Overwhelmed", "Worried", "Guilty", "Bored"
  ],
};
interface EmotionFormProps {
  challengeData: {
    id: number;
    challengeTitle: string;
    currentChallenge: number;
  };
  onCompleteEmotion: (data: any) => void; // or a more specific type
  
  onlogoutReaction: () => void;
}
const EmotionsForm: React.FC<EmotionFormProps> = ({ challengeData, onCompleteEmotion,onlogoutReaction }) => {

  const { startRecording, stopRecording, isRecording } = useRecording();
  const { toast } = useToast();

  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const toggleEmotion = (id: number) => {
    setSelectedEmotions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedEmotionNames = selectedEmotions.map((i) => EMOTIONS[i-1]);

  const handleByeBye = () => {
    toast({ title: "Thank you for participating!" });
    stopRecording();
    // navigate("/");
   // onCompleteEmotion("challange"); 
   onlogoutReaction();
  };

  const handleBack = () => {
    // navigate("/challengePage", {
    //   state: {
    //     ...challengeData,
    //   },
    // });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    if (selectedEmotions.length === 0) {
      toast({
        title: "No Emotions Selected",
        description: "Please select at least one emotion before continuing.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    try {
      const blob = await stopRecording();
      const file = new File([blob], `reaction-${Date.now()}.webm`, { type: blob?.type });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "video");
      formData.append("challengeId", challengeData?.id.toString() || "0");
      formData.append("text", "textReaction");
 const userid=localStorage.getItem('userId');

      // const response = await fetch(S3_UPLOAD_URL, { method: "POST", body: formData });
      // if (!response.ok) throw new Error("Upload failed");

      // const data = await response.json();
      // const mediaUrl = data?.url || "";

      const selectedEmotions = selectedEmotionNames;
const emotionsWithIntensity = Object.entries(selectedEmotions)
.map(([emotion, intensity]) => `${emotion}:${intensity}`)
.join(", ");

console.log('emotionsWithIntensity',emotionsWithIntensity)
      // const payload = {
      //   challengeId: challengeData?.id ,
      //   emotions: emotionsWithIntensity,
      //   mediaUrl,
      //   mode: "video",
      //   userid:userid
      // };
      // const saveRes = await fetch(NODE_API_URL, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      // if (!saveRes.ok) throw new Error("DB save failed");

      setIsSaving(false);
      setSaveSuccess(true);

      toast({
        title: "Success!",
        description: "Emotions and video saved successfully.",
      });

  
      onCompleteEmotion({
  ...challengeData,
  emotions: selectedEmotionNames,
});
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong while saving your data.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  const getEmotionCategoryCounts = (selectedEmotionNames: string[]) => {
  const counts = { joy: 0, sadness: 0 };

  selectedEmotionNames.forEach((name) => {
    if (emotionCategories.joy.includes(name)) {
      counts.joy++;
    } else if (emotionCategories.sadness.includes(name)) {
      counts.sadness++;
    }
  });

  return counts;
};


  return (
    <div className="min-h-[80vh] p-2">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-0">
        <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 relative min-h-[64px]">
          {/* Coin Badge */}
          <div className="inline-flex items-center px-3 py-2 rounded-full border border-[#F5BF21] bg-[#FFF8E5] shadow-sm text-brown-800 font-semibold text-sm">
            <div className="relative w-5 h-5 mr-2">
              <img
                src="/img/goldcoin.png"
                alt="Gold Coin"
                className="w-full h-full flip-animation transform-gpu"
              />
            </div>
            {challengeData?.id * 2} Coins
            <style>
              {`
                .flip-animation {
                  animation: flip 1s linear infinite;
                  transform-style: preserve-3d;
                }
                @keyframes flip {
                  0% { transform: rotateY(0deg); }
                  100% { transform: rotateY(360deg); }
                }
              `}
            </style>
          </div>

          {/* Title */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center leading-tight">
            <h2 className="text-base font-bold text-foreground mt-4">How are you feeling?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Feel free to add more than one emotion.</p>
          </div>

          {/* Exit Button */}
          <Button
            variant="outline"
            onClick={handleByeBye}
            className="border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Emotion Grid */}
      <div className="max-w-xl mx-auto relative mt-2">
        <Card className="animate-fade-in">
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {emotions.map((emotion) => {
                const isSelected = selectedEmotions.includes(emotion.id);
                return (
                  <Button
                    key={emotion.id}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => toggleEmotion(emotion.id)}
                    className={`!m-0 h-14 flex flex-col items-center transition-all duration-300 hover:scale-105 ${
                      isSelected
                        ? "bg-gradient-to-br from-primary to-primary-glow shadow-md transform scale-105"
                        : "border-border/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center text-base rounded-full ${
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

          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
            {/* <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full hover:bg-primary/20"
            >
              <ArrowLeft className="w-4 h-4 text-primary" />
            </Button> */}
          </div>

          <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              disabled={selectedEmotions.length === 0}
              className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 disabled:opacity-30"
            >
              {isSaving ? (
                saveSuccess ? (
                  <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
                ) : (
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                )
              ) : (
                <ArrowRight className="w-6 h-6 text-primary" />
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmotionsForm;
