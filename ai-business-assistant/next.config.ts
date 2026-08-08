import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseOrigin = "https://*.supabase.co";
let supabaseWsHost = "*.supabase.co";
try {
  const parsed = new URL(supabaseUrl);
  supabaseOrigin = parsed.origin;
  supabaseWsHost = parsed.host;
} catch {
  /* use defaults when URL is not set at build time */
}

const cspDirectives = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://js.stripe.com",
    "https://m.stripe.network",
    "https://www.googletagmanager.com",
    "https://va.vercel-scripts.com",
  ]
    .filter(Boolean)
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  [
    "img-src",
    "'self'",
    "blob:",
    "data:",
    "https://*.supabase.co",
    "https://avatars.githubusercontent.com",
    "https://lh3.googleusercontent.com",
    "https://www.google-analytics.com",
  ].join(" "),
  "font-src 'self'",
  [
    "connect-src",
    "'self'",
    `wss://${supabaseWsHost}`,
    supabaseOrigin,
    "https://api.stripe.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://us.i.posthog.com",
    "https://us-assets.i.posthog.com",
    "https://va.vercel-scripts.com",
    isDev ? "ws://localhost:*" : "",
  ]
    .filter(Boolean)
    .join(" "),
  "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
];

const cspHeader = cspDirectives.join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspHeader },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "recharts"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }, ...securityHeaders],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/monitoring-tunnel/:path*",
        destination: "https://o0.ingest.sentry.io/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring-tunnel",
  sourcemaps: { disable: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
