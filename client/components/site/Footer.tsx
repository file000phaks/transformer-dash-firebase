export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto grid gap-6 py-10 md:grid-cols-2 md:gap-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-cyan-500" />
            <span className="text-base font-semibold tracking-tight">Transformer Guard</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Wireless Transformer Monitoring & Intruder Detection powered by LoRaWAN.
          </p>
        </div>
        <div className="md:text-right">
          <p className="text-sm text-muted-foreground">
            Contact: <a className="underline hover:text-foreground" href="mailto:phakamilemlala1613@gmail.com">phakamilemlala1613@gmail.com</a>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">© {new Date().getFullYear()} Transformer Guard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
