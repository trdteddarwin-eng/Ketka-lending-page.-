import * as React from "react"
import { motion } from "framer-motion"

const PRIMARY = "#E63B2E"

export function LampBar() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "10rem",
        overflow: "visible",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        marginBottom: "-2rem",
        pointerEvents: "none",
      }}
    >
      {/* The bright line — light source */}
      <motion.div
        initial={{ width: "0rem", opacity: 0 }}
        whileInView={{ width: "20rem", opacity: 1 }}
        viewport={{ once: false }}
        transition={{ ease: "easeOut", delay: 0.2, duration: 0.8 }}
        style={{
          position: "absolute",
          zIndex: 50,
          height: "1px",
          top: "0",
          background: `linear-gradient(90deg, transparent, ${PRIMARY}, transparent)`,
        }}
      />

      {/* Sharp light beam — left side */}
      <motion.div
        initial={{ opacity: 0, width: "0rem" }}
        whileInView={{ opacity: 1, width: "40rem" }}
        viewport={{ once: false }}
        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
        style={{
          position: "absolute",
          right: "50%",
          top: "1px",
          height: "10rem",
          background: `linear-gradient(to bottom right, ${PRIMARY}18, transparent 60%)`,
          transformOrigin: "top right",
          zIndex: 5,
        }}
      />

      {/* Sharp light beam — right side */}
      <motion.div
        initial={{ opacity: 0, width: "0rem" }}
        whileInView={{ opacity: 1, width: "40rem" }}
        viewport={{ once: false }}
        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: "1px",
          height: "10rem",
          background: `linear-gradient(to bottom left, ${PRIMARY}18, transparent 60%)`,
          transformOrigin: "top left",
          zIndex: 5,
        }}
      />

      {/* Tiny glow dot at center of line */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.6, scale: 1 }}
        viewport={{ once: false }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          position: "absolute",
          top: "-4px",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: PRIMARY,
          boxShadow: `0 0 12px 4px ${PRIMARY}60`,
          zIndex: 60,
        }}
      />
    </div>
  )
}
