import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api } from '../../lib/api';
import type { Family, FamilyMember } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { FamilyQuickMapModal } from '../../components/visitation/FamilyQuickMapModal';
import {
  MapPin,
  Search,
  Filter,
  Phone,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  Navigation,
  Sparkles,
  Layers,
  RefreshCw,
  Church,
  ChevronLeft,
  Edit3,
  Check,
  X,
  User,
  Save
} from 'lucide-react';
import L from 'leaflet';

// Church and neighborhood center coordinates in Moharam Bek & Alexandria
const MOHARAM_BEK_CENTER = { lat: 31.1960, lng: 29.9140 };

const NEIGHBORHOOD_OFFSETS: Record<string, { lat: number; lng: number }> = {
  'محرم بك': { lat: 31.1965, lng: 29.9135 },
  'شارع محرم بك': { lat: 31.1965, lng: 29.9135 },
  'شارع الرصافة': { lat: 31.1985, lng: 29.9165 },
  'الرصافة': { lat: 31.1985, lng: 29.9165 },
  'بوالينو': { lat: 31.1945, lng: 29.9100 },
  'شارع بوالينو': { lat: 31.1945, lng: 29.9100 },
  'قنال المحمودية': { lat: 31.1920, lng: 29.9180 },
  'المحمودية': { lat: 31.1920, lng: 29.9180 },
  'منشا': { lat: 31.1990, lng: 29.9120 },
  'شارع منشا': { lat: 31.1990, lng: 29.9120 },
  'أمير البحر': { lat: 31.1950, lng: 29.9150 },
  'الحديني': { lat: 31.1970, lng: 29.9110 },
  'عرفان': { lat: 31.1935, lng: 29.9125 },
  'جرين': { lat: 31.1978, lng: 29.9090 },
  'محطة مصر': { lat: 31.1930, lng: 29.9060 },
  'الإسعاف': { lat: 31.1940, lng: 29.9080 },
  'كوم الدكة': { lat: 31.1950, lng: 29.9040 },
  'الغيط الصعيدي': { lat: 31.1955, lng: 29.9200 },
  'الموالح': { lat: 31.1870, lng: 29.9010 },
  'كرموز': { lat: 31.1870, lng: 29.9010 },
  'الإبراهيمية': { lat: 31.2120, lng: 29.9270 },
  'كامب شيزار': { lat: 31.2160, lng: 29.9320 },
  'الشاطبي': { lat: 31.2100, lng: 29.9180 },
  'الحضرة': { lat: 31.2010, lng: 29.9300 },
  'سموحة': { lat: 31.2150, lng: 29.9450 },
  'سيدي جابر': { lat: 31.2190, lng: 29.9400 },
  'كليوباترا': { lat: 31.2220, lng: 29.9350 },
};

// Helper: Extract [GEO:lat,lng] from notes
export function extractGeoFromNotes(notes?: string | null): { lat: number; lng: number } | null {
  if (!notes) return null;
  const match = notes.match(/\[GEO:([-\d.]+),([-\d.]+)\]/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

// Helper: Embed [GEO:lat,lng] into notes
export function setGeoInNotes(notes: string | null | undefined, lat: number, lng: number): string {
  const clean = (notes || '').replace(/\[GEO:[-\d.]+,[-\d.]+\]/g, '').trim();
  const tag = `[GEO:${lat.toFixed(6)},${lng.toFixed(6)}]`;
  return clean ? `${clean} ${tag}` : tag;
}

export const SmartVisitationMapPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [familyMembersMap, setFamilyMembersMap] = useState<Record<string, FamilyMember[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'urgent' | 'warning' | 'visited'>('all');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  // Edit location on map state
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [tempEditCoords, setTempEditCoords] = useState<[number, number] | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const editMarkerRef = useRef<L.Marker | null>(null);

  // Load Families and their kids
  const fetchFamilies = async () => {
    setLoading(true);
    try {
      const allFamilies = await api.getFamilies();
      
      let myFamilyIds: string[] = [];
      try {
        const relations = await api.getFamilyServantsForAll();
        if (profile && profile.role === 'servant') {
          myFamilyIds = relations.filter(r => r.servant_id === profile.id).map(r => r.family_id);
        }
      } catch (err) {
        console.warn('family_servants error:', err);
      }

      let filtered = allFamilies;
      if (profile && profile.role === 'servant') {
        filtered = allFamilies.filter(f => 
          myFamilyIds.includes(f.id) || f.assigned_servant_id === profile.id
        );
      }

      // Fetch family members for each family
      const membersMap: Record<string, FamilyMember[]> = {};
      await Promise.all(
        filtered.map(async f => {
          try {
            const kids = await api.getFamilyMembers(f.id);
            membersMap[f.id] = kids;
          } catch {
            membersMap[f.id] = [];
          }
        })
      );

      setFamilyMembersMap(membersMap);
      setFamilies(filtered);
    } catch (err: any) {
      toast.error('حدث خطأ في جلب بيانات الأسر: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, [profile]);

  // Compute family coordinates
  const getFamilyCoords = (family: Family, index: number): [number, number] => {
    // 1. Saved in family.notes [GEO:lat,lng]
    const geo = extractGeoFromNotes(family.notes);
    if (geo) return [geo.lat, geo.lng];

    // 2. Saved in localStorage
    try {
      const local = localStorage.getItem(`geo_${family.id}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.lat && parsed.lng) return [parsed.lat, parsed.lng];
      }
    } catch {}

    // 3. Fallback: Parse address from family or member
    const kids = familyMembersMap[family.id] || [];
    const kidAddress = kids.find(k => k.address)?.address || '';
    const combinedAddress = `${family.address || ''} ${kidAddress}`.toLowerCase();

    let base = MOHARAM_BEK_CENTER;
    for (const [key, coords] of Object.entries(NEIGHBORHOOD_OFFSETS)) {
      if (combinedAddress.includes(key.toLowerCase())) {
        base = coords;
        break;
      }
    }

    // Deterministic offset
    const hash = (family.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17) % 100;
    const latOffset = ((hash % 10) - 5) * 0.0014;
    const lngOffset = (Math.floor(hash / 10) - 5) * 0.0018;

    return [base.lat + latOffset, base.lng + lngOffset];
  };

  // Helper to determine status
  const getFamilyStatus = (family: Family): 'visited' | 'warning' | 'urgent' => {
    if (!family.last_visit_date) return 'urgent';
    const diff = Math.floor((Date.now() - new Date(family.last_visit_date).getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 30) return 'visited';
    if (diff <= 60) return 'warning';
    return 'urgent';
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: [MOHARAM_BEK_CENTER.lat, MOHARAM_BEK_CENTER.lng],
      zoom: 15,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Church Center Gold Marker
    const churchIcon = L.divIcon({
      className: 'custom-church-marker',
      html: `
        <div style="
          background: linear-gradient(135deg, #00174a, #002366);
          border: 3px solid #d4af37;
          color: #fed65b;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,23,74,0.5);
          font-size: 20px;
          font-weight: bold;
        ">
          ✝️
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    L.marker([MOHARAM_BEK_CENTER.lat, MOHARAM_BEK_CENTER.lng], { icon: churchIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: Cairo, sans-serif; text-align: right; direction: rtl; padding: 4px;">
          <strong style="color: #00174a; font-size: 13px;">⛪ كنيسة السيدة العذراء مريم</strong><br/>
          <span style="font-size: 11px; color: #666;">محرم بك — الإسكندرية</span>
        </div>
      `);

    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Family Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const filtered = families.filter(f => {
      const kids = familyMembersMap[f.id] || [];
      const kidsNames = kids.map(k => k.full_name).join(' ');
      const matchSearch = f.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          kidsNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.address && f.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (f.phone && f.phone.includes(searchTerm));
      const status = getFamilyStatus(f);
      const matchStatus = filterStatus === 'all' || filterStatus === status;
      return matchSearch && matchStatus;
    });

    filtered.forEach((family, idx) => {
      // Skip rendering regular marker if currently editing this family
      if (editingFamily?.id === family.id) return;

      const coords = getFamilyCoords(family, idx);
      const status = getFamilyStatus(family);

      let pinColor = '#10b981'; // Green (Visited)
      if (status === 'warning') pinColor = '#f59e0b'; // Yellow (Warning)
      if (status === 'urgent') pinColor = '#ef4444'; // Red (Urgent)

      const hasGeo = Boolean(extractGeoFromNotes(family.notes));
      const kids = familyMembersMap[family.id] || [];

      const customPin = L.divIcon({
        className: 'custom-family-pin',
        html: `
          <div style="
            background: white;
            border: 3px solid ${pinColor};
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            font-size: 14px;
            cursor: pointer;
            position: relative;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            ${status === 'visited' ? '🏠' : status === 'warning' ? '⚠️' : '🚨'}
            ${hasGeo ? `<span style="position:absolute; bottom:-3px; right:-3px; width:10px; height:10px; background:#d4af37; border-radius:50%; border:1px solid white;"></span>` : ''}
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker(coords, { icon: customPin }).addTo(markersGroup);

      const kidsSummary = kids.length > 0 ? kids.map(k => k.full_name).join('، ') : 'لا يوجد مخدومين مسجلين';
      const cleanAddress = family.address || (kids.find(k => k.address)?.address) || 'العنوان غير محدد';

      marker.bindPopup(`
        <div style="font-family: Cairo, sans-serif; text-align: right; direction: rtl; padding: 6px; min-width: 180px;">
          <strong style="color: #00174a; font-size: 13px;">أسرة أ/ ${family.head_name}</strong><br/>
          <span style="font-size: 11px; color: #555;">📍 ${cleanAddress}</span><br/>
          <span style="font-size: 11px; color: #002366; font-weight: bold;">👦 المخدومين: ${kidsSummary}</span><br/>
          <button id="btn-visit-${family.id}" style="margin-top: 8px; width: 100%; background: #002366; color: #fed65b; font-weight: bold; font-size: 11px; padding: 5px; border-radius: 8px; border: none; cursor: pointer;">
            عرض التفاصيل والافتقاد ✍️
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-visit-${family.id}`);
        if (btn) {
          btn.onclick = () => setSelectedFamily(family);
        }
      });

      marker.on('click', () => {
        setSelectedFamily(family);
      });
    });

  }, [families, familyMembersMap, searchTerm, filterStatus, editingFamily]);

  // Edit Mode Marker & Map Click Handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !editingFamily || !tempEditCoords) {
      if (editMarkerRef.current && map) {
        map.removeLayer(editMarkerRef.current);
        editMarkerRef.current = null;
      }
      return;
    }

    map.flyTo(tempEditCoords, 18, { duration: 0.8 });

    const editIcon = L.divIcon({
      className: 'custom-edit-marker',
      html: `
        <div style="
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(254, 214, 91, 0.45);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
          <div style="
            position: relative;
            background: #00174a;
            border: 3px solid #fed65b;
            color: #fed65b;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            font-size: 18px;
            font-weight: bold;
            cursor: grab;
          ">
            📍
          </div>
        </div>
      `,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    if (editMarkerRef.current) {
      editMarkerRef.current.setLatLng(tempEditCoords);
    } else {
      const editMarker = L.marker(tempEditCoords, {
        icon: editIcon,
        draggable: true,
        zIndexOffset: 2000
      }).addTo(map);

      editMarker.on('dragend', (e: any) => {
        const { lat, lng } = e.target.getLatLng();
        setTempEditCoords([lat, lng]);
      });

      editMarkerRef.current = editMarker;
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setTempEditCoords([lat, lng]);
      if (editMarkerRef.current) {
        editMarkerRef.current.setLatLng([lat, lng]);
      }
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      if (editMarkerRef.current) {
        map.removeLayer(editMarkerRef.current);
        editMarkerRef.current = null;
      }
    };
  }, [editingFamily, tempEditCoords]);

  // Start editing location
  const handleStartEditLocation = (family: Family) => {
    const coords = getFamilyCoords(family, 0);
    setEditingFamily(family);
    setTempEditCoords(coords);
    toast.success(`📍 انقر على الخريطة أو اسحب العلامة لتحديد مكان منزل أسرة ${family.head_name}`);
  };

  // Save edited location
  const handleSaveEditedLocation = async () => {
    if (!editingFamily || !tempEditCoords) return;
    setSavingLocation(true);
    try {
      const [lat, lng] = tempEditCoords;
      const updatedNotes = setGeoInNotes(editingFamily.notes, lat, lng);

      await api.updateFamily(editingFamily.id, {
        notes: updatedNotes
      });

      // Update state and cache
      setFamilies(prev => prev.map(f => f.id === editingFamily.id ? { ...f, notes: updatedNotes } : f));
      try {
        localStorage.setItem(`geo_${editingFamily.id}`, JSON.stringify({ lat, lng }));
      } catch {}

      toast.success(`تم تثبيت وحفظ موقع أسرة أ/ ${editingFamily.head_name} على الخريطة بنجاح 📍✨`);
      setEditingFamily(null);
      setTempEditCoords(null);
    } catch (err: any) {
      toast.error('حدث خطأ أثناء حفظ الموقع: ' + err.message);
    } finally {
      setSavingLocation(false);
    }
  };

  // Cancel edit location
  const handleCancelEditLocation = () => {
    setEditingFamily(null);
    setTempEditCoords(null);
  };

  // Zoom to family on map
  const handleFlyToFamily = (family: Family, index: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords = getFamilyCoords(family, index);
    map.flyTo(coords, 17, { duration: 1.2 });
    setSelectedFamily(family);
  };

  // Stats calculation
  const total = families.length;
  const visitedCount = families.filter(f => getFamilyStatus(f) === 'visited').length;
  const warningCount = families.filter(f => getFamilyStatus(f) === 'warning').length;
  const urgentCount = families.filter(f => getFamilyStatus(f) === 'urgent').length;

  const filteredFamiliesList = families.filter(f => {
    const kids = familyMembersMap[f.id] || [];
    const kidsNames = kids.map(k => k.full_name).join(' ');
    const matchSearch = f.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        kidsNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (f.address && f.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const status = getFamilyStatus(f);
    const matchStatus = filterStatus === 'all' || filterStatus === status;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout role="servant">
      <div className="space-y-6 text-right font-cairo" dir="rtl">
        
        {/* Top Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-bold">إجمالي الأسر المسجلة</p>
              <p className="text-2xl font-extrabold text-[#00174a] mt-1">{total} أسرة</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#002366]/10 flex items-center justify-center text-[#002366]">
              <Home className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-700 font-bold">تم الافتقاد (🟢)</p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">{visitedCount} أسرة</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-amber-200 bg-amber-50/40 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-700 font-bold">تحتاج متابعة (🟡)</p>
              <p className="text-2xl font-extrabold text-amber-800 mt-1">{warningCount} أسرة</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-200 bg-rose-50/40 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-700 font-bold">افتقاد عاجل (🔴)</p>
              <p className="text-2xl font-extrabold text-rose-800 mt-1">{urgentCount} أسرة</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Unassigned Servant Notice */}
        {profile?.role === 'servant' && families.length === 0 && !loading && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold shadow-xs">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>🔒 تنبيه الخصوصية: لم يتم إسناد أسرة أو فصل لحسابك بعد. يرجى التواصل مع أمين الخدمة لإسناد فصلك ومخدوميك لتظهر عناوينهم ومواقعهم على الخريطة.</span>
          </div>
        )}

        {/* Main Grid: Map (8 cols) + Families Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Map View Container (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden relative">
            
            {/* Map Action Overlay Header */}
            <div className="p-4 bg-[#00174a] text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#d4af37]">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#fed65b]" />
                <h3 className="font-extrabold text-sm text-white">خريطة افتقاد شوارع محرم بك والإسكندرية</h3>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>مُفتقدة</span>
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>متابعة</span>
                </span>
                <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>عاجل</span>
                </span>
              </div>
            </div>

            {/* Editing Mode Banner (When Servant is adjusting a location) */}
            {editingFamily && (
              <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-[#00174a] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in z-20 relative">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#00174a] text-[#fed65b] flex items-center justify-center font-bold">
                    📍
                  </span>
                  <div>
                    <p className="font-black text-xs sm:text-sm">
                      تعديل موقع منزل: أسرة أ/ {editingFamily.head_name}
                    </p>
                    <p className="text-[11px] text-[#00174a]/90 font-bold">
                      انقر على أي نقطة على الخريطة أو اسحب العلامة الصفراء لتحديد مكان المنزل بدقة.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSaveEditedLocation}
                    disabled={savingLocation}
                    className="flex-1 sm:flex-none px-4 py-2 bg-[#00174a] hover:bg-black text-[#fed65b] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    {savingLocation ? (
                      <div className="w-3.5 h-3.5 border-2 border-[#fed65b] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-[#fed65b]" />
                    )}
                    <span>حفظ وتثبيت الموقع 💾</span>
                  </button>

                  <button
                    onClick={handleCancelEditLocation}
                    className="px-3 py-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl font-bold text-xs transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Map Box */}
            <div
              ref={mapContainerRef}
              className="w-full h-[540px] sm:h-[600px] z-10"
              style={{ minHeight: '500px' }}
            />

            {/* Map Footnote */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>انقر على أي دبوس لعرض المخدومين وتسجيل الافتقاد أو تعديل الموقع.</span>
              <button
                onClick={fetchFamilies}
                className="text-[#002366] hover:text-[#d4af37] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث البيانات</span>
              </button>
            </div>
          </div>

          {/* Families Sidebar List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xl p-5 space-y-4 max-h-[720px] flex flex-col">
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-[#00174a]">قائمة أسر ومخدومي الخدمة</h3>
              <p className="text-xs text-slate-400">انتقل للموقع أو عدّل مكان المنزل بضغطة زر</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث باسم المخدوم أو الشارع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#002366]"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1 text-[11px] font-bold">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'all' ? 'bg-[#002366] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل ({families.length})
              </button>
              <button
                onClick={() => setFilterStatus('urgent')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'urgent' ? 'bg-rose-600 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                عاجل 🔴 ({urgentCount})
              </button>
              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'warning' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                متابعة 🟡 ({warningCount})
              </button>
              <button
                onClick={() => setFilterStatus('visited')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterStatus === 'visited' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                مُفتقدة 🟢 ({visitedCount})
              </button>
            </div>

            {/* Scrollable Families List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 space-y-2 pr-1">
              {filteredFamiliesList.map((family, idx) => {
                const status = getFamilyStatus(family);
                const kids = familyMembersMap[family.id] || [];
                const cleanAddress = family.address || (kids.find(k => k.address)?.address) || 'العنوان غير محدد';
                const hasCustomGeo = Boolean(extractGeoFromNotes(family.notes));

                return (
                  <div
                    key={family.id}
                    className="p-3 rounded-2xl hover:bg-slate-50 transition-all border border-slate-100 hover:border-slate-200 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          status === 'visited' ? 'bg-emerald-500' :
                          status === 'warning' ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
                        <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-[#002366] transition-colors">
                          أسرة أ/ {family.head_name}
                        </h4>
                      </div>
                      {hasCustomGeo && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-md">
                          موقع مثبت 📍
                        </span>
                      )}
                    </div>

                    {/* Makhdoumeen / Kids */}
                    {kids.length > 0 && (
                      <p className="text-[11px] font-bold text-[#002366] flex items-center gap-1">
                        <User className="w-3 h-3 text-[#d4af37]" />
                        <span>الأبناء: {kids.map(k => `${k.full_name} (${k.sunday_school_stage || 'مخدوم'})`).join('، ')}</span>
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500 truncate">
                      📍 {cleanAddress}
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{family.last_visit_date ? `آخر زيارة: ${family.last_visit_date}` : 'لم تُفتقد بعد'}</span>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditLocation(family);
                          }}
                          className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors"
                          title="تعديل موقع المنزل على الخريطة"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل الموقع</span>
                        </button>

                        <button
                          onClick={() => handleFlyToFamily(family, idx)}
                          className="text-[#002366] hover:text-black font-bold flex items-center gap-0.5"
                        >
                          <span>عرض</span>
                          <ChevronLeft className="w-3 h-3 inline" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredFamiliesList.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-bold">
                  لا توجد أسر تطابق هذا البحث أو الفلتر.
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Quick Family Details & Log Modal */}
      {selectedFamily && (
        <FamilyQuickMapModal
          family={selectedFamily}
          isOpen={true}
          onClose={() => setSelectedFamily(null)}
          onStartEditLocation={(fam) => handleStartEditLocation(fam)}
          onVisitationLogged={(familyId, newDate) => {
            setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, last_visit_date: newDate } : f));
          }}
        />
      )}

    </DashboardLayout>
  );
};
