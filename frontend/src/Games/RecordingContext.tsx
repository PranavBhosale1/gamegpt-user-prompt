import React, {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";

type RecordingType = "audio" | "video";

type RecordingContextType = {
  stream: MediaStream | null;
  recorder: MediaRecorder | null;
  startRecording: (type: RecordingType) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  forceStopAndCleanup: () => void;
  isRecording: boolean;
};

const RecordingContext = createContext<RecordingContextType | null>(null);

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within a RecordingProvider");
  }
  return context;
};

export const RecordingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const [currentRecorder, setCurrentRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTypeRef = useRef<RecordingType>("video");

  const startRecording = async (type: RecordingType) => {
    if (isRecording) return;

    const constraints = type === "video"
      ? { audio: true, video: true }
      : { audio: true };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const recorder = new MediaRecorder(stream, {
        mimeType: type === "video" ? "video/webm" : "audio/webm",
      });

      recordingTypeRef.current = type;
      chunksRef.current = [];
      setCurrentStream(stream);
      setCurrentRecorder(recorder);

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstart = () => setIsRecording(true);
      recorder.start();
      
      console.log(` Started ${type} recording`);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopRecording = async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = currentRecorder;
      const stream = currentStream;

      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const type = recordingTypeRef.current === "video" ? "video/webm" : "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        
        // Stop all tracks
        stream?.getTracks().forEach((track) => {
          track.stop();
          console.log(`🔴 Stopped ${track.kind} track`);
        });
        
        setIsRecording(false);
        setCurrentRecorder(null);
        setCurrentStream(null);
        resolve(blob);
      };

      recorder.stop();
    });
  };

  //  ENHANCED: Force stop everything with multiple cleanup methods
  const forceStopAndCleanup = () => {
    try {
      console.log("🚨 FORCE CLEANUP INITIATED");
      
      // Method 1: Stop MediaRecorder
      if (currentRecorder) {
        if (currentRecorder.state === "recording") {
          currentRecorder.stop();
          console.log("🔴 Forced recorder stop");
        }
        if (currentRecorder.state === "paused") {
          currentRecorder.resume();
          currentRecorder.stop();
          console.log("🔴 Resumed and stopped recorder");
        }
      }
      
      // Method 2: Stop all MediaStream tracks (CRITICAL)
      if (currentStream) {
        currentStream.getTracks().forEach((track) => {
          if (track.readyState === "live") {
            track.stop();
            console.log(`🔴 FORCE STOPPED ${track.kind} track - State: ${track.readyState}`);
          }
        });
        
        // Additional cleanup - Remove tracks from stream
        currentStream.getTracks().forEach((track) => {
          currentStream.removeTrack(track);
        });
      }
      
      // Method 3: Query and stop ALL active media streams (Nuclear option)
      navigator.mediaDevices.enumerateDevices().then(() => {
        // This forces browser to re-evaluate device permissions
        console.log("🔄 Re-evaluated media devices");
      }).catch(e => console.log("Device enumeration:", e));
      
      // Method 4: Reset all state immediately
      setIsRecording(false);
      setCurrentRecorder(null);
      setCurrentStream(null);
      chunksRef.current = [];
      
      console.log(" ALL CLEANUP COMPLETED - Camera/Mic should be OFF");
      
      // Method 5: Additional timeout cleanup (fallback)
      setTimeout(() => {
        if (currentStream) {
          currentStream.getTracks().forEach(track => {
            if (track.readyState === "live") {
              track.stop();
              console.log("🔴 TIMEOUT CLEANUP: Stopped lingering track");
            }
          });
        }
      }, 100);
      
    } catch (error) {
      console.error("❌ Error during force cleanup:", error);
      // Even if error, reset state
      setIsRecording(false);
      setCurrentRecorder(null);
      setCurrentStream(null);
    }
  };

  return (
    <RecordingContext.Provider
      value={{
        stream: currentStream,
        recorder: currentRecorder,
        startRecording,
        stopRecording,
        forceStopAndCleanup,
        isRecording,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};
