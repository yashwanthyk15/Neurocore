import { useEffect, useRef, useState, useCallback } from 'react';

export function useEyeTracking() {
  const [available, setAvailable] = useState(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);
  const dataRef = useRef({
    focusLossCount: 0,
    rereadCount: 0,
    gazeHistory: [],
    lastGazeY: null,
    startTime: null,
  });
  const webgazerRef = useRef(null);
  const intervalRef = useRef(null);

  const init = useCallback(async () => {
    try {
      // Dynamically load WebGazer only if camera available
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop()); // Just check permission

      if (!window.webgazer) {
        // Load webgazer from CDN dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      webgazerRef.current = window.webgazer;
      await webgazerRef.current
        .setRegression('ridge')
        .setTracker('TFFacemesh')
        .setGazeListener((data, elapsedTime) => {
          if (!data) {
            // Eyes off screen
            dataRef.current.focusLossCount += 1;
            return;
          }

          const { x, y } = data;
          const screenH = window.innerHeight;
          const screenW = window.innerWidth;

          // Check if gaze is within reading area (middle 60% of screen)
          const inReadingArea = x > screenW * 0.1 && x < screenW * 0.9 &&
                                 y > screenH * 0.1 && y < screenH * 0.9;

          if (!inReadingArea) {
            dataRef.current.focusLossCount += 1;
          }

          // Detect rereading (gaze moving back upward significantly)
          if (dataRef.current.lastGazeY !== null) {
            if (y < dataRef.current.lastGazeY - 80) {
              dataRef.current.rereadCount += 1;
            }
          }
          dataRef.current.lastGazeY = y;
          dataRef.current.gazeHistory.push({ x, y, t: Date.now() });

          // Keep only last 100 points
          if (dataRef.current.gazeHistory.length > 100) {
            dataRef.current.gazeHistory = dataRef.current.gazeHistory.slice(-100);
          }
        })
        .begin();

      webgazerRef.current.showVideoPreview(false).showPredictionPoints(false);
      dataRef.current.startTime = Date.now();
      setAvailable(true);
      setActive(true);
    } catch (err) {
      setError(err.message);
      setAvailable(false);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      if (webgazerRef.current) {
        webgazerRef.current.end();
        webgazerRef.current = null;
      }
    } catch (e) {}
    setActive(false);
  }, []);

  const getSignals = useCallback(() => {
    const elapsed = dataRef.current.startTime
      ? Math.floor((Date.now() - dataRef.current.startTime) / 1000)
      : 0;
    return {
      timeOnChunk: elapsed,
      focusLossCount: Math.floor(dataRef.current.focusLossCount / 5), // normalize
      rereadCount: dataRef.current.rereadCount,
    };
  }, []);

  const resetSignals = useCallback(() => {
    dataRef.current = {
      focusLossCount: 0,
      rereadCount: 0,
      gazeHistory: [],
      lastGazeY: null,
      startTime: Date.now(),
    };
  }, []);

  useEffect(() => {
    return () => {
      stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stop]);

  return { available, active, error, init, stop, getSignals, resetSignals };
}
