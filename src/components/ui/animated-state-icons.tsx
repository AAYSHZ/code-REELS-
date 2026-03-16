"use client";

import { motion, AnimatePresence } from "framer-motion";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// ─── Heart Icon ────────────────────────────────────────────────────────
interface HeartIconProps extends IconProps {
  filled?: boolean;
  onClick?: () => void;
}

export function HeartIcon({ size = 24, color = "white", filled = false, onClick, className }: HeartIconProps) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? "pointer" : "default", display: "inline-flex" }}
      whileTap={{ scale: 0.8 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <AnimatePresence mode="wait">
          {filled ? (
            <motion.path
              key="filled"
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill={color}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          ) : (
            <motion.path
              key="outline"
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
            />
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
}

// ─── Notification Bell Icon ────────────────────────────────────────────
interface NotificationIconProps extends IconProps {
  hasNotification?: boolean;
  onClick?: () => void;
}

export function NotificationIcon({ size = 24, color = "white", hasNotification = false, onClick, className }: NotificationIconProps) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? "pointer" : "default", display: "inline-flex", position: "relative" }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={hasNotification ? { rotate: [0, 15, -15, 10, -10, 5, 0] } : {}}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.svg>
      <AnimatePresence>
        {hasNotification && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            style={{
              position: "absolute",
              top: -1,
              right: -1,
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: "50%",
              backgroundColor: "#FF4757",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Send Icon ─────────────────────────────────────────────────────────
interface SendIconProps extends IconProps {
  sending?: boolean;
  onClick?: () => void;
}

export function SendIcon({ size = 24, color = "white", sending = false, onClick, className }: SendIconProps) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? "pointer" : "default", display: "inline-flex" }}
      whileTap={{ scale: 0.85 }}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={sending ? { x: [0, 4, 0], opacity: [1, 0.6, 1] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        <motion.path
          d="M22 2L11 13"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          d="M22 2L15 22L11 13L2 9L22 2Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </motion.svg>
    </motion.div>
  );
}

// ─── Volume Icon ───────────────────────────────────────────────────────
interface VolumeIconProps extends IconProps {
  muted?: boolean;
  onClick?: () => void;
}

export function VolumeIcon({ size = 24, color = "white", muted = true, onClick, className }: VolumeIconProps) {
  return (
    <motion.div
      onClick={onClick}
      className={className}
      style={{ cursor: onClick ? "pointer" : "default", display: "inline-flex" }}
      whileTap={{ scale: 0.9 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Speaker body — always visible */}
        <path
          d="M11 5L6 9H2v6h4l5 4V5z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <AnimatePresence mode="wait">
          {muted ? (
            /* Muted X lines */
            <motion.g
              key="muted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.line
                x1="23" y1="9" x2="17" y2="15"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.05 }}
              />
              <motion.line
                x1="17" y1="9" x2="23" y2="15"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              />
            </motion.g>
          ) : (
            /* Sound waves */
            <motion.g
              key="unmuted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.path
                d="M15.54 8.46a5 5 0 0 1 0 7.07"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              />
              <motion.path
                d="M19.07 4.93a10 10 0 0 1 0 14.14"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </motion.div>
  );
}
