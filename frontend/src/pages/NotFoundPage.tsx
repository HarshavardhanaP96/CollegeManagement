import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-slate-600 mb-4">The page you are looking for could not be found.</p>
      <Link
        to="/"
        className="rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
      >
        Go to dashboard
      </Link>
    </div>
  );
}



