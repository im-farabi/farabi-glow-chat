import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>© 2024 FARABI.me</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <a 
              href="https://openai.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Powered by AI
            </a>
            <a 
              href="https://www.anthropic.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              AI Resources
            </a>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Link to="/about#privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/about#terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
