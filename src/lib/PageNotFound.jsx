import { Link } from "react-router-dom";

export default function PageNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-heading text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl font-heading font-semibold text-foreground">Page Not Found</p>
      <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity">
        Go Home
      </Link>
    </div>
  );
}
