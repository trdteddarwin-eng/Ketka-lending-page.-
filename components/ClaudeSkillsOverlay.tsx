import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hero } from "@/components/ui/hero"

interface ClaudeSkillsOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function ClaudeSkillsOverlay({ isOpen, onClose }: ClaudeSkillsOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] bg-background"
          style={{ background: "#0a0a0a" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="fixed top-6 right-6 z-[9999] w-10 h-10 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <Hero
            className="!min-h-screen !rounded-none"
            style={{ background: "#0a0a0a" }}
            title={
              <>
                <span className="text-white">Claude Code Skills</span>
                <br />
                <span className="text-white/40 text-3xl md:text-5xl font-normal italic">/ Open Claw</span>
              </>
            }
            subtitle="AI agents that handle complex, multi-step jobs — from video creation to research pipelines. Give it a task, get back finished work."
            titleClassName="text-5xl md:text-7xl font-extrabold"
            subtitleClassName="text-lg md:text-xl max-w-[700px] text-white/50"
            actions={[
              {
                label: "Motion Graphic Video — $50",
                href: "https://buy.stripe.com/test_bJe3co3MV6Ms14k9xt6oo04",
                variant: "default",
              },
              {
                label: "Research Agent — $50",
                href: "https://buy.stripe.com/test_dRmeV6bfnb2I8wM3956oo05",
                variant: "outline",
              },
            ]}
            actionsClassName="mt-8 flex-col sm:flex-row"
          />

          {/* Skills detail cards */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-12">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="border border-white/10 rounded-lg p-6 bg-white/5 backdrop-blur"
              >
                <div className="text-2xl mb-2">🎬</div>
                <h3 className="text-white font-bold text-lg mb-1">Motion Graphic Video</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Give it a topic. Get back a fully produced video — script, narration, sound effects, and rendered output. No editing needed.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Script</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Narration</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">SFX</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Render</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="border border-white/10 rounded-lg p-6 bg-white/5 backdrop-blur"
              >
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="text-white font-bold text-lg mb-1">Research Agent</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Scrapes websites, builds dossiers, designs spec sites, and drafts personalized outreach — all in one pipeline run.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Research</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Design</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Deploy</span>
                  <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">Email</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
