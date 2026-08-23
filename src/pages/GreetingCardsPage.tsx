import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Sparkles, 
  Download, 
  Share2, 
  RefreshCw, 
  Check, 
  Heart, 
  Palette, 
  Type, 
  Send,
  MessageCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface CardTemplate {
  id: string;
  name: string;
  category: 'mary' | 'easter' | 'christmas' | 'general' | 'birthday';
  tag: string;
  bgColor1: string;
  bgColor2: string;
  accentColor: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  iconSymbol: 'mary' | 'cross' | 'star' | 'dove' | 'crown' | 'gift';
  defaultTitle: string;
  defaultMessage: string;
  defaultVerse: string;
}

const TEMPLATES: CardTemplate[] = [
  {
    id: 'st-mary-luxury',
    name: 'عيد وصوم السيدة العذراء',
    category: 'mary',
    tag: 'شفيعة الكنيسة',
    bgColor1: '#041334',
    bgColor2: '#0b2356',
    accentColor: '#fed65b',
    textColor: '#ffffff',
    subTextColor: '#f3e8c8',
    borderColor: '#d4af37',
    iconSymbol: 'mary',
    defaultTitle: 'بركة وشفاعة أم النور',
    defaultMessage: 'كل عام وأنتم بخير بمناسبة صوم وعيد السيدة العذراء مريم، لتكن شفاعتها وصلواتها حصناً وبركة لحياتكم وبيوتكم.',
    defaultVerse: '«تُعَظِّمُ نَفْسِي الرَّبَّ، وَتَبْتَهِجُ رُوحِي بِاللهِ مُخَلِّصِي» (لو ١: ٤٦-٤٧)'
  },
  {
    id: 'resurrection-royal',
    name: 'عيد القيامة المجيد',
    category: 'easter',
    tag: 'المسيح قام',
    bgColor1: '#4a0814',
    bgColor2: '#1d0207',
    accentColor: '#f7d377',
    textColor: '#ffffff',
    subTextColor: '#fce7b2',
    borderColor: '#d4af37',
    iconSymbol: 'cross',
    defaultTitle: 'إخرستوس آنيستي.. آليثوس آنيستي',
    defaultMessage: 'المسيح قام.. بالحقيقة قام! نهنئكم بعيد القيامة المجيد، راجين أن يملأ نور القيامة قلوبكم بالفرح والسلام والرجاء الحي.',
    defaultVerse: '«أَنَا هُوَ الْقِيَامَةُ وَالْحَيَاةُ. مَنْ آمَنَ بِي وَلَوْ مَاتَ فَسَيَحْيَا» (يو ١١: ٢٥)'
  },
  {
    id: 'nativity-peace',
    name: 'عيد الميلاد المجيد',
    category: 'christmas',
    tag: 'المجد لله في الأعالي',
    bgColor1: '#071f1e',
    bgColor2: '#020d0c',
    accentColor: '#fed65b',
    textColor: '#ffffff',
    subTextColor: '#d8f3dc',
    borderColor: '#d4af37',
    iconSymbol: 'star',
    defaultTitle: 'المجد لله في الأعالي',
    defaultMessage: 'كل عام وأنتم بخير بمناسبة عيد الميلاد المجيد وميلاد مخلصنا الصالح، سلام ومسرة تملأ بيوتكم وقلوبكم دائماً.',
    defaultVerse: '«الْمَجْدُ لِلَّهِ فِي الأَعَالِي، وَعَلَى الأَرْضِ السَّلاَمُ، وَبِالنَّاسِ الْمَسَرَّةُ» (لو ٢: ١٤)'
  },
  {
    id: 'general-blessing',
    name: 'بركة وسلام كنسي',
    category: 'general',
    tag: 'آية وبركة',
    bgColor1: '#0a1d37',
    bgColor2: '#15325b',
    accentColor: '#ffd700',
    textColor: '#ffffff',
    subTextColor: '#e2e8f0',
    borderColor: '#d4af37',
    iconSymbol: 'dove',
    defaultTitle: 'نعمة وسلام لكم',
    defaultMessage: 'نصلي إلى الرب القدير أن يحفظكم في نعمته وسلامه، وأن يبارك في كل عمل تمتد إليه أيديكم ويسدد كل خطواتكم.',
    defaultVerse: '«يُبَارِكُكَ الرَّبُّ وَيَحْرُسُكَ. يُضِيءُ الرَّبُّ بِوَجْهِهِ عَلَيْكَ وَيَرْحَمُكَ» (عد ٦: ٢٤-٢٥)'
  },
  {
    id: 'birthday-joy',
    name: 'تهنئة عيد ميلاد مبارك',
    category: 'birthday',
    tag: 'سنة حلوة مع يسوع',
    bgColor1: '#16193b',
    bgColor2: '#2b1055',
    accentColor: '#fbc531',
    textColor: '#ffffff',
    subTextColor: '#f1f2f6',
    borderColor: '#f5cd79',
    iconSymbol: 'crown',
    defaultTitle: 'سنة حلوة مع يسوع',
    defaultMessage: 'عيد ميلاد مبارك وسعيد! نتمنى لك عاماً جديداً مليئاً ببركات السماء، وصحة وبركة ونجاح في كل خطوة مع الرب.',
    defaultVerse: '«تَاجُ السَّنَةِ جُودُكَ، وَآثَارُكَ تَقْطُرُ دَسَماً» (مز ٦٥: ١١)'
  },
  {
    id: 'emerald-gold',
    name: 'تهنئة روحية ملكية',
    category: 'general',
    tag: 'كنيسة العذراء',
    bgColor1: '#06281e',
    bgColor2: '#0b4635',
    accentColor: '#fed65b',
    textColor: '#ffffff',
    subTextColor: '#c8f7dc',
    borderColor: '#d4af37',
    iconSymbol: 'dove',
    defaultTitle: 'معونة وبركة من العلي',
    defaultMessage: 'نهديكم أطيب التهاني والمحبة الخالصة من كنيسة السيدة العذراء مريم بمحرم بك، مصلين أن ترافقكم مراحم الرب كل حين.',
    defaultVerse: '«الرَّبُّ رَاعِيَّ فَلاَ يَعْوِزُنِي شَيْءٌ» (مز ٢٣: ١)'
  }
];

const PRESET_MESSAGES = [
  'كل عام وأنتم بخير، وبركة صلوات وشفاعة أم النور مريم العذراء ترافقكم وتحفظ بيوتكم دائماً.',
  'المسيح قام.. بالحقيقة قام! فصح مبارك وقيامة تملأ قلوبكم بالنور والرجاء والمحبة.',
  'عيد ميلاد مجيد، ميلاد السلام في قلوبكم وبيوتكم.. كل عام وأنتم بكل خير وفرح.',
  'سنة حلوة ومباركة مع يسوع، يحفظك الرب فيها وينعم عليك بالصحة والبركة والنجاح.',
  'سلام ونعمة من ربنا يسوع المسيح، أذكركم بمحبة في صلواتي متمنياً لكم فيض البركات.'
];

export const GreetingCardsPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate>(TEMPLATES[0]);
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [customTitle, setCustomTitle] = useState(TEMPLATES[0].defaultTitle);
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].defaultMessage);
  const [customVerse, setCustomVerse] = useState(TEMPLATES[0].defaultVerse);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // When template changes, update defaults if custom fields are unchanged
  const handleSelectTemplate = (tpl: CardTemplate) => {
    setSelectedTemplate(tpl);
    setCustomTitle(tpl.defaultTitle);
    setCustomMessage(tpl.defaultMessage);
    setCustomVerse(tpl.defaultVerse);
  };

  // Render Canvas in HD
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High Resolution Canvas (1080 x 1350 - perfect 4:5 Instagram/WhatsApp portrait)
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGradient = ctx.createRadialGradient(
      width / 2, height * 0.35, 80,
      width / 2, height / 2, width * 0.85
    );
    bgGradient.addColorStop(0, selectedTemplate.bgColor2);
    bgGradient.addColorStop(1, selectedTemplate.bgColor1);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Background Pattern (Subtle Stars/Dots)
    ctx.fillStyle = 'rgba(254, 214, 91, 0.04)';
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(i * 99) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 33) * 0.5 + 0.5) * height;
      const r = (i % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Double Gold Border with Corner Accents
    ctx.strokeStyle = selectedTemplate.borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(45, 45, width - 90, height - 90);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Corner Ornaments
    const drawCorner = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = selectedTemplate.accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 35);
      ctx.lineTo(0, 0);
      ctx.lineTo(35, 0);
      ctx.stroke();

      ctx.fillStyle = selectedTemplate.accentColor;
      ctx.beginPath();
      ctx.arc(10, 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    drawCorner(50, 50, 0);
    drawCorner(width - 50, 50, Math.PI / 2);
    drawCorner(width - 50, height - 50, Math.PI);
    drawCorner(50, height - 50, -Math.PI / 2);

    // 4. Church Header (Top Badge)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Small Gold Cross at very top
    ctx.fillStyle = selectedTemplate.accentColor;
    ctx.font = 'bold 36px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('✝', width / 2, 115);

    // Church Name
    ctx.fillStyle = selectedTemplate.accentColor;
    ctx.font = 'bold 26px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('كنيسة السيدة العذراء مريم بمحرم بك', width / 2, 165);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '500 19px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('الإسكندرية — المنصة الرقمية الموحدة', width / 2, 202);

    // Decorative Divider below church name
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 180, 235);
    ctx.lineTo(width / 2 + 180, 235);
    ctx.stroke();

    ctx.fillStyle = selectedTemplate.accentColor;
    ctx.beginPath();
    ctx.arc(width / 2, 235, 5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Central Emblem / Icon
    const emblemY = 330;
    // Glowing ring
    const glowGrad = ctx.createRadialGradient(width / 2, emblemY, 30, width / 2, emblemY, 90);
    glowGrad.addColorStop(0, 'rgba(254, 214, 91, 0.25)');
    glowGrad.addColorStop(1, 'rgba(254, 214, 91, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(width / 2, emblemY, 90, 0, Math.PI * 2);
    ctx.fill();

    // Outer Circle
    ctx.strokeStyle = selectedTemplate.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, emblemY, 55, 0, Math.PI * 2);
    ctx.stroke();

    // Icon Inside
    ctx.fillStyle = selectedTemplate.accentColor;
    ctx.font = 'bold 44px "Cairo", "Segoe UI", sans-serif';
    let iconChar = '🕊️';
    if (selectedTemplate.iconSymbol === 'mary') iconChar = '👑';
    else if (selectedTemplate.iconSymbol === 'cross') iconChar = '✝';
    else if (selectedTemplate.iconSymbol === 'star') iconChar = '⭐';
    else if (selectedTemplate.iconSymbol === 'crown') iconChar = '🎂';
    ctx.fillText(iconChar, width / 2, emblemY + 4);

    // 6. Recipient Greeting (إلى: ...)
    let currentY = 445;
    if (recipientName.trim()) {
      ctx.fillStyle = selectedTemplate.subTextColor;
      ctx.font = 'bold 30px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText(`إلى العزيز: ${recipientName.trim()}`, width / 2, currentY);
      currentY += 55;
    }

    // 7. Main Occasion Title
    ctx.fillStyle = selectedTemplate.accentColor;
    ctx.font = '900 48px "Cairo", "Tajawal", sans-serif';
    ctx.fillText(customTitle, width / 2, currentY);
    currentY += 65;

    // Small Gold Divider
    ctx.strokeStyle = 'rgba(254, 214, 91, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, currentY);
    ctx.lineTo(width / 2 + 120, currentY);
    ctx.stroke();
    currentY += 45;

    // 8. Main Message (Multi-line wrap)
    ctx.fillStyle = selectedTemplate.textColor;
    ctx.font = '600 29px "Cairo", "Segoe UI", sans-serif';

    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const messageLines = wrapText(customMessage, width - 260);
    messageLines.forEach((line) => {
      ctx.fillText(line, width / 2, currentY);
      currentY += 46;
    });

    // 9. Bible Verse Box
    if (customVerse.trim()) {
      currentY += 25;
      const verseBoxWidth = width - 220;
      const verseLines = wrapText(customVerse.trim(), verseBoxWidth - 60);
      const verseBoxHeight = (verseLines.length * 36) + 40;

      // Box Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 1.5;

      // Rounded rect function
      const r = 18;
      const bx = width / 2 - verseBoxWidth / 2;
      const by = currentY;
      ctx.beginPath();
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + verseBoxWidth - r, by);
      ctx.quadraticCurveTo(bx + verseBoxWidth, by, bx + verseBoxWidth, by + r);
      ctx.lineTo(bx + verseBoxWidth, by + verseBoxHeight - r);
      ctx.quadraticCurveTo(bx + verseBoxWidth, by + verseBoxHeight, bx + verseBoxWidth - r, by + verseBoxHeight);
      ctx.lineTo(bx + r, by + verseBoxHeight);
      ctx.quadraticCurveTo(bx, by + verseBoxHeight, bx, by + verseBoxHeight - r);
      ctx.lineTo(bx, by + r);
      ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Verse Text
      ctx.fillStyle = selectedTemplate.subTextColor;
      ctx.font = 'italic 500 23px "Cairo", "Segoe UI", sans-serif';
      let vY = by + 34;
      verseLines.forEach((vline) => {
        ctx.fillText(vline, width / 2, vY);
        vY += 36;
      });

      currentY = by + verseBoxHeight + 35;
    }

    // 10. Sender Signature (من: ...)
    if (senderName.trim()) {
      ctx.fillStyle = selectedTemplate.accentColor;
      ctx.font = 'bold 30px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText(`محبكم: ${senderName.trim()}`, width / 2, height - 150);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '500 24px "Cairo", "Segoe UI", sans-serif';
      ctx.fillText('دمتم في رعاية ومحبة المسيح ✝️', width / 2, height - 150);
    }

    // 11. Footer Website Link
    ctx.fillStyle = 'rgba(254, 214, 91, 0.7)';
    ctx.font = '500 18px "Cairo", "Segoe UI", sans-serif';
    ctx.fillText('www.tibarthenos.com', width / 2, height - 95);

  }, [selectedTemplate, recipientName, senderName, customTitle, customMessage, customVerse]);

  // Download High-Res Image
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `كارت_تهنئة_${selectedTemplate.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download error', err);
    } finally {
      setDownloading(false);
    }
  };

  // Share via WhatsApp or Native Web Share
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Check if Web Share API with files is supported (Mobile Safari / Chrome)
      if (navigator.share && navigator.canShare) {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], 'church-greeting.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: customTitle,
              text: `${customTitle}\n${customMessage}\n\n✝️ كنيسة السيدة العذراء مريم بمحرم بك\nhttps://www.tibarthenos.com`,
              files: [file]
            });
            return;
          }
        }, 'image/png');
      }

      // Fallback: WhatsApp Direct Text Share
      const shareText = encodeURIComponent(
        `✨ *${customTitle}* ✨\n\n` +
        (recipientName ? `إلى: ${recipientName}\n` : '') +
        `${customMessage}\n\n` +
        (customVerse ? `📖 ${customVerse}\n\n` : '') +
        (senderName ? `محبكم: ${senderName}\n` : '') +
        `✝️ *كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية*\n` +
        `صمم بطاقتك الخاصة: https://www.tibarthenos.com/cards`
      );
      window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
    } catch (e) {
      console.error('Share error', e);
    }
  };

  const handleCopyText = () => {
    const fullText = 
      `✨ ${customTitle} ✨\n` +
      (recipientName ? `إلى: ${recipientName}\n` : '') +
      `${customMessage}\n` +
      (customVerse ? `\n📖 ${customVerse}\n` : '') +
      (senderName ? `\nمحبكم: ${senderName}\n` : '') +
      `\n✝️ كنيسة السيدة العذراء مريم بمحرم بك\nhttps://www.tibarthenos.com/cards`;
    
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#00113a] text-white py-8 px-4 sm:px-6 lg:px-8 font-cairo" dir="rtl">
      <Helmet>
        <title>صانع بطاقات التهنئة الكنسية | كنيسة السيدة العذراء بمحرم بك</title>
        <meta name="description" content="صمم بطاقة تهنئة مسيحية مخصصة لعيد القيامة، عيد الميلاد، وصوم العذراء مريم وشاركها فوراً مع أحبائك وأسرتك." />
      </Helmet>

      {/* Header Banner */}
      <div className="max-w-6xl mx-auto mb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#d4af37]/20 border border-[#d4af37]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#fed65b] shadow-inner">
          <Sparkles className="w-4 h-4 text-[#fed65b] animate-spin" />
          <span>خدمة رقمية جديدة لشعب الكنيسة</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          صانع بطاقات التهنئة الكنسية 🎨
        </h1>
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          صمّم بطاقة معايدة باسمك واسم أحبائك للمناسبات والأعياد القبطية بشعار وبركة كنيسة العذراء مريم، وشاركها مباشرة بجودة فائقة على واتساب وفيسبوك.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Controls Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
          
          {/* Step 1: Template Selection */}
          <div className="bg-[#001a54]/80 border border-[#d4af37]/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#fed65b]">
              <Palette className="w-4 h-4" />
              <span>١. اختر مناسبة ونمط البطاقة:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between h-24 relative overflow-hidden group ${
                    selectedTemplate.id === tpl.id
                      ? 'border-[#fed65b] shadow-[0_0_15px_rgba(254,214,91,0.3)] bg-gradient-to-br from-[#002366] to-[#00174a]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#d4af37]/20 text-[#fed65b]">
                      {tpl.tag}
                    </span>
                    {selectedTemplate.id === tpl.id && (
                      <div className="w-4 h-4 rounded-full bg-[#fed65b] flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#00174a] stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-[#fed65b] transition-colors leading-tight">
                    {tpl.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Custom Names */}
          <div className="bg-[#001a54]/80 border border-[#d4af37]/30 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#fed65b]">
              <Type className="w-4 h-4" />
              <span>٢. الأسماء والتهنئة:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">إلى (اسم المهنأ عليه):</label>
                <input
                  type="text"
                  placeholder="مثال: أبي الحبيب / د. مينا / تاسوني ماري"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-[#00113a] border border-[#d4af37]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">من (اسم الراسل):</label>
                <input
                  type="text"
                  placeholder="مثال: ابنكم مينا / أسرة مدارس الأحد"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-[#00113a] border border-[#d4af37]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">عنوان التهنئة الرئيسي:</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-[#00113a] border border-[#d4af37]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
              />
            </div>

            {/* Custom Message */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">نص التهنئة:</label>
                <span className="text-[10px] text-slate-400">يمكنك الاختيار من النصوص الجاهزة بالأسفل</span>
              </div>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full bg-[#00113a] border border-[#d4af37]/40 rounded-xl p-3 text-xs sm:text-sm text-white leading-relaxed placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
              />
            </div>

            {/* Quick Preset Messages */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#d4af37]">💡 نصوص تهنئة سريعة جاهزة:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => setCustomMessage(msg)}
                    className="text-[11px] bg-white/5 hover:bg-[#d4af37]/20 border border-white/10 hover:border-[#d4af37]/40 px-2.5 py-1 rounded-lg text-slate-200 hover:text-white transition-all text-right truncate max-w-full"
                  >
                    {msg.slice(0, 45)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Bible Verse */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">آية كتابية مصاحبة:</label>
              <input
                type="text"
                value={customVerse}
                onChange={(e) => setCustomVerse(e.target.value)}
                className="w-full bg-[#00113a] border border-[#d4af37]/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#fed65b]"
              />
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="bg-gradient-to-r from-[#002366] to-[#00174a] border border-[#d4af37]/50 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:flex-1 bg-gradient-to-r from-[#d4af37] to-[#fed65b] hover:from-[#c29f2d] hover:to-[#eec045] text-[#00174a] font-extrabold text-sm py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-[#00174a] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>تحميل الصورة بجودة عالية HD</span>
            </button>

            <button
              onClick={handleShare}
              className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>مشاركة على واتساب</span>
            </button>

            <button
              onClick={handleCopyText}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
              title="نسخ نص التهنئة"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>
        </div>

        {/* Right / Live Preview Canvas (5 Cols) */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-4 lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#fed65b] flex items-center gap-1.5">
              <span>معاينة فورية مباشرة (Live Preview)</span>
            </h3>
            <span className="text-[11px] text-slate-400">دقة فائقة جاهزة للمشاركة 📱</span>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-[#d4af37]/40 bg-black/40 flex items-center justify-center p-1 group">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-[420px] rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-[1.01]"
              style={{ aspectRatio: '1080 / 1350' }}
            />
          </div>

          {/* Quick Sharing Tip */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-slate-300 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 flex items-center justify-center text-[#fed65b] shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <p className="leading-relaxed">
              يمكنك تحميل الصورة وإرسالها في جروبات الخدمة، أسر مدارس الأحد، أو نشرها كـ <strong>Story</strong> على واتساب وإنستجرام وفيسبوك.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
