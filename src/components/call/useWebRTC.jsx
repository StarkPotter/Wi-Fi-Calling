const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, { get: () => ({ filter: async () => [], get: async () => null, create: async () => ({}), update: async () => ({}), delete: async () => ({}) }) }),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } }
};

import { useState, useRef, useCallback, useEffect } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
};

export default function useWebRTC({ myPhoneId, onCallEnded }) {
  const [callState, setCallState] = useState('idle');
  const [remoteId, setRemoteId] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [incomingSignal, setIncomingSignal] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteAudioEl = useRef(null); // We create the <audio> element ourselves
  const durationInterval = useRef(null);
  const callStartTime = useRef(null);
  const pendingCandidates = useRef([]); // Buffer ICE candidates until remote desc is set

  // Create the hidden audio element once
  useEffect(() => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.playsInline = true;
    document.body.appendChild(audio);
    remoteAudioEl.current = audio;
    return () => {
      audio.remove();
    };
  }, []);

  const cleanup = useCallback(() => {
    if (durationInterval.current) clearInterval(durationInterval.current);
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (remoteAudioEl.current) {
      remoteAudioEl.current.srcObject = null;
    }
    pendingCandidates.current = [];
    setCallDuration(0);
    setIsMuted(false);
    callStartTime.current = null;
  }, []);

  const startDurationTimer = useCallback(() => {
    callStartTime.current = Date.now();
    durationInterval.current = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);
  }, []);

  const applyPendingCandidates = useCallback(async () => {
    const pc = peerConnection.current;
    if (!pc) return;
    for (const c of pendingCandidates.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
    pendingCandidates.current = [];
  }, []);

  const createPeerConnection = useCallback(async (targetId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;

    // Mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.current = stream;
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Remote audio — attach directly to our audio element
    pc.ontrack = (event) => {
      if (remoteAudioEl.current && event.streams[0]) {
        remoteAudioEl.current.srcObject = event.streams[0];
        remoteAudioEl.current.play().catch(() => {});
      }
    };

    // Send ICE candidates to the other side
    pc.onicecandidate = async (event) => {
      if (event.candidate && targetId) {
        await db.entities.CallSignal.create({
          from_user_id: myPhoneId,
          to_user_id: targetId,
          signal_type: 'ice-candidate',
          signal_data: JSON.stringify(event.candidate),
          status: 'pending'
        });
      }
    };

    return pc;
  }, [myPhoneId]);

  // ── MAKE CALL ──────────────────────────────────────────────────────────────
  const makeCall = useCallback(async (targetId, myName) => {
    setRemoteId(targetId);
    setCallState('calling');

    const pc = await createPeerConnection(targetId);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send ring + offer together
    await db.entities.CallSignal.create({
      from_user_id: myPhoneId,
      to_user_id: targetId,
      from_name: myName || myPhoneId,
      signal_type: 'ring',
      status: 'pending',
      signal_data: JSON.stringify({ callerName: myName || myPhoneId })
    });

    await db.entities.CallSignal.create({
      from_user_id: myPhoneId,
      to_user_id: targetId,
      signal_type: 'offer',
      signal_data: JSON.stringify(offer),
      status: 'pending'
    });
  }, [myPhoneId, createPeerConnection]);

  // ── ANSWER CALL ────────────────────────────────────────────────────────────
  const answerCall = useCallback(async (signal, myName) => {
    const callerId = signal.from_user_id;
    setRemoteId(callerId);
    setRemoteName(signal.from_name || callerId);
    setCallState('connected');
    startDurationTimer();

    const pc = await createPeerConnection(callerId);

    // Fetch the offer
    const signals = await db.entities.CallSignal.filter(
      { from_user_id: callerId, to_user_id: myPhoneId, signal_type: 'offer' },
      '-created_date', 1
    );

    if (signals.length > 0) {
      const offerData = JSON.parse(signals[0].signal_data);
      await pc.setRemoteDescription(new RTCSessionDescription(offerData));

      // Apply any buffered ICE candidates
      await applyPendingCandidates();

      // Also fetch any already-stored ICE candidates
      const iceSigs = await db.entities.CallSignal.filter({
        from_user_id: callerId,
        to_user_id: myPhoneId,
        signal_type: 'ice-candidate'
      });
      for (const ic of iceSigs) {
        try { await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(ic.signal_data))); } catch (_) {}
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await db.entities.CallSignal.create({
        from_user_id: myPhoneId,
        to_user_id: callerId,
        signal_type: 'answer',
        signal_data: JSON.stringify(answer),
        status: 'answered'
      });
    }

    setIncomingSignal(null);
  }, [myPhoneId, createPeerConnection, startDurationTimer, applyPendingCandidates]);

  // ── HANG UP ────────────────────────────────────────────────────────────────
  const hangUp = useCallback(async () => {
    const duration = callDuration;
    const target = remoteId;

    await db.entities.CallSignal.create({
      from_user_id: myPhoneId,
      to_user_id: target,
      signal_type: 'hang-up',
      signal_data: '{}',
      status: 'ended'
    });

    cleanup();
    setCallState('idle');
    setRemoteId('');
    setRemoteName('');

    if (onCallEnded) onCallEnded(target, duration);
  }, [myPhoneId, remoteId, callDuration, cleanup, onCallEnded]);

  // ── REJECT ─────────────────────────────────────────────────────────────────
  const rejectCall = useCallback(async () => {
    if (incomingSignal) {
      await db.entities.CallSignal.create({
        from_user_id: myPhoneId,
        to_user_id: incomingSignal.from_user_id,
        signal_type: 'hang-up',
        signal_data: '{}',
        status: 'rejected'
      });
    }
    cleanup();
    setIncomingSignal(null);
    setCallState('idle');
  }, [myPhoneId, incomingSignal, cleanup]);

  // ── MUTE ───────────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // toggle
      });
      setIsMuted(prev => !prev);
    }
  }, [isMuted]);

  // ── INCOMING SIGNAL LISTENER ───────────────────────────────────────────────
  useEffect(() => {
    if (!myPhoneId) return;

    const unsubscribe = db.entities.CallSignal.subscribe(async (event) => {
      if (event.type !== 'create') return;
      const signal = event.data;
      if (signal.to_user_id !== myPhoneId) return;

      if (signal.signal_type === 'ring') {
        // Only accept if idle
        setCallState(prev => {
          if (prev === 'idle') {
            setIncomingSignal(signal);
            setRemoteName(signal.from_name || signal.from_user_id);
            return 'ringing';
          }
          return prev;
        });
      }

      if (signal.signal_type === 'answer') {
        const pc = peerConnection.current;
        if (pc && pc.signalingState !== 'stable') {
          const answerData = JSON.parse(signal.signal_data);
          await pc.setRemoteDescription(new RTCSessionDescription(answerData));
          // Apply any pending ICE candidates that arrived before the answer
          await applyPendingCandidates();
          setCallState('connected');
          startDurationTimer();
        }
      }

      if (signal.signal_type === 'ice-candidate') {
        const candidate = JSON.parse(signal.signal_data);
        const pc = peerConnection.current;
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
        } else {
          // Buffer it — remote description not set yet
          pendingCandidates.current.push(candidate);
        }
      }

      if (signal.signal_type === 'hang-up') {
        cleanup();
        setCallState('idle');
        setRemoteId('');
        setRemoteName('');
        setIncomingSignal(null);
      }
    });

    return () => unsubscribe();
  }, [myPhoneId, cleanup, startDurationTimer, applyPendingCandidates]);

  return {
    callState,
    remoteId,
    remoteName,
    callDuration,
    incomingSignal,
    isMuted,
    makeCall,
    answerCall,
    hangUp,
    rejectCall,
    toggleMute,
  };
}