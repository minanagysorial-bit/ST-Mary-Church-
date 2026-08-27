import { api } from './api';

const QUEUE_KEY = 'stmary_offline_attendance_queue';

export interface OfflineAttendanceRecord {
  family_id: string;
  member_id: string;
  date: string;
  present: boolean;
  recorded_by?: string | null;
}

export interface QueuedAttendanceBatch {
  id: string;
  family_id: string;
  family_name?: string;
  date: string;
  records: OfflineAttendanceRecord[];
  timestamp: number;
}

export function getOfflineQueue(): QueuedAttendanceBatch[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline attendance queue:', e);
    return [];
  }
}

export function saveOfflineBatch(batch: Omit<QueuedAttendanceBatch, 'id' | 'timestamp'>): QueuedAttendanceBatch {
  const queue = getOfflineQueue();
  const newBatch: QueuedAttendanceBatch = {
    ...batch,
    id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  };

  // Remove existing pending batch for same family & date if any
  const filtered = queue.filter(b => !(b.family_id === batch.family_id && b.date === batch.date));
  filtered.push(newBatch);

  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event('offline_attendance_queue_changed'));
  return newBatch;
}

export function removeOfflineBatch(batchId: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter(b => b.id !== batchId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('offline_attendance_queue_changed'));
}

export async function syncOfflineAttendanceQueue(
  onBatchSynced?: (batch: QueuedAttendanceBatch) => void
): Promise<{ successCount: number; errorCount: number }> {
  if (!navigator.onLine) {
    return { successCount: 0, errorCount: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    return { successCount: 0, errorCount: 0 };
  }

  let successCount = 0;
  let errorCount = 0;

  for (const batch of queue) {
    try {
      const promises = batch.records.map(r => api.upsertFamilyAttendanceRecord(r as any));
      await Promise.all(promises);
      removeOfflineBatch(batch.id);
      successCount++;
      if (onBatchSynced) onBatchSynced(batch);
    } catch (err) {
      console.error(`Failed to sync batch ${batch.id}:`, err);
      errorCount++;
    }
  }

  return { successCount, errorCount };
}
