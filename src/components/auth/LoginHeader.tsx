import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const LoginHeader = () => {
  return (
    <motion.div 
      className="text-center mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mb-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-orange-600 rounded-xl">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            StackBuild
          </h1>
        </div>
      </div>
      <p className="text-slate-300 text-lg">
        Choose your dashboard to continue
      </p>
    </motion.div>
  );
};

export default LoginHeader;