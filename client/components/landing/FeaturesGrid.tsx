"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Scan, Text, Network } from 'lucide-react';

const features = [
  {
    icon: <Scan className="w-5 h-5 text-white" />,
    title: "Gemini Vision OCR",
    description: "Itemized digital receipt parsing. Drop a blurry photo, and our vault extracts line items, taxes, and tips with optical precision.",
    tag: "Accuracy: 99.8%"
  },
  {
    icon: <Text className="w-5 h-5 text-white" />,
    title: "Natural Language",
    description: "Don't want to use a calculator? Just type \"I paid $50 for gas, Sarah owes me half\" in the glowing input UI, and the ledger updates instantly.",
    tag: "Instant parsing"
  },
  {
    icon: <Network className="w-5 h-5 text-white" />,
    title: "Greedy Simplification",
    description: "Our algorithmic engine collapses complex webs of debt. A chaotic weekend trip of 20 transfers minimizes to just a few direct payments.",
    tag: "Max N-1 transfers"
  }
];

export default function FeaturesGrid() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-32" id="features">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Intelligent Ledger Architecture</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: idx * 0.2 }}
            className="group relative flex flex-col p-8 bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
          >
            {/* Subtle top-right glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />

            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6">
              {feature.icon}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
            
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-8">
              {feature.description}
            </p>

            <div className="mt-auto flex">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                {feature.tag}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
