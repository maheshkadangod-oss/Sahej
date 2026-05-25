import { useMemo, useCallback } from 'react';
import { addDays, differenceInDays, differenceInCalendarMonths, parseISO } from 'date-fns';
import { usePersistedState } from './usePersistedState';
import { vaccineSchedule, feedingStages, type FeedingStage, type VaccineDose } from '../data/babyCare';
import type { WeightEntry, VaccineRecord } from '../types';

export type VaccineState = 'given' | 'overdue' | 'due-soon' | 'upcoming';

export interface VaccineStatus {
  dose: VaccineDose;
  state: VaccineState;
  /** Computed due date (if a birth date is set), else null. */
  dueDate: Date | null;
  /** The record, if this dose has been marked given. */
  record?: VaccineRecord;
}

export interface BabyReminder {
  id: string;
  kind: 'vaccine' | 'weight';
  severity: 'overdue' | 'due';
  text: string;
}

// A dose counts as "due soon" within this window before its due date, and "overdue"
// once it's this many days past due (a short grace period avoids false alarms on the exact day).
const DUE_SOON_DAYS = 30;
const OVERDUE_GRACE_DAYS = 7;
const WEIGHT_REMINDER_DAYS = 30;

interface UseBabyCareArgs {
  /** Baby's birth date (ISO yyyy-mm-dd) from the user profile, if set. */
  birthDate?: string;
  /** Baby's name, for personalizing push reminder copy. */
  babyName?: string;
  showToast: (msg: string) => void;
}

export function useBabyCare({ birthDate, babyName, showToast }: UseBabyCareArgs) {
  const [weightLog, setWeightLog] = usePersistedState<WeightEntry[]>('sahej_weight_log', []);
  const [vaccineRecords, setVaccineRecords] = usePersistedState<VaccineRecord[]>('sahej_vaccine_records', []);

  const birth = useMemo(() => {
    if (!birthDate) return null;
    try { const d = parseISO(birthDate); return isNaN(d.getTime()) ? null : d; } catch { return null; }
  }, [birthDate]);

  const ageMonths = useMemo(() => (birth ? Math.max(0, differenceInCalendarMonths(new Date(), birth)) : null), [birth]);

  // Feeding stage matching the baby's current age. Null if under 6 months (solids not started)
  // or if no birth date is set (UI then lets her browse all stages).
  const currentFeedingStage: FeedingStage | null = useMemo(() => {
    if (ageMonths == null || ageMonths < 6) return null;
    return feedingStages.find(s => ageMonths >= s.fromMonth && ageMonths <= s.toMonth)
      ?? feedingStages[feedingStages.length - 1];
  }, [ageMonths]);

  // Per-dose vaccine status, computed from birth date + records.
  const vaccineStatuses: VaccineStatus[] = useMemo(() => {
    const today = new Date();
    return vaccineSchedule.map(dose => {
      const record = vaccineRecords.find(r => r.doseId === dose.id);
      if (record) return { dose, state: 'given' as VaccineState, dueDate: birth ? addDays(birth, dose.ageDays) : null, record };
      if (!birth) return { dose, state: 'upcoming' as VaccineState, dueDate: null };
      const dueDate = addDays(birth, dose.ageDays);
      const daysUntil = differenceInDays(dueDate, today);
      let state: VaccineState;
      if (daysUntil < -OVERDUE_GRACE_DAYS) state = 'overdue';
      else if (daysUntil <= DUE_SOON_DAYS) state = 'due-soon';
      else state = 'upcoming';
      return { dose, state, dueDate };
    });
  }, [vaccineRecords, birth]);

  const overdueCount = useMemo(() => vaccineStatuses.filter(v => v.state === 'overdue').length, [vaccineStatuses]);
  const dueSoonCount = useMemo(() => vaccineStatuses.filter(v => v.state === 'due-soon').length, [vaccineStatuses]);

  // Custom (non-scheduled) vaccine records the mother added herself.
  const customRecords = useMemo(() => vaccineRecords.filter(r => !r.doseId), [vaccineRecords]);

  const latestWeight = useMemo(
    () => (weightLog.length ? [...weightLog].sort((a, b) => b.timestamp - a.timestamp)[0] : null),
    [weightLog],
  );

  // Surfaced reminders for the in-app reminders card (phase 1; reliable because it's shown on open).
  const reminders: BabyReminder[] = useMemo(() => {
    const list: BabyReminder[] = [];
    for (const v of vaccineStatuses) {
      if (v.state === 'overdue') list.push({ id: `vac-${v.dose.id}`, kind: 'vaccine', severity: 'overdue', text: `${v.dose.ageLabel} vaccines are overdue: ${v.dose.vaccines.join(', ')}` });
    }
    for (const v of vaccineStatuses) {
      if (v.state === 'due-soon') list.push({ id: `vac-${v.dose.id}`, kind: 'vaccine', severity: 'due', text: `${v.dose.ageLabel} vaccines are coming up: ${v.dose.vaccines.join(', ')}` });
    }
    // Weight check-in: if baby is under 2 and no weight logged in the last month.
    if (ageMonths != null && ageMonths <= 24) {
      const daysSinceWeight = latestWeight ? differenceInDays(new Date(), latestWeight.timestamp) : Infinity;
      if (daysSinceWeight >= WEIGHT_REMINDER_DAYS) {
        list.push({ id: 'weight', kind: 'weight', severity: 'due', text: latestWeight ? 'It’s been a while — time for a monthly weight check-in.' : 'Log baby’s weight to start tracking growth.' });
      }
    }
    return list;
  }, [vaccineStatuses, ageMonths, latestWeight]);

  // Future-dated reminders for the Web Push backend (Phase 2). The server sends these even when
  // the app is closed. We schedule one nudge ~3 days before each upcoming vaccine due date, plus
  // a monthly weight check-in. Only future fire times are included (past-due is handled in-app).
  const pushReminders = useMemo(() => {
    const now = Date.now();
    const name = babyName?.trim() || 'your baby';
    const list: { id: string; fireAt: number; title: string; body: string }[] = [];
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

    for (const v of vaccineStatuses) {
      if (v.state === 'given' || !v.dueDate) continue;
      const fireAt = v.dueDate.getTime() - THREE_DAYS;
      if (fireAt > now) {
        list.push({
          id: `vac-${v.dose.id}`,
          fireAt,
          title: '💉 Vaccination coming up',
          body: `${name}'s ${v.dose.ageLabel} vaccines are due in ~3 days: ${v.dose.vaccines.join(', ')}`,
        });
      }
    }

    // Monthly weight check-in (only while baby is under 2).
    if (ageMonths != null && ageMonths <= 24) {
      const base = latestWeight ? latestWeight.timestamp : now;
      const fireAt = base + WEIGHT_REMINDER_DAYS * 24 * 60 * 60 * 1000;
      if (fireAt > now) {
        list.push({ id: 'weight-monthly', fireAt, title: '⚖️ Weight check-in', body: `Time for ${name}'s monthly weight check-in in Sahej.` });
      }
    }
    return list;
  }, [vaccineStatuses, ageMonths, latestWeight, babyName]);

  const addWeight = useCallback((weightKg: number) => {
    if (!weightKg || weightKg <= 0 || weightKg > 40) { showToast('Please enter a valid weight in kg.'); return; }
    const entry: WeightEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      weightKg: Math.round(weightKg * 100) / 100,
      ...(ageMonths != null ? { ageMonths } : {}),
    };
    setWeightLog(prev => [entry, ...prev]);
    showToast('Weight saved 💛');
  }, [ageMonths, setWeightLog, showToast]);

  const deleteWeight = useCallback((id: string) => {
    setWeightLog(prev => prev.filter(w => w.id !== id));
  }, [setWeightLog]);

  const markVaccineGiven = useCallback((dose: VaccineDose, givenDate: string) => {
    const record: VaccineRecord = {
      id: `dose-${dose.id}`,
      doseId: dose.id,
      name: `${dose.ageLabel}: ${dose.vaccines.join(', ')}`,
      givenDate,
    };
    setVaccineRecords(prev => [...prev.filter(r => r.doseId !== dose.id), record]);
    showToast('Marked as given ✓');
  }, [setVaccineRecords, showToast]);

  const unmarkVaccine = useCallback((doseId: string) => {
    setVaccineRecords(prev => prev.filter(r => r.doseId !== doseId));
  }, [setVaccineRecords]);

  const addCustomVaccine = useCallback((name: string, givenDate: string, notes?: string) => {
    const clean = name.trim();
    if (!clean) { showToast('Please enter the vaccine name.'); return; }
    const record: VaccineRecord = {
      id: `custom-${Date.now()}`,
      name: clean,
      givenDate: givenDate || new Date().toISOString().slice(0, 10),
      ...(notes?.trim() ? { notes: notes.trim() } : {}),
    };
    setVaccineRecords(prev => [record, ...prev]);
    showToast('Vaccine record added ✓');
  }, [setVaccineRecords, showToast]);

  const deleteVaccineRecord = useCallback((id: string) => {
    setVaccineRecords(prev => prev.filter(r => r.id !== id));
  }, [setVaccineRecords]);

  return {
    hasBirthDate: !!birth,
    ageMonths,
    weightLog, latestWeight, addWeight, deleteWeight,
    vaccineStatuses, customRecords, overdueCount, dueSoonCount,
    markVaccineGiven, unmarkVaccine, addCustomVaccine, deleteVaccineRecord,
    currentFeedingStage,
    reminders,
    pushReminders,
  };
}
