import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Award, Cross, Heart, Sparkles, BookOpen, Shield, RefreshCw } from 'lucide-react';
import { api, type Priest, parseImageTransform } from '../../lib/api';
import { SEO } from '../../components/common/SEO';

export const PriestsPage: React.FC = () => {
  const [priests, setPriests] = useState<Priest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'reposed' | 'martyr'>('all');

  const defaultPriests: Priest[] = [
    {
      id: 'default-1',
      name: 'القمص يوسف مجلى',
      status: 'reposed',
      bio: 'من الرعاة الأوائل الذين خدموا الكنيسة في البدايات.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 0, created_at: '', updated_at: ''
    },
    {
      id: 'default-2',
      name: 'القمص فيلبس بطرس',
      status: 'reposed',
      bio: 'أحد الآباء الرعاة الأفاضل الذين تركوا بصمة روحية في الحي.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 1, created_at: '', updated_at: ''
    },
    {
      id: 'default-3',
      name: 'القمص أنطوان عبد الملك',
      status: 'reposed',
      bio: 'نُقل لاحقاً إلى القاهرة راعياً لكنيسة مار يوحنا بحلمية الزيتون.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 2, created_at: '', updated_at: ''
    },
    {
      id: 'default-4',
      name: 'القمص أرمانيوس البراموسى',
      status: 'reposed',
      bio: 'تنيح لاحقاً باسم "نيافة الحبر الجليل الأنبا مكاريوس أسقف دير البراموس".',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 3, created_at: '', updated_at: ''
    },
    {
      id: 'default-5',
      name: 'القمص غبريال البراموسى',
      status: 'reposed',
      bio: 'من الخدام والآباء الأجلاء الذين خدموا مذبح الكنيسة بكل تقوى.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 4, created_at: '', updated_at: ''
    },
    {
      id: 'default-6',
      name: 'القمص مرقس باسيليوس',
      status: 'reposed',
      bio: 'أول كاهن رُسم على مذبح الكنيسة. رُقي قمصاً عام ١٩٤٦م، ورقد في الرب في ٧ مارس ١٩٨٢م وبُني له مزار خاص بالكنيسة يُزار حتى اليوم.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: '/history_15.jpg', ordained_date: '٧ مارس ١٩٤٣م', reposed_date: '٧ مارس ١٩٨٢م', sort_order: 5, created_at: '', updated_at: ''
    },
    {
      id: 'default-7',
      name: 'القمص أسحق إبراهيم',
      status: 'reposed',
      bio: 'نُقل للخدمة في كنيستنا قادماً من كنيسة الشهيد العظيم مارجرجس بغيط العنب.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 6, created_at: '', updated_at: ''
    },
    {
      id: 'default-8',
      name: 'القمص عبد المسيح مقار',
      status: 'reposed',
      bio: 'نُقل للخدمة في كنيستنا قادماً من كنيسة السيدة العذراء مريم بغيط العنب.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 7, created_at: '', updated_at: ''
    },
    {
      id: 'default-9',
      name: 'القمص ميخائيل سعد',
      status: 'reposed',
      bio: 'خدم مذبح الكنيسة بأمانة، ثم خدم كراعي كنيسة السيدة العذراء والقديس يوسف بسموحة.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 8, created_at: '', updated_at: ''
    },
    {
      id: 'default-10',
      name: 'القس صموئيل عبده',
      status: 'reposed',
      bio: 'خدم بالكنيسة ونُقل قادماً من كنيسة العذراء مريم بالمستشفى القبطي.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: null, reposed_date: null, sort_order: 9, created_at: '', updated_at: ''
    },
    {
      id: 'default-11',
      name: 'القمص مكسيموس وصفى',
      status: 'reposed',
      bio: 'راعٍ جليل خدم الكنيسة لعقود طويلة بغيرة رسولية تنيح في ٢٣ ديسمبر ٢٠٢٣م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '١ أكتوبر ١٩٧١م', reposed_date: '٢٣ ديسمبر ٢٠٢٣م', sort_order: 10, created_at: '', updated_at: ''
    },
    {
      id: 'default-12',
      name: 'القس دوماديوس حنا',
      status: 'reposed',
      bio: 'كاهن تقي خدم مذبح الكنيسة والتعليم بكل محبة وتفانٍ حتى رقد في الرب.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '٢٧ يناير ١٩٧٤م', reposed_date: '٤ نوفمبر ٢٠٢١م', sort_order: 11, created_at: '', updated_at: ''
    },
    {
      id: 'default-13',
      name: 'القس موسى شنودة',
      status: 'reposed',
      bio: 'رُسم على مذبح الكنيسة وتنيح في ٢٣ أغسطس ٢٠٠٦م بعد مسيرة حافلة بالخدمة.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '١ مارس ١٩٨٧م', reposed_date: '٢٣ أغسطس ٢٠٠٦م', sort_order: 12, created_at: '', updated_at: ''
    },
    {
      id: 'default-14',
      name: 'القس مرقس ميلاد',
      status: 'active',
      bio: 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ١٦ يونيو ١٩٩٥م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '١٦ يونيو ١٩٩٥م', reposed_date: null, sort_order: 13, created_at: '', updated_at: ''
    },
    {
      id: 'default-15',
      name: 'القس أرسانيوس وديد',
      status: 'martyr',
      bio: 'رُسم لخدمة منطقة كرموز في ١٦ يونيو ١٩٩٥م، ونال إكليل الشهادة المبارك في ٧ أبريل ٢٠٢٢م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '١٦ يونيو ١٩٩٥م', reposed_date: '٧ أبريل ٢٠٢٢م', sort_order: 14, created_at: '', updated_at: ''
    },
    {
      id: 'default-16',
      name: 'القس بيشوى ثابت',
      status: 'active',
      bio: 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٦ مايو ٢٠٠٧م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '٦ مايو ٢٠٠٧م', reposed_date: null, sort_order: 15, created_at: '', updated_at: ''
    },
    {
      id: 'default-17',
      name: 'القس مينا نادر',
      status: 'active',
      bio: 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٩ نوفمبر ٢٠١٣م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '٩ نوفمبر ٢٠١٣م', reposed_date: null, sort_order: 16, created_at: '', updated_at: ''
    },
    {
      id: 'default-18',
      name: 'القس ميخائيل ميخائيل',
      status: 'active',
      bio: 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٤ يوليو ٢٠١٥م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '٤ يوليو ٢٠١٥م', reposed_date: null, sort_order: 17, created_at: '', updated_at: ''
    },
    {
      id: 'default-19',
      name: 'القس كيرلس ميلاد',
      status: 'active',
      bio: 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٤ يوليو ٢٠٢٤م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '٤ يوليو ٢٠٢٤م', reposed_date: null, sort_order: 18, created_at: '', updated_at: ''
    },
    {
      id: 'default-20',
      name: 'القس موسى وجيه',
      status: 'active',
      bio: 'كاهن الكنيسة الحالي، رُسم على مذبح الكنيسة في ٤ نوفمبر ٢٠٢٥م.',
      title: 'كاهن كنيسة السيدة العذراء',
      image_url: null, ordained_date: '٤ نوفمبر ٢٠٢٥م', reposed_date: null, sort_order: 19, created_at: '', updated_at: ''
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await api.getPriests();
      if (data && data.length > 0) {
        setPriests(data);
      } else {
        setPriests(defaultPriests);
      }
    } catch (err) {
      console.error('Error fetching dynamic priests:', err);
      setPriests(defaultPriests);
    } finally {
      setLoading(false);
    }
  };

  const filteredPriests = priests.filter(p => {
    if (filter === 'active') return p.status === 'active';
    if (filter === 'reposed') return p.status === 'reposed';
    if (filter === 'martyr') return p.status === 'martyr';
    return true;
  });

  const getAvatarPlaceholder = (priest: Priest) => {
    if (priest.status === 'martyr') {
      return (
        <div className="w-full h-full bg-[#fed65b]/10 text-[#d4af37] flex items-center justify-center relative">
          <Shield className="w-10 h-10" />
          <Cross className="w-4 h-4 text-red-600 absolute top-[44%]" />
        </div>
      );
    }
    if (priest.status === 'reposed') {
      return (
        <div className="w-full h-full bg-slate-100 text-slate-400 flex items-center justify-center">
          <Cross className="w-8 h-8" />
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-[#002366]/5 text-[#002366] flex items-center justify-center">
        <Award className="w-10 h-10" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-cairo">
      <SEO 
        title="الآباء الكهنة ومذبح الكنيسة | كنيسة السيدة العذراء بمحرم بك بالإسكندرية"
        description="سيرة وبيانات الآباء الكهنة الأجلاء مكرسي ومخدومي مذبح كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية، الكهنة الحاليين والراحلين وشهداء الكنيسة الأبرار."
        keywords={[
          'كهنة كنيسة العذراء محرم بك',
          'اباء كنيسة العذراء محرم بك',
          'القمص يوسف مجلى',
          'كهنة اسكندرية الاقباط الارثوذكس',
          'كهنة محرم بك'
        ]}
        canonicalUrl="https://stmary-moharambek-digitalhub.org/about/priests"
      />
      {/* Header Banner */}
      <section className="relative py-16 bg-[#00113a] text-white overflow-hidden border-b-4 border-[#d4af37]">
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-20" 
          style={{ backgroundImage: "url('/church.jpeg')", backgroundPosition: "center bottom" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] via-[#00113a]/80 to-[#00113a] z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 text-center space-y-4">
          <Link 
            to="/about"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-[#fed65b] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            <span>الرجوع لصفحة عن الكنيسة</span>
          </Link>
          <h1 className="font-tajawal text-3xl sm:text-5xl font-extrabold tracking-tight">
            الآباء كهنة الكنيسة الأجلاء
            <span className="block text-[#fed65b] text-xl sm:text-2xl mt-3 font-bold">بمحرم بك - الإسكندرية</span>
          </h1>
          <p className="text-slate-350 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
            "أَطِيعُوا مُرْشِدِيكُمْ وَاخْضَعُوا، لأَنَّهُمْ يَسْهَرُونَ لأَجْلِ نُفُوسِكُمْ." سيرة عطرة للآباء الرعاة الأجلاء الذين خدموا رعية المسيح بكل أمانة.
          </p>
        </div>
      </section>

      {/* Main Grid & Filters */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white/60 p-2.5 rounded-2xl border border-slate-200/80 max-w-md mx-auto shadow-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-[#002366] text-white shadow' : 'text-slate-650 hover:bg-slate-100'}`}
          >
            الكل ({priests.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'active' ? 'bg-emerald-650 text-white shadow' : 'text-slate-650 hover:bg-slate-100'}`}
          >
            الحاليون ({priests.filter(p => p.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('reposed')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'reposed' ? 'bg-slate-600 text-white shadow' : 'text-slate-650 hover:bg-slate-100'}`}
          >
            الراحلون ({priests.filter(p => p.status === 'reposed').length})
          </button>
          <button
            onClick={() => setFilter('martyr')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'martyr' ? 'bg-rose-650 text-white shadow' : 'text-slate-650 hover:bg-slate-100'}`}
          >
            الشهداء ({priests.filter(p => p.status === 'martyr').length})
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold space-y-3">
            <RefreshCw className="w-8 h-8 text-[#002366] animate-spin mx-auto" />
            <p>جاري تحميل قائمة الآباء الكهنة...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPriests.map((priest, idx) => {
              const { convertedUrl, styles } = parseImageTransform(priest.image_url);
              return (
                <div 
                  key={priest.id} 
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-6 text-right">
                    {/* Photo Profile */}
                    <div className="h-64 w-full bg-slate-100 rounded-2xl overflow-hidden relative shadow border border-slate-200">
                      {convertedUrl ? (
                        <img 
                          src={convertedUrl} 
                          alt={priest.name} 
                          className="w-full h-full object-cover transition-transform duration-300"
                          style={{ objectPosition: styles.objectPosition, transform: styles.transform }}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625361-155de0cbb55a?w=800';
                          }}
                        />
                      ) : (
                        getAvatarPlaceholder(priest)
                      )}

                      {/* Status Badge */}
                      <span className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full shadow border backdrop-blur-md ${
                        priest.status === 'active' ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200' :
                        priest.status === 'martyr' ? 'bg-rose-100/90 text-rose-800 border-rose-200' :
                        'bg-slate-100/90 text-slate-700 border-slate-300'
                      }`}>
                        {priest.status === 'active' ? 'كاهن حالي' :
                         priest.status === 'martyr' ? 'شهيد الكنيسة' : 'متنيح في الرب'}
                      </span>
                    </div>

                  <div className="space-y-2">
                    <h3 className="font-tajawal text-xl font-extrabold text-[#002366] leading-tight">
                      {priest.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold leading-normal">
                      {priest.title || 'كاهن مذبح كنيسة العذراء مريم بمحرم بك'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold pt-2">
                      {priest.ordained_date && (
                        <span className="bg-[#002366]/5 text-[#002366] px-2.5 py-1 rounded-md border border-[#002366]/10 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          الرسامة: {priest.ordained_date}
                        </span>
                      )}
                      {priest.reposed_date && (
                        <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md border border-rose-100 flex items-center gap-1">
                          <Cross className="w-3.5 h-3.5" />
                          الرحيل: {priest.reposed_date}
                        </span>
                      )}
                    </div>
                  </div>

                  {priest.bio && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-3 border-t border-slate-100/80">
                      {priest.bio}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>كنيسة العذراء بمحرم بك</span>
                  <Cross className="w-4 h-4 text-slate-350" />
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>
    </div>
  );
};
