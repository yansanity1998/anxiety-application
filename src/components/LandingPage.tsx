import { useState, useEffect, useRef } from 'react';
import { FaBrain, FaHeart, FaUsers, FaShieldAlt, FaChevronLeft, FaChevronRight, FaTimes, FaArrowDown, FaStar, FaQuoteLeft, FaPlay, FaCheckCircle, FaAward, FaClock, FaGraduationCap } from 'react-icons/fa';
import Login from '../auth/Login';
import Register from '../auth/Register';

// CSS-in-JS styles for smooth animations
const animationStyles = `
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeInLeft {
    0% {
      opacity: 0;
      transform: translateX(-30px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInRight {
    0% {
      opacity: 0;
      transform: translateX(30px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.8);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes slideInFromTop {
    0% {
      opacity: 0;
      transform: translateY(-50px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .animate-fade-in-left {
    animation: fadeInLeft 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .animate-fade-in-right {
    animation: fadeInRight 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .animate-fade-in-scale {
    animation: fadeInScale 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .animate-slide-in-top {
    animation: slideInFromTop 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
  }
  
  .animation-delay-400 {
    animation-delay: 0.4s;
  }
  
  .animation-delay-600 {
    animation-delay: 0.6s;
  }
  
  .animation-delay-800 {
    animation-delay: 0.8s;
  }
  
  .animation-delay-1000 {
    animation-delay: 1s;
  }
`;

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<{[key: string]: boolean}>({});
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Inject animation styles and scroll to top on mount
  useEffect(() => {
    // Scroll to top when landing page loads
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    // Trigger page load animations
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.head.removeChild(styleElement);
    };
  }, []);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (showLogin || showRegister) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLogin, showRegister]);

  // Handle ESC key to close modals with animation
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showLogin || showRegister) {
          setIsClosing(true);
          setTimeout(() => {
            setShowLogin(false);
            setShowRegister(false);
            setIsClosing(false);
          }, 300); // Match animation duration
        }
      }
    };

    // Add event listener when modals are open
    if (showLogin || showRegister) {
      document.addEventListener('keydown', handleEscKey);
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showLogin, showRegister]);

  const carouselImages = [
    {
      src: '/guidance 5.png',
      title: 'Personalized Care Approach',
      description: 'Experience tailored support designed specifically for your needs'
    },
    {
      src: '/guidance 2.jpg',
      title: 'Safe Space for Healing',
      description: 'A secure environment where you can express yourself freely'
    },
    {
      src: '/guidance 3.jpg',
      title: 'Community & Growth',
      description: 'Join a supportive community focused on mental wellness'
    },
    {
      src: '/guidance 1.jpg',
      title: 'Professional Guidance Support',
      description: 'Connect with certified counselors who understand your journey'
    },
    {
      src: '/guidance 4.jpg',
      title: 'Mindful Wellness Journey',
      description: 'Discover inner peace through guided mindfulness and meditation'
    }
  ];

  // Auto-advance carousel every 4 seconds with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Intersection Observer for scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const handleLoginSwitch = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleRegisterSwitch = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const closeLoginModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowLogin(false);
      setIsClosing(false);
    }, 300);
  };

  const closeRegisterModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowRegister(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Full-Width Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Hero Image with Enhanced Animations */}
        <div className={`absolute inset-0 overflow-hidden ${isPageLoaded ? 'animate-carousel-entrance' : 'opacity-0'}`}>
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                index === currentSlide
                  ? 'opacity-100 scale-100 translate-x-0'
                  : index < currentSlide
                  ? 'opacity-0 scale-110 -translate-x-full'
                  : 'opacity-0 scale-110 translate-x-full'
              }`}
            >
              <img
                src={image.src}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
            </div>
          ))}
        </div>

        {/* Floating Header */}
        <header className="absolute top-0 left-0 right-0 z-20 flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-6 gap-3 backdrop-blur-md bg-white/10">
  <div className={`flex items-center gap-2 sm:gap-3 flex-shrink min-w-0 opacity-0 ${isPageLoaded ? 'animate-fade-in-left' : ''}`}>
    <img 
      src="/spc-guidance.png" 
      alt="spc-guidance Logo" 
      className={`w-8 h-8 sm:w-15 sm:h-15 object-contain opacity-0 ${isPageLoaded ? 'animate-fade-in-scale animation-delay-200' : ''}`}
    />
    <div className="min-w-0">
      <h1 className={`text-base sm:text-lg md:text-3xl font-bold text-white drop-shadow-lg truncate opacity-0 ${isPageLoaded ? 'animate-slide-in-top animation-delay-400' : ''}`}>
        Anxiety Support System
      </h1>
      <p className={`text-[10px] sm:text-xs md:text-sm text-white/90 drop-shadow opacity-0 ${isPageLoaded ? 'animate-fade-in-up animation-delay-600' : ''}`}>
        Your journey to wellness starts here
      </p>
    </div>
  </div>
  <button
    onClick={() => setShowLogin(true)}
    className={`bg-red-900 text-white border-red-900 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-semibold shadow-lg hover:bg-red-800 transform hover:scale-105 transition-all duration-300 opacity-0 ${isPageLoaded ? 'animate-fade-in-right animation-delay-800' : ''}`}
  >
    Login
  </button>
</header>


        {/* Hero Content with Animated Text */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-2xl md:text-5xl lg:text-5xl font-bold text-white drop-shadow-2xl leading-tight transition-all duration-700 ease-in-out">
              <span className={`block mb-2 sm:mb-2 opacity-0 ${isPageLoaded ? 'animate-fade-in-up animation-delay-400' : ''}`}>Manage Anxiety</span>
              <span className={`text-1xl sm:text-2xl md:text-3xl lg:text-3xl font-light text-white/90 opacity-0 ${isPageLoaded ? 'animate-fade-in-up animation-delay-600' : ''}`}>
                with Professional Guidance
              </span>
            </h2>
            <div className="transition-all duration-500 ease-in-out transform">
              <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg opacity-0 ${isPageLoaded ? 'animate-fade-in-up animation-delay-800' : ''}`}>
                {carouselImages[currentSlide].description}
              </p>
            </div>
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 opacity-0 ${isPageLoaded ? 'animate-fade-in-up animation-delay-1000' : ''}`}>
              <button
                onClick={() => setShowLogin(true)}
                className="bg-gradient-to-r from-[#800000] to-[#a00000] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 min-w-[200px]"
              >
                Get Started Today
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:bg-white/30 transform hover:scale-105 transition-all duration-300 min-w-[200px] flex items-center gap-2"
              >
                Learn More <FaArrowDown className="text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={prevSlide}
          className={`absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20 opacity-0 ${isPageLoaded ? 'animate-fade-in-left animation-delay-1000' : ''}`}
        >
          <FaChevronLeft className="text-lg sm:text-xl" />
        </button>
        <button
          onClick={nextSlide}
          className={`absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20 opacity-0 ${isPageLoaded ? 'animate-fade-in-right animation-delay-1000' : ''}`}
        >
          <FaChevronRight className="text-lg sm:text-xl" />
        </button>

        {/* Carousel Indicators */}
        <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20 opacity-0 ${isPageLoaded ? 'animate-fade-in-up animation-delay-1000' : ''}`}>
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 bg-gradient-to-br from-gray-50 to-white">
        {/* Statistics Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-[#800000] to-[#a00000] relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Trusted by Students Nationwide
              </h3>
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Join thousands who have transformed their mental health journey
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">1K+</div>
                  <div className="text-sm sm:text-base text-white/80 font-medium">Active Students</div>
                  <div className="text-xs text-white/60 mt-1">In St. Peter's College</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">98%</div>
                  <div className="text-sm sm:text-base text-white/80 font-medium">Success Rate</div>
                  <div className="text-xs text-white/60 mt-1">Anxiety Reduction</div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">24/7</div>
                  <div className="text-sm sm:text-base text-white/80 font-medium">Support Available</div>
                  <div className="text-xs text-white/60 mt-1">Guidance Counselor  </div>
                </div>
              </div>
              <div className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 transform hover:scale-105 transition-all duration-300 hover:bg-white/20">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300">4.9</div>
                  <div className="text-sm sm:text-base text-white/80 font-medium flex items-center justify-center gap-1">
                    <FaStar className="text-yellow-300" />
                    <span>Rating</span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">From 5,000+ Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto" data-animate id="how-it-works">
          <div className={`transition-all duration-1000 ${isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-16">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#800000] to-[#a00000] bg-clip-text text-transparent">
                Your Path to Wellness in 3 Simple Steps
              </h3>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Start your mental health journey with our proven, step-by-step approach designed specifically for students
              </p>
            </div>
            
            <div className="relative">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-all duration-300">
                      <FaGraduationCap className="text-white text-2xl sm:text-3xl" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      1
                    </div>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 group-hover:text-[#800000] transition-colors duration-300">
                    Complete Assessment
                  </h4>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Take our comprehensive anxiety assessment designed by licensed therapists to understand your unique needs and triggers.
                  </p>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-gray-200/50">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                      <FaClock className="text-[#800000]" />
                      <span className="font-medium">Takes only 5 minutes</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-all duration-300">
                      <FaBrain className="text-white text-2xl sm:text-3xl" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      2
                    </div>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 group-hover:text-[#800000] transition-colors duration-300">
                    Get Matched
                  </h4>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Our AI-powered system connects you with the perfect counselor and creates a personalized treatment plan just for you.
                  </p>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-gray-200/50">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                      <FaAward className="text-[#800000]" />
                      <span className="font-medium">Certified professionals only</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center group">
                  <div className="relative mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-all duration-300">
                      <FaHeart className="text-white text-2xl sm:text-3xl" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      3
                    </div>
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 group-hover:text-[#800000] transition-colors duration-300">
                    Start Healing
                  </h4>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Begin your journey with interactive CBT modules, mindfulness exercises, and regular check-ins with your counselor.
                  </p>
                  <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-gray-200/50">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                      <FaCheckCircle className="text-[#800000]" />
                      <span className="font-medium">See results in 2 weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          id="features" 
          className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto bg-gradient-to-br from-gray-50 to-white"
          data-animate
        >
          <div className={`transition-all duration-1000 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-12 sm:mb-16">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-[#800000] to-[#a00000] bg-clip-text text-transparent">
                Your Mental Wellness Companion
              </h3>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Experience a comprehensive approach to anxiety management with tools designed specifically for students and young adults
              </p>
            </div>

            {/* Enhanced Feature Cards with Staggered Animation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
              <div 
                className={`group bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-[#800000]/10 hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: '100ms' }}
              >
                <div className="bg-gradient-to-r from-[#800000] to-[#a00000] p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300"> 
                  <FaBrain className="text-white text-2xl" /> 
                </div> 
                <h3 className="text-xl font-bold text-[#800000] mb-4 group-hover:text-[#a00000] transition-colors duration-300">24/7 Expert Support</h3> 
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300"> 
                  Access certified counselors and mental health professionals anytime you need support, guidance, or just someone to talk to.
                </p> 
                <div className="mt-4 text-sm text-[#800000] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  → Available around the clock
                </div>
              </div>

              <div 
                className={`group bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-[#800000]/10 hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: '200ms' }}
              >
                <div className="bg-gradient-to-r from-[#800000] to-[#a00000] p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaHeart className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-[#800000] mb-4 group-hover:text-[#a00000] transition-colors duration-300">Personalized Journey</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Get customized coping strategies, mindfulness exercises, and progress tracking tailored to your unique anxiety patterns.
                </p>
                <div className="mt-4 text-sm text-[#800000] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  → Tailored just for you
                </div>
              </div>

              <div 
                className={`group bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-[#800000]/10 hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: '300ms' }}
              >
                <div className="bg-gradient-to-r from-[#800000] to-[#a00000] p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaShieldAlt className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-[#800000] mb-4 group-hover:text-[#a00000] transition-colors duration-300">Complete Privacy</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Share your thoughts and feelings in a completely confidential, secure environment with end-to-end encryption.
                </p>
                <div className="mt-4 text-sm text-[#800000] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  → Your safety guaranteed
                </div>
              </div>

              <div 
                className={`group bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-xl border border-[#800000]/10 hover:shadow-2xl transition-all duration-700 transform hover:scale-105 hover:-translate-y-2 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: '400ms' }}
              >
                <div className="bg-gradient-to-r from-[#800000] to-[#a00000] p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FaUsers className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-[#800000] mb-4 group-hover:text-[#a00000] transition-colors duration-300">Supportive Community</h3>
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                  Connect with peers who understand your journey and share experiences in moderated, safe group sessions.
                </p>
                <div className="mt-4 text-sm text-[#800000] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  → You're never alone
                </div>
              </div>
            </div>

            {/* Video Demo Section */}
            <div className={`mt-16 sm:mt-20 transition-all duration-1000 delay-500 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 sm:p-12 border border-gray-200/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500 rounded-full filter blur-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl"></div>
                </div>
                <div className="relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    <div>
                      <h4 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
                        See How It Works
                      </h4>
                      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        Watch how our platform helps students like you overcome anxiety and build confidence through personalized support and evidence-based techniques.
                      </p>
                      <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-white text-xs" />
                          </div>
                          <span className="text-gray-700 font-medium">Interactive CBT modules</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-white text-xs" />
                          </div>
                          <span className="text-gray-700 font-medium">Real-time progress tracking</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <FaCheckCircle className="text-white text-xs" />
                          </div>
                          <span className="text-gray-700 font-medium">24/7 professional support</span>
                        </div>
                      </div>
                      <button className="bg-gradient-to-r from-[#800000] to-[#a00000] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3">
                        <FaPlay className="text-sm" />
                        Watch Demo Video
                      </button>
                    </div>
                    <div className="relative">
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-all duration-300">
                        <div className="bg-gradient-to-br from-[#800000] to-[#a00000] rounded-xl p-6 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            </div>
                            <span className="text-white/70 text-sm">Anxiety Support Dashboard</span>
                          </div>
                          <div className="space-y-3">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm">Daily Check-in</span>
                                <span className="text-green-300 text-xs">Completed</span>
                              </div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm">CBT Module 3</span>
                                <span className="text-yellow-300 text-xs">In Progress</span>
                              </div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-white text-sm">Counselor Session</span>
                                <span className="text-blue-300 text-xs">Tomorrow 2PM</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-white/30 transition-colors duration-300">
                            <FaPlay className="text-white text-xl ml-1" />
                          </div>
                          <p className="text-white/80 text-sm">2 min demo video</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-white to-gray-50" data-animate id="testimonials">
          <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-16">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#800000] to-[#a00000] bg-clip-text text-transparent">
                What Students Are Saying
              </h3>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Real stories from students who transformed their mental health journey with our support
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] to-[#a00000]"></div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-full flex items-center justify-center mr-4">
                      <FaQuoteLeft className="text-white text-lg" />
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-sm" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    "This platform completely changed how I handle my anxiety. The CBT modules are so easy to follow, and having a counselor available 24/7 gave me the confidence I needed."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      J
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Jesper B.</div>
                      <div className="text-sm text-gray-500">BSIT Student, SPC</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] to-[#a00000]"></div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-full flex items-center justify-center mr-4">
                      <FaQuoteLeft className="text-white text-lg" />
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-sm" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    "I was skeptical at first, but the personalized approach and the supportive community made all the difference. My panic attacks have reduced by 90% in just 3 months."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      T
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Tristan B.</div>
                      <div className="text-sm text-gray-500">BSIT Student, SPC</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="group">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] to-[#a00000]"></div>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#800000] to-[#a00000] rounded-full flex items-center justify-center mr-4">
                      <FaQuoteLeft className="text-white text-lg" />
                    </div>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className="text-sm" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 italic">
                    "The progress tracking feature helped me see how far I've come. It's amazing to look back and see the improvement in my daily anxiety levels and overall mood."
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                      R
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Romarc B.</div>
                      <div className="text-sm text-gray-500">BSIT Student, SPC</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-2xl font-bold text-gray-800">4.9/5</span>
                </div>
                <div className="text-gray-600">
                  <div className="font-semibold">Average Rating</div>
                  <div className="text-sm">From 5,000+ verified reviews</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Call to Action */}
        <section 
          id="cta" 
          className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto"
          data-animate
        >
          <div className={`transition-all duration-1000 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative bg-gradient-to-r from-[#800000] via-[#900000] to-[#a00000] rounded-3xl p-8 sm:p-12 lg:p-16 text-white shadow-2xl overflow-hidden">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="mb-8">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 animate-fade-in">
                    Ready to Transform Your Mental Health?
                  </h3>
                  <p className="text-lg sm:text-xl mb-6 opacity-90 max-w-3xl mx-auto leading-relaxed">
                    Join thousands of students who have already taken the first step towards a calmer, more confident life. 
                    Your journey to wellness starts with a single click.
                  </p>
                  
                  {/* Stats Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-10">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 transform hover:scale-105 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-2">95%</div>
                      <div className="text-sm opacity-90">Report Reduced Anxiety</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 transform hover:scale-105 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-2">24/7</div>
                      <div className="text-sm opacity-90">Professional Support</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 transform hover:scale-105 transition-all duration-300">
                      <div className="text-2xl sm:text-3xl font-bold mb-2">10K+</div>
                      <div className="text-sm opacity-90">Students Helped</div>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
                  <button
                    onClick={() => setShowLogin(true)}
                    className="group bg-white text-[#800000] px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 min-w-[220px] justify-center"
                  >
                    <span>Start Your Journey</span>
                    <div className="transform group-hover:translate-x-1 transition-transform duration-300">→</div>
                  </button>
                  <button
                    onClick={() => setShowRegister(true)}
                    className="bg-transparent border-2 border-white text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-semibold text-lg sm:text-xl shadow-lg hover:bg-white hover:text-[#800000] transform hover:scale-105 transition-all duration-300 min-w-[220px]"
                  >
                    Create Free Account
                  </button>
                </div>
                
                {/* Trust Indicators */}
                <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm opacity-90">
                    <div className="flex items-center gap-2">
                      <FaShieldAlt className="text-green-300" />
                      <span>100% Confidential</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>•</span>
                      <span>Free to Start</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>•</span>
                      <span>No Credit Card Required</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Login Modal */}
      {(showLogin || (isClosing && !showRegister)) && (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isClosing && !showRegister ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4 transition-all duration-300 ${isClosing && !showRegister ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            <button
              onClick={closeLoginModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition-colors"
            >
              <FaTimes className="text-lg sm:text-xl" />
            </button>
            <div className="p-2">
              <Login onSwitch={handleLoginSwitch} />
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {(showRegister || (isClosing && !showLogin)) && (
        <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isClosing && !showLogin ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4 transition-all duration-300 ${isClosing && !showLogin ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            <button
              onClick={closeRegisterModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 transition-colors"
            >
              <FaTimes className="text-lg sm:text-xl" />
            </button>
            <div className="p-2">
              <Register onSwitch={handleRegisterSwitch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
