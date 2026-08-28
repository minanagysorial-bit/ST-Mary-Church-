import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, ArrowLeft, ZoomIn, ZoomOut, X, Image as ImageIcon, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';
import { parseImageTransform } from '../../lib/api';
import { SEO } from '../../components/common/SEO';

interface HistoryImage {
  id: number;
  src: string;
  alt: string;
  description: string;
  isPlaceholder?: boolean;
  objectPosition?: string;
}

export const HistoryPage: React.FC = () => {
  const [activeImage, setActiveImage] = useState<HistoryImage | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxOffsetX, setLightboxOffsetX] = useState(0);
  const [lightboxOffsetY, setLightboxOffsetY] = useState(0);

  const handleOpenImage = (img: HistoryImage) => {
    setActiveImage(img);
    setLightboxZoom(1);
    setLightboxOffsetX(0);
    setLightboxOffsetY(0);
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxZoom(prev => Math.min(prev + 0.3, 3.5));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxZoom(prev => Math.max(prev - 0.3, 0.6));
  };

  const handleShiftUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOffsetY(prev => prev - 30);
  };

  const handleShiftDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOffsetY(prev => prev + 30);
  };

  const handleShiftLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOffsetX(prev => prev - 30);
  };

  const handleShiftRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxOffsetX(prev => prev + 30);
  };

  const handleResetTransform = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxZoom(1);
    setLightboxOffsetX(0);
    setLightboxOffsetY(0);
  };

  // List of 20 images
  const historyImages: HistoryImage[] = [
    { id: 1, src: '/history_1.jpg', alt: 'صورة 1: غبطة البابا البطريرك الأنبا يؤانس 19', description: 'البابا المتنيح الأنبا يؤانس 19 البابا الـ 113 أثناء وضع حجر الأساس.', objectPosition: 'top' },
    { id: 2, src: '/history_2.jpg', alt: 'صورة 2: الأمير عمر طوسون', description: 'سمو الأمير عمر طوسون الذي حضر احتفال وضع حجر الأساس للكنيسة عام 1934.', objectPosition: 'top' },
    { id: 3, src: '/history_3.jpg', alt: 'صورة 3: وثيقة حجر الأساس التاريخية', description: 'الوثيقة المكتوبة بخط اليد والموقعة من البابا البطريرك والأمير عمر طوسون وأعضاء المجلس الملي.' },
    { id: 4, src: '/history_4.jpg', alt: 'صورة 4: المقاول شاروبيم أقلاديوس', description: 'المقاول شاروبيم أقلاديوس أحد منفذي أعمال البناء والخرسانة للكنيسة.' },
    { id: 5, src: '/history_5.jpg', alt: 'صورة 5: المقاول فرج أقلاديوس', description: 'المقاول فرج أقلاديوس منفذ أعمال البناء والخرسانة والزخارف الداخلية.' },
    { id: 6, src: '/history_6.jpg', alt: 'صورة 6: يوم افتتاح الكنيسة عام 1935', description: 'يوم افتتاح الكنيسة في عيد السيدة العذراء ١٦ مسرى ١٦٥١ ش الموافق ٢٢ أغسطس ١٩٣٥ م.' },
    { id: 7, src: '/history_7.jpg', alt: 'صورة 7: جريدة الأهرام ٢٢ أغسطس ١٩٣٥', description: 'خبر افتتاح الكنيسة بجريدة الأهرام الصادرة يوم الأحد الموافق ٢٢ أغسطس ١٩٣٥ م تحت عنوان: غبطة الأنبا يؤانس يفتتح كنيسة قبطية جديدة في الإسكندرية.' },
    { id: 8, src: '/history_8.jpg', alt: 'صورة 8: حضن الآب (شرقية الهيكل الكبير)', description: 'رسم السيد المسيح جالس على العرش في شرقية الهيكل بريشة الفنان الإيطالي آبات ABBAT.' },
    { id: 9, src: '/history_9.jpg', alt: 'صورة 9: أيقونة العشاء الرباني', description: 'أيقونة العشاء الرباني الشهيرة المعلقة بالكنيسة للفنان آبات ABBAT.' },
    { id: 10, src: '/history_10.jpg', alt: 'صورة 10: قبة صعود السيد المسيح', description: 'منظر لقبة الكنيسة الوسطى التي تمثل صعود رب المجد للسماء للفنان آبات ABBAT.' },
    { id: 11, src: '/history_11.jpg', alt: 'صورة 11: القديس مرقس البشير', description: 'أيقونة القديس مرقس الرسول وكاتب الإنجيل وبجواره رمز الأسد بريشة الفنان آبات ABBAT.' },
    { id: 12, src: '/history_12.jpg', alt: 'صورة 12: القديس متى الإنجيلي', description: 'أيقونة القديس متى البشير وبجواره رمز الملاك الحارس بريشة الفنان آبات ABBAT.' },
    { id: 13, src: '/history_13.jpg', alt: 'صورة 13: القديس يوحنا الحبيب', description: 'أيقونة القديس يوحنا الإنجيلي واللاهوتي وبجواره رمز النسر بريشة الفنان آبات ABBAT.' },
    { id: 14, src: '/history_14.jpg', alt: 'صورة 14: القديس لوقا الطبيب', description: 'أيقونة القديس لوقا الإنجيلي والرسام وبجواره رمز الثور بريشة الفنان آبات ABBAT.' },
    { id: 15, src: '/history_15.jpg', alt: 'صورة 15: المتنيح القس مرقس باسيليوس كاتب التاريخ', description: 'صورة تاريخية لأول كاهن مرسوم على مذبح الكنيسة وهو يدوّن أحداث وسجلات الكنيسة.', objectPosition: 'top' },
    { id: 16, src: '/history_16.jpg', alt: 'صورة 16: زيارة الأنبا باسيليوس جاثليق إثيوبيا', description: 'الأنبا باسيليوس أثناء إقامة قداس إلهي باللغة الحبشية على مذبح الكنيسة.' },
    { id: 17, src: '/history_17.jpg', alt: 'صورة 17: الزيارة الرعوية للبابا كيرلس السادس', description: 'المتنيح البابا القديس كيرلس السادس خلال زيارته الأولى للكنيسة في 27 يوليو 1959.', objectPosition: 'top' },
    { id: 18, src: '/history_18.jpg', alt: 'صورة 18: الزيارة الرعوية الأولى للبابا شنودة الثالث', description: 'المتنيح البابا العظيم الأنبا شنودة الثالث يبارك الكنيسة وشعبها في 23 أبريل 1972.', objectPosition: 'top' },
    { id: 19, src: '/history_19.jpg', alt: 'صورة 19: الاستقبال الشعبي للبابا شنودة الثالث', description: 'حفاوة استقبال شعب كنيسة العذراء بمحرم بك لقداسته خلال زيارته الأولى.', objectPosition: 'top' },
    { id: 20, src: '/history_20.jpg', alt: 'صورة 20: الزيارة الرعوية الثانية للبابا شنودة الثالث', description: 'لقطة أرشيفية لزيارة قداسته الثانية للكنيسة في يونيو 1976.', objectPosition: 'top' },
    { id: 21, src: '/pope_tawadros_visit_2024_1.jpg', alt: 'صورة 21: قداسة البابا تواضروس الثاني مع مجمع كهنة الكنيسة (7 أغسطس 2024)', description: 'قداسة البابا المعظم الأنبا تواضروس الثاني يتوسط الآباء كهنة كنيسة السيدة العذراء بمحرم بك خلال الزيارة البابوية التاريخية يوم الأربعاء 7 أغسطس 2024 م.', objectPosition: 'top' },
    { id: 22, src: '/pope_tawadros_visit_2024_2.jpg', alt: 'صورة 22: اجتماع الأربعاء وعظة قداسة البابا داخل صحن الكنيسة', description: 'حضور شعبي حاشد داخل صحن الكنيسة تحت القبة الرئيسية خلال إلقاء قداسة البابا تواضروس الثاني لعظة الأربعاء الأسبوعية في 7 أغسطس 2024 م.', objectPosition: 'center' }
  ];

  // Helper to render image or placeholder card
  const renderImageBlock = (ids: number[]) => {
    const matched = historyImages.filter(img => ids.includes(img.id));
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-${matched.length} gap-4 my-6`}>
        {matched.map(img => {
          const { convertedUrl, styles } = parseImageTransform(img.src);
          const computedPosition = img.objectPosition || styles.objectPosition;

          return (
            <div 
              key={img.id}
              onClick={() => handleOpenImage(img)}
              className="group relative cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-200/60 hover:border-[#d4af37]/40 shadow-sm hover:shadow-xl interactive-card flex flex-col justify-between"
            >
              {img.isPlaceholder ? (
                <div className="w-full h-48 bg-[#00113a]/5 flex flex-col items-center justify-center text-slate-450 gap-2 border-b border-slate-100 group-hover:bg-[#002366]/10 transition-colors">
                  <ImageIcon className="w-10 h-10 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500">صورة أرشيفية ({img.id})</span>
                </div>
              ) : (
                <div className="relative aspect-video sm:aspect-auto sm:h-48 overflow-hidden border-b border-slate-100 bg-slate-100">
                  <img 
                    src={convertedUrl || img.src} 
                    alt={img.alt} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{ objectPosition: computedPosition, transform: styles.transform }}
                  />
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <ZoomIn className="w-8 h-8 text-white drop-shadow-md transform scale-90 group-hover:scale-100 transition-transform duration-300" />
                  </div>
                </div>
              )}
              <div className="p-3 text-right">
                <p className="text-[11px] font-bold text-[#002366] line-clamp-1">{img.alt}</p>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{img.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-cairo">
      <SEO 
        title="تاريخ كنيسة السيدة العذراء بمحرم بك (تأسست 1934م) | الوثائق والأيقونات الأثرية"
        description="السيرة التاريخية الكاملة لبناء وتدشين كنيسة السيدة العذراء مريم بمحرم بك منذ عام 1934 بحضور البابا يؤانس التاسع عشر والأمير عمر طوسون، وأيقونات الفنان الإيطالي العالمي آبات."
        keywords={[
          'تاريخ كنيسة العذراء محرم بك',
          'حجر اساس كنيسة العذراء محرم بك',
          'البابا يوانس 19 محرم بك',
          'الامير عمر طوسون كنيسة العذراء',
          'ايقونات الفنان ابات كنيسة العذراء',
          'افتتاح كنيسة العذراء محرم بك 1935'
        ]}
        canonicalUrl="https://stmary-moharambek-digitalhub.org/about/history"
        schema={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "تاريخ كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية",
          "description": "سيرة البناء والتدشين والبركة الإلهية لكنيسة السيدة العذراء بمحرم بك منذ 1934م",
          "image": "https://stmary-moharambek-digitalhub.org/history_6.jpg",
          "publisher": {
            "@type": "Organization",
            "name": "كنيسة السيدة العذراء مريم بمحرم بك",
            "logo": {
              "@type": "ImageObject",
              "url": "https://stmary-moharambek-digitalhub.org/favicon.svg"
            }
          }
        }}
      />
      {/* Top Banner */}
      <section className="relative py-12 bg-[#00113a] text-white overflow-hidden border-b-4 border-[#d4af37]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#00113a] to-[#00113a]/80 z-10" />
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center space-y-3">
          <Link to="/about" className="inline-flex items-center gap-1 text-[#fed65b] text-xs font-bold hover:underline mb-2">
            <ChevronRight className="w-4 h-4" />
            <span>الرجوع إلى "عن الكنيسة"</span>
          </Link>
          <h1 className="font-tajawal text-2xl sm:text-4xl font-extrabold tracking-wide">
            تاريخ الكنيسة العريق
          </h1>
          <p className="text-slate-350 text-xs font-medium">سيرة البناء والتدشين والبركة الإلهية عبر الأجيال</p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/60 shadow-md space-y-6 text-slate-800 leading-relaxed text-sm sm:text-base text-right">
          
          <div className="space-y-4">
            <h2 className="font-tajawal text-xl sm:text-2xl font-extrabold text-[#002366] border-r-4 border-[#d4af37] pr-3">
              نبذة تاريخية عن كنيسة السيدة العذراء مريم بمحرم بك
            </h2>
            <p>
              تعتبر كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية صرحاً أرثوذكسياً عريقاً وشاهداً حياً على تاريخ الكنيسة القبطية في القرن العشرين. بدأت فكرة تأسيس الكنيسة مع التوسع العمراني لحي محرم بك، فقام الأراخنة وأبناء الكنيسة بالتعاون مع البطريركية بجهود حثيثة لبناء كنيسة باسم والدة الإله القديسة مريم.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-tajawal text-lg font-bold text-[#002366]">
              وضع حجر الأساس (١٩٣٤ م)
            </h3>
            <p>
              في يوم الأحد المبارك الموافق ٤ نوفمبر ١٩٣٤ م، قام غبطة البابا المعظم الأنبا يؤانس التاسع عشر بابا الإسكندرية وبطريرك الكرازة المرقسية الـ ١١٣ بوضع حجر الأساس لكنيسة السيدة العذراء بمحرم بك وسط احتفال شعبي ورسمي مهيب، بحضور سمو الأمير عمر طوسون وجمع غفير من الأراخنة ومسؤولي الدولة.
            </p>
            {renderImageBlock([1, 2, 3])}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-tajawal text-lg font-bold text-[#002366]">
              أعمال البناء والتشييد المعماري
            </h3>
            <p>
              تولى تنفيذ هذا العمل الهندسي والمعماري الفخم المقاولان المعلمان شاروبيم وفرج أقلاديوس، حيث أقيمت الكنيسة على الطراز البازيليكي المتميز بأعمدتها الرخامية الضخمة وقبابها الشاهقة وزخارفها القبطية البديعة التي تجمع بين الأصالة والوقار الكنسي.
            </p>
            {renderImageBlock([4, 5])}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-tajawal text-lg font-bold text-[#002366]">
              الافتتاح والتدشين التاريخي (١٩٣٥ م)
            </h3>
            <p>
              افتتحت الكنيسة رسمياً وأقيم بها أول قداس إلهي في عيد صعود جسد السيدة العذراء مريم الموافق ١٦ مسرى ١٦٥١ ش (٢٢ أغسطس ١٩٣٥ م) برئاسة قداسة البابا الأنبا يؤانس التاسع عشر. ونشرت جريدة الأهرام تغطية كبرى للحدث التاريخي بالصفحة الأولى.
            </p>
            {renderImageBlock([6, 7])}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-tajawal text-lg font-bold text-[#002366]">
              أيقونات ولوحات الفنان الإيطالي العالمي "آبات" (ABBAT)
            </h3>
            <p>
              تتميز الكنيسة بمجموعة فريدة ونادرة من الجداريات والأيقونات الأثرية التي أبدعها الفنان الإيطالي الشهير "آبات" (ABBAT) عام ١٩٣٥ م، ومنها حضن الآب بشرقية الهيكل، لوحة العشاء الرباني الأثرية، وقبة صعود المخلص للسماء، وأيقونات الإنجيليين الأربعة.
            </p>
            {renderImageBlock([8, 9, 10])}
            {renderImageBlock([11, 12, 13, 14])}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-tajawal text-lg font-bold text-[#002366]">
              محطات مضيئة وزيارات بطريركية ورعوية
            </h3>
            
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                <span className="bg-[#d4af37] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded">معجزة إلهية</span>
                <p className="font-bold text-sm text-[#002366] mt-1.5">ظهور السيدة العذراء وحماية كنيستها من الغارة الجوية</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  إبان الحرب العالمية الثانية سقطت قنبلة خلف الكنيسة وهدمت ثلاثة منازل، وتطايرت شظاياها مخترقة حائط الكنيسة الخلفي، دون أن تؤثر على صورة العذراء المريمية أو كسر الزجاج الذي يغطيها. وقد شهد البواب غير المسيحي برؤية سيدة ترتدي البياض تزيح القنبلة بيمينها بعيداً عن مبنى الكنيسة.
                </p>
              </div>

              <div className="bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                <span className="bg-[#d4af37] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded">٧ مارس ١٩٤٣</span>
                <p className="font-bold text-sm text-[#002366] mt-1.5">رسامة القس مرقس باسيليوس كأول كاهن للمذبح</p>
                {renderImageBlock([15])}
              </div>

              <div className="bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                <span className="bg-[#d4af37] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded">زيارة تاريخية</span>
                <p className="font-bold text-sm text-[#002366] mt-1.5">زيارة المتنيح الأنبا باسيليوس جاثليق أثيوبيا</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  أقام الوفد الحبشي قداساً باللغة الحبشية على مذبح الكنيسة تأكيداً على رابطة المحبة الكنسية والأرثوذكسية.
                </p>
                {renderImageBlock([16])}
              </div>

              <div className="bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                <span className="bg-[#d4af37] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded">٢٧ يوليو ١٩٥٩</span>
                <p className="font-bold text-sm text-[#002366] mt-1.5">الزيارة الرعوية الأولى للبابا كيرلس السادس</p>
                {renderImageBlock([17])}
              </div>

              <div className="bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                <span className="bg-[#d4af37] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded">٢٣ أبريل ١٩٧٢</span>
                <p className="font-bold text-sm text-[#002366] mt-1.5">الزيارة الرعوية الأولى للبابا شنودة الثالث للكنيسة</p>
                {renderImageBlock([18, 19])}
              </div>

              <div className="bg-[#002366]/5 p-4 rounded-2xl border border-[#002366]/10">
                <span className="bg-[#d4af37] text-[#00174a] text-[10px] font-bold px-2 py-0.5 rounded">يونيو ١٩٧٦</span>
                <p className="font-bold text-sm text-[#002366] mt-1.5">الزيارة الرعوية الثانية للبابا شنودة الثالث للكنيسة</p>
                {renderImageBlock([20])}
              </div>

              {/* 🕊️ Historic Visit of Pope Tawadros II (7/8/2024) */}
              <div className="bg-gradient-to-br from-amber-500/10 via-[#002366]/5 to-[#00174a]/10 p-5 sm:p-6 rounded-3xl border-2 border-[#d4af37]/60 shadow-md space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="bg-[#002366] text-[#fed65b] text-xs font-extrabold px-3.5 py-1 rounded-full shadow-xs">
                    ٧ أغسطس ٢٠٢٤ م (١ مسرى ١٧٤٠ ش)
                  </span>
                  <span className="text-xs bg-[#fed65b] text-[#00174a] font-extrabold px-3 py-1 rounded-full shadow-2xs">
                    زيارة بابوية تاريخية 🕊️✨
                  </span>
                </div>
                <h4 className="font-tajawal text-base sm:text-xl font-extrabold text-[#002366] pt-1">
                  الزيارة الرعوية التاريخية لقداسة البابا تواضروس الثاني
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                  تشرّفت كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية بالزيارة الرعوية التاريخية الميمونة لأبينا البطريرك قداسة البابا المعظم الأنبا تواضروس الثاني (بابا الإسكندرية وبطريرك الكرازة المرقسية الـ ١١٨)، حيث ألقى قداسته اجتماع الأربعاء الأسبوعي وعظته المباركة وسط حضور شعبي حاشد وفرحة غامرة لشعب الكنيسة وإسكندرية، وبارك مجمع كهنة الكنيسة والشمامسة والخدام.
                </p>
                {renderImageBlock([21, 22])}
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Lightbox / Zoom & Pan Modal */}
      {activeImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn select-none overflow-hidden"
          onClick={() => setActiveImage(null)}
        >
          {/* Top Control Bar with Zoom & Pan Actions */}
          <div 
            className="absolute top-4 inset-x-4 max-w-2xl mx-auto flex items-center justify-between text-white z-50 bg-black/60 px-4 py-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Zoom & Pan Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button 
                onClick={handleZoomIn}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center gap-1 text-xs font-bold"
                title="تكبير الصورة (+)"
              >
                <ZoomIn className="w-4 h-4 text-[#fed65b]" />
                <span className="hidden sm:inline">تكبير</span>
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all flex items-center gap-1 text-xs font-bold"
                title="تصغير الصورة (-)"
              >
                <ZoomOut className="w-4 h-4 text-[#fed65b]" />
                <span className="hidden sm:inline">تصغير</span>
              </button>
              
              <div className="h-4 w-px bg-white/20 mx-0.5" />

              <button 
                onClick={handleShiftUp}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                title="تحريك لأعلى"
              >
                <ArrowUp className="w-4 h-4 text-[#fed65b]" />
              </button>
              <button 
                onClick={handleShiftDown}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                title="تحريك لأسفل"
              >
                <ArrowDown className="w-4 h-4 text-[#fed65b]" />
              </button>
              <button 
                onClick={handleShiftRight}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                title="تحريك لليمين"
              >
                <ArrowRight className="w-4 h-4 text-[#fed65b]" />
              </button>
              <button 
                onClick={handleShiftLeft}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                title="تحريك لليسار"
              >
                <ArrowLeft className="w-4 h-4 text-[#fed65b]" />
              </button>

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              <button 
                onClick={handleResetTransform}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all"
                title="إعادة الضبط"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-slate-300 pr-1">
                {Math.round(lightboxZoom * 100)}%
              </span>
            </div>

            {/* Close Button */}
            <button 
              className="bg-white/10 hover:bg-rose-600 text-white p-1.5 rounded-xl transition-all"
              onClick={() => setActiveImage(null)}
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div 
            className="max-w-4xl w-full text-center space-y-4 pt-16 flex flex-col items-center justify-center max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {activeImage.isPlaceholder ? (
              <div className="mx-auto w-full max-w-lg aspect-video bg-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-white/10 gap-3">
                <ImageIcon className="w-16 h-16 text-slate-500" />
                <p className="font-bold text-sm text-slate-350">{activeImage.alt}</p>
                <p className="text-xs text-slate-500 px-8 leading-relaxed">
                  هذه الصورة الأرشيفية غير متوفرة حالياً في النظام وسيتم رفعها قريباً.
                </p>
              </div>
            ) : (
              <div className="relative max-w-full max-h-[70vh] overflow-hidden flex items-center justify-center">
                <img 
                  src={activeImage.src} 
                  alt={activeImage.alt} 
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                  style={{
                    transform: `scale(${lightboxZoom}) translate(${lightboxOffsetX}px, ${lightboxOffsetY}px)`,
                    objectPosition: activeImage.objectPosition || 'center'
                  }}
                />
              </div>
            )}
            <div className="bg-black/70 p-3.5 rounded-2xl text-white inline-block max-w-lg border border-white/10 backdrop-blur-md">
              <h3 className="font-bold text-sm text-[#fed65b]">{activeImage.alt}</h3>
              <p className="text-xs text-slate-300 mt-1">{activeImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
