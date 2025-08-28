import { useState, useEffect, useRef } from 'react';
import { FaBrain, FaHeart, FaUsers, FaShieldAlt, FaChevronLeft, FaChevronRight, FaTimes, FaArrowDown } from 'react-icons/fa';
import Login from '../auth/Login';
import Register from '../auth/Register';

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<{[key: string]: boolean}>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  const carouselImages = [
    {
      src: '/guidance 1.jpg',
      title: 'Professional Guidance Support',
      description: 'Connect with certified counselors who understand your journey'
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
    }
  ];

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 2000);

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

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Full-Width Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <img
            src={carouselImages[currentSlide].src}
            alt={carouselImages[currentSlide].title}
            className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"></div>
        </div>

        {/* Floating Header */}
        <header className="absolute top-0 left-0 right-0 z-20 flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-6 gap-3 backdrop-blur-md bg-white/10">
  <div className="flex items-center gap-2 sm:gap-3 flex-shrink min-w-0">
    <img 
      src="/lotus.png" 
      alt="Lotus Logo" 
      className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
    />
    <div className="min-w-0">
      <h1 className="text-base sm:text-lg md:text-3xl font-bold text-white drop-shadow-lg truncate">
        Anxiety Support System
      </h1>
      <p className="text-[10px] sm:text-xs md:text-sm text-white/90 drop-shadow">
        Your journey to wellness starts here
      </p>
    </div>
  </div>
  <button
    onClick={() => setShowLogin(true)}
    className="bg-red-900 text-white border-red-900 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm md:text-base font-semibold shadow-lg hover:bg-red-800 transform hover:scale-105 transition-all duration-300"
  >
    Login
  </button>
</header>


        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 z-10">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-2xl md:text-5xl lg:text-5xl font-bold text-white drop-shadow-2xl leading-tight">
              <span className="block mb-2 sm:mb-2">Manage Anxiety</span>
              <span className="text-1xl sm:text-2xl md:text-3xl lg:text-3xl font-light text-white/90">
                with Professional Guidance
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              {carouselImages[currentSlide].description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
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
          className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
        >
          <FaChevronLeft className="text-lg sm:text-xl" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
        >
          <FaChevronRight className="text-lg sm:text-xl" />
        </button>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
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
        {/* Features Section */}
        <section 
          id="features" 
          className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto"
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

            {/* Additional Benefits Section */}
            <div className={`mt-16 sm:mt-20 transition-all duration-1000 delay-500 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 sm:p-12 border border-gray-200/50">
                <div className="text-center mb-8">
                  <h4 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">What Makes Us Different?</h4>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    We combine evidence-based therapy techniques with modern technology to create a comprehensive support system
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  <div className="text-center group">
                    <div className="bg-white p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                      <div className="text-3xl mb-4">🧠</div>
                      <h5 className="font-bold text-gray-800 mb-2">CBT Modules</h5>
                      <p className="text-sm text-gray-600">Interactive cognitive behavioral therapy exercises</p>
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="bg-white p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                      <div className="text-3xl mb-4">🎯</div>
                      <h5 className="font-bold text-gray-800 mb-2">Progress Tracking</h5>
                      <p className="text-sm text-gray-600">Visual insights into your mental wellness journey</p>
                    </div>
                  </div>
                  <div className="text-center group">
                    <div className="bg-white p-6 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                      <div className="text-3xl mb-4">🌟</div>
                      <h5 className="font-bold text-gray-800 mb-2">Gamification</h5>
                      <p className="text-sm text-gray-600">Achieve milestones and build healthy habits</p>
                    </div>
                  </div>
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
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
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
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
            <button
              onClick={() => setShowRegister(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
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
