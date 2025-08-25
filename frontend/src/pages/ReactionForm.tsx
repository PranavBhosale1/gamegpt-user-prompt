import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { environment } from "../../environment";
import { LogOut } from "lucide-react"; 
import {
  ArrowLeft,
  ArrowRight,
  Video,
  Home,
  Mic,
  FileText,
  Square,
  Circle,
  Loader,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ReactionMode = 'video' | 'audio' | 'text';
const S3_UPLOAD_URL = environment.S3_UPLOAD_URL;
const NODE_API_URL = environment.NODE_API_URL;
const ReactionForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const challengeData = location.state as {
    challengeId: number;
    challengeTitle: string;
    currentChallenge: number;
  } | null;

  const [mode, setMode] = useState<ReactionMode>('video');
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
      if (!challengeData?.challengeId) {
        // Redirect if Emotion form was accessed directly
        navigate("/challenge", { replace: true });
      }
    }, [challengeData, navigate]);


  useEffect(() => {
    if (mode === 'video') {
      startVideoRecording();
    }
      else if (mode === 'audio') {
    startAudioRecording(); // ✅ Automatically start audio recording when audio mode is selected
  }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode]);

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setMediaBlob(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch {
      toast({ title: "Error", description: "Could not access camera and mic.", variant: "destructive" });
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
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setMediaBlob(blob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch {
      toast({ title: "Error", description: "Could not access microphone.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleByeBye = () => {
    toast({
      title: "Thank you for participating!",
      // description: `You completed`,
    });
    navigate("/");
  };
  const handleNext = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if ((mode === 'video' || mode === 'audio') && mediaBlob) {
        const file = new File([mediaBlob], `reaction-${Date.now()}.webm`, { type: mediaBlob.type });
        const formData = new FormData();
        formData.append("file", file);
        formData.append("mode", mode);
        formData.append("challengeId", challengeData?.challengeId.toString() || "0");
        formData.append("text", textReaction);

        const response = await fetch(S3_UPLOAD_URL, { method: "POST", body: formData });
        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
          const mediaUrl = data?.url || ""; 

        const saveRes = await fetch(NODE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: challengeData?.challengeId, mode, text: null, mediaUrl }),
        });

        if (!saveRes.ok) throw new Error("DB save failed");

      } else if (mode === 'text') {
        const saveRes = await fetch(NODE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: challengeData?.challengeId, mode, text: textReaction.trim(), mediaUrl: "" }),
        });
        if (!saveRes.ok) throw new Error("DB save failed");
      }

      toast({ title: "Reaction Saved!", description: "Your reaction has been saved successfully." });
      setSaveSuccess(true);

      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(false);

        if (mode === 'video') {
          if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
          setMode('audio');
        } else if (mode === 'audio') {
          setMode('text');
        } else {
          navigate("/emotions", {
            state: {
              challengeId: challengeData?.challengeId,
              challengeTitle: challengeData?.challengeTitle,
              currentChallenge: challengeData?.currentChallenge,
            },
          });
        }
      }, 800);

    } catch (err) {
      toast({ title: "Error", description: "Could not upload or save.", variant: "destructive" });
      setIsSaving(false);
    }
  };

  const currentChallenge = location.state?.currentChallenge ?? 0;
  console.log('ReactionscurrentChallenge:', currentChallenge);
  const handleBack = () => {
    if (mode === "video") {
      navigate("/challenge", {
        state: {
          fromEmotion: true,
          currentChallenge: currentChallenge, // ✅ Go back to the same challenge
        },
      });
    } else if (mode === "audio") {
      setMode("video");
    } else if (mode === "text") {
      setMode("audio");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
{/* {header} */}
 {/* Header */}
<div className="max-w-xl mx-auto ">
  <div className="flex items-center justify-between px-4 py-2 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 relative min-h-[64px]">

    {/* Left - Home Button */}
    <div className="inline-flex items-center px-3 py-2 rounded-full bg-yellow-400/90 shadow-sm text-brown-800 font-semibold text-sm">
                <div className="relative w-5 h-5 mr-2">
                  <img
                    src="/img/goldcoin.png"
                    alt="Gold Coin"
                    className="w-full h-full flip-animation transform-gpu"
                  />
                </div>
                {challengeData?.challengeId * 2 } Coins

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
        {mode === "video"
          ? "Record Your Video Response."
          : mode === "audio"
          ? "Record Your Audio Response."
          : "Type Your Text Response."}
      </h2>
      <p className="text-xs text-muted-foreground mt-0.5">
        {mode === "video"
          ? "Record a video for 1 minute."
          : mode === "audio"
          ? "Record an audio for 1 minute."
          : "Thoughts and Reactions."}
      </p>
    </div>

    {/* Right - Logout */}
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


      <div className="max-w-xl mx-auto relative">
        <Card className="p-2 bg-card/20 backdrop-blur-sm border-border/20 animate-fade-in">
          <div className="space-y-2">
            <div className="text-center space-y-2">
              <div className="flex justify-center items-top text-foreground">
                {/* {mode === 'video' && <Video className="w-8 h-8" />}
                {mode === 'audio' && <Mic className="w-8 h-8" />}
                {mode === 'text' && <FileText className="w-8 h-8" />} */}

                {mode === 'video' }
                {mode === 'audio' }
                {mode === 'text' }
              </div>
              <p className="text-muted-foreground">
                {/* {mode === 'video' && 'Record a 1-minute video response'} */}
                {/* {mode === 'audio' && 'Record a 1-minute audio response'} */}
                {/* {mode === 'video' && 'Record a 1-minute video response'}
                {mode === 'audio' && 'Record a 1-minute audio response'} */}
                {/* {mode === 'text' && 'Write your thoughts (3 minutes to write)'} */}
              </p>
            </div>

            {/* Video */}
            {mode === 'video' && (
              <div className="space-y-4 text-center">
                <video ref={videoRef} className="w-full max-w-md mx-auto rounded-lg bg-black" autoPlay muted playsInline />
                {isRecording && (
                  <div className="text-lg font-bold text-destructive animate-pulse">
                    Recording: {formatTime(recordingTime)}
                  </div>
                )}
                <div className="flex justify-center space-x-4">
                  {!isRecording ? (
                    <Button onClick={startVideoRecording} className="bg-gradient-to-r from-destructive to-destructive/80">
                      <Circle className="w-4 h-4 mr-2 fill-current" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="outline" className="border-destructive text-destructive">
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Audio */}
            {mode === 'audio' && (
              <div className="space-y-4 text-center">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                  <Mic className={`w-12 h-12 ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
                </div>
                {isRecording && (
                  <div className="text-lg font-bold text-destructive animate-pulse">
                    Recording: {formatTime(recordingTime)}
                  </div>
                )}
                <div className="flex justify-center space-x-4">
                  {!isRecording ? (
                    <Button onClick={startAudioRecording} className="bg-gradient-to-r from-destructive to-destructive/80">
                      <Circle className="w-4 h-4 mr-2 fill-current" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} variant="outline" className="border-destructive text-destructive">
                      <Square className="w-4 h-4 mr-2 fill-current" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Text */}
            {mode === 'text' && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Share your thoughts and reactions here..."
                  value={textReaction}
                  onChange={(e) => setTextReaction(e.target.value)}
                  className="min-h-[200px] bg-background/50 border-border/50"
                />
                <div className="text-sm text-muted-foreground text-right">
                  {textReaction.length} characters
                </div>
              </div>
            )}
          </div>

          {/* Arrows */}
          <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBack}
              disabled={mode === 'video'}
              className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20 disabled:opacity-30"
            >
              <ArrowLeft className="w-6 h-6 text-primary" />
            </Button>
          </div>

          <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={isSaving}
              className="h-12 w-12 rounded-full border-primary/30 bg-primary/10 hover:bg-primary/20"
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

export default ReactionForm;
