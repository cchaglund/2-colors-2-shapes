import { ChevronLeft } from 'lucide-react';
import { Link } from './Link';

export function BackToCanvasLink() {
    return (
        <Link
            href="/"
            className="inline-flex items-center gap-1 text-base hover:underline text-(--color-text-secondary) mb-4"
        >
            <ChevronLeft size={16} />
            <span className="hidden md:inline">Back to canvas</span>
        </Link>
    );
}
