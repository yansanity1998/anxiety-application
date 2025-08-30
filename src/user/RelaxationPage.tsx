import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaLeaf } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import RelaxationTools from './components/RelaxationTools';

const RelaxationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-emerald-50">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-teal-500 via-green-600 to-emerald-600 p-4 sm:p-6 shadow-lg"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaArrowLeft className="text-white" />
            </motion.button>
            
            <div className="flex items-center gap-3">
              <motion.div
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                  y: [0, -2, 0]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <FaLeaf className="text-white text-xl" />
              </motion.div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Relaxation Center</h1>
                <p className="text-white/80 text-sm sm:text-base">Find your path to inner peace and calm</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <RelaxationTools />
        </motion.div>

        {/* Additional Info Section */}
        <motion.div 
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-teal-200 shadow-lg">
            <h3 className="text-lg font-bold text-teal-800 mb-3">Benefits of Relaxation</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Reduces stress and anxiety</li>
              <li>• Improves sleep quality</li>
              <li>• Lowers blood pressure</li>
              <li>• Enhances mental clarity</li>
              <li>• Boosts immune system</li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-200 shadow-lg">
            <h3 className="text-lg font-bold text-green-800 mb-3">Quick Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Practice regularly for best results</li>
              <li>• Find a quiet, comfortable space</li>
              <li>• Use headphones for immersive experience</li>
              <li>• Start with shorter sessions</li>
              <li>• Be patient with yourself</li>
            </ul>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-lg">
            <h3 className="text-lg font-bold text-emerald-800 mb-3">When to Practice</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Morning: Start your day calm</li>
              <li>• Work breaks: Reset and refocus</li>
              <li>• Evening: Unwind and de-stress</li>
              <li>• Before sleep: Prepare for rest</li>
              <li>• Anytime: When feeling overwhelmed</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RelaxationPage; 