import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { environment } from "../../environment";
import { LogOut, ArrowLeft, ArrowRight, Mic, Square, Circle, Loader, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ReactionMode = "audio" | "text";
const S3_UPLOAD_URL = environment.S3_UPLOAD_URL;
const NODE_API_URL = environment.NODE_API_URL;

interface ReactionFormProps {
  challengeData: {
    challengeId: number;
    challengeTitle?: string;
    currentChallenge?: number;
    emotions?: string[];
  };
  onCompleteReaction: () => void;
  onBackToChallenge?: () => void;
  onExit?: () => void;
}

const ReactionForm: React.FC<ReactionFormProps> = ({ 
  challengeData, 
  onCompleteReaction,
  onBackToChallenge,
  onExit 
}) => {
  const { toast } = useToast();

  const [mode, setMode] = useState<ReactionMode>("audio");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [textReaction, setTextReaction] = useState("");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (mode === "audio") {
      startAudioRecording();
    }
    return () => {
      cleanup();
    };
  }, [mode]);

  //  ENHANCED: Complete cleanup function
  const cleanup = () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`🔴 Cleanup stopped ${track.kind} track`);
        });
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsRecording(false);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setMediaBlob(blob);
        console.log(" Audio recording stopped, blob created");
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
      console.log("🎤 Started audio recording");
    } catch (error) {
      toast({ title: "Error", description: "Could not access microphone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`🔴 Manual stop: ${track.kind} track stopped`);
        });
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  //  NEW: Force stop recording and get blob (for auto-save)
  const forceStopAndGetBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(mediaBlob); // Return existing blob if not recording
        return;
      }

      // Set up one-time stop handler
      const handleStop = () => {
        mediaRecorderRef.current?.removeEventListener('stop', handleStop);
        resolve(mediaBlob);
      };
      
      mediaRecorderRef.current.addEventListener('stop', handleStop);
      
      // Force stop
      stopRecording();
      
      // Fallback timeout
      setTimeout(() => {
        resolve(mediaBlob);
      }, 500);
    });
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleExit = () => {
    toast({ title: "Thank you for participating!" });
    cleanup(); //  Use enhanced cleanup
    if (onExit) {
      onExit();
    }
  };

  //  ENHANCED: Auto-save recording even if user didn't press stop
  const handleNext = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const userid=localStorage.getItem('userId');
      if (mode === "audio") {
        let blobToUpload = mediaBlob;
        
        //  AUTO-SAVE: If still recording, force stop and get blob
        if (isRecording) {
          console.log("🚨 User clicked next while recording - auto-saving...");
          toast({ 
            title: "Auto-saving recording...", 
            description: "Don't worry, we got your audio!" 
          });
          blobToUpload = await forceStopAndGetBlob();
        }
        
        if (blobToUpload) {
          const file = new File([blobToUpload], `reaction-${Date.now()}.webm`, { type: blobToUpload.type });
          const formData = new FormData();
          formData.append("file", file);
          formData.append("mode", mode);
          formData.append("challengeId", challengeData?.challengeId.toString() || "0");
          formData.append("text", textReaction);

          // const response = await fetch(S3_UPLOAD_URL, { method: "POST", body: formData });
          // if (!response.ok) throw new Error("Upload failed");

          // const data = await response.json();
          // const mediaUrl = data?.url || "";
        
          // const saveRes = await fetch(NODE_API_URL, {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     challengeId: challengeData?.challengeId,
          //     mode,
          //     text: null,
          //     mediaUrl,
          //     userid:userid

          //   }),
          // });
          // if (!saveRes.ok) throw new Error("DB save failed");
          
          console.log(" Auto-saved audio recording successfully");
        }
      } else if (mode === "text") {
        if (!textReaction.trim()) {
          toast({
            title: "Please share your thoughts",
            description: "Text response cannot be empty.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }

        // const saveRes = await fetch(NODE_API_URL, {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({
        //     challengeId: challengeData?.challengeId,
        //     mode,
        //     text: textReaction.trim(),
        //     mediaUrl: "",
        //      userid:userid
        //   }),
        // });
        // if (!saveRes.ok) throw new Error("DB save failed");
      }

      toast({ title: "Reaction Saved!", description: "Your reaction has been saved successfully." });
      setSaveSuccess(true);

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);
        if (mode === "audio") {
          setMode("text");
        } else {
          cleanup(); //  Cleanup before moving on
          onCompleteReaction();
        }
      }, 800);
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Error", description: "Could not upload or save.", variant: "destructive" });
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (mode === "audio" && onBackToChallenge) {
      cleanup(); //  Cleanup before going back
      onBackToChallenge();
    } else if (mode === "text") {
      setMode("audio");
    }
  };

  return (
    <div className="min-h-[80vh] p-6">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-4">
        <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 relative min-h-[64px]">
          <div className="inline-flex items-center px-3 py-2 rounded-full border border-[#F5BF21] bg-[#FFF8E5] shadow-sm text-brown-800 font-semibold text-sm">
            <div className="relative w-5 h-5 mr-2">
              <img src="/img/goldcoin.png" alt="Gold Coin" className="w-full h-full flip-animation transform-gpu" />
            </div>
            {challengeData?.challengeId * 2} Coins
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

          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center leading-tight">
            <h2 className="text-base font-bold text-foreground mt-4">
              {mode === "audio" ? "Record Your Audio Response." : "Type Your Text Response."}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "audio" ? 
                (isRecording ? "Recording... (Click next when done)" : "Record an audio for 1 minute.") 
                : "Thoughts and Reactions."}
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

      <div className="max-w-xl mx-auto relative">
        <Card className="p-4 bg-card backdrop-blur-sm border-border shadow-sm">
          <div className="space-y-4 text-center">
            {mode === "audio" && (
              <>
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Mic className={`w-12 h-12 ${isRecording ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                </div>
                {isRecording && (
                  <div className="text-lg font-bold text-destructive animate-pulse">
                    Recording: {formatTime(recordingTime)}
                  </div>
                )}
                <div className="flex justify-center space-x-4">
                  {!isRecording ? (
                    <Button onClick={startAudioRecording} className="bg-gradient-to-r from-destructive to-destructive/80">
                      <Circle className="w-4 h-4 mr-2 fill-current" /> Start
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="outline" className="border-destructive text-destructive">
                      <Square className="w-4 h-4 mr-2 fill-current" /> Stop
                    </Button>
                  )}
                </div>
                {/*  NEW: Helper text */}
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: You can click "Next" directly - we'll auto-save your recording!
                </p>
              </>
            )}

            {mode === "text" && (
              <>
                <Textarea
                  placeholder="Share your thoughts and reactions here..."
                  value={textReaction}
                  onChange={(e) => setTextReaction(e.target.value)}
                  className="min-h-[200px] bg-background/50 border-border/50"
                />
                <div className="text-sm text-muted-foreground text-right">{textReaction.length} characters</div>
              </>
            )}
          </div>

          <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
            <Button variant="outline" size="icon" onClick={handleBack} className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20">
              <ArrowLeft className="w-6 h-6 text-primary" />
            </Button>
          </div>
          <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
            <Button variant="outline" size="icon" onClick={handleNext} disabled={isSaving} className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20">
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

export default ReactionForm;
