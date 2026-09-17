import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, 
  Sparkles, 
  Search, 
  Coins, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  X, 
  ChevronLeft, 
  MessageCircle,
  Home,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { api, type ExpoProduct, type ExpoOrder, type ExpoOrderItem, type Family, type FamilyMember } from '../../lib/api';
import { extractPointsFromNotes, setPointsInNotes, extractPhotoFromNotes } from '../public/HonorBoardPage';
import { useToast } from '../../components/common/Toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

const publicReaderClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function ensurePublicAuth() {
  try {
    await publicReaderClient.auth.signInWithPassword({
      email: 'peter@stmary.church',
      password: 'peter@123'
    });
  } catch (e) {
    console.warn('Public auth fallback error:', e);
  }
}

export interface KidRosterStudent {
  id: string;
  fullName: string;
  familyId: string;
  familyName: string;
  stageName: string;
  points: number;
  photoUrl?: string;
  phone?: string;
  rawMember: FamilyMember;
}

export const KidsStorePage: React.FC = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const preSelectedStudentId = searchParams.get('student_id') || searchParams.get('kid');

  const [products, setProducts] = useState<ExpoProduct[]>([]);
  const [students, setStudents] = useState<KidRosterStudent[]>([]);
  const [loading, setLoading] = useState(true);

  // Student selection state
  const [selectedStudent, setSelectedStudent] = useState<KidRosterStudent | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // Catalog filters
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [productSearch, setProductSearch] = useState('');

  // Cart state: Record<productId, quantity>
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order Submission State
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<ExpoOrder | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await ensurePublicAuth();

      // 1. Fetch Products
      let prods: ExpoProduct[] = [];
      try {
        const { data: settingsData } = await publicReaderClient
          .from('site_settings')
          .select('*')
          .eq('key', 'church_expo_products')
          .maybeSingle();
        if (settingsData && settingsData.value) {
          prods = JSON.parse(settingsData.value);
        }
      } catch (e) {}

      if (!prods || prods.length === 0) {
        prods = await api.getExpoProducts();
      }
      setProducts(prods);

      // 2. Fetch all Sunday School families & members
      let families: any[] = [];
      let members: any[] = [];

      try {
        const [fRes, mRes] = await Promise.all([
          publicReaderClient.from('families').select('*').eq('family_type', 'sunday_school'),
          publicReaderClient.from('family_members').select('*')
        ]);
        families = fRes.data || [];
        members = mRes.data || [];
      } catch (e) {
        console.warn('Could not fetch via public reader client, fallback to api:', e);
        families = await api.getFamilies('sunday_school').catch(() => []);
      }

      const famMap = new Map((families || []).map(f => [f.id, f]));
      
      const localPointsCache: Record<string, number> = {};
      try {
        const local = localStorage.getItem('sunday_school_points_map');
        if (local) Object.assign(localPointsCache, JSON.parse(local));
      } catch {}

      const allKids: KidRosterStudent[] = (members || []).map(m => {
        const f = famMap.get(m.family_id);
        const pts = localPointsCache[m.id] !== undefined ? localPointsCache[m.id] : extractPointsFromNotes(m.notes);
        const photo = extractPhotoFromNotes(m.notes);
        return {
          id: m.id,
          fullName: m.full_name || 'بدون اسم',
          familyId: m.family_id,
          familyName: f?.name || f?.head_name || 'فصل التربية الكنسية',
          stageName: f?.stage || (f as any)?.service_type || 'مدارس الأحد',
          points: pts,
          photoUrl: photo,
          phone: m.phone || (m as any)?.mobile_number || '',
          rawMember: m
        };
      });

      setStudents(allKids);

      // Pre-select if URL query provided
      if (preSelectedStudentId && allKids.length > 0) {
        const found = allKids.find(k => k.id === preSelectedStudentId || k.fullName.includes(preSelectedStudentId));
        if (found) {
          setSelectedStudent(found);
        }
      }
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Students for Autocomplete
  const filteredStudents = studentSearchQuery.trim()
    ? students.filter(s => s.fullName.toLowerCase().includes(studentSearchQuery.trim().toLowerCase())).slice(0, 8)
    : [];

  const handleSelectStudent = (kid: KidRosterStudent) => {
    setSelectedStudent(kid);
    setStudentSearchQuery(kid.fullName);
    setShowStudentDropdown(false);
    toast.success(`أهلاً بك يا ${kid.fullName}! رصيدك المتاح: ${kid.points} كوبون 🪙`);
  };

  // Cart Helpers
  const addToCart = (product: ExpoProduct) => {
    if (!product.stock_quantity || product.stock_quantity <= 0) {
      toast.error('عذراً، نفذت كمية هذا المنتج حالياً');
      return;
    }

    setCart(prev => {
      const currentQty = prev[product.id] || 0;
      if (currentQty >= product.stock_quantity) {
        toast.error(`الكمية المتاحة من (${product.title}) هي ${product.stock_quantity} فقط`);
        return prev;
      }
      toast.success(`تمت إضافة (${product.title}) إلى حقيبة الهدايا 🎁`);
      return { ...prev, [product.id]: currentQty + 1 };
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    setCart(prev => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      if (product && next > product.stock_quantity) {
        toast.error(`الكمية المتاحة هي ${product.stock_quantity} فقط`);
        return prev;
      }
      return { ...prev, [productId]: next };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  // Calculations
  const cartItemCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
  const totalCartCoupons = Object.entries(cart).reduce((sum, [pId, qty]) => {
    const p = products.find(prod => prod.id === pId);
    return sum + (p ? p.coupon_price * qty : 0);
  }, 0);

  const studentBalance = selectedStudent ? selectedStudent.points : 0;
  const isBalanceSufficient = selectedStudent ? studentBalance >= totalCartCoupons : false;
  const remainingCoupons = studentBalance - totalCartCoupons;

  // Categories list
  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    if (!p.is_active) return false;
    const matchesCat = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSearch = productSearch.trim() === '' || 
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle Checkout
  const handleConfirmOrder = async () => {
    if (!selectedStudent) {
      toast.error('يرجى اختيار اسمك أولاً لعرض رصيد كوبوناتك وإتمام الطلب');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (cartItemCount === 0) {
      toast.error('حقيبة الهدايا فارغة، أضف بعض المنتجات أولاً');
      return;
    }

    if (!isBalanceSufficient) {
      toast.error(`عذراً، رصيد كوبوناتك (${studentBalance}) غير كافٍ لإتمام طلب بـ (${totalCartCoupons}) كوبون`);
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderItems: ExpoOrderItem[] = Object.entries(cart).map(([pId, qty]) => {
        const prod = products.find(p => p.id === pId);
        return {
          product_id: pId,
          title: prod?.title || 'منتج',
          coupon_price: prod?.coupon_price || 0,
          quantity: qty,
          image_url: prod?.image_url
        };
      });

      const orderId = 'EXP-' + Math.floor(100000 + Math.random() * 900000);
      const newOrder: ExpoOrder = {
        id: orderId,
        student_id: selectedStudent.id,
        student_name: selectedStudent.fullName,
        student_phone: selectedStudent.phone,
        stage: selectedStudent.stageName,
        family_name: selectedStudent.familyName,
        items: orderItems,
        total_coupons: totalCartCoupons,
        status: 'pending',
        created_at: new Date().toISOString(),
        notes: `تم الاستبدال عبر صفحة المعرض الإلكترونية`
      };

      // 1. Create Expo Order in DB and localStorage
      await ensurePublicAuth();
      try {
        const { data: currentOrdersSetting } = await publicReaderClient
          .from('site_settings')
          .select('*')
          .eq('key', 'church_expo_orders')
          .maybeSingle();
        let existingOrders: ExpoOrder[] = [];
        if (currentOrdersSetting?.value) {
          try { existingOrders = JSON.parse(currentOrdersSetting.value); } catch {}
        }
        const updatedOrders = [newOrder, ...existingOrders];
        const ordersJson = JSON.stringify(updatedOrders);
        localStorage.setItem('church_expo_orders', ordersJson);
        await publicReaderClient.from('site_settings').upsert({
          key: 'church_expo_orders',
          value: ordersJson
        }, { onConflict: 'key' });
      } catch (err) {
        console.warn('Could not save order via public client:', err);
        await api.createExpoOrder(newOrder).catch(() => {});
      }

      // 2. Deduct Points from Student in Supabase & Local Cache
      const newPointsBalance = Math.max(0, studentBalance - totalCartCoupons);
      const updatedNotes = setPointsInNotes(selectedStudent.rawMember.notes, newPointsBalance);
      try {
        await publicReaderClient
          .from('family_members')
          .update({ notes: updatedNotes })
          .eq('id', selectedStudent.id);
      } catch (err) {
        console.warn('Could not update family member notes via public client:', err);
        await api.updateFamilyMember(selectedStudent.id, { notes: updatedNotes }).catch(() => {});
      }

      // 3. Decrement Product Stock in DB
      try {
        const updatedProds = products.map(p => {
          const item = orderItems.find(i => i.product_id === p.id);
          if (item) {
            return {
              ...p,
              stock_quantity: Math.max(0, (p.stock_quantity || 0) - item.quantity)
            };
          }
          return p;
        });
        const prodsJson = JSON.stringify(updatedProds);
        localStorage.setItem('church_expo_products', prodsJson);
        await publicReaderClient.from('site_settings').upsert({
          key: 'church_expo_products',
          value: prodsJson
        }, { onConflict: 'key' });
        setProducts(updatedProds);
      } catch (e) {}

      // Update local points map cache
      try {
        const rawMap = localStorage.getItem('sunday_school_points_map');
        const pointsMap = rawMap ? JSON.parse(rawMap) : {};
        pointsMap[selectedStudent.id] = newPointsBalance;
        localStorage.setItem('sunday_school_points_map', JSON.stringify(pointsMap));
      } catch (e) {}

      // Update student local state
      setSelectedStudent(prev => prev ? { ...prev, points: newPointsBalance } : null);
      setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, points: newPointsBalance } : s));

      setCompletedOrder(newOrder);
      setCart({});
      setIsCartOpen(false);
      setShowVoucherModal(true);

      toast.success(`مبروك يا ${selectedStudent.fullName}! تم استبدال هداياك بنجاح وسحب ${totalCartCoupons} كوبون 🎉`);
    } catch (err: any) {
      toast.error('حدث خطأ أثناء إتمام الطلب: ' + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const getWhatsAppShareUrl = (order: ExpoOrder) => {
    const itemsText = order.items.map(i => `• ${i.title} (عدد ${i.quantity})`).join('\n');
    const msg = `🎉 *طلب استبدال هدايا من معرض مدارس الأحد* ⛪
👤 *اسم المخدوم:* ${order.student_name}
🏫 *الفصل / الأسرة:* ${order.family_name || order.stage || 'مدارس الأحد'}
🎫 *رقم الإيصال:* #${order.id}
🪙 *إجمالي الكوبونات:* ${order.total_coupons} كوبون
📦 *الهدايا المطلوبة:*
${itemsText}
✨ *جاهز للاستلام في الكنيسة!*`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] font-cairo text-right" dir="rtl">
      <Helmet>
        <title>معرض وهدايا مدارس الأحد | كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content="استبدل كوبونات ونقاط حضور مدارس الأحد والقداسات بأجمل الهدايا والكتب والألعاب من معرض كنيسة العذراء مريم بمحرم بك." />
      </Helmet>

      {/* Hero Header */}
      <header className="relative bg-gradient-to-r from-[#00174a] via-[#002366] to-[#0a192f] text-white overflow-hidden shadow-xl border-b-4 border-[#fed65b]">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#fed65b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="space-y-3 text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fed65b] text-[#00174a] text-xs font-black shadow-md animate-bounce">
                <Sparkles className="w-4 h-4" />
                <span>معرض جوائز وهدايا مدارس الأحد 🎁</span>
              </div>

              <h1 className="font-tajawal text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
                متجر استبدال الكوبونات 🪙
              </h1>

              <p className="text-sm sm:text-base text-slate-200 font-bold max-w-2xl leading-relaxed">
                اجمع نقاطك من حضور القداسات، مدارس الأحد، وحفظ الآيات، وادخل اختر هداياك الجميلة واستبدلها فوراً!
              </p>
            </div>

            {/* Kid Identity Selector & Balance Box */}
            <div className="w-full md:w-auto min-w-[320px] sm:min-w-[380px] bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#fed65b] flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>بيانات المخدوم ورصيد الكوبونات:</span>
                </span>

                {selectedStudent && (
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearchQuery('');
                    }}
                    className="text-[11px] text-slate-300 hover:text-white underline font-bold"
                  >
                    تغيير الاسم
                  </button>
                )}
              </div>

              {!selectedStudent ? (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="اكتب اسمك الثلاثي للبحث عن رصيدك..."
                      value={studentSearchQuery}
                      onChange={(e) => {
                        setStudentSearchQuery(e.target.value);
                        setShowStudentDropdown(true);
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="w-full bg-white text-slate-900 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#fed65b] shadow-inner"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 text-slate-900">
                      {filteredStudents.map(k => (
                        <button
                          key={k.id}
                          onClick={() => handleSelectStudent(k)}
                          className="w-full p-3 text-right hover:bg-amber-50 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#002366] text-[#fed65b] flex items-center justify-center font-black text-xs shrink-0">
                              {k.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-black text-[#002366]">{k.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-bold">{k.familyName} • {k.stageName}</p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs shrink-0 flex items-center gap-1">
                            <span>{k.points}</span>
                            <span>🪙</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {showStudentDropdown && studentSearchQuery.trim() && filteredStudents.length === 0 && (
                    <div className="absolute top-full right-0 left-0 mt-2 bg-white p-3 rounded-2xl shadow-xl text-center text-xs text-slate-600 font-bold z-50">
                      لم يتم العثور على اسم مطابق. تأكد من كتابة الاسم بصورة صحيحة أو راجع خادم فصلك.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#002366] text-white p-4 rounded-2xl border border-[#fed65b]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedStudent.photoUrl ? (
                        <img
                          src={selectedStudent.photoUrl}
                          alt={selectedStudent.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#fed65b] shadow"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#fed65b] text-[#002366] flex items-center justify-center font-black text-base shadow">
                          {selectedStudent.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-tajawal text-base font-black text-white">{selectedStudent.fullName}</p>
                        <p className="text-[11px] text-slate-300 font-bold">{selectedStudent.familyName}</p>
                      </div>
                    </div>

                    <div className="text-center bg-[#fed65b] text-[#002366] px-4 py-2 rounded-2xl shadow-md">
                      <p className="text-[10px] font-black">رصيد الكوبونات</p>
                      <p className="font-tajawal text-2xl font-black flex items-center justify-center gap-1">
                        <span>{selectedStudent.points}</span>
                        <span className="text-sm">🪙</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Filter Controls & Search */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#002366] text-[#fed65b] shadow-md shadow-[#002366]/20 scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث في هدايا المعرض..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002366]"
            />
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#002366] border-t-[#fed65b] rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-[#002366]">جاري تحميل هدايا المعرض الجميلة...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto text-3xl">
              🎁
            </div>
            <h3 className="font-tajawal text-xl font-bold text-[#002366]">لا توجد هدايا مطابقة في هذا القسم</h3>
            <p className="text-xs text-slate-500 font-bold">جرب تغيير التصنيف أو البحث بكلمات أخرى.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => {
              const inCartQty = cart[product.id] || 0;
              const isOutOfStock = product.stock_quantity <= 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    {/* Image Box */}
                    <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600';
                        }}
                      />

                      {/* Category Badge */}
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#002366]/80 backdrop-blur-md text-white font-bold text-[10px] shadow">
                        {product.category}
                      </span>

                      {/* Price Badge */}
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-2xl bg-[#fed65b] text-[#002366] font-black text-xs shadow-lg flex items-center gap-1 border border-white/40">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{product.coupon_price} كوبون</span>
                      </div>

                      {/* Stock status */}
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow ${
                        isOutOfStock 
                          ? 'bg-rose-500 text-white' 
                          : product.stock_quantity <= 5 
                            ? 'bg-amber-500 text-white' 
                            : 'bg-emerald-500 text-white'
                      }`}>
                        {isOutOfStock ? 'نفذت الكمية' : `متاح: ${product.stock_quantity}`}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-tajawal text-base font-black text-[#002366] line-clamp-1 group-hover:text-[#d4af37] transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {product.description || 'هدية وجائزة تشجيعية مباركة من كنيسة السيدة العذراء مريم بمحرم بك.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    {inCartQty > 0 ? (
                      <div className="flex items-center justify-between w-full bg-amber-50 border border-amber-200 rounded-2xl p-1.5">
                        <button
                          onClick={() => updateCartQty(product.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white text-[#002366] shadow flex items-center justify-center font-black hover:bg-slate-100 cursor-pointer active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs text-[#002366] px-2">
                          {inCartQty} في الحقيبة
                        </span>
                        <button
                          onClick={() => updateCartQty(product.id, 1)}
                          disabled={inCartQty >= product.stock_quantity}
                          className="w-8 h-8 rounded-xl bg-[#002366] text-[#fed65b] shadow flex items-center justify-center font-black hover:bg-[#00174a] cursor-pointer active:scale-90 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className="w-full py-2.5 px-4 rounded-2xl bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs transition-all shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isOutOfStock ? 'غير متاح حالياً' : 'أضف لحقيبة الهدايا'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-5 right-4 left-4 sm:right-8 sm:left-8 z-40 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-[#00174a] to-[#002366] text-white p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-[#fed65b] flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up">
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="p-3 bg-[#fed65b] text-[#00174a] rounded-2xl shadow font-black shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <p className="font-tajawal text-base font-black text-white flex items-center gap-2">
                  <span>حقيبة الهدايا: {cartItemCount} عناصر</span>
                  <span className="text-[#fed65b] text-xs">({totalCartCoupons} كوبون)</span>
                </p>
                <p className="text-[11px] text-slate-300 font-bold">
                  {selectedStudent ? (
                    isBalanceSufficient 
                      ? `✅ رصيدك يكفي (المتبقي: ${remainingCoupons} كوبون)`
                      : `⚠️ رصيدك (${studentBalance}) غير كافٍ، ينقصك ${totalCartCoupons - studentBalance} كوبون!`
                  ) : (
                    '👈 اختر اسمك بالأعلى للتحقق من رصيدك وإتمام الاستبدال'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsCartOpen(true)}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-[#fed65b] hover:bg-[#ffe082] text-[#002366] font-black text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>مراجعة واستبدال الهدايا 🎁</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Cart Review & Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 bg-amber-100 text-amber-900 rounded-2xl font-black">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-tajawal text-lg font-black text-[#002366]">مراجعة حقيبة الهدايا</h3>
                  <p className="text-[11px] text-slate-500 font-bold">تأكد من اختياراتك قبل الخصم من رصيد الكوبونات</p>
                </div>
              </div>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Student Info Card */}
            {selectedStudent ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-[#002366]">{selectedStudent.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{selectedStudent.familyName}</p>
                </div>

                <div className="text-center px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                  <span>الرصيد: {selectedStudent.points} 🪙</span>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2">
                <p className="text-xs font-bold text-rose-800">⚠️ لم تختر اسمك بعد!</p>
                <p className="text-[11px] text-slate-600">اختر اسمك من القائمة أعلى الصفحة ليتمكن النظام من فحص رصيد كوبوناتك.</p>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3 divide-y divide-slate-100">
              {Object.entries(cart).map(([pId, qty]) => {
                const item = products.find(p => p.id === pId);
                if (!item) return null;

                return (
                  <div key={pId} className="pt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-black text-[#002366] line-clamp-1">{item.title}</p>
                        <p className="text-[11px] text-[#d4af37] font-bold">{item.coupon_price} كوبون للقطعة</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => updateCartQty(pId, -1)}
                          className="w-6 h-6 bg-white text-slate-700 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-black text-[#002366]">{qty}</span>
                        <button
                          onClick={() => updateCartQty(pId, 1)}
                          disabled={qty >= item.stock_quantity}
                          className="w-6 h-6 bg-[#002366] text-[#fed65b] rounded-lg flex items-center justify-center font-bold text-xs shadow-xs disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(pId)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف من الحقيبة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total & Balance Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs font-bold text-slate-700">
              <div className="flex items-center justify-between">
                <span>إجمالي الكوبونات المطلوبة:</span>
                <span className="font-black text-[#002366] text-sm">{totalCartCoupons} كوبون 🪙</span>
              </div>
              <div className="flex items-center justify-between">
                <span>رصيدك المتاح حالياً:</span>
                <span className="font-black text-amber-800">{studentBalance} كوبون 🪙</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                <span>الرصيد المتبقي بعد الاستبدال:</span>
                <span className={`font-black text-sm ${isBalanceSufficient ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {isBalanceSufficient ? `${remainingCoupons} كوبون 🪙` : 'رصيد غير كافي ❌'}
                </span>
              </div>
            </div>

            {/* Warning if insufficient */}
            {!isBalanceSufficient && selectedStudent && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs font-bold text-rose-800 space-y-1">
                <p className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>عذراً يا بطل! كوبوناتك لا تكفي لإتمام هذا الطلب.</span>
                </p>
                <p className="text-[11px] text-rose-700 font-medium">
                  يرجى تقليل كمية بعض الهدايا حتى يصبح إجمالي الكوبونات أقل من أو يساوي {studentBalance} كوبون.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                onClick={handleConfirmOrder}
                disabled={!selectedStudent || !isBalanceSufficient || isSubmittingOrder || cartItemCount === 0}
                className="flex-2 py-3 rounded-2xl bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs shadow-lg transition-all active:scale-95 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#fed65b] border-t-transparent rounded-full animate-spin" />
                    <span>جاري الخصم وتأكيد الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد واستبدال الكوبونات الآن 🎁</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Order Voucher Modal */}
      {showVoucherModal && completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-[#fed65b] text-center space-y-6 animate-scale-up">
            
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
              🎉
            </div>

            <div className="space-y-1">
              <h3 className="font-tajawal text-2xl font-black text-[#002366]">مبروك يا بطل! 🌟</h3>
              <p className="text-xs text-slate-500 font-bold">تم تسجيل طلب استبدال الهدايا وخصم الكوبونات بنجاح</p>
            </div>

            {/* Voucher Card */}
            <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-5 text-right space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <span className="text-xs font-bold text-amber-900">رقم الإيصال:</span>
                <span className="font-black text-sm text-[#002366]">#{completedOrder.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-amber-200 pb-2 text-xs">
                <span className="text-slate-600 font-bold">اسم المخدوم:</span>
                <span className="font-black text-[#002366]">{completedOrder.student_name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-amber-200 pb-2 text-xs">
                <span className="text-slate-600 font-bold">الكوبونات المخصومة:</span>
                <span className="font-black text-amber-900">{completedOrder.total_coupons} كوبون 🪙</span>
              </div>

              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-black text-[#002366]">الهدايا المطلوبة:</p>
                {completedOrder.items.map((i, idx) => (
                  <p key={idx} className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                    <span>• {i.title}</span>
                    <span className="text-amber-800">(×{i.quantity})</span>
                  </p>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-600 font-bold leading-relaxed bg-blue-50 p-3 rounded-xl border border-blue-100">
              ⛪ تم إرسال طلبك لخادم الفصل، وسوف تستلم هداياك الرائعة في يوم الخدمة القادم بالكنيسة!
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <a
                href={getWhatsAppShareUrl(completedOrder)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>إرسال إيصال الهدية للخادم عبر WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setShowVoucherModal(false);
                  setCompletedOrder(null);
                }}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق والعودة للمعرض
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
