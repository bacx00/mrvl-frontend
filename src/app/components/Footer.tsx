export default function Footer(){
  return(
    <footer className="text-center py-4" style={{background:'var(--primary)',color:'var(--bg)'}}>
      <div className="container small">
        <p className="mb-2">© 2025 Mrvl.Net. All rights reserved.</p>
        <a href="/privacy" className="me-3">Privacy</a>
        <a href="/terms"   className="me-3">Terms</a>
        <a href="https://twitter.com"  target="_blank"  className="me-3">Twitter</a>
        <a href="https://discord.com"  target="_blank"  rel="noopener">Discord</a>
      </div>
    </footer>
  );
}
