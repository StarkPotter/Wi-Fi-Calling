const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, { get: () => ({ filter: async () => [], get: async () => null, create: async () => ({}), update: async () => ({}), delete: async () => ({}) }) }),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } }
};

import React, { useState, useEffect, useCallback } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone as PhoneIcon, Clock, BookUser } from 'lucide-react';
import Dialpad from '@/components/call/Dialpad';
import PhoneIdBadge from '@/components/call/PhoneIdBadge';
import CallHistory from '@/components/call/CallHistory';
import IncomingCallScreen from '@/components/call/IncomingCallScreen';
import ActiveCallScreen from '@/components/call/ActiveCallScreen';
import Phonebook from '@/components/call/Phonebook';
import useWebRTC from '@/components/call/useWebRTC';

// Generate a permanent unique 6-digit number from a random seed (stored on user)
function generateNewPhoneId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function PhonePage() {
  const [user, setUser] = useState(null);
  const [myPhoneId, setMyPhoneId] = useState('');
  const [dialValue, setDialValue] = useState('');
  const [activeTab, setActiveTab] = useState('dial'); // dial | contacts | history
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin();
        return;
      }

      const me = await db.auth.me();
      setUser(me);

      // If user already has a phone_id, keep it forever
      if (me.phone_id) {
        setMyPhoneId(me.phone_id);
      } else {
        // First time: generate and save permanently
        const newId = generateNewPhoneId();
        await db.auth.updateMe({ phone_id: newId });
        setMyPhoneId(newId);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleCallEnded = useCallback(async (targetId, duration) => {
    await db.entities.CallLog.create({
      caller_id: myPhoneId,
      caller_name: user?.full_name || myPhoneId,
      receiver_id: targetId,
      duration_seconds: duration,
      call_type: 'outgoing',
      status: duration > 0 ? 'completed' : 'missed'
    });
    queryClient.invalidateQueries({ queryKey: ['callLogs'] });
  }, [myPhoneId, user, queryClient]);

  const { callState, remoteId, remoteName, callDuration, incomingSignal,
          isMuted, makeCall, answerCall, hangUp, rejectCall, toggleMute } = useWebRTC({
    myPhoneId,
    onCallEnded: handleCallEnded
  });

  const { data: callLogs = [] } = useQuery({
    queryKey: ['callLogs'],
    queryFn: () => db.entities.CallLog.list('-created_date', 30),
    enabled: !!myPhoneId,
  });

  const handleDial = () => {
    if (!dialValue) return;
    makeCall(dialValue, user?.full_name || myPhoneId);
  };

  const handleAnswer = () => {
    answerCall(incomingSignal, user?.full_name || myPhoneId);
  };

  const handleCallContact = (phoneId) => {
    setDialValue(phoneId);
    setActiveTab('dial');
    makeCall(phoneId, user?.full_name || myPhoneId);
  };

  // Loading / redirecting
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'dial', label: 'Keypad', icon: PhoneIcon },
    { id: 'contacts', label: 'Contacts', icon: BookUser },
    { id: 'history', label: 'Recents', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1117] via-[#0a1628] to-[#0d1117] relative overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(16,185,129,0.07),transparent_60%)]" />

      <div className="relative z-10 max-w-md mx-auto px-4 pt-12 pb-24 min-h-screen flex flex-col">

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <p className="text-white/30 text-xs font-medium uppercase tracking-widest">
            {user?.full_name || 'Your Phone'}
          </p>
          <PhoneIdBadge phoneId={myPhoneId} />
          <p className="text-white/20 text-[11px]">Tap to copy · Share so others can call you</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dial' && (
              <motion.div
                key="dial"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <Dialpad value={dialValue} onChange={setDialValue} onCall={handleDial} />
              </motion.div>
            )}
            {activeTab === 'contacts' && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <Phonebook ownerEmail={user?.email} onCallContact={handleCallContact} />
              </motion.div>
            )}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.18 }}
              >
                <CallHistory calls={callLogs} myPhoneId={myPhoneId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="max-w-md mx-auto px-4 pb-6">
          <div className="flex items-center justify-around bg-[#1a2234]/90 backdrop-blur-xl 
                          rounded-2xl border border-white/8 px-2 py-2 shadow-2xl">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all
                    ${isActive ? 'text-emerald-400' : 'text-white/30 hover:text-white/50'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {isActive && (
                    <motion.div layoutId="tab-indicator"
                      className="absolute bottom-2 w-1 h-1 rounded-full bg-emerald-400"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Incoming call overlay */}
      <AnimatePresence>
        {callState === 'ringing' && incomingSignal && (
          <IncomingCallScreen
            callerName={remoteName}
            callerId={incomingSignal.from_user_id}
            onAnswer={handleAnswer}
            onReject={rejectCall}
          />
        )}
      </AnimatePresence>

      {/* Active call overlay */}
      <AnimatePresence>
        {(callState === 'calling' || callState === 'connected') && (
          <ActiveCallScreen
            remoteName={remoteName}
            remoteId={remoteId}
            duration={callDuration}
            onHangUp={hangUp}
            isConnecting={callState === 'calling'}
            isMuted={isMuted}
            onToggleMute={toggleMute}
          />
        )}
      </AnimatePresence>
    </div>
  );
}