import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- CUSTOM HOOKS ---

/**
 * useInView Hook
 * Detects when an element enters the viewport using IntersectionObserver
 */
const useInView = (options) => {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (options?.triggerOnce) observer.unobserve(entry.target);
      } else if (!options?.triggerOnce) {
        setIsInView(false);
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options]);

  return [ref, isInView];
};

/**
 * useTypingEffect Hook
 * Cycles through an array of strings with a typing and deleting animation
 */
const useTypingEffect = (texts, speed = 100, delay = 2000) => {
  const [displayText, setDisplayText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[index % texts.length];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(currentText.substring(0, displayText.length + 1));
        if (displayText === currentText) {
          setTimeout(() => setIsDeleting(true), delay);
        }
      } else {
        setDisplayText(currentText.substring(0, displayText.length - 1));
        if (displayText === '') {
          setIsDeleting(false);
          setIndex(prev => prev + 1);
        }
      }
    }, isDeleting ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, index, texts, speed, delay]);

  return displayText;
};

/**
 * useCounter Hook
 * Animates a number from 0 to target when in view
 */
const useCounter = (target, duration = 2000, trigger = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    let start = 0;
    const end = parseInt(target);
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration, trigger]);

  return count;
};

// --- SUB-COMPONENTS ---

/**
 * ParticleCanvas Component
 * Animated floating dots and lines
 */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const particleCount = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.radius = Math.random() * 3 + 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.update();
        p.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    init();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};

/**
 * Section Wrapper
 * Handles the scroll fade-up animation
 */
const Section = ({ children, id, className = "" }) => {
  const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        } ${className}`}
    >
      {children}
    </section>
  );
};

// --- MAIN PORTFOLIO COMPONENT ---

const Portfolio = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const mainRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [formStatus, setFormStatus] = useState('idle'); // idle, sending, success, error
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      const response = await fetch('https://azad126141.app.n8n.cloud/webhook/5f52d54b-d24f-4656-a364-e87ef3adb82b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setFormStatus('success');
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setFormStatus('idle'), 5000);
      } else {
        setFormStatus('error');
      }
    } catch (err) {
      setFormStatus('error');
    }
  };

  const roles = [
    "Full Stack Developer",
    "React.js Developer",
    "Node.js Developer",
    "Python & Flask Developer",
    "Automation & AI Tools Expert"
  ];

  const typingText = useTypingEffect(roles);

  // Scroll effect for internal main container
  const handleMainScroll = (e) => {
    const mainEl = e.currentTarget;
    setScrolled(mainEl.scrollTop > 50);

    const sections = ['hero', 'skills', 'experience', 'projects', 'certificates', 'education', 'contact'];
    let current = activeSection;

    for (const section of sections) {
      const el = document.getElementById(section);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if section is significantly visible in the main viewport
        if (rect.top <= 200) {
          current = section;
        }
      }
    }
    if (current !== activeSection) {
      setActiveSection(current);
    }
  };

  useEffect(() => {
    // Initial check
    const sections = ['hero', 'skills', 'experience', 'projects', 'certificates', 'education', 'contact'];
    const currentHash = window.location.hash.replace('#', '');
    if (sections.includes(currentHash)) {
      setActiveSection(currentHash);
    }
  }, []);

  // ESC for Lightbox
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <div className="bg-[#cbd5e1] text-[#0f172a] font-sans selection:bg-[#2dd4bf]/20 overflow-x-hidden h-screen w-screen p-0">
      {/* Global CSS Injected via Style Tag */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .soft-bg {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
        }
        .glass-dashboard {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(40px);
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.05);
        }
        .sidebar-gradient {
          background: linear-gradient(180deg, #5eead4 0%, #0d9488 100%);
          border-radius: 50px;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 40px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.02);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);
        }
        .pastel-peach { background: rgba(254, 215, 215, 0.6); }
        .pastel-blue { background: rgba(191, 219, 254, 0.6); }
        .pastel-green { background: rgba(198, 246, 213, 0.6); }
        .pastel-purple { background: rgba(233, 213, 255, 0.6); }
        
        .nav-item {
          transition: all 0.3s ease;
          border-radius: 20px;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .nav-item.active {
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .shimmer-text {
          color: #0f172a;
        }
        .skill-bar-fill {
          height: 100%;
          background: #2dd4bf;
          border-radius: 20px;
        }
        .glow-button {
          background: #2dd4bf;
          color: white;
          padding: 16px 32px;
          border-radius: 30px;
          font-weight: 700;
          transition: all 0.3s ease;
          box-shadow: 0 10px 20px -5px rgba(45, 212, 191, 0.4);
        }
        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -10px rgba(45, 212, 191, 0.6);
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        .bottom-nav {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="glass-dashboard h-full w-full max-w-[1600px] mx-auto flex flex-col md:flex-row overflow-hidden border border-white relative">
        {/* Background Branded Watermark */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
          <img
            src="./assets/azad_image.png"
            alt=""
            className="w-full h-full object-cover grayscale blur-[2px] scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/40" />
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-6 bg-white/40 backdrop-blur-lg border-b border-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full border border-white/50 overflow-hidden shadow-sm">
              <img src="./assets/azad_image.png" alt="Azad" className="w-full h-full object-cover" />
            </div>
            <span className="font-black text-xl tracking-tighter">Azad</span>
          </div>
          <div className="px-3 py-1 bg-green-400/20 text-green-600 rounded-full text-[10px] font-bold animate-pulse">ONLINE</div>
        </div>

        {/* Sidebar Navigation (Desktop) */}
        <aside className="hidden md:flex w-80 sidebar-gradient p-4 flex-col text-white relative m-2">
          <div className="flex flex-col items-center mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 overflow-hidden mb-2 bg-white/20">
              <img
                src="./assets/azad_image.png"
                alt="Azad"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Azad&background=random"; }}
              />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Azad</h1>
            <p className="text-white/70 text-xs mt-2 font-medium">Full Stack Software Engineer</p>
          </div>

          <nav className="space-y-1.5 flex-grow">
            {[
              { id: 'hero', icon: 'https://img.icons8.com/ios-filled/100/0d9488/home.png', black: 'https://img.icons8.com/ios-filled/100/ffffff/home.png', label: 'Home' },
              { id: 'skills', icon: 'https://img.icons8.com/ios-filled/100/0d9488/brain.png', black: 'https://img.icons8.com/ios-filled/100/ffffff/brain.png', label: 'Skills' },
              { id: 'experience', icon: 'https://img.icons8.com/ios-filled/100/0d9488/stopwatch.png', black: 'https://img.icons8.com/ios-filled/100/ffffff/stopwatch.png', label: 'Experience' },
              { id: 'projects', icon: 'https://img.icons8.com/ios-filled/100/0d9488/opened-folder.png', black: 'https://img.icons8.com/ios-filled/100/ffffff/opened-folder.png', label: 'Projects' },
              { id: 'contact', icon: 'https://img.icons8.com/ios-filled/100/0d9488/new-post.png', black: 'https://img.icons8.com/ios-filled/100/ffffff/new-post.png', label: 'Contact' }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`nav-item flex flex-col items-center space-y-1.5 p-2 rounded-[24px] transition-all ${activeSection === item.id ? '' : 'opacity-70 hover:opacity-100'
                  }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 rounded-2xl transition-all duration-300 ${activeSection === item.id ? 'bg-white/10 shadow-lg border border-white/20' : ''}`}>
                  <img src={activeSection === item.id ? item.icon : item.black} alt={item.label} className="w-6 h-6 object-contain" />
                </div>
                <span className="font-bold text-[10px] uppercase tracking-tighter text-center">{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-4">
            <div className="p-3 bg-white/10 rounded-[20px] text-center border border-white/10">
              <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Live Status</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-tight">AVAILABLE_FOR_WORK</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          ref={mainRef}
          onScroll={handleMainScroll}
          className="flex-grow p-6 md:p-12 overflow-y-auto overflow-x-hidden h-full pb-32 md:pb-12 custom-scrollbar"
        >

          {/* --- SECTION 2: HERO --- */}
          <section id="hero" className="relative min-h-[250px] md:min-h-[350px] flex items-center justify-center mb-6">
            <div className="glass-card p-4 md:p-8 w-full max-w-4xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-peach-100 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

              <div className="relative z-10 text-center">
                <div className="inline-block px-4 py-1.5 bg-[#2dd4bf]/10 text-[#2dd4bf] rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
                  Portfolio Manifest • 2026
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-[#0f172a] mb-2 tracking-tighter leading-none">
                  Hello, I'm <span className="text-[#2dd4bf]">Azad</span>
                </h1>

                <div className="text-xl md:text-2xl text-[#64748b] mb-4 font-medium min-h-[25px]">
                  {`> `}<span>{typingText}</span>
                  <span className="inline-block w-1 h-5 md:h-6 bg-[#2dd4bf] ml-1 animate-pulse" />
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
                  <div className="p-2 md:p-4 bg-slate-50/50 rounded-[16px] md:rounded-[24px] border border-white">
                    <p className="text-lg md:text-xl font-black text-[#0f172a]">1.5+</p>
                    <p className="text-[7px] md:text-[9px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">Years</p>
                  </div>
                  <div className="p-2 md:p-4 bg-slate-50/50 rounded-[16px] md:rounded-[24px] border border-white">
                    <p className="text-lg md:text-xl font-black text-[#0f172a]">10+</p>
                    <p className="text-[7px] md:text-[9px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">Projects</p>
                  </div>
                  <div className="p-2 md:p-4 bg-slate-50/50 rounded-[16px] md:rounded-[24px] border border-white">
                    <p className="text-lg md:text-xl font-black text-[#0f172a]">3+</p>
                    <p className="text-[7px] md:text-[9px] font-bold text-[#64748b] uppercase tracking-widest mt-0.5">Countries</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3">
                  <a href="#projects" className="glow-button w-full sm:w-auto px-5 py-2.5 text-xs md:text-sm">
                    Explore Lab
                  </a>
                  <a href="./azad_new_resume.pdf" download="azad_new_resume.pdf" className="w-full sm:w-auto px-5 py-2.5 rounded-full border-2 border-slate-200 text-[#0f172a] font-bold hover:bg-slate-50 transition-all text-xs md:text-sm">
                    Download_CV
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* --- SECTION 3: ABOUT --- */}
          <Section id="about" className="py-4 max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 flex justify-center">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-[#2563eb] p-2 relative group">
                  <div className="w-full h-full rounded-full bg-white overflow-hidden shadow-xl">
                    <img
                      src="./assets/azad_image.png"
                      alt="Azad Profile"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Azad&background=2563eb&color=fff"; }}
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#7c3aed] animate-[spin_20s_linear_infinite] opacity-30" />
                </div>
              </div>

              <div className="md:col-span-8">
                <h2 className="text-3xl md:text-5xl font-bold mb-6 shimmer-text">About Me</h2>
                <p className="text-[#64748b] text-base md:text-lg leading-relaxed mb-8">
                  I'm a Full Stack Developer with 1.5+ years of experience at Morpheme Webnexus Pvt Ltd, where I built and shipped 4 live production applications for clients in India, Australia, and the US. I specialise in React.js, Node.js, PostgreSQL, and automation workflows using n8n. I'm passionate about building robust, scalable solutions that solve real-world problems. B.Tech graduate in AI & ML from AKTU University.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard icon="./assets/project.png" value="4" label="Live Projects" />
                  <StatCard icon="https://img.icons8.com/fluency/96/stopwatch.png" value="1.5" label="Years Experience" decimals={1} />
                  <StatCard icon="./assets/Countries_Served.png" value="3" label="Countries Served" />
                </div>
              </div>
            </div>
          </Section>

          {/* --- SECTION 4: SKILLS --- */}
          <Section id="skills" className="py-4">
            <h2 className="text-4xl md:text-6xl font-black mb-4 text-[#0f172a] tracking-tighter text-center">CORE SKILLS</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkillCard icon="react" title="Frontend" skills={["React.js", "Redux", "JS", "HTML", "CSS"]} percent={90} theme="pastel-peach" />
              <SkillCard icon="https://img.icons8.com/fluency/96/artificial-intelligence.png" title="AI Dev" skills={["Cursor", "GitHub Copilot", "Lovable", "ChatGPT"]} percent={92} theme="pastel-blue" />
              <SkillCard icon="nodedotjs" title="Backend" skills={["Node.js", "Express", "Python", "Flask", "Auth"]} percent={85} theme="pastel-green" />
              <SkillCard icon="n8n" title="Automation" skills={["n8n", "Google APIs", "Meta APIs", "Bots"]} percent={85} theme="pastel-purple" />
              <SkillCard icon="postgresql" title="Databases" skills={["PostgreSQL", "Supabase", "Redis"]} percent={80} theme="pastel-peach" />
              <SkillCard icon="git" title="Tools" skills={["Git", "GitHub", "Postman", "CORS"]} percent={88} theme="pastel-blue" />
            </div>
          </Section>

          {/* --- SECTION 5: EXPERIENCE --- */}
          <Section id="experience" className="py-8 max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 shimmer-text">Work Experience</h2>

            <div>
              <div className="glass-card p-6 md:p-8 relative">
                <h3 className="text-2xl font-bold text-[#0f172a]">Full Stack Developer</h3>
                <p className="text-[#2dd4bf] font-semibold mb-2">Morpheme Webnexus Pvt Ltd</p>
                <p className="text-[#64748b] text-sm mb-4 uppercase tracking-widest">Nov 2023 – May 7, 2026 | Greater Noida, India</p>

                <ul className="space-y-3">
                  {[
                    "Built and deployed 4 production web applications for clients across India, Australia, and the US",
                    "Designed REST APIs with JWT authentication and role-based access control for multi-tenant systems",
                    "Implemented Redis caching for high-frequency queries, improving backend response performance",
                    "Developed n8n automation workflows integrating Google, Meta, Notion, Slack, and WhatsApp APIs",
                    "Built WhatsApp-based multi-channel outreach system for a political campaign platform at scale",
                    "Delivered end-to-end features from design to production, collaborating directly with international clients"
                  ].map((point, i) => (
                    <li key={i} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-[#2dd4bf] rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-[#64748b] text-sm md:text-base">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          {/* --- SECTION 6: PROJECTS --- */}
          <Section id="projects" className="py-8 max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center shimmer-text">Featured Projects</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <ProjectCard
                name="Pathway"
                desc="School & Institution Management System. Full-stack academic platform with timetable generation, role-based dashboards, and attendance tracking."
                tech={["React.js", "Node.js", "Express.js", "PostgreSQL"]}
                link="https://pathway.hireacoder.in/"
              />
              <ProjectCard
                name="MyConnexa"
                desc="Election Campaign Intelligence Platform. AI-powered campaign platform with voter segmentation, real-time analytics, and WhatsApp outreach."
                tech={["React.js", "Flask", "Python", "Supabase"]}
                link="https://www.myconnexa.app/"
              />
              <ProjectCard
                name="ShowTrail"
                desc="Influencer & Brand Admin Panel. Scalable admin panel for influencer-brand workflows, Amazon listings, and giveaway campaigns."
                tech={["React.js", "Node.js", "Express.js", "PostgreSQL"]}
                link="https://admin.showtrail.app/auth"
              />
              <ProjectCard
                name="The Growth Agent"
                desc="AI Business Solutions Website. Responsive business site with lead-gen CTAs and automated onboarding workflows."
                tech={["React.js", "n8n", "Lovable AI"]}
                link="https://www.thegrowthagent.com.au/"
              />
            </div>
          </Section>

          {/* --- SECTION 7: CERTIFICATES --- */}
          <Section id="certificates" className="py-8 max-w-7xl mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 shimmer-text">Certificates & Degrees</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {["B.Tech Degree", "12th Certificate", "10th Certificate"].map((title, i) => {
                const certImages = {
                  "B.Tech Degree": "./assets/btech.png",
                  "12th Certificate": "./assets/12th_class.png",
                  "10th Certificate": "./assets/10th_class.png",
                };
                const hasImage = certImages[title];

                return (
                  <div key={i} className="glass-card p-6 flex flex-col items-center">
                    <div className="w-full aspect-[4/3] border-2 border-[#2dd4bf]/10 rounded-2xl flex items-center justify-center bg-slate-50 mb-4 overflow-hidden group relative">
                      {hasImage ? (
                        <img
                          src={hasImage}
                          alt={title}
                          onClick={() => setLightbox({ title, img: hasImage })}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <span className="text-[#64748b] font-medium group-hover:text-[#2dd4bf] transition-colors">{title} Preview</span>
                      )}
                    </div>
                    <h4 className="text-lg font-bold mb-4 text-[#0f172a]">{title}</h4>
                    <button
                      onClick={() => setLightbox({ title, img: hasImage })}
                      className="w-full py-2 bg-[#2dd4bf]/5 border border-[#2dd4bf]/20 text-[#2dd4bf] rounded-lg hover:bg-[#2dd4bf] hover:text-white transition-all font-semibold"
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>

          </Section>

          {/* --- SECTION 8: EDUCATION --- */}
          <Section id="education" className="py-8 max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-[#0f172a] tracking-tighter text-center">EDUCATION</h2>

            <div className="space-y-6">
              <EducationCard
                title="B.Tech in AI & ML"
                school="RD Engineering College, AKTU University"
                year="2021–2025"
                score="65%"
                icon="./assets/btech.png"
                theme="pastel-blue"
              />
              <EducationCard
                title="12th – Senior Secondary"
                school="Ch. Chhabil Dass Public School"
                year="2020–2021"
                score="75%"
                icon="./assets/12th_class.png"
                theme="pastel-peach"
              />
              <EducationCard
                title="10th – Secondary"
                school="Spring Dale School"
                year="2018–2019"
                score="75%"
                icon="./assets/10th_class.png"
                theme="pastel-green"
              />
            </div>
          </Section>

          {/* --- SECTION 9: CONTACT --- */}
          <Section id="contact" className="py-8 max-w-7xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-center text-[#0f172a] tracking-tighter">GET IN TOUCH</h2>

            <div className="grid lg:grid-cols-2 gap-8 items-stretch max-w-6xl mx-auto">
              <div className="flex flex-col space-y-3 w-full h-full">
                <ContactInfoCard isBrand={true} icon="https://img.icons8.com/color/96/gmail-new.png" label="Email" value="azadm6484@gmail.com" />
                <ContactInfoCard isBrand={true} icon="https://img.icons8.com/color/96/phone.png" label="Phone" value="+91-8383895123" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=902+-+New+Hindan+Vihar,+Hazz+house+colony,+Mohan+Nagar,+201007+Ghaziabad,+India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <ContactInfoCard icon="googlemaps" label="Location" value="902 - New Hindan Vihar, Hazz house colony, Mohan Nagar, 201007 Ghaziabad, India" />
                </a>
                {/* <ContactInfoCard icon="clockify" label="Availability" value="Active / Open to Work" /> */}

                {/* Embedded Map - Flex-1 to fill height */}
                <div className="w-full flex-1 min-h-[250px] rounded-[24px] overflow-hidden border border-white shadow-lg relative group">
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] pointer-events-none group-hover:bg-transparent transition-all duration-500"></div>
                  <iframe
                    src="https://maps.google.com/maps?q=902%20-%20New%20Hindan%20Vihar,%20Hazz%20house%20colony,%20Mohan%20Nagar,%20201007%20Ghaziabad,%20India&t=&z=14&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) brightness(0.95)' }}
                    allowFullScreen=""
                    loading="lazy"
                  ></iframe>
                </div>
              </div>

              <div className="glass-card p-8 border border-white w-full">
                <form onSubmit={handleFormSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-[#64748b] mb-2 uppercase tracking-[0.2em] ml-4">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white/90 border border-slate-200 rounded-[24px] text-[#0f172a] px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#2dd4bf]/20 focus:bg-white transition-all font-bold text-sm placeholder:text-[#94a3b8]"
                      placeholder="Your Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#64748b] mb-2 uppercase tracking-[0.2em] ml-4">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/90 border border-slate-200 rounded-[24px] text-[#0f172a] px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-[#2dd4bf]/20 focus:bg-white transition-all font-bold text-sm placeholder:text-[#94a3b8]"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#64748b] mb-2 uppercase tracking-[0.2em] ml-4">Message</label>
                    <textarea
                      rows="6"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-white/90 border border-slate-200 rounded-[30px] text-[#0f172a] px-6 py-4 focus:outline-none focus:ring-4 focus:ring-[#2dd4bf]/20 focus:bg-white transition-all font-bold text-sm placeholder:text-[#94a3b8] resize-none"
                      placeholder="How can I help you?"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={formStatus === 'sending'}
                    className={`glow-button w-full py-4 shadow-lg transition-all ${formStatus === 'success' ? 'bg-green-500 hover:bg-green-600' :
                      formStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : ''
                      }`}
                  >
                    {formStatus === 'sending' ? 'TRANSMITTING...' :
                      formStatus === 'success' ? 'MESSAGE_SENT!' :
                        formStatus === 'error' ? 'RETRY_SUBMISSION' : 'INITIATE_MESSAGE'}
                  </button>
                  {formStatus === 'success' && (
                    <p className="text-center text-green-600 font-bold text-xs animate-bounce mt-2">Thank you! Your message reached the lab.</p>
                  )}
                </form>
              </div>
            </div>
          </Section>

          {/* --- SECTION 10: FOOTER --- */}
          <footer className="py-8 bg-white/40 backdrop-blur-xl text-center rounded-[32px] mx-4 my-0 border border-white shadow-xl">
            <p className="text-[#64748b] mb-6 font-bold text-xs tracking-widest uppercase">Laboratory Session Ended • Azad © 2026</p>
            <div className="flex justify-center space-x-6 md:space-x-8">
              <SocialIcon icon="github" href="https://github.com/azadm6484" />
              <SocialIcon icon="https://img.icons8.com/fluency/96/linkedin.png" href="https://www.linkedin.com/in/mohd-azad-04857230a" />
              <SocialIcon icon="instagram" href="https://www.instagram.com/_azad_126" />
              <SocialIcon icon="gmail" href="mailto:azadm6484@gmail.com" />
            </div>
          </footer>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-white/60 backdrop-blur-2xl rounded-[32px] z-50 flex items-center justify-around px-4 border border-white/50 shadow-2xl">
          {[
            { id: 'hero', teal: 'https://img.icons8.com/ios-filled/100/0d9488/home.png', black: 'https://img.icons8.com/ios-filled/100/000000/home.png', label: 'Home' },
            { id: 'skills', teal: 'https://img.icons8.com/ios-filled/100/0d9488/brain.png', black: 'https://img.icons8.com/ios-filled/100/000000/brain.png', label: 'Skills' },
            { id: 'experience', teal: 'https://img.icons8.com/ios-filled/100/0d9488/stopwatch.png', black: 'https://img.icons8.com/ios-filled/100/000000/stopwatch.png', label: 'Experience' },
            { id: 'projects', teal: 'https://img.icons8.com/ios-filled/100/0d9488/opened-folder.png', black: 'https://img.icons8.com/ios-filled/100/000000/opened-folder.png', label: 'Projects' },
            { id: 'contact', teal: 'https://img.icons8.com/ios-filled/100/0d9488/new-post.png', black: 'https://img.icons8.com/ios-filled/100/000000/new-post.png', label: 'Contact' }
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveSection(item.id)}
              className="w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300"
            >
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${activeSection === item.id ? 'bg-white/20 shadow-sm border border-white/30' : ''}`}>
                <img
                  src={activeSection === item.id ? item.teal : item.black}
                  className={`w-6 h-6 object-contain transition-all duration-300 ${activeSection === item.id ? '' : 'opacity-60'}`}
                  alt={item.id}
                />
              </div>
            </a>
          ))}
        </nav>

        {/* Global Lightbox Viewer */}
        {lightbox && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12">
            <div
              className="absolute inset-0 bg-white/40 backdrop-blur-[100px] transition-all duration-500"
              onClick={() => setLightbox(null)}
            />
            <div className="relative w-full max-w-6xl max-h-screen overflow-y-auto no-scrollbar animate-[scale_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] z-[1010]">
              <div className="fixed top-8 right-8 z-[1100]">
                <button
                  onClick={() => setLightbox(null)}
                  className="w-16 h-16 bg-white/20 backdrop-blur-2xl text-[#0f172a] border border-white/30 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-2xl group"
                >
                  <span className="text-3xl font-light transform group-hover:rotate-90 transition-transform duration-300">✕</span>
                </button>
              </div>
              <div className="w-full flex justify-center py-20 px-4">
                {lightbox.img ? (
                  <img
                    src={lightbox.img}
                    alt={lightbox.title}
                    className="w-full h-auto rounded-[32px] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border-8 border-white/50"
                  />
                ) : (
                  <div className="w-full max-w-2xl aspect-video bg-white/20 backdrop-blur-md border-4 border-dashed border-white/40 rounded-[60px] flex items-center justify-center text-2xl font-black text-[#64748b] tracking-tighter">
                    [ NO_ASSET_FOUND ]
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const StatCard = ({ icon, value, label, decimals = 0 }) => {
  const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const count = useCounter(value, 2000, isInView);

  return (
    <div ref={ref} className="glass-card p-6 text-center transform hover:scale-105 transition-transform">
      <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-3xl flex items-center justify-center p-2 shadow-sm border border-white overflow-hidden">
        <img
          src={icon}
          alt={label}
          className="w-full h-full object-contain rounded-xl transform scale-110"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://ui-avatars.com/api/?name=Stat&background=random";
          }}
        />
      </div>
      <div className="text-3xl font-bold text-[#0f172a] mb-1">
        {decimals > 0 ? count.toFixed(decimals) : count}+
      </div>
      <div className="text-[#64748b] text-[10px] uppercase font-black tracking-widest leading-tight">{label}</div>
    </div>
  );
};

const SkillCard = ({ icon, title, skills, percent, theme = "glass-card" }) => {
  const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <div ref={ref} className={`${theme} glass-card p-10 group transition-all`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white/80 rounded-2xl flex items-center justify-center p-3 shadow-sm group-hover:scale-110 transition-transform duration-500">
            <img
              src={icon.startsWith('http') ? icon : `https://cdn.simpleicons.org/${icon}`}
              alt={title}
              className="w-full h-full object-contain rounded-[5px]"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://ui-avatars.com/api/?name=Azad&background=random";
              }}
            />
          </div>
          <h3 className="text-xl font-black text-[#0f172a] tracking-tighter uppercase">{title}</h3>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-10">
        {skills.map(skill => (
          <span key={skill} className="px-4 py-1.5 bg-white/50 text-[#64748b] text-[10px] font-black rounded-full border border-white shadow-sm">
            {skill}
          </span>
        ))}
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center font-bold text-[10px] uppercase tracking-widest text-[#94a3b8]">
          <span>Efficiency</span>
          <span className="text-[#0f172a]">{percent}%</span>
        </div>
        <div className="relative h-3 w-full bg-white/30 rounded-full overflow-hidden p-0.5 border border-white">
          <div
            className="skill-bar-fill"
            style={{ width: isInView ? `${percent}%` : '0%' }}
          />
        </div>
      </div>
    </div>
  );
};


const ProjectCard = ({ name, desc, tech, link }) => {
  const tiltRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, shineX: 50, shineY: 50 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (centerY - y) / 25;
    const rotateY = (x - centerX) / 25;
    setTilt({ x: rotateX, y: rotateY, shineX: (x / rect.width) * 100, shineY: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0, shineX: 50, shineY: 50 });

  return (
    <div
      ref={tiltRef}
      className="glass-card overflow-hidden group relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <div className="h-2 w-full bg-gradient-to-r from-[#2dd4bf] to-[#0d9488]" />
      <div className="p-8">
        <h3 className="text-2xl font-bold mb-4 text-[#0f172a]">{name}</h3>
        <p className="text-[#64748b] mb-6 leading-relaxed font-medium">{desc}</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {tech.map(t => (
            <span key={t} className="px-3 py-1 border border-[#2dd4bf]/20 text-[#2dd4bf] text-xs font-bold rounded-lg uppercase">
              {t}
            </span>
          ))}
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-[#2dd4bf] font-bold hover:translate-x-2 transition-transform"
        >
          Live Demo <span className="ml-2">→</span>
        </a>
      </div>

      {/* Dynamic Shine Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${tilt.shineX}% ${tilt.shineY}%, rgba(37, 99, 235, 0.1) 0%, transparent 60%)`
        }}
      />
    </div>
  );
};

const EducationCard = ({ title, school, year, score, icon, theme = "glass-card" }) => {
  const [ref, isInView] = useInView({ threshold: 0.1, triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`${theme} glass-card p-6 md:p-8 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8 transition-all duration-1000 transform relative overflow-hidden ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
        }`}
    >
      <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-white shrink-0 overflow-hidden p-1">
        {icon.includes('.') ? (
          <img src={icon} alt="Marksheet" className="w-full h-full object-contain rounded-xl" />
        ) : (
          <span className="text-4xl">{icon}</span>
        )}
      </div>

      <div className="flex-1 text-center md:text-left w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 items-center md:items-start">
          <h3 className="text-xl md:text-2xl font-black text-[#0f172a] tracking-tight">{title}</h3>
          <span className="px-4 py-1 bg-white/40 text-[#2dd4bf] text-xs font-bold rounded-full border border-white whitespace-nowrap">
            {year}
          </span>
        </div>
        <p className="text-[#64748b] mb-4 font-bold text-sm md:text-base">{school}</p>
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-green-500/10 text-green-600 text-xs font-black rounded-full border border-green-500/10">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>SCORE: {score}</span>
        </div>
      </div>
    </div>
  );
};

const ContactInfoCard = ({ icon, label, value, isBrand = false }) => (
  <div className="glass-card p-4 flex flex-col md:flex-row items-center text-center md:text-left space-y-3 md:space-y-0 md:space-x-5 hover:border-[#2dd4bf]/40 transition-colors w-full">
    <div className="w-11 h-11 bg-white/80 rounded-xl flex items-center justify-center p-2.5 shadow-sm border border-white shrink-0">
      <img
        src={isBrand ? icon : `https://cdn.simpleicons.org/${icon}`}
        alt={label}
        className="w-full h-full object-contain"
      />
    </div>
    <div>
      <p className="text-[#64748b] text-[9px] uppercase tracking-widest font-black mb-0.5">{label}</p>
      <p className="text-base font-black text-[#0f172a] tracking-tight leading-tight">{value}</p>
    </div>
  </div>
);

const SocialIcon = ({ icon, href }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-14 h-14 bg-white/80 border border-white flex items-center justify-center rounded-[24px] hover:bg-[#2dd4bf]/20 transition-all group shadow-sm"
  >
    <img
      src={icon.includes('/') ? icon : `https://cdn.simpleicons.org/${icon}`}
      className="w-6 h-6 object-contain group-hover:scale-110 transition-transform"
      alt="Social"
    />
  </a>
);

export default Portfolio;
