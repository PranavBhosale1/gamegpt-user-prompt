import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Mic, Play, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-challenge-app.jpg";

const LandingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState({
    camera: false,
    audio: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      stream.getTracks().forEach(track => track.stop());

      setPermissions({ camera: true, audio: true });
      toast({
        title: "Permissions Granted!",
        description: "Camera and microphone access granted successfully.",
      });
    } catch (error) {
      toast({
        title: "Permission Denied",
        description: "Please allow camera and microphone access to continue.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = () => {
    if (permissions.camera && permissions.audio) {
      navigate("/challenge");
    } else {
      toast({
        title: "Permissions Required",
        description: "Please grant camera and microphone permissions first.",
        variant: "destructive",
      });
    }
  };

  return (
   <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
  <div className="relative z-10 max-w-[605px] mx-auto w-full">
    <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/30 animate-fade-in shadow-xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center animate-pulse-gold">
          <Play className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Challenge Experience
        </h1>
        <p className="text-muted-foreground text-base">
          Welcome to Mood Magic! Let's begin your interactive challenge journey.
        </p>
      </div>

      {/* Permission States */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
          permissions.camera ? 'bg-success/10 border border-success/20' : 'bg-muted/30 border border-border'
        }`}>
          {permissions.camera ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Camera className="w-5 h-5 text-muted-foreground" />
          )}
          <span className={permissions.camera ? 'text-success' : 'text-foreground'}>
            Camera Access
          </span>
        </div>

        <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
          permissions.audio ? 'bg-success/10 border border-success/20' : 'bg-muted/30 border border-border'
        }`}>
          {permissions.audio ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Mic className="w-5 h-5 text-muted-foreground" />
          )}
          <span className={permissions.audio ? 'text-success' : 'text-foreground'}>
            Microphone Access
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <div>
        {!permissions.camera || !permissions.audio ? (
          <Button 
            onClick={requestPermissions} 
            disabled={isLoading}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 transition-all duration-300"
          >
            {isLoading ? "Requesting Permissions..." : "Let's Begin"}
          </Button>
        ) : (
          <Button 
            onClick={handleStart}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 transition-all duration-300 animate-bounce-subtle"
          >
            Start Challenge
          </Button>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        You'll complete challenges, share reactions, and track emotions in this immersive experience.
      </div>
    </Card>
  </div>
</div>


  );
};

export default LandingPage;
