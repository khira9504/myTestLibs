export const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} E-Commerce. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
