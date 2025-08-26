import { useState, Suspense, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/Games/RecordingContext"; //  Import useRecording
import LandingPage from "@/Games/LandingPage";
import ChallengePage from "@/Games/ChallengePage";
import EmotionForm from "@/Games/EmotionsForm";
import ReactionForm from "@/Games/ReactionForm";
import { Layout } from "@/components/Layout";
import challengeData from "@/data/challenges.json";

export default function App() {
  const { toast } = useToast();
  const { forceStopAndCleanup } = useRecording(); //  Get cleanup function
  const [currentScreen, setCurrentScreen] = useState<"landing" | "challenge" | "emotion" | "reaction">("landing");
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [currentChallengeData, setCurrentChallengeData] = useState<any>(null);

  const totalChallenges = challengeData.length;

  const handleReactionComplete = () => {
    const nextIndex = currentChallengeIndex + 1;
    if (nextIndex < totalChallenges) {
      setCurrentChallengeIndex(nextIndex);
      setCurrentScreen("challenge");
      // toast({ 
      //   title: `Challenge ${nextIndex + 1} of ${totalChallenges}`,
      //   description: "Moving to next challenge!" 
      // });
    } else {
      toast({ 
        title: "🎉 All Challenges Complete!", 
        // description: "Congratulations! You've completed all challenges." 
      });
      handleGameExit(); //  Use proper exit
    }
  };

  const handleGameExit = () => {
    //  FORCE STOP ALL RECORDING & CLEANUP
    forceStopAndCleanup();
    
    toast({ title: "Thanks for playing! All recording stopped." });
    setCurrentScreen("landing");
    setCurrentChallengeIndex(0);
    setCurrentChallengeData(null);
  };

  //  Cleanup on component unmount
  useEffect(() => {
    return () => {
      forceStopAndCleanup();
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-xl mx-auto pt-6"> {/*  Reduced padding */}
        {currentScreen === "landing" && (
          <Suspense fallback={<div>Loading Landing...</div>}>
            <LandingPage onStart={() => setCurrentScreen("challenge")} />
          </Suspense>
        )}

        {currentScreen === "challenge" && (
          <Suspense fallback={<div>Loading Challenge...</div>}>
            <ChallengePage
              currentChallengeIndex={currentChallengeIndex}
              onCompleteChallenge={(challengeData) => {
                setCurrentChallengeData({
                  id: challengeData.id,
                  challengeTitle: challengeData.title,
                  currentChallenge: currentChallengeIndex,
                  type: challengeData.type,
                  content: challengeData.content,
                  mediaUrl: challengeData.mediaUrl
                });
                setCurrentScreen("emotion");
              }}
              onExit={handleGameExit} //  Pass proper exit handler
            />
          </Suspense>
        )}

        {currentScreen === "emotion" && (
          <Suspense fallback={<div>Loading Emotions...</div>}>
            <EmotionForm
              challengeData={currentChallengeData}
              onCompleteEmotion={(data) => {
                setCurrentChallengeData(data);
                setCurrentScreen("reaction");
              }}
              onlogoutReaction={handleGameExit} //  Use proper exit
            />
          </Suspense>
        )}

        {currentScreen === "reaction" && (
          <Suspense fallback={<div>Loading Reactions...</div>}>
            <ReactionForm
              challengeData={{
                challengeId: currentChallengeData?.id,
                challengeTitle: currentChallengeData?.challengeTitle,
                currentChallenge: currentChallengeIndex,
                emotions: currentChallengeData?.emotions
              }}
              onCompleteReaction={handleReactionComplete}
              onBackToChallenge={() => setCurrentScreen("challenge")}
              onExit={handleGameExit} //  Use proper exit
            />
          </Suspense>
        )}
      </div>
    </Layout>
  );
}
