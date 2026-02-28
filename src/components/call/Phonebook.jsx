const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy({}, { get: () => ({ filter: async () => [], get: async () => null, create: async () => ({}), update: async () => ({}), delete: async () => ({}) }) }),
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } }
};

import React, { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Phone, Trash2, X, User } from 'lucide-react';

function AddContactModal({ ownerEmail, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phoneId.trim()) return;
    setSaving(true);
    await db.entities.Contact.create({
      owner_email: ownerEmail,
      name: name.trim(),
      phone_id: phoneId.trim(),
      notes: notes.trim()
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#111827] rounded-t-3xl p-6 pb-10 space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-semibold text-lg">New Contact</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contact name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
                         placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">Phone Number</label>
            <input
              value={phoneId}
              onChange={e => setPhoneId(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
                         placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors font-mono"
            />
          </div>
          <div>
            <label className="text-white/50 text-xs uppercase tracking-wider mb-1 block">Notes (optional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white 
                         placeholder-white/20 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!name.trim() || !phoneId.trim() || saving}
          className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold
                     disabled:opacity-30 hover:bg-emerald-400 transition-all active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Contact'}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Phonebook({ ownerEmail, onCallContact }) {
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', ownerEmail],
    queryFn: () => db.entities.Contact.filter({ owner_email: ownerEmail }, 'name'),
    enabled: !!ownerEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Contact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts', ownerEmail] })
  });

  const handleSaved = () => queryClient.invalidateQueries({ queryKey: ['contacts', ownerEmail] });

  return (
    <div className="flex flex-col h-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-sm">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-400
                     hover:bg-emerald-500/25 transition-all text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Contacts list */}
      {contacts.length === 0 ? (
        <div className="text-center py-16 text-white/25">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No contacts yet</p>
          <p className="text-xs mt-1">Add contacts to call them easily</p>
        </div>
      ) : (
        <div className="space-y-1">
          {contacts.map(contact => (
            <motion.div
              key={contact.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/3 hover:bg-white/6 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 
                              flex items-center justify-center text-emerald-300 font-semibold text-sm shrink-0">
                {contact.name[0].toUpperCase()}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{contact.name}</p>
                <p className="text-white/35 text-xs font-mono">#{contact.phone_id}</p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => deleteMutation.mutate(contact.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onCallContact(contact.phone_id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add contact modal */}
      <AnimatePresence>
        {showAdd && (
          <AddContactModal
            ownerEmail={ownerEmail}
            onClose={() => setShowAdd(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}