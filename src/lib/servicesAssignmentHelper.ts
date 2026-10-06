import { api, type ChurchServiceCategory, type Profile } from './api';
import { type ServiceScheduleConfig, type DayOfWeekArabic, DEFAULT_SERVICE_SCHEDULES } from './attendanceStatusHelper';

export interface ChurchServiceItem {
  id?: string;
  category: ChurchServiceCategory | string;
  label: string;
  icon: string;
  description: string;
  isCustom?: boolean;
  defaultDay?: DayOfWeekArabic;
  defaultStart?: string;
  defaultEnd?: string;
}

export const ALL_CHURCH_SERVICE_CATEGORIES: { category: ChurchServiceCategory; label: string; icon: string; description: string; defaultDay?: DayOfWeekArabic; defaultStart?: string; defaultEnd?: string }[] = [
  { category: 'ابتدائي بنين', label: 'ابتدائي بنين', icon: 'boy', description: 'خدمة مرحلة ابتدائي للبنين (الجمعة 2:30 ظهراً)', defaultDay: 'الجمعة', defaultStart: '14:30', defaultEnd: '17:00' },
  { category: 'ابتدائي بنات', label: 'ابتدائي بنات', icon: 'girl', description: 'خدمة مرحلة ابتدائي للبنات (الجمعة 10:30 صباحاً)', defaultDay: 'الجمعة', defaultStart: '10:30', defaultEnd: '13:00' },
  { category: 'فتيان إعدادي', label: 'فتيان إعدادي', icon: 'school', description: 'خدمة فتيان المرحلة الإعدادية (الجمعة 4:30 مساءً)', defaultDay: 'الجمعة', defaultStart: '16:30', defaultEnd: '19:00' },
  { category: 'فتيات إعدادي', label: 'فتيات إعدادي', icon: 'school', description: 'خدمة فتيات المرحلة الإعدادية (الجمعة 11:00 صباحاً)', defaultDay: 'الجمعة', defaultStart: '11:00', defaultEnd: '13:30' },
  { category: 'شباب ثانوي', label: 'شباب ثانوي', icon: 'groups', description: 'خدمة شباب المرحلة الثانوية (الجمعة 9:00 صباحاً)', defaultDay: 'الجمعة', defaultStart: '09:00', defaultEnd: '11:30' },
  { category: 'شابات ثانوي', label: 'شابات ثانوي', icon: 'groups_2', description: 'خدمة شابات المرحلة الثانوية (الخميس 6:00 مساءً)', defaultDay: 'الخميس', defaultStart: '18:00', defaultEnd: '20:30' },
  { category: 'خدمة شباب جامعة', label: 'خدمة شباب جامعة', icon: 'local_library', description: 'خدمة الشباب والطلبة الجامعيين (الثلاثاء 7:00 مساءً)', defaultDay: 'الثلاثاء', defaultStart: '19:00', defaultEnd: '21:30' },
  { category: 'خدمة شابات جامعة', label: 'خدمة شابات جامعة', icon: 'local_library', description: 'خدمة الشابات والطالبات الجامعيات (الخميس 7:00 مساءً)', defaultDay: 'الخميس', defaultStart: '19:00', defaultEnd: '21:30' },
  { category: 'خريجين', label: 'خريجين', icon: 'work', description: 'خدمة الخريجين وسوق العمل والمهنيين (الأحد 7:00 مساءً)', defaultDay: 'الأحد', defaultStart: '19:00', defaultEnd: '21:30' },
  { category: 'عرس قانا الجليل', label: 'عرس قانا الجليل', icon: 'favorite', description: 'خدمة المقبلين على الزواج والمتزوجين حديثاً (الأربعاء 7:00 مساءً)', defaultDay: 'الأربعاء', defaultStart: '19:00', defaultEnd: '21:30' },
];

export const DEFAULT_CHURCH_SERVICE_CATEGORIES = ALL_CHURCH_SERVICE_CATEGORIES;

/**
 * Retrieve custom church services added by Super Admin.
 */
export function getCustomServices(settings: Record<string, string> = {}): ChurchServiceItem[] {
  const raw = settings['custom_church_services'];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }

  try {
    const local = localStorage.getItem('custom_church_services');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Combine default and custom services into a single unified list.
 */
export function getAllChurchServices(settings: Record<string, string> = {}): ChurchServiceItem[] {
  const customList = getCustomServices(settings);
  const map = new Map<string, ChurchServiceItem>();

  DEFAULT_CHURCH_SERVICE_CATEGORIES.forEach(item => {
    map.set(item.category, item);
  });

  customList.forEach(item => {
    map.set(item.category, { ...item, isCustom: true });
  });

  return Array.from(map.values());
}

/**
 * Save custom services list to database and localStorage.
 */
export async function saveCustomServices(
  services: ChurchServiceItem[],
  currentSettings: Record<string, string> = {}
): Promise<void> {
  const customOnly = services.filter(s => s.isCustom || !DEFAULT_CHURCH_SERVICE_CATEGORIES.some(d => d.category === s.category));
  const payload = JSON.stringify(customOnly);
  
  try {
    localStorage.setItem('custom_church_services', payload);
  } catch {
    // ignore
  }

  await api.updateSiteSettings({
    custom_church_services: payload
  });
}

/**
 * Delete a custom church service and its configuration.
 */
export async function deleteCustomService(
  categoryName: string,
  currentSettings: Record<string, string> = {}
): Promise<void> {
  const currentCustom = getCustomServices(currentSettings);
  const updated = currentCustom.filter(c => c.category !== categoryName);
  await saveCustomServices(updated, currentSettings);
}

/**
 * Retrieves the list of assigned service categories for a specific Service Leader.
 * Checks both direct leader assignments and category leader_ids for 100% synchronization.
 */
export function getLeaderAssignedServices(
  leaderId: string,
  settings: Record<string, string> = {}
): ChurchServiceCategory[] {
  if (!leaderId) return [];

  const resultSet = new Set<ChurchServiceCategory>();

  // 1. Check direct setting: service_leader_assigned_services_${leaderId}
  const directKey = `service_leader_assigned_services_${leaderId}`;
  const rawDirect = settings[directKey];
  if (rawDirect) {
    try {
      const parsed = JSON.parse(rawDirect);
      if (Array.isArray(parsed)) {
        parsed.forEach(cat => resultSet.add(cat as ChurchServiceCategory));
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // 2. Also check all service_assignment_${cat} to see if leaderId is in leader_ids
  const allServices = getAllChurchServices(settings);
  allServices.forEach(item => {
    const catKey = `service_assignment_${item.category}`;
    const rawCat = settings[catKey];
    if (rawCat) {
      try {
        const parsed = JSON.parse(rawCat);
        if (Array.isArray(parsed.leader_ids) && parsed.leader_ids.includes(leaderId)) {
          resultSet.add(item.category as ChurchServiceCategory);
        }
      } catch {
        // ignore
      }
    }
  });

  return Array.from(resultSet);
}

/**
 * Saves and updates service assignments for a leader across both direct mapping and service configs.
 */
export async function saveLeaderAssignedServices(
  leaderId: string,
  newCategories: string[],
  currentSettings: Record<string, string> = {}
): Promise<void> {
  if (!leaderId) return;

  const updates: Record<string, string> = {};
  const allServices = getAllChurchServices(currentSettings);

  // 1. Direct leader mapping
  const directKey = `service_leader_assigned_services_${leaderId}`;
  updates[directKey] = JSON.stringify(newCategories);

  // 2. Cross-update each service_assignment_${cat}
  allServices.forEach(item => {
    const catKey = `service_assignment_${item.category}`;
    const defaultSched = item.defaultDay ? { day: item.defaultDay, start: item.defaultStart || '09:00', end: item.defaultEnd || '11:30' } : (DEFAULT_SERVICE_SCHEDULES[item.category] || { day: 'الجمعة', start: '09:00', end: '11:30' });
    
    let config: ServiceScheduleConfig = {
      priest_ids: [],
      leader_ids: [],
      day_of_week: defaultSched.day,
      start_time: defaultSched.start,
      end_time: defaultSched.end
    };

    const rawCat = currentSettings[catKey];
    if (rawCat) {
      try {
        config = { ...config, ...JSON.parse(rawCat) };
      } catch {
        // use default
      }
    }

    const currentLeaders = new Set(config.leader_ids || []);
    if (newCategories.includes(item.category)) {
      currentLeaders.add(leaderId);
    } else {
      currentLeaders.delete(leaderId);
    }

    config.leader_ids = Array.from(currentLeaders);
    updates[catKey] = JSON.stringify(config);
    
    // Save local backup
    try {
      localStorage.setItem(`church_service_assign_${item.category}`, JSON.stringify(config));
    } catch {
      // ignore
    }
  });

  // Persist to siteSettings
  await api.updateSiteSettings(updates);
  try {
    localStorage.setItem(directKey, JSON.stringify(newCategories));
  } catch {
    // ignore
  }
}

/**
 * Retrieves the list of assigned service categories for a specific Priest.
 * Checks both direct priest assignments and category priest_ids for 100% synchronization.
 */
export function getPriestAssignedServices(
  priestId: string,
  settings: Record<string, string> = {}
): ChurchServiceCategory[] {
  if (!priestId) return [];

  const resultSet = new Set<ChurchServiceCategory>();

  // 1. Check direct setting: priest_assigned_services_${priestId}
  const directKey = `priest_assigned_services_${priestId}`;
  const rawDirect = settings[directKey];
  if (rawDirect) {
    try {
      const parsed = JSON.parse(rawDirect);
      if (Array.isArray(parsed)) {
        parsed.forEach(cat => resultSet.add(cat as ChurchServiceCategory));
      }
    } catch {
      // ignore
    }
  }

  // 2. Also check all service_assignment_${cat} to see if priestId is in priest_ids
  const allServices = getAllChurchServices(settings);
  allServices.forEach(item => {
    const catKey = `service_assignment_${item.category}`;
    const rawCat = settings[catKey];
    if (rawCat) {
      try {
        const parsed = JSON.parse(rawCat);
        if (Array.isArray(parsed.priest_ids) && parsed.priest_ids.includes(priestId)) {
          resultSet.add(item.category as ChurchServiceCategory);
        }
      } catch {
        // ignore
      }
    }
  });

  return Array.from(resultSet);
}

/**
 * Saves and updates service assignments for a Priest across both direct mapping and service configs.
 */
export async function savePriestAssignedServices(
  priestId: string,
  newCategories: string[],
  currentSettings: Record<string, string> = {}
): Promise<void> {
  if (!priestId) return;

  const updates: Record<string, string> = {};
  const allServices = getAllChurchServices(currentSettings);

  // 1. Direct priest mapping
  const directKey = `priest_assigned_services_${priestId}`;
  updates[directKey] = JSON.stringify(newCategories);

  // 2. Cross-update each service_assignment_${cat}
  allServices.forEach(item => {
    const catKey = `service_assignment_${item.category}`;
    const defaultSched = item.defaultDay ? { day: item.defaultDay, start: item.defaultStart || '09:00', end: item.defaultEnd || '11:30' } : (DEFAULT_SERVICE_SCHEDULES[item.category] || { day: 'الجمعة', start: '09:00', end: '11:30' });
    
    let config: ServiceScheduleConfig = {
      priest_ids: [],
      leader_ids: [],
      day_of_week: defaultSched.day,
      start_time: defaultSched.start,
      end_time: defaultSched.end
    };

    const rawCat = currentSettings[catKey];
    if (rawCat) {
      try {
        config = { ...config, ...JSON.parse(rawCat) };
      } catch {
        // use default
      }
    }

    const currentPriests = new Set(config.priest_ids || []);
    if (newCategories.includes(item.category)) {
      currentPriests.add(priestId);
    } else {
      currentPriests.delete(priestId);
    }

    config.priest_ids = Array.from(currentPriests);
    updates[catKey] = JSON.stringify(config);
    
    try {
      localStorage.setItem(`church_service_assign_${item.category}`, JSON.stringify(config));
    } catch {
      // ignore
    }
  });

  await api.updateSiteSettings(updates);
  try {
    localStorage.setItem(directKey, JSON.stringify(newCategories));
  } catch {
    // ignore
  }
}
