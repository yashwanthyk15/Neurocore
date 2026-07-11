import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';

export function useReadingSession(documentId, initialSettings) {
  const [sessionId, setSessionId] = useState(null);
  const [settings, setSettings] = useState(initialSettings || {
    fontSize: 18,
    lineSpacing: 1.8,
    chunkSize: 600,
    focusMode: false,
    colorOverlay: 'none',
    useDyslexicFont: true,
  });
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [adaptationReasons, setAdaptationReasons] = useState([]);
  const snapshotTimer = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Start or resume session
  useEffect(() => {
    if (!documentId) return;
    api.post('/sessions/start', { documentId })
      .then(res => setSessionId(res.data.session._id))
      .catch(err => console.warn('Session start failed (offline mode):', err.message));
  }, [documentId]);

  // Auto-snapshot every 30 seconds
  useEffect(() => {
    if (!sessionId) return;
    snapshotTimer.current = setInterval(() => {
      saveSnapshot({});
    }, 30000);
    return () => clearInterval(snapshotTimer.current);
  }, [sessionId]); // eslint-disable-line

  // Save on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (sessionId) {
        navigator.sendBeacon(`/api/sessions/${sessionId}/snapshot`,
          JSON.stringify({ currentChunkIndex, currentSettings: settingsRef.current }));
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [sessionId, currentChunkIndex]);

  const saveSnapshot = useCallback(async (behavioralEvent) => {
    if (!sessionId) return;
    try {
      await api.post(`/sessions/${sessionId}/snapshot`, {
        behavioralEvent,
        currentChunkIndex,
        currentSettings: settingsRef.current,
      });
    } catch (e) {
      // Fallback to localStorage
      try {
        localStorage.setItem(`nc_session_${documentId}`, JSON.stringify({
          sessionId,
          currentChunkIndex,
          settings: settingsRef.current,
          savedAt: Date.now(),
        }));
      } catch {}
    }
  }, [sessionId, currentChunkIndex, documentId]);

  const processAdaptation = useCallback(async (behavioralData) => {
    try {
      const res = await api.post('/adaptations/process', {
        behavioralData,
        currentSettings: settingsRef.current,
        sessionId,
        chunkIndex: currentChunkIndex,
      });
      if (res.data.changed) {
        setSettings(res.data.adaptations);
        setAdaptationReasons(res.data.reasons);
        setTimeout(() => setAdaptationReasons([]), 6000);
      }
      return res.data;
    } catch (e) {
      console.warn('Adaptation processing failed:', e.message);
      return null;
    }
  }, [sessionId, currentChunkIndex]);

  const completeSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      await api.post(`/sessions/${sessionId}/complete`);
    } catch (e) {}
  }, [sessionId]);

  return {
    sessionId,
    settings,
    setSettings,
    currentChunkIndex,
    setCurrentChunkIndex,
    saveSnapshot,
    processAdaptation,
    completeSession,
    adaptationReasons,
  };
}
