export function GET() {
  return new Response('google-site-verification: google0596062146e3b44e.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
