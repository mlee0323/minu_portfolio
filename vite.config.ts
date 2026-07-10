import react from "@vitejs/plugin-react"
import type { Plugin } from "vite"
import { defineConfig } from "vite"

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "form-action 'none'",
  "script-src 'self' https://w.soundcloud.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://picsum.photos https://fastly.picsum.photos https://*.sndcdn.com https://*.blob.vercel-storage.com",
  "media-src 'self' blob: data: https://*.blob.vercel-storage.com",
  "frame-src https://w.soundcloud.com",
  "child-src https://w.soundcloud.com",
  "connect-src 'self' http://127.0.0.1:* ws://127.0.0.1:* http://localhost:* ws://localhost:* https://api.soundcloud.com https://*.soundcloud.com https://*.sndcdn.com https://blob.vercel-storage.com https://*.blob.vercel-storage.com",
  "font-src 'self' data:",
  "manifest-src 'self'",
].join("; ")

const developmentContentSecurityPolicy = contentSecurityPolicy.replace(
  "script-src 'self' https://w.soundcloud.com",
  "script-src 'self' 'unsafe-inline' https://w.soundcloud.com",
)

const securityHeaders = {
  "Content-Security-Policy": `${contentSecurityPolicy}; frame-ancestors 'none'`,
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
} as const

const developmentSecurityHeaders = {
  ...securityHeaders,
  "Content-Security-Policy": `${developmentContentSecurityPolicy}; frame-ancestors 'none'`,
} as const

const contentSecurityPolicyMetaPlugin = {
  name: "content-security-policy-meta",
  apply: "build",
  transformIndexHtml() {
    return [
      {
        tag: "meta",
        attrs: {
          "http-equiv": "Content-Security-Policy",
          content: contentSecurityPolicy,
        },
        injectTo: "head-prepend",
      },
    ]
  },
} satisfies Plugin

export default defineConfig(({ mode }) => ({
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
  },
  plugins: [react(), contentSecurityPolicyMetaPlugin],
  preview: {
    headers: securityHeaders,
  },
  server: {
    headers: developmentSecurityHeaders,
  },
}))
