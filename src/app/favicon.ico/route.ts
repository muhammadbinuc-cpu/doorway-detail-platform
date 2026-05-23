const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M11 42 23 26l7 10 12-18 17 24" fill="none" stroke="#C9A227" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M18 47 34 24l12 18" fill="none" stroke="#C9A227" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M48 8v7M48 23v7M37 19h7M52 19h7M24 9v4M24 18v4M18 15h4M26 15h4M57 27v3M57 34v3M52 32h3M59 32h3" fill="none" stroke="#C9A227" stroke-width="3" stroke-linecap="round" />
</svg>`;

export function GET(): Response {
  return new Response(favicon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
