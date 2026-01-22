import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-bags-border">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
          {/* Logo Image */}
          <div className="relative">
            <img 
              src="/bagscheck.png" 
              alt="BagsCheck" 
              className="w-18 h-18 transition-transform group-hover:scale-105" 
            />
          </div>
          
          {/* Text Logo */}
          <h1 className="text-xl font-bold tracking-tight">
            <span className="text-white">Bags</span>
            <span className="text-bags-green">Check</span>
          </h1>
        </Link>

        {/* Right side - reserved for future */}
        <div className="flex items-center gap-3">
          {/* Empty for now */}
        </div>
      </div>
    </header>
  );
}
