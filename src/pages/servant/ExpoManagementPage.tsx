import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/common/DashboardLayout';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Share2, 
  Copy, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Coins, 
  Filter, 
  FileSpreadsheet, 
  Printer, 
  QrCode, 
  Package, 
  MessageCircle, 
  User, 
  Sparkles,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  Eye,
  Info
} from 'lucide-react';
import { api, type ExpoProduct, type ExpoOrder, type ExpoOrderItem, type UserRole } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/common/Toast';
import { uploadAnnouncementImage } from '../../lib/fileUpload';

const PRESET_PRODUCT_IMAGES = [
  { label: 'كتاب مقدس مصور', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600' },
  { label: 'صليب خشب زيتون', url: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&q=80&w=600' },
  { label: 'أدوات وألوان مدرسية', url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600' },
  { label: 'ألعاب وبازل', url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&q=80&w=600' },
  { label: 'ميداليات وأيقونات', url: 'https://images.unsplash.com/photo-1601342630310-85f0962453c9?auto=format&fit=crop&q=80&w=600' },
  { label: 'كأس ودرع تكريم', url: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&q=80&w=600' },
];

export const ExpoManagementPage: React.FC = () => {
  const { profile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'share'>('products');
  const [products, setProducts] = useState<ExpoProduct[]>([]);
  const [orders, setOrders] = useState<ExpoOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('all');

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExpoProduct | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<number>(50);
  const [prodStock, setProdStock] = useState<number>(20);
  const [prodCategory, setProdCategory] = useState<string>('ألعاب وهدايا');
  const [prodStage, setProdStage] = useState<string>('الكل');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  // Order Details Modal
  const [viewingOrder, setViewingOrder] = useState<ExpoOrder | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pList, oList] = await Promise.all([
        api.getExpoProducts(),
        api.getExpoOrders()
      ]);
      setProducts(pList);
      setOrders(oList);
    } catch (err) {
      console.error('Failed to load expo data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Create / Edit Product Modal
  const handleOpenProductModal = (product?: ExpoProduct) => {
    if (product) {
      setEditingProduct(product);
      setProdTitle(product.title);
      setProdDesc(product.description || '');
      setProdPrice(product.coupon_price);
      setProdStock(product.stock_quantity);
      setProdCategory(product.category);
      setProdStage(product.stage || 'الكل');
      setProdImageUrl(product.image_url);
      setProdIsActive(product.is_active);
    } else {
      setEditingProduct(null);
      setProdTitle('');
      setProdDesc('');
      setProdPrice(50);
      setProdStock(20);
      setProdCategory('ألعاب وهدايا');
      setProdStage('الكل');
      setProdImageUrl(PRESET_PRODUCT_IMAGES[0].url);
      setProdIsActive(true);
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) {
      toast.error('يرجى إدخال اسم الهدية / المنتج');
      return;
    }
    if (prodPrice <= 0) {
      toast.error('يرجى تحديد سعر الكوبونات بشكل صحيح');
      return;
    }

    setSavingProduct(true);
    try {
      const newProduct: ExpoProduct = {
        id: editingProduct ? editingProduct.id : 'exp_' + Date.now(),
        title: prodTitle.trim(),
        description: prodDesc.trim(),
        coupon_price: Number(prodPrice),
        stock_quantity: Number(prodStock),
        category: prodCategory,
        stage: prodStage,
        image_url: prodImageUrl.trim() || PRESET_PRODUCT_IMAGES[0].url,
        is_active: prodIsActive,
        created_at: editingProduct ? editingProduct.created_at : new Date().toISOString(),
        created_by: profile?.full_name || 'خادم'
      };

      await api.saveExpoProduct(newProduct);
      toast.success(editingProduct ? 'تم تعديل المنتج بنجاح' : 'تمت إضافة الهدية للمعرض بنجاح ✨');
      setShowProductModal(false);
      await fetchData();
    } catch (err: any) {
      toast.error('فشل حفظ المنتج: ' + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الهدية من المعرض؟')) return;
    try {
      await api.deleteExpoProduct(id);
      toast.success('تم حذف الهدية من المعرض');
      await fetchData();
    } catch (err: any) {
      toast.error('فشل الحذف: ' + err.message);
    }
  };

  // Orders Actions
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'delivered' | 'cancelled') => {
    try {
      await api.updateExpoOrderStatus(orderId, newStatus);
      toast.success(
        newStatus === 'delivered' 
          ? 'تم تأكيد تسليم الهدية للولد بنجاح 🎉' 
          : newStatus === 'cancelled' 
            ? 'تم إلغاء الطلب' 
            : 'تم تغيير الحالة إلى قيد التجهيز'
      );
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (viewingOrder && viewingOrder.id === orderId) {
        setViewingOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast.error('فشل تحديث حالة الطلب: ' + err.message);
    }
  };

  // Export Orders to Excel CSV
  const handleExportOrdersCSV = () => {
    if (orders.length === 0) {
      toast.error('لا توجد طلبات لتصديرها');
      return;
    }

    const headers = ['رقم الطلب', 'اسم المخدوم', 'المرحلة / الفصل', 'الهاتف', 'الهدايا المطلوبة', 'إجمالي الكوبونات', 'الحالة', 'تاريخ الطلب'];
    const rows = orders.map(o => [
      `#${o.id}`,
      `"${o.student_name}"`,
      `"${o.stage || o.family_name || ''}"`,
      `"${o.student_phone || ''}"`,
      `"${o.items.map(i => `${i.title} (${i.quantity})`).join(' + ')}"`,
      o.total_coupons,
      o.status === 'delivered' ? 'تم التسليم' : o.status === 'cancelled' ? 'ملغي' : 'قيد التجهيز',
      `"${new Date(o.created_at).toLocaleDateString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `كشف_طلبات_معرض_الكوبونات_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير كشف طلبات المعرض بنجاح إلى Excel 📊');
  };

  // Public Store Link
  const publicStoreUrl = `${window.location.origin}/store`;

  const copyStoreLink = (customUrl?: string | React.MouseEvent) => {
    const urlToCopy = typeof customUrl === 'string' ? customUrl : publicStoreUrl;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(urlToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = urlToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('تم نسخ رابط المعرض المباشر للمخدومين بنجاح! 📋');
    } catch (err) {
      toast.error('يرجى نسخ الرابط يدوياً من الشاشة');
    }
  };

  const getShareWhatsAppMessage = () => {
    const text = `🎉 *معرض هدايا وجوائز مدارس الأحد* ⛪✨
كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية

🎁 يا أبطال مدارس الأحد، دلوقتي تقدروا تدخلوا على معرض الكنيسة وتشوفوا كل الهدايا والكتب والألعاب وتستبدلوا كوبوناتكم فوراً!

🔗 *ادخل على المعرض من الرابط ده واكتب اسمك:*
${publicStoreUrl}

🪙 شجعوا أولادكم على القداسات وحفظ الآيات للحصول على مزيد من الكوبونات! 🌟`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Categories
  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'الكل' || p.category === selectedCategory;
    const matchesSearch = productSearch.trim() === '' || 
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(productSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredOrders = orders.filter(o => {
    const matchesStatus = selectedOrderStatus === 'all' || o.status === selectedOrderStatus;
    const matchesSearch = orderSearch.trim() === '' || 
      o.student_name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.stage || '').toLowerCase().includes(orderSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Stats
  const totalStockCount = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'delivered').length;
  const totalCouponsExchanged = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_coupons, 0);

  return (
    <DashboardLayout role={(profile?.role as UserRole) || 'servant'}>
      <div className="space-y-8 font-cairo text-right" dir="rtl">

        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#002366] text-[#fed65b] rounded-2xl shadow-md">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-tajawal text-2xl sm:text-3xl font-extrabold text-[#002366] tracking-wide">
                إدارة المعرض ومتجر هدايا الكوبونات 🎁
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                إضافة الهدايا والجوائز، تحديد أسعار الكوبونات، واستقبال ومتابعة تسليم طلبات الأولاد
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2.5 bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة هدية جديدة</span>
            </button>

            <button
              onClick={copyStoreLink}
              className="px-4 py-2.5 bg-[#fed65b] hover:bg-[#ffe082] text-[#002366] font-black text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>نسخ رابط المعرض للأولاد</span>
            </button>

            <a
              href={publicStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              title="فتح صفحة المعرض العامة"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-[11px] font-black text-slate-400">إجمالي الهدايا بالمعرض</span>
            <p className="font-tajawal text-2xl font-black text-[#002366]">{products.length} منتج</p>
            <p className="text-[10px] text-slate-500 font-bold">المخزون المتاح: {totalStockCount} قطعة</p>
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2">
            <span className="text-[11px] font-black text-amber-800">طلبات قيد التجهيز والتسليم</span>
            <p className="font-tajawal text-2xl font-black text-amber-900">{pendingOrdersCount} طلب ⏳</p>
            <p className="text-[10px] text-amber-700 font-bold">تتطلب التجهيز والتسليم للولد</p>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2">
            <span className="text-[11px] font-black text-emerald-800">طلبات تم تسليمها بنجاح</span>
            <p className="font-tajawal text-2xl font-black text-emerald-900">{deliveredOrdersCount} طلب ✅</p>
            <p className="text-[10px] text-emerald-700 font-bold">تم استلامها في الكنيسة</p>
          </div>

          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm space-y-2">
            <span className="text-[11px] font-black text-blue-800">إجمالي الكوبونات المستبدلة</span>
            <p className="font-tajawal text-2xl font-black text-blue-900">{totalCouponsExchanged} 🪙</p>
            <p className="text-[10px] text-blue-700 font-bold">تم خصمها من رصيد الأولاد</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>منتجات المعرض والمخزون ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'orders'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل طلبات الشراء ({orders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'share'
                ? 'bg-[#002366] text-[#fed65b] shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة الرابط والواتساب</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS CATALOG & STOCK */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#002366] text-[#fed65b] shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث في المنتجات..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                />
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#002366] text-[#fed65b] font-black">
                    <tr>
                      <th className="p-4">الهدية / المنتج</th>
                      <th className="p-4">القسم / التصنيف</th>
                      <th className="p-4">السعر بالكوبونات</th>
                      <th className="p-4">الكمية بالمخزون</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-black text-[#002366] text-xs">{p.title}</p>
                            <p className="text-[10px] text-slate-400 line-clamp-1">{p.description || 'لا يوجد وصف'}</p>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                            {p.category}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center gap-1 w-max">
                            <span>{p.coupon_price}</span>
                            <span>🪙</span>
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            p.stock_quantity <= 0 
                              ? 'bg-rose-100 text-rose-800' 
                              : p.stock_quantity <= 5 
                                ? 'bg-amber-100 text-amber-900' 
                                : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {p.stock_quantity} قطعة
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {p.is_active ? 'معروض للبيع ✅' : 'مخفي ⛔'}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenProductModal(p)}
                              className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              title="تعديل المنتج"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="حذف المنتج"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS & REDEMPTIONS LOG */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter & Export Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedOrderStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrderStatus === 'all' ? 'bg-[#002366] text-[#fed65b]' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  جميع الطلبات ({orders.length})
                </button>

                <button
                  onClick={() => setSelectedOrderStatus('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrderStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  قيد التجهيز ({pendingOrdersCount})
                </button>

                <button
                  onClick={() => setSelectedOrderStatus('delivered')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedOrderStatus === 'delivered' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  تم التسليم ({deliveredOrdersCount})
                </button>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ابحث باسم المخدوم أو الكود..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                  />
                </div>

                <button
                  onClick={handleExportOrdersCSV}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="تصدير كشف استلامات الهدايا Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">تصدير Excel</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#002366] text-[#fed65b] font-black">
                    <tr>
                      <th className="p-4">كود الطلب</th>
                      <th className="p-4">اسم المخدوم</th>
                      <th className="p-4">المرحلة / الفصل</th>
                      <th className="p-4">الهدايا المطلوبة</th>
                      <th className="p-4">الكوبونات المخصومة</th>
                      <th className="p-4">تاريخ الطلب</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                          لا توجد طلبات استبدال مطابقة حالياً
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-black text-[#002366] bg-slate-100 px-2 py-1 rounded-lg">
                              #{order.id}
                            </span>
                          </td>

                          <td className="p-4">
                            <p className="font-black text-[#002366] text-xs">{order.student_name}</p>
                            {order.student_phone && (
                              <p className="text-[10px] text-slate-400 font-mono">{order.student_phone}</p>
                            )}
                          </td>

                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px]">
                              {order.stage || order.family_name || 'مدارس الأحد'}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="space-y-0.5">
                              {order.items.map((i, idx) => (
                                <p key={idx} className="text-[11px] text-slate-800 flex items-center gap-1">
                                  <span>• {i.title}</span>
                                  <span className="text-[#d4af37] font-black">(×{i.quantity})</span>
                                </p>
                              ))}
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs">
                              {order.total_coupons} 🪙
                            </span>
                          </td>

                          <td className="p-4 text-[11px] text-slate-500">
                            {new Date(order.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>

                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border focus:outline-none cursor-pointer ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  : order.status === 'cancelled'
                                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                                    : 'bg-amber-50 border-amber-300 text-amber-800'
                              }`}
                            >
                              <option value="pending">⏳ قيد التجهيز</option>
                              <option value="delivered">✅ تم التسليم للولد</option>
                              <option value="cancelled">❌ ملغي</option>
                            </select>
                          </td>

                          <td className="p-4 text-center">
                            <button
                              onClick={() => setViewingOrder(order)}
                              className="p-2 rounded-xl bg-[#002366]/10 text-[#002366] hover:bg-[#002366]/20 transition-colors"
                              title="عرض تفاصيل الإيصال"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SHARE STORE & QR CODE */}
        {activeTab === 'share' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
                🎁
              </div>
              <h3 className="font-tajawal text-xl font-black text-[#002366]">مشاركة رابط المعرض مع المخدومين</h3>
              <p className="text-xs text-slate-500 font-bold">
                شارك الرابط في جروبات واتساب فصول مدارس الأحد ليتمكن الأولاد من الدخول واستبدال كوبوناتهم
              </p>
            </div>

            {/* Direct Link Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-black text-slate-700">رابط المعرض المباشر:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicStoreUrl}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-800 text-left"
                  dir="ltr"
                />
                <button
                  onClick={copyStoreLink}
                  className="px-4 py-2.5 bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>نسخ</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Share Box */}
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>رسالة واتساب الجاهزة للإرسال:</span>
                </span>
                
                <a
                  href={getShareWhatsAppMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <span>إرسال عبر WhatsApp 📲</span>
                </a>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-slate-700 font-bold whitespace-pre-line leading-relaxed">
                {`🎉 *معرض هدايا وجوائز مدارس الأحد* ⛪✨
كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية

🎁 يا أبطال مدارس الأحد، دلوقتي تقدروا تدخلوا على معرض الكنيسة وتشوفوا كل الهدايا والكتب والألعاب وتستبدلوا كوبوناتكم فوراً!

🔗 *ادخل على المعرض من الرابط ده واكتب اسمك:*
${publicStoreUrl}

🪙 شجعوا أولادكم على القداسات وحفظ الآيات للحصول على مزيد من الكوبونات! 🌟`}
              </div>
            </div>

          </div>
        )}

        {/* Product Modal (Create / Edit) */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-tajawal text-lg font-black text-[#002366]">
                  {editingProduct ? 'تعديل هدية في المعرض' : 'إضافة هدية جديدة للمعرض 🎁'}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-bold text-slate-700">
                <div>
                  <label className="block mb-1 font-black text-[#002366]">اسم الهدية / المنتج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كتاب مقدس مصور، صليب خشب، بازل..."
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                  />
                </div>

                <div>
                  <label className="block mb-1">وصف مختصر للهدية</label>
                  <textarea
                    rows={2}
                    placeholder="تفاصيل عن الهدية ومواصفاتها..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-black text-[#002366]">السعر بالكوبونات 🪙 *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={prodPrice}
                      onChange={(e) => setProdPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">الكمية المتاحة بالمخزون *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={prodStock}
                      onChange={(e) => setProdStock(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">القسم / التصنيف</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                    >
                      <option value="كتب وقصص">كتب وقصص</option>
                      <option value="بركات كنسية">بركات كنسية</option>
                      <option value="أدوات مدرسية">أدوات مدرسية</option>
                      <option value="ألعاب وهدايا">ألعاب وهدايا</option>
                      <option value="تكريم وجوائز">تكريم وجوائز</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">المرحلة المخصصة لها</label>
                    <select
                      value={prodStage}
                      onChange={(e) => setProdStage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002366]"
                    >
                      <option value="الكل">متاح لجميع المراحل</option>
                      <option value="ابتدائي بنين">ابتدائي بنين</option>
                      <option value="ابتدائي بنات">ابتدائي بنات</option>
                      <option value="فتيان إعدادي">فتيان إعدادي</option>
                      <option value="فتيات إعدادي">فتيات إعدادي</option>
                    </select>
                  </div>
                </div>

                {/* Preset Image Picker */}
                <div>
                  <label className="block mb-1">اختر صورة سريعة جاهزة أو اكتب رابط الصورة:</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {PRESET_PRODUCT_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProdImageUrl(preset.url)}
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          prodImageUrl === preset.url ? 'border-[#002366] bg-amber-50 ring-2 ring-[#fed65b]' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded-lg mb-1" />
                        <span className="text-[10px] line-clamp-1">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  <input
                    type="url"
                    placeholder="أو الصق رابط صورة مخصص (URL)..."
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="prodActive"
                    checked={prodIsActive}
                    onChange={(e) => setProdIsActive(e.target.checked)}
                    className="accent-[#002366] rounded cursor-pointer"
                  />
                  <label htmlFor="prodActive" className="cursor-pointer">تفعيل وعرض المنتج في المعرض للأولاد</label>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="flex-2 py-2.5 rounded-xl bg-[#002366] hover:bg-[#00174a] text-[#fed65b] font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {savingProduct ? 'جاري الحفظ...' : editingProduct ? 'حفظ التعديلات' : 'إضافة الهدية للمعرض'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Order Details Voucher Modal */}
        {viewingOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-tajawal text-base font-black text-[#002366]">إيصال طلب #{viewingOrder.id}</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(viewingOrder.created_at).toLocaleString('ar-EG')}</p>
                </div>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-bold text-slate-700">
                <div className="flex justify-between">
                  <span>اسم المخدوم:</span>
                  <span className="font-black text-[#002366]">{viewingOrder.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>المرحلة / الفصل:</span>
                  <span>{viewingOrder.stage || viewingOrder.family_name || 'مدارس الأحد'}</span>
                </div>
                <div className="flex justify-between">
                  <span>الكوبونات المخصومة:</span>
                  <span className="font-black text-amber-900">{viewingOrder.total_coupons} 🪙</span>
                </div>
                <div className="flex justify-between">
                  <span>الحالة الحالية:</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                    viewingOrder.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {viewingOrder.status === 'delivered' ? 'تم التسليم' : viewingOrder.status === 'cancelled' ? 'ملغي' : 'قيد التجهيز'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black text-[#002366]">قائمة الهدايا المطلوبة:</p>
                <div className="space-y-2 divide-y divide-slate-100">
                  {viewingOrder.items.map((i, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        {i.image_url && <img src={i.image_url} alt={i.title} className="w-8 h-8 rounded-lg object-cover" />}
                        <span className="font-bold text-slate-800">{i.title}</span>
                      </div>
                      <span className="font-black text-[#002366]">{i.coupon_price} × {i.quantity} كوبون</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                {viewingOrder.status !== 'delivered' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(viewingOrder.id, 'delivered')}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>تأكيد تسليم الهدية للولد</span>
                  </button>
                )}

                <button
                  onClick={() => setViewingOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};
