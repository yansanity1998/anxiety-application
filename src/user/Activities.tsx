import { useState } from 'react';
import { 
  FaArrowLeft, 
  FaGamepad, 
  FaHeart, 
  FaBrain,
  FaLeaf,
  FaSpa,
  FaTrophy,
  FaFire
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import AnxietyReliefGame from './components/AnxietyReliefGame';
import BrainTrainingGame from './components/BrainTrainingGame';

const Activities = () => {
  const navigate = useNavigate();
  const [userData] = useState(null); // You can pass actual userData if needed

  const goBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#800000]/5 w-full" style={{ maxWidth: '100vw' }}>
      {/* Header */}
      <div className="bg-[#800000] border-b border-white/10 sticky top-0 z-50 shadow-lg w-full backdrop-blur-sm">
        <div className="relative px-3 sm:px-4 md:px-6 py-3 sm:py-4 w-full max-w-full">
          <div className="flex items-center justify-between w-full max-w-full">
            {/* Left: Back Button & Title */}
            <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={goBack}
                className="flex-shrink-0 bg-white/10 hover:bg-white/20 rounded-full transition-colors w-10 h-10 flex items-center justify-center border border-white/20"
                aria-label="Go back to dashboard"
              >
                <FaArrowLeft className="text-white text-base" />
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <img 
                    src="/lotus.png" 
                    alt="Lotus" 
                    className="h-8 w-8 sm:h-10 sm:w-10" 
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 
                    className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate"
                    style={{ 
                      textShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 30px rgba(255,255,255,0.15)'
                    }}
                  >
                    Activities
                  </h1>
                  <p className="text-xs sm:text-sm text-white/80 truncate">
                    Fun wellness challenges & games
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 overflow-x-hidden">
        
        {/* Welcome Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl p-6 shadow-xl border border-purple-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FaGamepad className="text-white text-2xl" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Wellness Activities
                </h2>
                <p className="text-gray-600 text-sm">
                  Interactive games and challenges designed to help manage anxiety and improve mental wellness
                </p>
              </div>
            </div>
            
            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FaHeart className="text-white text-sm" />
                </div>
                <div className="text-lg font-bold text-green-600">2</div>
                <div className="text-xs text-gray-600">Games</div>
              </div>
              
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FaBrain className="text-white text-sm" />
                </div>
                <div className="text-lg font-bold text-blue-600">∞</div>
                <div className="text-xs text-gray-600">Levels</div>
              </div>
              
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FaFire className="text-white text-sm" />
                </div>
                <div className="text-lg font-bold text-orange-600">Fun</div>
                <div className="text-xs text-gray-600">Factor</div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
              <FaSpa className="text-white text-lg" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-800 bg-clip-text text-transparent">
                Why Play Wellness Games?
              </h2>
            </div>
          </div>
          
          <div className="relative">
            <div 
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {[
                {
                  icon: FaBrain,
                  title: 'Cognitive Training',
                  description: 'Improve focus & attention',
                  gradient: 'from-blue-500 to-indigo-600',
                  bgGradient: 'from-blue-50 to-indigo-100'
                },
                {
                  icon: FaHeart,
                  title: 'Stress Reduction',
                  description: 'Lower anxiety levels',
                  gradient: 'from-pink-500 to-red-600',
                  bgGradient: 'from-pink-50 to-red-100'
                },
                {
                  icon: FaLeaf,
                  title: 'Mindfulness Practice',
                  description: 'Present-moment awareness',
                  gradient: 'from-green-500 to-emerald-600',
                  bgGradient: 'from-green-50 to-emerald-100'
                },
                {
                  icon: FaTrophy,
                  title: 'Achievement & Growth',
                  description: 'Build confidence & progress',
                  gradient: 'from-yellow-500 to-orange-600',
                  bgGradient: 'from-yellow-50 to-orange-100'
                }
              ].map((benefit, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-48 bg-gradient-to-br ${benefit.bgGradient} rounded-xl p-3 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105`}
                >
                  <div className={`w-10 h-10 bg-gradient-to-r ${benefit.gradient} rounded-lg flex items-center justify-center mb-2 shadow-lg`}>
                    <benefit.icon className="text-white text-sm" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1 text-sm">{benefit.title}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Game Section */}
        <AnxietyReliefGame userData={userData} />

        {/* Brain Training Game */}
        <BrainTrainingGame userData={userData} />

        {/* Coming Soon Section */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl shadow-lg">
              <FaGamepad className="text-white text-lg" />
            </div>
            <div>
              <h2 className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-800 bg-clip-text text-transparent">
                More Games Coming Soon
              </h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: 'Breathing Bubble Pop',
                description: 'Pop bubbles in sync with your breathing rhythm',
                icon: '🫧',
                status: 'In Development'
              },
              {
                title: 'Meditation Garden',
                description: 'Grow a virtual garden through mindfulness practice',
                icon: '🌱',
                status: 'Coming Soon'
              },
              {
                title: 'Anxiety Monster Tamer',
                description: 'Transform anxious thoughts into friendly companions',
                icon: '👾',
                status: 'Planned'
              },
              {
                title: 'Calm Color Match',
                description: 'Soothing color-matching game for relaxation',
                icon: '🎨',
                status: 'Planned'
              }
            ].map((game, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-lg border border-gray-200 opacity-75"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{game.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-700">{game.title}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded-full font-medium">
                      {game.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">{game.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activities;
