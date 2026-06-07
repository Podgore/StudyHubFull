import React, { useState, useEffect } from 'react';
import { Typography } from '@mui/material';
import Assignment from '../../api/Assignment';
import { parseRemainingTimeToSeconds } from '../../utils/timedTestSessionCache';

type CountdownTimerProps = {
  assignmentId: string;
  sessionId: string;
  sessionHash: string;
  initialSeconds?: number;
};

const CountdownTimer = ({
  assignmentId,
  sessionId,
  sessionHash,
  initialSeconds = 0,
}: CountdownTimerProps) => {
  const [time, setTime] = useState(initialSeconds > 0 ? initialSeconds : 0);

  useEffect(() => {
    setTime(initialSeconds > 0 ? initialSeconds : 0);
  }, [initialSeconds, assignmentId, sessionId, sessionHash]);

  useEffect(() => {
    let cancelled = false;

    const syncFromServer = async () => {
      const remaining = await Assignment.getTimedTestRemainingTime(
        assignmentId,
        sessionId,
        sessionHash,
      );
      if (cancelled || !remaining) return;
      setTime(parseRemainingTimeToSeconds(remaining));
    };

    if (initialSeconds <= 0) {
      void syncFromServer();
    }

    const interval = setInterval(() => {
      void syncFromServer();
    }, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [assignmentId, sessionId, sessionHash, initialSeconds]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [time]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Typography variant="h3" color={time > 0 ? 'textPrimary' : 'error'}>
      {time > 0 ? formatTime(time) : 'Time’s up!'}
    </Typography>
  );
};

export default CountdownTimer;
