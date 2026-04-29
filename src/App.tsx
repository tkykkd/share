import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { Music, Play, Pause, ChevronDown, Heart, History, MapPin, Feather, Sparkles } from 'lucide-react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Section = ({ children, className = '', id }: SectionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section
      ref={ref}
      id={id}
      className={`min-h-screen flex flex-col items-center justify-center relative px-6 py-20 ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl w-full text-center"
      >
        {children}
      </motion.div>
    </section>
  );
};

const AudioPlayer = () => {
  const [voicePlaying, setVoicePlaying] = React.useState(false);
  const [bgMusicPlaying, setBgMusicPlaying] = React.useState(false);
  const [bgVolume, setBgVolume] = React.useState(35);
  const bgAudioRef = useRef<HTMLAudioElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement>(null);

  // Try to start BGM automatically on page load.
  // Note: browsers may block autoplay until a user gesture occurs.
  React.useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;
    audio.volume = bgVolume / 100;

    audio
      .play()
      .then(() => setBgMusicPlaying(true))
      .catch(() => {
        // Autoplay blocked; user can start it via the UI button.
      });
  }, []);

  React.useEffect(() => {
    const audio = bgAudioRef.current;
    if (!audio) return;
    audio.volume = bgVolume / 100;
  }, [bgVolume]);

  const toggleBgMusic = () => {
    const audio = bgAudioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio
        .play()
        .then(() => setBgMusicPlaying(true))
        .catch(() => {
          // Ignore; user gesture is required.
        });
    } else {
      audio.pause();
      setBgMusicPlaying(false);
    }
  };

  const toggleVoiceMessage = () => {
    const audio = voiceAudioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => setVoicePlaying(true)).catch(() => {
        // Ignore playback errors from browser restrictions.
      });
    } else {
      audio.pause();
      setVoicePlaying(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2 }}
      className="fixed bottom-8 right-8 z-50 flex items-end gap-3"
    >
      {/* Background Music Toggle */}
      <div className="bg-zinc-900/80 backdrop-blur-md border border-gold-500/20 px-3 py-2 rounded-2xl luxury-shadow flex items-center gap-2">
        <button 
          onClick={toggleBgMusic}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${bgMusicPlaying ? 'text-gold-500 bg-gold-500/10' : 'text-zinc-500'}`}
          title={bgMusicPlaying ? "Mute Background Music" : "Play Background Music"}
        >
          {bgMusicPlaying ? <Music size={18} className="animate-pulse" /> : <Music size={18} className="opacity-50" />}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={bgVolume}
          onChange={(e) => setBgVolume(Number(e.target.value))}
          className="w-24 accent-amber-500"
          title="BGM Volume"
        />
      </div>

      <div className="bg-zinc-900/80 backdrop-blur-md border border-gold-500/20 p-4 rounded-2xl luxury-shadow flex items-center gap-4">
        <audio 
          ref={bgAudioRef}
          src="audio/happy-birthday-reverb-slow.mp3"
          loop 
        />
        <audio
          ref={voiceAudioRef}
          src="audio/voice-message.mp3"
          onEnded={() => setVoicePlaying(false)}
        />
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold-500/60 font-medium">Voice Message</span>
          <span className="text-xs text-zinc-300 font-serif">Message for Koichi</span>
        </div>
        <button 
          onClick={toggleVoiceMessage}
          className="w-10 h-10 rounded-full bg-gold-600 hover:bg-gold-500 flex items-center justify-center transition-all active:scale-95 text-zinc-950"
        >
          {voicePlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const [started, setStarted] = React.useState(false);
  
  const handleStart = () => {
    setStarted(true);
    // Auto-trigger background music on start
    const musicIcon = document.querySelector('button[title="Play Background Music"]') as HTMLButtonElement;
    if (musicIcon) musicIcon.click();
  };
  
  return (
    <main ref={containerRef} className="relative font-sans overflow-x-hidden selection:bg-gold-500/20 selection:text-gold-200">
      {/* Start Overlay */}
      {!started && (
        <motion.div 
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="max-w-md"
          >
            <Sparkles className="text-gold-500 mb-8 mx-auto" size={48} strokeWidth={1} />
            <h1 className="text-3xl md:text-4xl font-serif mb-4 text-gold-gradient">
              Happy 46th Birthday,<br />Koichi.
            </h1>
            <p className="text-zinc-500 mb-12 font-serif tracking-widest text-sm uppercase">2026.04.29</p>
            <button 
              onClick={handleStart}
              className="px-12 py-4 bg-linear-to-r from-gold-700 to-gold-500 text-zinc-950 font-serif text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-gold-900/20"
            >
              受け取る
            </button>
          </motion.div>
        </motion.div>
      )}
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(60,40,10,0.15),transparent)]" />
        <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-gold-900/10 to-transparent" />
      </div>

      {/* Hero Section */}
      <Section className="relative z-10 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
        >
           <div className="w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03),transparent_70%)]" />
        </motion.div>

        <span className="text-sm tracking-[0.4em] uppercase text-gold-500/80 mb-6 block font-medium">
          Celebrating 46 Remarkable Years
        </span>
        <h1 className="text-5xl md:text-7xl font-serif mb-8 text-gold-gradient leading-tight tracking-tight">
          轍と信義：<br />46年目のメキシカンピラフ
        </h1>
        <p className="text-lg md:text-xl font-handwriting text-zinc-400 mb-12 max-w-xl mx-auto leading-relaxed">
          「4月29日。30度を越えるコラートの部屋で、すべてが始まった場所を思い出す。」
        </p>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-gold-500/40"
        >
          <ChevronDown size={32} strokeWidth={1} />
        </motion.div>
      </Section>

      {/* Chapter 1 */}
      <Section className="bg-zinc-950/50">
        <div className="mb-12 flex justify-center">
          <div className="w-px h-24 bg-linear-to-b from-transparent via-gold-500/50 to-transparent" />
        </div>
        <div className="inline-flex items-center gap-2 text-gold-500 mb-6 font-serif">
          <History size={20} />
          <span className="tracking-[0.2em] text-sm uppercase">Chapter 01</span>
        </div>
        <h2 className="text-3xl font-serif mb-8">The Beginning</h2>
        <div className="space-y-6 text-zinc-400 leading-loose font-serif text-lg">
          <p>
            大学の教室、最後列。
            そこにいたのは、無骨なレザーのバイカーベストを羽織った君だった。
          </p>
          <p>
            周囲から少し浮いているような、けれど確固たる自分を持っているような、
            あの独特の佇まいが、僕たちの出会いだったね。
          </p>
        </div>
        <div className="mt-12">
          <img
            src="images/chapters/chapter-01.png"
            alt="Chapter 01 memory"
            className="w-full max-w-3xl mx-auto aspect-[16/9] object-cover rounded-2xl border border-gold-500/20"
            loading="lazy"
          />
        </div>
      </Section>

      {/* Chapter 2 */}
      <Section className="relative">
        <div className="absolute left-0 right-0 top-0 h-px bg-linear-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="inline-flex items-center gap-2 text-gold-500 mb-6 font-serif">
          <Sparkles size={20} />
          <span className="tracking-[0.2em] text-sm uppercase">Chapter 02</span>
        </div>
        <h2 className="text-3xl font-serif mb-8">Late Nights at Jonathan's</h2>
        <div className="space-y-6 text-zinc-400 leading-loose font-serif text-lg">
          <p>
            ジョナサンで迎える深夜。
            目の前には、お決まりのメキシカンピラフ。
          </p>
          <p>
            夜が明けるまで語り明かした、青臭い夢や将来のこと。
            あのスパイスの香りと共に、僕たちの絆は深まっていった。
          </p>
        </div>
        <div className="mt-12">
          <img
            src="images/chapters/chapter-02.png"
            alt="Chapter 02 memory"
            className="w-full max-w-3xl mx-auto aspect-[16/9] object-cover rounded-2xl border border-gold-500/20"
            loading="lazy"
          />
        </div>
      </Section>

      {/* Chapter 3 */}
      <Section className="bg-zinc-950/80">
        <div className="inline-flex items-center gap-2 text-gold-500 mb-6 font-serif">
          <MapPin size={20} />
          <span className="tracking-[0.2em] text-sm uppercase">Chapter 03</span>
        </div>
        <h2 className="text-3xl font-serif mb-8">Youth in Honmoku</h2>
        <div className="space-y-6 text-zinc-400 leading-loose font-serif text-lg">
          <p>
            ベトナムへの旅。
            そして、本牧で始まった「House of Goods」。
          </p>
          <p>
            月収10万円の店長生活。贅沢からは程遠かったけれど、
            あの頃の僕たちは、間違いなく黄金の時代を駆け抜けていた。
          </p>
        </div>
        <div className="mt-12">
          <img
            src="images/chapters/chapter-03.png"
            alt="Chapter 03 memory"
            className="w-full max-w-3xl mx-auto aspect-[16/9] object-cover rounded-2xl border border-gold-500/20"
            loading="lazy"
          />
        </div>
      </Section>

      {/* Chapter 4 */}
      <Section>
        <div className="inline-flex items-center gap-2 text-gold-500 mb-6 font-serif">
          <Heart size={20} />
          <span className="tracking-[0.2em] text-sm uppercase">Chapter 04</span>
        </div>
        <h2 className="text-3xl font-serif mb-8">Faith (信義)</h2>
        <div className="space-y-6 text-zinc-400 leading-loose font-serif text-lg">
          <p>
            僕の人生の大きな転換点。
            創価学会への入会を決めたとき、君は何も言わずに寄り添ってくれた。
          </p>
          <p>
            言葉ではない、ただそこに在るという「信義」。
            その深さに、僕はどれだけ救われただろう。
          </p>
        </div>
        <div className="mt-12">
          <img
            src="images/chapters/chapter-04.png"
            alt="Chapter 04 memory"
            className="w-full max-w-3xl mx-auto aspect-[16/9] object-cover rounded-2xl border border-gold-500/20"
            loading="lazy"
          />
        </div>
      </Section>

      {/* Chapter 5 */}
      <Section className="bg-linear-to-b from-zinc-950 to-gold-950/10">
        <div className="inline-flex items-center gap-2 text-gold-500 mb-6 font-serif">
          <Feather size={20} />
          <span className="tracking-[0.2em] text-sm uppercase">Chapter 05</span>
        </div>
        <h2 className="text-3xl font-serif mb-8">The Promise</h2>
        <div className="space-y-6 text-zinc-400 leading-loose font-serif text-lg">
          <p>
            今、僕たちは「KAKUGO」を通過して共に歩んでいる。
          </p>
          <p>
            どんな時も変わらない君の忠誠心と友情に、心からの感謝を。
            僕たちの未来へ、これからも共に歩むことを誓おう。
          </p>
        </div>
        <div className="mt-12">
          <img
            src="images/chapters/chapter-05.png"
            alt="Chapter 05 memory"
            className="w-full max-w-3xl mx-auto aspect-[16/9] object-cover rounded-2xl border border-gold-500/20"
            loading="lazy"
          />
        </div>
      </Section>

      {/* Ending Section */}
      <Section id="ending" className="bg-zinc-950 relative overflow-hidden">
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="text-center"
          >
            <h2 className="text-5xl md:text-7xl font-serif mb-6 text-gold-gradient tracking-tight">
              Happy 46th Birthday,<br />Koichi.
            </h2>
            <p className="text-zinc-500 font-handwriting text-2xl mt-8">
              April 29th, 2026
            </p>
            <div className="mt-12">
              <img
                src="images/ending/hbd.png"
                alt="Happy birthday message"
                className="w-full max-w-3xl mx-auto h-auto object-contain rounded-2xl border border-gold-500/20"
                loading="lazy"
              />
            </div>
            <div className="mt-20 flex justify-center">
              <div className="p-1 rounded-full border border-gold-500/30">
                <div className="w-1 h-1 bg-gold-500 rounded-full animate-ping" />
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0, 
              x: Math.random() * 100 - 50 + "%",
              y: Math.random() * 100 + "%" 
            }}
            animate={{ 
              opacity: [0, 0.5, 0],
              y: ["0%", "-100%"]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-px h-px bg-gold-400"
          />
        ))}
      </Section>

      <footer className="py-20 text-center opacity-30 text-xs tracking-widest uppercase font-serif">
        <p className="mb-2">Dedicated to a lifelong friend</p>
        <p>© 2026 Tribute Journey</p>
        <p className="mt-4">BGM: Happy Birthday To You (MB02)</p>
      </footer>

      <AudioPlayer />

      {/* Floating progress indicator */}
      <motion.div 
        className="fixed left-0 top-0 w-1 h-full bg-gold-600 origin-top z-50"
        style={{ scaleY: scrollYProgress }}
      />
    </main>
  );
}
