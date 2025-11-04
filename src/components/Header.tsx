const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-center py-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              FARABI
            </span>
            <span className="text-muted-foreground/50">.me</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Let's start chatting
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
