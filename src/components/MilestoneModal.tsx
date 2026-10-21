/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Milestone } from '../types';
import { useData } from '../context/DataContext';
import { X, Flag, Trash2, Calendar, Sparkles } from 'lucide-react';

interface MilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  milestoneToEdit?: Milestone | null;
}

const PRESET_ICONS = [
  '🏡', '🌲', '🏖️', '🍻', '🚗', '✈️', '🏔️', '🍽️', 
  '⛺', '🎿', '🎟️', '🛍️', '🎉', '🛶', '🏨', '🍕', '☕', '🌅'
];

export const MilestoneModal: React.FC<MilestoneModalProps> = ({
  isOpen,
  onClose,
  groupId,
  milestoneToEdit,
}) => {
  const { createMilestone, updateMilestone, deleteMilestone } = useData();

  const [title, setTitle] = useState('');
  const [dayNumber, setDayNumber] = useState<string>('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📍');

  useEffect(() => {
    if (milestoneToEdit) {
      setTitle(milestoneToEdit.title);
      setDayNumber(milestoneToEdit.day_number !== undefined ? milestoneToEdit.day_number.toString() : '');
      setDate(milestoneToEdit.date || '');
      setDescription(milestoneToEdit.description || '');
      setIcon(milestoneToEdit.icon || '📍');
    } else {
      setTitle('');
      setDayNumber('');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setIcon('📍');
    }
  }, [milestoneToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !groupId) return;

    const parsedDay = dayNumber.trim() ? parseInt(dayNumber.trim(), 10) : undefined;

    if (milestoneToEdit) {
      updateMilestone(milestoneToEdit.id, {
        title: title.trim(),
        day_number: isNaN(parsedDay as number) ? undefined : parsedDay,
        date: date || undefined,
        description: description.trim() || undefined,
        icon: icon || '📍',
      });
    } else {
      createMilestone({
        groupId,
        title: title.trim(),
        day_number: isNaN(parsedDay as number) ? undefined : parsedDay,
        date: date || undefined,
        description: description.trim() || undefined,
        icon: icon || '📍',
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (milestoneToEdit) {
      deleteMilestone(milestoneToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-lg shadow-sm">
            {icon || <Flag className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-white">
              {milestoneToEdit ? 'Edit Event Milestone' : 'Add Event Milestone / Day'}
            </h2>
            <p className="text-xs text-slate-400">
              Create a milestone chapter for your financial diary
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Icon selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Choose an Icon
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-2xl border border-slate-800 max-h-24 overflow-y-auto">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-transform cursor-pointer ${
                    icon === emoji ? 'bg-teal-500/30 border border-teal-400/50 scale-110' : 'hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Milestone / Day Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Day 1: Arrival, Day 2: Beach Trip"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Day Number & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Day Number (Optional)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={dayNumber}
                onChange={(e) => setDayNumber(e.target.value)}
                placeholder="e.g. 1, 2, 3"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Diary Description / Story Highlights */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>Financial Diary Note / Highlights</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Event Story
              </span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Landed at airport, picked up rental car, and checked into cabin for s'mores."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {milestoneToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 disabled:opacity-40 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                {milestoneToEdit ? 'Save Changes' : 'Create Milestone'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
