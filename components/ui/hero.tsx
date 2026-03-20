import * as React from "react"
import { motion } from "framer-motion"

const PRIMARY = "#E63B2E"

export function LampBar() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "14rem",
        overflow: "visible",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        marginBottom: "-4rem",
        pointerEvents: "none",
      }}
    >
      {/* Thin bright line at top — the "lamp" source */}
      <motion.div
        initial={{ width: "10rem", opacity: 0 }}
        viewport={{ once: true }}
        transition={{ ease: "easeInOut", delay: 0.2, duration: 0.8 }}
        whileInView={{ width: "24rem", opacity: 0.7 }}
        style={{
          position: "absolute",
          zIndex: 50,
          height: "2px",
          top: "0",
          background: PRIMARY,
        }}
      />

      {/* Small concentrated glow right behind the line */}
      <motion.div
        initial={{ width: "6rem", opacity: 0 }}
        viewport={{ once: true }}
        transition={{ ease: "easeInOut", delay: 0.3, duration: 0.8 }}
        whileInView={{ width: "12rem", opacity: 0.35 }}
        style={{
          position: "absolute",
          top: "-0.5rem",
          zIndex: 20,
          height: "3rem",
          borderRadius: "9999px",
          background: PRIMARY,
          filter: "blur(16px)",
        }}
      />

      {/* Left light cone — shining DOWN onto the cards */}
      <motion.div
        initial={{ opacity: 0, width: "12rem" }}
        whileInView={{ opacity: 1, width: "28rem" }}
        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
        style={{
          position: "absolute",
          right: "50%",
          top: 0,
          height: "14rem",
          backgroundImage: `conic-gradient(from 70deg at center top, ${PRIMARY}22, transparent 40%, transparent)`,
          zIndex: 5,
        }}
      />

      {/* Right light cone — shining DOWN onto the cards */}
      <motion.div
        initial={{ opacity: 0, width: "12rem" }}
        whileInView={{ opacity: 1, width: "28rem" }}
        transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          height: "14rem",
          backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent 60%, ${PRIMARY}22)`,
          zIndex: 5,
        }}
      />

      {/* Soft downward gradient wash — the "reflected light" on the cards area */}
      <div
        style={{
          position: "absolute",
          top: "1rem",
          width: "70%",
          height: "12rem",
          background: `radial-gradient(ellipse at center top, ${PRIMARY}12 0%, ${PRIMARY}08 30%, transparent 70%)`,
          zIndex: 3,
        }}
      />
    </div>
  )
}
