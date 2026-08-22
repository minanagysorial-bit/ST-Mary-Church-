import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api, Profile, Sermon, Verse, Announcement, Liturgy, ContactMessage } from '../lib/api';

interface AdminDataContextType {
  profiles: Profile[];
  sermons: Sermon[];
  verses: Verse[];
  announcements: Announcement[];
  liturgies: Liturgy[];
  contactMessages: ContactMessage[];
  sundaySchoolStudents: any[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshSermons: () => Promise<void>;
  refreshVerses: () => Promise<void>;
  refreshAnnouncements: () => Promise<void>;
  refreshLiturgies: () => Promise<void>;
  refreshContactMessages: () => Promise<void>;
  refreshStudents: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

export const AdminDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [liturgies, setLiturgies] = useState<Liturgy[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [sundaySchoolStudents, setSundaySchoolStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshProfiles = useCallback(async () => {
    if (!profile) return;
    if (['super_admin', 'admin'].includes(profile.role)) {
      try {
        const data = await api.getProfiles();
        setProfiles(data);
      } catch (err) {
        console.error('Error fetching profiles in context:', err);
      }
    }
  }, [profile]);

  const refreshSermons = useCallback(async () => {
    if (!profile) return;
    if (['super_admin', 'admin', 'priest'].includes(profile.role)) {
      try {
        const data = await api.getSermons();
        setSermons(data);
      } catch (err) {
        console.error('Error fetching sermons in context:', err);
      }
    }
  }, [profile]);

  const refreshVerses = useCallback(async () => {
    if (!profile) return;
    if (['super_admin', 'admin'].includes(profile.role)) {
      try {
        const data = await api.getVerses();
        setVerses(data);
      } catch (err) {
        console.error('Error fetching verses in context:', err);
      }
    }
  }, [profile]);

  const refreshAnnouncements = useCallback(async () => {
    if (!profile) return;
    if (['super_admin', 'admin', 'priest'].includes(profile.role)) {
      try {
        const data = await api.getAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        console.error('Error fetching announcements in context:', err);
      }
    }
  }, [profile]);

  const refreshLiturgies = useCallback(async () => {
    if (!profile) return;
    if (['priest', 'super_admin', 'admin'].includes(profile.role)) {
      try {
        const data = await api.getLiturgies();
        setLiturgies(data);
      } catch (err) {
        console.error('Error fetching liturgies in context:', err);
      }
    }
  }, [profile]);

  const refreshContactMessages = useCallback(async () => {
    if (!profile) return;
    if (['super_admin', 'admin', 'priest'].includes(profile.role)) {
      try {
        const data = await api.getContactMessages();
        setContactMessages(data);
      } catch (err) {
        console.error('Error fetching contact messages in context:', err);
      }
    }
  }, [profile]);

  const refreshStudents = useCallback(async () => {
    if (!profile) return;
    if (['servant', 'super_admin', 'admin'].includes(profile.role)) {
      try {
        const data = await api.getSundaySchoolStudents();
        setSundaySchoolStudents(data);
      } catch (err) {
        console.error('Error fetching Sunday school students in context:', err);
      }
    }
  }, [profile]);

  const refreshAll = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await Promise.all([
        refreshProfiles(),
        refreshSermons(),
        refreshVerses(),
        refreshAnnouncements(),
        refreshLiturgies(),
        refreshContactMessages(),
        refreshStudents()
      ]);
    } catch (err) {
      console.error('Error refreshing admin data context:', err);
    } finally {
      setLoading(false);
    }
  }, [profile, refreshProfiles, refreshSermons, refreshVerses, refreshAnnouncements, refreshLiturgies, refreshContactMessages, refreshStudents]);

  useEffect(() => {
    if (profile) {
      refreshAll();
    } else {
      // Clear data on logout
      setProfiles([]);
      setSermons([]);
      setVerses([]);
      setAnnouncements([]);
      setLiturgies([]);
      setContactMessages([]);
      setSundaySchoolStudents([]);
    }
  }, [profile, refreshAll]);

  return (
    <AdminDataContext.Provider value={{
      profiles, sermons, verses, announcements, liturgies, contactMessages, sundaySchoolStudents, loading,
      refreshAll, refreshProfiles, refreshSermons, refreshVerses, refreshAnnouncements, refreshLiturgies, refreshContactMessages, refreshStudents
    }}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error('useAdminData must be used within <AdminDataProvider>');
  return ctx;
};
