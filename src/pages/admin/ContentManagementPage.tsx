import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api, type Announcement, type Sermon, type Profile, type ContactMessage, type PrayerRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import {
  Megaphone, Plus, Search, CalendarDays, Power, 
  Trash2, Edit2, X, Check, Clock, Play, Radio, MessageSquare, Heart, Settings, RefreshCw, MailOpen
} from 'lucide-react';

type TabType = 'sermons' | 'announcements' | 'stream' | 'contacts' | 'prayers' | 'footer';

export const ContentManagementPage: React.FC = () => {
  const toast = useToast();
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType;
  
  const [activeTab, setActiveTab] = useState<TabType>('sermons');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam && ['sermons', 'announcements', 'stream', 'contacts', 'prayers', 'footer'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // --- Shared states & Loaders ---
  const [priests, setPriests] = useState<Profile[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // --- 1. Sermons States ---
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [sermonSearch, setSermonSearch] = useState('');
  const [showSermonModal, setShowSermonModal] = useState(false);
  const [sermonTitle, setSermonTitle] = useState('');
  const [sermonSpeaker, setSermonSpeaker] = useState('');
  const [sermonTopic, setSermonTopic] = useState('روحيات');
  const [sermonYoutube, setSermonYoutube] = useState('');

  // --- 2. Announcements States ---
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annSearch, setAnnSearch] = useState('');
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annId, setAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annDurationType, setAnnDurationType] = useState<'permanent' | 'days_limit' | 'days_specific'>('days_limit');
  const [annDurationDays, setAnnDurationDays] = useState<number>(7);
  const [annSpecificDays, setAnnSpecificDays] = useState<string[]>(['الجمعة', 'الأحد']);
  const [annStartDate, setAnnStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [annActive, setAnnActive] = useState(true);
  const WEEKDAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  // --- 3. Live Stream States ---
  const [streamMode, setStreamMode] = useState('manual');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [streamActive, setStreamActive] = useState('false');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDesc, setStreamDesc] = useState('');
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

  // --- 4. Contact Messages States ---
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  // --- 5. Prayer Requests States ---
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [prayerSearch, setPrayerSearch] = useState('');

  // --- 6. Footer States ---
  const [footerAbout, setFooterAbout] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerSchedule, setFooterSchedule] = useState('');

  // --- Fetching Logic ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [sermonList, priestList, annList, settingsList, contactList, prayerList] = await Promise.all([
        api.getSermons(),
        api.getPriestProfiles(),
        api.getAnnouncements(),
        api.getSiteSettings(),
        api.getContactMessages(),
        api.getPrayerRequests()
      ]);

      setSermons(sermonList);
      setPriests(priestList);
      setAnnouncements(annList);
      setSiteSettings(settingsList);
      setContacts(contactList);
      setPrayers(prayerList);

      // Populate Live Stream form
      setStreamMode(settingsList.live_stream_mode || 'manual');
      setYoutubeApiKey(settingsList.youtube_api_key || '');
      setYoutubeChannelId(settingsList.youtube_channel_id || '');
      setStreamActive(settingsList.live_stream_active || 'false');
      setStreamUrl(settingsList.live_stream_youtube_url || '');
      setStreamTitle(settingsList.live_stream_title || '');
      setStreamDesc(settingsList.live_stream_description || '');

      // Populate Footer form
      setFooterAbout(settingsList.footer_about || '');
      setFooterPhone(settingsList.footer_phone || '');
      setFooterEmail(settingsList.footer_email || '');
      setFooterAddress(settingsList.footer_address || '');
      setFooterSchedule(settingsList.footer_schedule || '');

      if (priestList.length > 0 && !sermonSpeaker) {
        setSermonSpeaker(priestList[0].full_name);
      }
    } catch (err: any) {
      toast.error('حدث خطأ أثناء تحميل البيانات: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 1. Sermons Handlers ---
  const handleAddSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sermonTitle.trim() || !sermonSpeaker) {
      toast.error('يرجى ملء الحقول المطلوبة للعظة.');
      return;
    }
    setActionLoading(true);
    try {
      await api.createSermon({
        title: sermonTitle,
        speaker: sermonSpeaker,
        topic: sermonTopic,
        sermon_date: new Date().toISOString().split('T')[0],
        duration_minutes: 45,
        youtube_url: sermonYoutube || null,
        audio_url: null,
        description: 'عظة جديدة تم رفعها عبر مركز إدارة المحتوى الموحد.',
        featured: false,
        created_by: null,
      });
      setSermonTitle('');
      setSermonYoutube('');
      setShowSermonModal(false);
      toast.success('تمت إضافة العظة بنجاح.');
      const data = await api.getSermons();
      setSermons(data);
    } catch (err: any) {
      toast.error(err.message || 'فشل إضافة العظة.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العظة؟')) return;
    setActionLoading(true);
    try {
      await api.deleteSermon(id);
      toast.success('تم حذف العظة بنجاح.');
      setSermons(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف العظة.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncSermons = async () => {
    const apiKey = siteSettings.youtube_api_key;
    const channelId = siteSettings.youtube_channel_id;

    if (!apiKey || !channelId) {
      toast.error('يرجى تهيئة مفتاح يوتيوب API ومعرف القناة في تبويب "البث المباشر" أولاً.');
      return;
    }

    setActionLoading(true);
    try {
      let playlistId = channelId;
      if (channelId.startsWith('UC')) {
        playlistId = 'UU' + channelId.substring(2);
      }

      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=20&key=${apiKey}`
      );
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || 'فشل الاتصال بـ YouTube API');
      }

      if (!data.items || data.items.length === 0) {
        toast.success('لم يتم العثور على أي فيديوهات في قناة يوتيوب.');
        return;
      }

      const existingUrls = new Set(sermons.map(s => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = s.youtube_url?.match(regExp);
        return match && match[2].length === 11 ? match[2] : s.youtube_url;
      }).filter(Boolean));

      let importedCount = 0;

      for (const item of data.items) {
        const videoId = item.snippet.resourceId.videoId;
        if (existingUrls.has(videoId)) continue;

        let speaker = 'آباء الكنيسة';
        for (const priest of priests) {
          const cleanName = priest.full_name.replace('القمص', '').replace('القس', '').trim();
          if (item.snippet.title.includes(cleanName) || item.snippet.title.includes(priest.full_name)) {
            speaker = priest.full_name;
            break;
          }
        }

        await api.createSermon({
          title: item.snippet.title,
          speaker,
          topic: 'تعليم وعظة',
          sermon_date: item.snippet.publishedAt ? item.snippet.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          duration_minutes: 60,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          audio_url: null,
          description: item.snippet.description || 'عظة مستوردة تلقائياً من قناة يوتيوب.',
          featured: false,
          created_by: null,
        });

        importedCount++;
      }

      if (importedCount > 0) {
        toast.success(`تم استيراد ${importedCount} عظة جديدة بنجاح!`);
        const refreshed = await api.getSermons();
        setSermons(refreshed);
      } else {
        toast.success('جميع فيديوهات يوتيوب متزامنة بالفعل مع الموقع.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('فشل مزامنة العظات: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- 2. Announcements Handlers ---
  const handleOpenAnnModal = (ann?: Announcement) => {
    if (ann) {
      setAnnId(ann.id);
      setAnnTitle(ann.title);
      setAnnContent(ann.content);
      setAnnDurationType(ann.duration_type);
      setAnnDurationDays(ann.duration_days || 7);
      setAnnSpecificDays(ann.specific_days || []);
      setAnnStartDate(ann.start_date);
      setAnnActive(ann.is_active);
    } else {
      setAnnId(null);
      setAnnTitle('');
      setAnnContent('');
      setAnnDurationType('days_limit');
      setAnnDurationDays(7);
      setAnnSpecificDays(['الجمعة', 'الأحد']);
      setAnnStartDate(new Date().toISOString().split('T')[0]);
      setAnnActive(true);
    }
    setShowAnnModal(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      toast.error('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    setActionLoading(true);
    try {
      if (annId) {
        await api.updateAnnouncement(annId, {
          title: annTitle,
          content: annContent,
          duration_type: annDurationType,
          duration_days: annDurationType === 'days_limit' ? annDurationDays : null,
          specific_days: annDurationType === 'days_specific' ? annSpecificDays : null,
          start_date: annStartDate,
          is_active: annActive
        });
        toast.success('تم تحديث الإعلان بنجاح.');
      } else {
        await api.createAnnouncement({
          title: annTitle,
          content: annContent,
          duration_type: annDurationType,
          duration_days: annDurationType === 'days_limit' ? annDurationDays : null,
          specific_days: annDurationType === 'days_specific' ? annSpecificDays : null,
          start_date: annStartDate,
          is_active: annActive,
          created_by: profile?.id || null
        });
        toast.success('تمت إضافة الإعلان بنجاح.');
      }
      setShowAnnModal(false);
      const data = await api.getAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الإعلان.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAnn = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    setActionLoading(true);
    try {
      await api.deleteAnnouncement(id);
      toast.success('تم حذف الإعلان بنجاح.');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف الإعلان.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAnnActive = async (ann: Announcement) => {
    setActionLoading(true);
    try {
      await api.updateAnnouncement(ann.id, { is_active: !ann.is_active });
      toast.success('تم تعديل حالة تفعيل الإعلان.');
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_active: !a.is_active } : a));
    } catch (err: any) {
      toast.error(err.message || 'فشل تغيير حالة التفعيل.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- 3. Live Stream Handlers ---
  const handleUpdateLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updated = {
        ...siteSettings,
        live_stream_mode: streamMode,
        youtube_api_key: youtubeApiKey,
        youtube_channel_id: youtubeChannelId,
        live_stream_active: streamActive,
        live_stream_youtube_url: streamUrl,
        live_stream_title: streamTitle,
        live_stream_description: streamDesc,
      };
      await api.updateSiteSettings(updated);
      setSiteSettings(updated);
      toast.success('تم تحديث إعدادات البث المباشر بنجاح.');
    } catch (err: any) {
      toast.error('فشل حفظ إعدادات البث: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- 4. Contacts Handlers ---
  const handleMessageStatus = async (id: string, newStatus: 'unread' | 'read' | 'replied') => {
    setActionLoading(true);
    try {
      await api.updateContactMessageStatus(id, newStatus);
      toast.success('تم تحديث حالة الرسالة.');
      setContacts(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    } catch (err: any) {
      toast.error('فشل تحديث حالة الرسالة: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من مسح هذه الرسالة؟')) return;
    setActionLoading(true);
    try {
      await api.deleteContactMessage(id);
      toast.success('تم مسح الرسالة بنجاح.');
      setContacts(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      toast.error('فشل مسح الرسالة: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- 5. Prayers Handlers ---
  const handlePrayerStatus = async (id: string, isRead: boolean) => {
    setActionLoading(true);
    try {
      await api.updatePrayerRequestStatus(id, isRead);
      toast.success('تم تعديل حالة طلب الصلاة بنجاح.');
      setPrayers(prev => prev.map(p => p.id === id ? { ...p, is_read: isRead } : p));
    } catch (err: any) {
      toast.error('فشل تعديل حالة الطلب: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePrayer = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من مسح هذا طلب الصلاة؟')) return;
    setActionLoading(true);
    try {
      await api.deletePrayerRequest(id);
      toast.success('تم مسح طلب الصلاة بنجاح.');
      setPrayers(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error('فشل مسح طلب الصلاة: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- 6. Footer Handlers ---
  const handleUpdateFooter = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updated = {
        ...siteSettings,
        footer_about: footerAbout,
        footer_phone: footerPhone,
        footer_email: footerEmail,
        footer_address: footerAddress,
        footer_schedule: footerSchedule,
      };
      await api.updateSiteSettings(updated);
      setSiteSettings(updated);
      toast.success('تم حفظ إعدادات الفوتر بنجاح.');
    } catch (err: any) {
      toast.error('فشل حفظ إعدادات الفوتر: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // --- Filter Computations ---
  const filteredSermons = sermons.filter(s =>
    s.title.toLowerCase().includes(sermonSearch.toLowerCase()) ||
    s.speaker.toLowerCase().includes(sermonSearch.toLowerCase()) ||
    s.topic.toLowerCase().includes(sermonSearch.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(annSearch.toLowerCase()) ||
    a.content.toLowerCase().includes(annSearch.toLowerCase())
  );

  const filteredContacts = contacts.filter(m =>
    m.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    m.phone.includes(contactSearch) ||
    m.message.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const filteredPrayers = prayers.filter(p =>
    p.requester_name.toLowerCase().includes(prayerSearch.toLowerCase()) ||
    p.request_text.toLowerCase().includes(prayerSearch.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 font-cairo text-right" dir="rtl">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d4af37]/20 pb-5">
          <div>
            <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
              مركز إدارة المحتوى الموحد
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-1">إدارة شاملة للعظات، الإعلانات، البث المباشر، وتعديل الفوتر واستمارات الشعب</p>
          </div>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 self-start sm:self-auto flex items-center gap-1.5 font-tajawal font-bold text-xs"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </button>
        </div>

        {/* Tab Switcher Grid */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
          {(
            [
              { id: 'sermons', label: 'العظات والتعليم', icon: Play },
              { id: 'announcements', label: 'الإعلانات والأخبار', icon: Megaphone },
              { id: 'stream', label: 'البث المباشر', icon: Radio },
              { id: 'contacts', label: 'رسائل تواصل معنا', icon: MessageSquare },
              { id: 'prayers', label: 'طلبات الصلاة', icon: Heart },
              { id: 'footer', label: 'تعديل الفوتر', icon: Settings }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-tajawal font-extrabold text-xs transition-all border ${
                activeTab === tab.id
                  ? 'bg-[#002366] border-[#002366] text-[#fed65b] shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="w-12 h-12 border-4 border-[#002366] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-500 font-bold">جاري تحميل البيانات وتنسيق الجداول...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 overflow-hidden">
            
            {/* TABS CONTAINER */}

            {/* TAB 1: SERMONS */}
            {activeTab === 'sermons' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative max-w-md w-full">
                    <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث باسم العظة، الواعظ، أو الموضوع..."
                      value={sermonSearch}
                      onChange={e => setSermonSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 outline-none w-full font-bold"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleSyncSermons}
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/10 hover:scale-102 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                      <span>مزامنة الفيديوهات من يوتيوب</span>
                    </button>
                    <button
                      onClick={() => setShowSermonModal(true)}
                      className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#002366]/10 hover:scale-102 transition-all shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة عظة جديدة</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold border-b border-slate-100">
                        <th className="p-4">عنوان العظة</th>
                        <th className="p-4">الواعظ</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">رابط يوتيوب</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {filteredSermons.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-xs text-slate-400">لا توجد عظات مطابقة لبحثك.</td>
                        </tr>
                      ) : (
                        filteredSermons.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-[#002366]">{s.title}</td>
                            <td className="p-4 text-slate-600">{s.speaker}</td>
                            <td className="p-4 text-xs">
                              <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-lg">{s.topic}</span>
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-[10px]">{s.youtube_url || 'لا يوجد'}</td>
                            <td className="p-4 flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDeleteSermon(s.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="حذف العظة"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: ANNOUNCEMENTS */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative max-w-md w-full">
                    <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث في الإعلانات..."
                      value={annSearch}
                      onChange={e => setAnnSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 outline-none w-full font-bold"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenAnnModal()}
                    className="bg-[#002366] text-white hover:text-[#fed65b] font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-[#002366]/10 hover:scale-102 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة إعلان جديد</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold border-b border-slate-100">
                        <th className="p-4">عنوان الإعلان</th>
                        <th className="p-4">تاريخ النشر</th>
                        <th className="p-4">مدة الإعلان</th>
                        <th className="p-4">حالة النشر</th>
                        <th className="p-4 text-center">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-semibold text-slate-700">
                      {filteredAnnouncements.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-xs text-slate-400">لا توجد إعلانات مطابقة لبحثك.</td>
                        </tr>
                      ) : (
                        filteredAnnouncements.map(ann => (
                          <tr key={ann.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-bold text-[#002366]">
                              <div>{ann.title}</div>
                              <div className="text-[10px] text-slate-400 mt-1 font-semibold truncate max-w-xs">{ann.content}</div>
                            </td>
                            <td className="p-4 text-slate-500 text-xs font-mono">{ann.start_date}</td>
                            <td className="p-4 text-xs font-semibold">
                              {ann.duration_type === 'permanent' && 'دائم النشر'}
                              {ann.duration_type === 'days_limit' && `${ann.duration_days} أيام`}
                              {ann.duration_type === 'days_specific' && `أيام محددة: (${ann.specific_days?.join('، ')})`}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleAnnActive(ann)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] border ${
                                  ann.is_active
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${ann.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                <span>{ann.is_active ? 'نشط حالياً' : 'مغلق مؤقتاً'}</span>
                              </button>
                            </td>
                            <td className="p-4 flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenAnnModal(ann)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="تعديل الإعلان"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAnn(ann.id)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="حذف الإعلان"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: LIVE STREAM */}
            {activeTab === 'stream' && (
              <form onSubmit={handleUpdateLiveStream} className="space-y-6 max-w-xl text-right">
                <div className="bg-[#fed65b]/10 border border-[#fed65b]/20 p-4 rounded-2xl flex items-start gap-3">
                  <Radio className="w-6 h-6 text-[#d4af37] shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="font-tajawal font-extrabold text-sm text-[#002366]">لوحة التحكم المباشرة بالبث</h4>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      عند تمكين البث، يتم إدراج واجهة مشغل فيديو البث مباشرةً بالصفحة الرئيسية والصفحة المخصصة للبث.
                    </p>
                  </div>
                </div>

                 <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نمط تشغيل البث المباشر</label>
                  <select
                    value={streamMode}
                    onChange={e => setStreamMode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                  >
                    <option value="manual">يدوي (Manual Override / Fallback)</option>
                    <option value="auto">تلقائي كامل (Automated via YouTube API)</option>
                  </select>
                </div>

                {streamMode === 'auto' ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">YouTube API Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={youtubeApiKey}
                        onChange={e => setYoutubeApiKey(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">YouTube Channel ID</label>
                      <input
                        type="text"
                        placeholder="UC..."
                        value={youtubeChannelId}
                        onChange={e => setYoutubeChannelId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">حالة البث اليدوي</label>
                      <select
                        value={streamActive}
                        onChange={e => setStreamActive(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                      >
                        <option value="true">تفعيل البث يدوياً</option>
                        <option value="false">إيقاف البث يدوياً</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">رابط الفيديو/البث (YouTube Link)</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={streamUrl}
                        onChange={e => setStreamUrl(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">عنوان البث اليدوي</label>
                      <input
                        type="text"
                        placeholder="قداس الأحد الإلهي - كنيسة العذراء بمحرم بك"
                        value={streamTitle}
                        onChange={e => setStreamTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">وصف البث اليدوي</label>
                      <textarea
                        placeholder="ادخل تفاصيل أو معلومات البث..."
                        rows={3}
                        value={streamDesc}
                        onChange={e => setStreamDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-semibold"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>{actionLoading ? 'جاري تحديث البث...' : 'تحديث حالة البث المباشر'}</span>
                </button>
              </form>
            )}

            {/* TAB 4: CONTACT MESSAGES */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative max-w-md w-full">
                    <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم، التليفون، أو محتوى الرسالة..."
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 outline-none w-full font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredContacts.length === 0 ? (
                    <div className="col-span-2 p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      لا توجد رسائل واردة مطابقة لبحثك.
                    </div>
                  ) : (
                    filteredContacts.map(msg => (
                      <div
                        key={msg.id}
                        className={`border rounded-2xl p-5 space-y-3 relative group transition-all ${
                          msg.status === 'unread'
                            ? 'bg-amber-50/20 border-amber-100 shadow-[0_2px_15px_rgba(212,175,55,0.03)]'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {msg.status === 'unread' && (
                          <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        )}

                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-tajawal font-bold text-sm text-[#002366]">{msg.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{msg.phone}</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">
                            {new Date(msg.created_at || '').toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-650 leading-relaxed font-semibold bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                          {msg.message}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex gap-2">
                            {msg.status === 'unread' ? (
                              <button
                                onClick={() => handleMessageStatus(msg.id, 'read')}
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <MailOpen className="w-3.5 h-3.5" />
                                <span>تعليم كمقروءة</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleMessageStatus(msg.id, 'unread')}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <span>تعليم كغير مقروءة</span>
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="مسح الرسالة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: PRAYER REQUESTS */}
            {activeTab === 'prayers' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="relative max-w-md w-full">
                    <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث ببيانات طالب الصلاة..."
                      value={prayerSearch}
                      onChange={e => setPrayerSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl pr-10 pl-4 py-2.5 text-xs text-slate-800 outline-none w-full font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPrayers.length === 0 ? (
                    <div className="col-span-2 p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      لا توجد طلبات صلاة مسجلة حالياً.
                    </div>
                  ) : (
                    filteredPrayers.map(p => (
                      <div
                        key={p.id}
                        className={`border rounded-2xl p-5 space-y-3 relative group transition-all ${
                          !p.is_read
                            ? 'bg-amber-50/20 border-amber-100 shadow-[0_2px_15px_rgba(212,175,55,0.03)]'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        {!p.is_read && (
                          <span className="absolute top-4 left-4 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        )}

                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-tajawal font-bold text-sm text-[#002366]">{p.requester_name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">طلب صلاة للتجنيب أو الافتقاد</p>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold font-mono">
                            {new Date(p.submitted_at).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-650 leading-relaxed font-semibold bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                          {p.request_text}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex gap-2">
                            {!p.is_read ? (
                              <button
                                onClick={() => handlePrayerStatus(p.id, true)}
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>تمت الصلاة والقداس</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handlePrayerStatus(p.id, false)}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                <span>إعادة تعيين كقيد الانتظار</span>
                              </button>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeletePrayer(p.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="مسح الطلب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: FOOTER EDITOR */}
            {activeTab === 'footer' && (
              <form onSubmit={handleUpdateFooter} className="space-y-6 max-w-xl text-right">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
                  <Settings className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-tajawal font-extrabold text-sm text-[#002366]">إعدادات الفوتر (تذييل الموقع)</h4>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      قم بتحديث نصوص وعناوين وأوقات القداسات التي تظهر في جميع صفحات الموقع بأسفل الصفحة.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">نبذة عن الكنيسة بالفوتر</label>
                  <textarea
                    placeholder="نبذة تاريخية ورعوية مختصرة..."
                    rows={3}
                    value={footerAbout}
                    onChange={e => setFooterAbout(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">رقم الهاتف بالفوتر</label>
                  <input
                    type="text"
                    placeholder="+20 3 4950000"
                    value={footerPhone}
                    onChange={e => setFooterPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">البريد الإلكتروني بالفوتر</label>
                  <input
                    type="email"
                    placeholder="info@stmarymoharambek.org"
                    value={footerEmail}
                    onChange={e => setFooterEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">عنوان الكنيسة بالفوتر</label>
                  <input
                    type="text"
                    placeholder="شارع الكنيسة، محرم بك، الإسكندرية..."
                    value={footerAddress}
                    onChange={e => setFooterAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">مواعيد القداسات والخدمات (افصل بينها بـ | واستخدم @ للتوقيت)</label>
                  <textarea
                    placeholder="القداس الأول (الأحد) @ 6:00 ص - 8:00 ص | القداس الثاني @ 8:00 ص..."
                    rows={4}
                    value={footerSchedule}
                    onChange={e => setFooterSchedule(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading ? 'جاري حفظ التحديثات...' : 'حفظ إعدادات الفوتر'}</span>
                </button>
              </form>
            )}

          </div>
        )}

      </div>

      {/* --- ADD SERMON MODAL --- */}
      {showSermonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 space-y-5 text-right" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">إضافة عظة روحية جديدة</h3>
              <button onClick={() => setShowSermonModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSermon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عنوان العظة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عظة عن الرجاء المسيحي"
                  value={sermonTitle}
                  onChange={e => setSermonTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">اسم قدس أب كاهن الواعظ</label>
                <select
                  value={sermonSpeaker}
                  onChange={e => setSermonSpeaker(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                >
                  {priests.length === 0 ? (
                    <option value="الآباء كهنة الكنيسة">الآباء كهنة الكنيسة</option>
                  ) : (
                    priests.map(p => (
                      <option key={p.id} value={p.full_name}>{p.full_name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">التصنيف الروحي</label>
                <select
                  value={sermonTopic}
                  onChange={e => setSermonTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                >
                  <option value="روحيات">روحيات</option>
                  <option value="عقيدة">عقيدة</option>
                  <option value="طقس">طقس</option>
                  <option value="تفسير كتاب مقدس">تفسير كتاب مقدس</option>
                  <option value="أعياد ومناسبات">أعياد ومناسبات</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">رابط عظة يوتيوب (يوتيوب فيديو كامل)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={sermonYoutube}
                  onChange={e => setSermonYoutube(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                <Plus className="w-4 h-4" />
                <span>{actionLoading ? 'جاري الحفظ...' : 'إضافة العظة الآن'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT ANNOUNCEMENT MODAL --- */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 space-y-5 text-right" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-tajawal font-extrabold text-sm text-[#002366]">
                {annId ? 'تعديل إعلان كنسي' : 'إضافة إعلان كنسي جديد'}
              </h3>
              <button onClick={() => setShowAnnModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عنوان الإعلان</label>
                <input
                  type="text"
                  required
                  placeholder="أدخل عنواناً واضحاً للإعلان..."
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">تفاصيل ومحتوى الإعلان</label>
                <textarea
                  required
                  placeholder="محتوى الإعلان بالتفصيل والتواريخ..."
                  rows={4}
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">مدة تفعيل وعرض الإعلان</label>
                <select
                  value={annDurationType}
                  onChange={e => setAnnDurationType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                >
                  <option value="permanent">دائم النشر (لا يحذف تلقائياً)</option>
                  <option value="days_limit">عدد أيام محدد (من تاريخ النشر)</option>
                  <option value="days_specific">أيام محددة في الأسبوع فقط</option>
                </select>
              </div>

              {annDurationType === 'days_limit' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">عدد أيام النشر المسموح بها</label>
                  <input
                    type="number"
                    min={1}
                    value={annDurationDays}
                    onChange={e => setAnnDurationDays(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-bold"
                  />
                </div>
              )}

              {annDurationType === 'days_specific' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#fed65b] bg-[#002366] p-2 rounded-lg text-center">أيام النشر المسموحة بالأسبوع</label>
                  <div className="flex flex-wrap gap-2 justify-center pt-1">
                    {WEEKDAYS.map(day => {
                      const isSelected = annSpecificDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setAnnSpecificDays(prev =>
                              prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            isSelected
                              ? 'bg-[#002366] border-[#002366] text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">تاريخ بدء النشر</label>
                <input
                  type="date"
                  value={annStartDate}
                  onChange={e => setAnnStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#002366] rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none transition-colors font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="annActive"
                  checked={annActive}
                  onChange={e => setAnnActive(e.target.checked)}
                  className="accent-[#002366]"
                />
                <label htmlFor="annActive" className="text-xs font-bold text-slate-750 cursor-pointer select-none">
                  تفعيل الإعلان فورياً ونشره للموقع
                </label>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-[#002366] hover:bg-[#00174a] text-white hover:text-[#fed65b] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-55"
              >
                <Check className="w-4 h-4" />
                <span>{actionLoading ? 'جاري الحفظ...' : annId ? 'تحديث الإعلان' : 'حفظ ونشر الإعلان'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};
