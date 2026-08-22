import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BookOpen, Users, Calendar, ArrowLeft, Cross, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export const AboutPage: React.FC = () => {
  const [cards, setCards] = useState<any[]>([
    {
      title: 'تاريخ الكنيسة',
      description: 'رحلة عمرها يقارب القرن من الزمان، تروي قصة شراء الأرض، وضع حجر الأساس، وتأسيس وتدشين هذا الصرح الروحي العظيم.',
      image: '/history_1.jpg',
      link: '/about/history',
      badge: 'القرن الماضي'
    },
    {
      title: 'الآباء كهنة الكنيسة',
      description: 'تعرف على سير وتاريخ الآباء الأجلاء والخدام الرعاة الذين تعاقبوا على مذبح الكنيسة وخدموا شعبها بكل أمانة وإخلاص.',
      image: '/history_15.jpg',
      link: '/about/priests',
      badge: 'الرعاية الروحية'
    },
    {
      title: 'أيام فى ذاكرة الكنيسة',
      description: 'محطات تاريخية وأحداث خالدة لا تُنسى؛ من وضع حجر الأساس إلى الزيارات البابوية المباركة للآباء البطاركة الأجلاء.',
      image: '/history_6.jpg',
      link: '/about/memory',
      badge: 'محطات خالدة'
    }
  ]);

  useEffect(() => {
    const fetchAboutPageData = async () => {
      try {
        const page = await api.getCustomPageBySlug('about');
        if (page) {
          const sectionsData = await api.getPageSections(page.id);
          const cardsGrid = sectionsData.find(s => s.section_type === 'cards_grid');
          if (cardsGrid && cardsGrid.items && cardsGrid.items.length > 0) {
            setCards(cardsGrid.items.map((item: any, idx: number) => ({
              title: item.title,
              description: item.desc,
              image: item.image,
              link: item.link,
              badge: idx === 0 ? 'القرن الماضي' : idx === 1 ? 'الرعاية الروحية' : 'محطات خالدة'
            })));
          }
        }
      } catch (err) {
        console.error('Error loading dynamic about cards:', err);
      }
    };
    fetchAboutPageData();
  }, []);

  const getIcon = (idx: number) => {
    if (idx === 0) return <BookOpen className="w-8 h-8 text-amber-700" />;
    if (idx === 1) return <Users className="w-8 h-8 text-blue-700" />;
    return <Calendar className="w-8 h-8 text-emerald-700" />;
  };

  const getBgGradient = (idx: number) => {
    if (idx === 0) return 'from-amber-50/40 to-amber-100/20 border-amber-200/60 text-slate-800';
    if (idx === 1) return 'from-blue-50/40 to-blue-100/20 border-blue-200/60 text-slate-800';
    return 'from-emerald-50/40 to-emerald-100/20 border-emerald-200/60 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-cairo">
      <Helmet>
        <title>نبذة تاريخية ورعوية - كنيسة السيدة العذراء مريم بمحرم بك | الأقباط الأرثوذكس</title>
        <meta name="description" content="تاريخ كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية، معرّف بآباء ومجمع كهنة الكنيسة عبر العصور والزيارات البابوية المباركة." />
        <meta name="keywords" content="تاريخ كنيسة محرم بك, كهنة العذراء محرم بك, الأقباط الأرثوذكس بالإسكندرية" />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>
      {/* Top Banner */}
      <section className="relative py-20 bg-[#00113a] text-white overflow-hidden border-b-4 border-[#d4af37]">
        {/* Background Image with opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-20" 
          style={{ backgroundImage: "url('/church.jpeg')", backgroundPosition: "center bottom" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] via-[#00113a]/80 to-[#00113a] z-10" />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#d4af37]/25 border border-[#fed65b]/30 text-[#fed65b] text-xs font-bold px-4 py-1.5 rounded-full shadow-inner">
            <Sparkles className="w-4 h-4" />
            <span>نبذة تاريخية ورعوية</span>
          </div>
          <h1 className="font-tajawal text-3xl sm:text-5xl font-extrabold tracking-tight">
            عن كنيسة السيدة العذراء مريم
            <span className="block text-[#fed65b] text-xl sm:text-2xl mt-3 font-bold">بمحرم بك - الإسكندرية</span>
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed font-semibold">
            منارة روحيّة وتاريخية عريقة تأسست ببركة ورعاية الآباء البطاركة والكهنة الأجلاء لتخدم الأجيال المتعاقبة.
          </p>
        </div>
      </section>

      {/* Main Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <Link 
              key={idx} 
              to={card.link}
              className={`group flex flex-col justify-between h-[360px] rounded-3xl p-8 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-2 border ${
                getBgGradient(idx)
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                    idx === 0 
                      ? 'bg-amber-100/60 text-amber-800 border-amber-200/40' 
                      : idx === 1 
                        ? 'bg-blue-100/60 text-blue-800 border-blue-200/40' 
                        : 'bg-emerald-100/60 text-emerald-800 border-emerald-200/40'
                  }`}>
                    {card.badge}
                  </span>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    idx === 0 ? 'bg-amber-100/40' : idx === 1 ? 'bg-blue-100/40' : 'bg-emerald-100/40'
                  }`}>
                    {getIcon(idx)}
                  </div>
                </div>

                <div className="space-y-3 text-right">
                  <h3 className={`font-tajawal text-xl sm:text-2xl font-extrabold ${
                    idx === 0 ? 'text-amber-900' : idx === 1 ? 'text-blue-900' : 'text-emerald-900'
                  }`}>
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-650 font-semibold">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold pt-4 border-t border-slate-200/50">
                <span className={idx === 0 ? 'text-amber-800' : idx === 1 ? 'text-blue-800' : 'text-emerald-800'}>
                  استكشف القسم
                </span>
                <ArrowLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${
                  idx === 0 ? 'text-amber-800' : idx === 1 ? 'text-blue-800' : 'text-emerald-800'
                }`} />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};
