import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityTimerProps {
  onActivityComplete: (activity: { name: string; duration: number; startTime: Date; endTime: Date }) => void;
}

export const ActivityTimer = ({ onActivityComplete }: ActivityTimerProps) => {
  const [activityName, setActivityName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);
  const pausedTimeRef = useRef(0);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setElapsedTime(Date.now() - (startTime?.getTime() || 0) - pausedTimeRef.current);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, startTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    if (!activityName.trim()) return;
    
    if (!isRunning) {
      setStartTime(new Date());
      pausedTimeRef.current = 0;
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      pausedTimeRef.current += Date.now() - (startTime?.getTime() || 0) - elapsedTime;
    } else if (isPaused) {
      setIsPaused(false);
    }
  };

  const handleStop = () => {
    if (isRunning && startTime) {
      const endTime = new Date();
      onActivityComplete({
        name: activityName,
        duration: elapsedTime,
        startTime,
        endTime,
      });
      
      setIsRunning(false);
      setIsPaused(false);
      setElapsedTime(0);
      setActivityName("");
      setStartTime(null);
      pausedTimeRef.current = 0;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card rounded-2xl shadow-medium p-8 border border-border">
        <div className="space-y-6">
          <div className="text-center">
            <div
              className={cn(
                "text-6xl md:text-7xl font-bold tabular-nums tracking-tight",
                isRunning && !isPaused && "text-primary animate-pulse-soft"
              )}
            >
              {formatTime(elapsedTime)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {!isRunning && "Ready to track"}
              {isRunning && !isPaused && "Tracking..."}
              {isPaused && "Paused"}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="What are you working on?"
              disabled={isRunning}
              className="text-lg h-12 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRunning) {
                  handleStart();
                }
              }}
            />

            <div className="flex gap-3 justify-center">
              {!isRunning ? (
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={!activityName.trim()}
                  className="gap-2 px-8"
                >
                  <Play className="h-5 w-5" />
                  Start
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={handlePause}
                    className="gap-2 px-8"
                  >
                    <Pause className="h-5 w-5" />
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={handleStop}
                    className="gap-2 px-8"
                  >
                    <Square className="h-5 w-5" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
