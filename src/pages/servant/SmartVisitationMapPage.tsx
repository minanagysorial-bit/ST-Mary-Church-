import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { api } from '../../lib/api';
import type { Family } from '../../lib/database.types';
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
  ChevronLeft
} from 'lucide-react';
import L from 'leaflet';

// Sample coordinates generator around Moharam Bek & Alexandria
const MOHARAM_BEK_CENTER = { lat: 31.1960, lng: 29.9140 };

const NEIGHBORHOOD_OFFSETS: Record<string, { lat: number; lng: number }> = {
  'محرم بك': { lat: 31.1960, lng: 29.9140 },
  'شارع الرصافة': { lat: 31.1985, lng: 29.9165 },
  'قنال المحمودية': { lat: 31.1920, lng: 29.9180 },
  'بوالينو': { lat: 31.1945, lng: 29.9100 },
  'محطة مصر': { lat: 31.1930, lng: 29.9060 },
  'كرموز': { lat: 31.1870, lng: 29.9010 },
  'الإبراهيمية': { lat: 31.2120, lng: 29.9270 },
  'كامب شيزار': { lat: 31.2160, lng: 29.9320 },
  'الشاطبي': { lat: 31.2100, lng: 29.9180 },
};

export const SmartVisitationMapPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'urgent' | 'warning' | 'visited'>('all');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Load Families
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

  // Compute family coordinates deterministically
  const getFamilyCoords = (family: Family, index: number): [number, number] => {
    const address = (family.address || '').toLowerCase();
    let base = MOHARAM_BEK_CENTER;

    for (const [key, coords] of Object.entries(NEIGHBORHOOD_OFFSETS)) {
      if (address.includes(key.toLowerCase())) {
        base = coords;
        break;
      }
    }

    // Spread markers slightly around the base area based on ID hash
    const hash = (family.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + index * 17) % 100;
    const latOffset = ((hash % 10) - 5) * 0.0018;
    const lngOffset = (Math.floor(hash / 10) - 5) * 0.0022;

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

  // Update Markers when families or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const filtered = families.filter(f => {
      const matchSearch = f.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.address && f.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (f.phone && f.phone.includes(searchTerm));
      const status = getFamilyStatus(f);
      const matchStatus = filterStatus === 'all' || filterStatus === status;
      return matchSearch && matchStatus;
    });

    filtered.forEach((family, idx) => {
      const coords = getFamilyCoords(family, idx);
      const status = getFamilyStatus(family);

      let pinColor = '#10b981'; // Green (Visited)
      let pinIcon = '🟢';
      if (status === 'warning') {
        pinColor = '#f59e0b'; // Yellow (Warning)
        pinIcon = '🟡';
      } else if (status === 'urgent') {
        pinColor = '#ef4444'; // Red (Urgent)
        pinIcon = '🔴';
      }

      const customPin = L.divIcon({
        className: 'custom-family-pin',
        html: `
          <div style="
            background: white;
            border: 3px solid ${pinColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 10px rgba(0,0,0,0.25);
            font-size: 14px;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            ${status === 'visited' ? '🏠' : status === 'warning' ? '⚠️' : '🚨'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(coords, { icon: customPin }).addTo(markersGroup);

      marker.on('click', () => {
        setSelectedFamily(family);
      });
    });

  }, [families, searchTerm, filterStatus]);

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
  const visitedPercent = total > 0 ? Math.round((visitedCount / total) * 100) : 0;

  const filteredFamiliesList = families.filter(f => {
    const matchSearch = f.head_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <p className="text-xs text-emerald-700 font-bold">تم الافتقاد مؤخراً (🟢)</p>
              <p className="text-2xl font-extrabold text-emerald-800 mt-1">{visitedCount} أسرة ({visitedPercent}%)</p>
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

        {/* Main Grid: Map (8 cols) + Families Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Map View Container (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden relative">
            
            {/* Map Action Overlay Header */}
            <div className="p-4 bg-[#00174a] text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#d4af37]">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-[#fed65b]" />
                <h3 className="font-extrabold text-sm text-white">خريطة شوارع محرم بك والإسكندرية</h3>
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

            {/* Interactive Map Box */}
            <div
              ref={mapContainerRef}
              className="w-full h-[540px] sm:h-[600px] z-10"
              style={{ minHeight: '500px' }}
            />

            {/* Map Footnote */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span>انقر على أي دبوس لعرض تفاصيل الأسرة والاتصال السريع أو تسجيل الافتقاد.</span>
              <button
                onClick={fetchFamilies}
                className="text-[#002366] hover:text-[#d4af37] font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* Families Sidebar List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xl p-5 space-y-4 max-h-[680px] flex flex-col">
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-[#00174a]">قائمة أسر الخدمة</h3>
              <p className="text-xs text-slate-400">اختر أسرة للانتقال لموقعها فورياً على الخريطة</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث باسم الأسرة أو الشارع..."
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
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
              {filteredFamiliesList.map((family, idx) => {
                const status = getFamilyStatus(family);
                return (
                  <div
                    key={family.id}
                    onClick={() => handleFlyToFamily(family, idx)}
                    className="p-3 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer space-y-1 group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-[#002366] transition-colors">
                        أسرة أ/ {family.head_name}
                      </h4>
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        status === 'visited' ? 'bg-emerald-500' :
                        status === 'warning' ? 'bg-amber-500' :
                        'bg-rose-500'
                      }`} />
                    </div>

                    <p className="text-[11px] text-slate-500 truncate">{family.address || 'العنوان غير محدد'}</p>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{family.last_visit_date ? `آخر زيارة: ${family.last_visit_date}` : 'لم تُفتقد بعد'}</span>
                      <span className="text-[#002366] font-bold group-hover:translate-x-[-2px] transition-transform flex items-center">
                        <span>عرض بالخريطة</span>
                        <ChevronLeft className="w-3 h-3 inline" />
                      </span>
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
          onVisitationLogged={(familyId, newDate) => {
            setFamilies(prev => prev.map(f => f.id === familyId ? { ...f, last_visit_date: newDate } : f));
          }}
        />
      )}

    </DashboardLayout>
  );
};
