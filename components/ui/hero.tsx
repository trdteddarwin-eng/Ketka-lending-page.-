import * as React from "react"
import { motion } from "framer-motion"

const PRIMARY = "#E63B2E"

export function LampBar() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "6rem",
        overflow: "visible",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        marginBottom: "2rem",
      }}
    >
      {/* Main glow */}
      <div style={{ position: "absolute", zIndex: 10, height: "5rem", width: "28rem", top: "0", borderRadius: "9999px", background: PRIMARY, opacity: 0.25, filter: "blur(40px)" }} />

      {/* Lamp pulse */}
      <motion.div
        initial={{ width: "8rem" }}
        viewport={{ once: true }}
        transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
        whileInView={{ width: "16rem" }}
        style={{ position: "absolute", top: "-1rem", zIndex: 20, height: "5rem", borderRadius: "9999px", background: PRIMARY, opacity: 0.3, filter: "blur(24px)" }}
      />

      {/* Top line */}
      <motion.div
        initial={{ width: "15rem" }}
        viewport={{ once: true }}
        transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
        whileInView={{ width: "30rem" }}
        style={{ position: "absolute", zIndex: 50, height: "2px", top: "0", background: PRIMARY, opacity: 0.6 }}
      />

      {/* Left cone */}
      <motion.div
        initial={{ opacity: 0.3, width: "15rem" }}
        whileInView={{ opacity: 0.7, width: "30rem" }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        style={{
          position: "absolute",
          right: "50%",
          top: 0,
          height: "6rem",
          overflow: "visible",
          backgroundImage: `conic-gradient(from 70deg at center top, ${PRIMARY}66, transparent, transparent)`,
          zIndex: 5,
        }}
      />

      {/* Right cone */}
      <motion.div
        initial={{ opacity: 0.3, width: "15rem" }}
        whileInView={{ opacity: 0.7, width: "30rem" }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          height: "6rem",
          overflow: "visible",
          backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${PRIMARY}66)`,
          zIndex: 5,
        }}
      />
    </div>
  )
}
