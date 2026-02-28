import React from 'react';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import moment from 'moment';

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CallHistory({ calls, myPhoneId }) {
  if (!calls || calls.length === 0) {
    return (
      <div className="text-center py-12 text-white/30">
        <p className="text-sm">No recent calls</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {calls.map((call) => {
        const isOutgoing = call.caller_id === myPhoneId;
        const isMissed = call.status === 'missed';
        const displayName = isOutgoing ? (call.receiver_name || call.receiver_id) : (call.caller_name || call.caller_id);
        const displayId = isOutgoing ? call.receiver_id : call.caller_id;

        return (
          <div key={call.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center
              ${isMissed ? 'bg-red-500/15 text-red-400' : isOutgoing ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
              {isMissed ? <PhoneMissed className="w-4 h-4" /> :
               isOutgoing ? <PhoneOutgoing className="w-4 h-4" /> : <PhoneIncoming className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isMissed ? 'text-red-400' : 'text-white'}`}>
                {displayName || `#${displayId}`}
              </p>
              <p className="text-xs text-white/30">
                #{displayId} · {formatDuration(call.duration_seconds)}
              </p>
            </div>
            <span className="text-xs text-white/25 shrink-0">
              {moment(call.created_date).fromNow()}
            </span>
          </div>
        );
      })}
    </div>
  );
}