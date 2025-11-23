import type { LucideProps } from 'lucide-react';
import { Facebook, Instagram, LayoutDashboard, PencilRuler } from 'lucide-react';

const WordPress = (props: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 12c0 5.523 6.477 10 12 10C17.523 22 12 17.523 12 12zm0 0c0-5.523-6.477-10-12-10C6.477 2 12 6.477 12 12zm0 0c-5.523 0-10 4.477-10 10 5.523 0 10-4.477 10-10zm0 0c5.523 0 10-4.477 10-10-5.523 0-10 4.477-10 10zM6.51 7.21c-.42.27-.6.82-.41 1.28l3.1 7.63c.2.49.77.72 1.23.51l.39-.18.41-1.2-2.1-.98-.9-2.22 2.15-.99.39-1.2-.4-.17c-.51-.23-1.07.01-1.27.5zM12 12c.98 0 1.77.8 1.77 1.77s-.8 1.77-1.77 1.77-1.77-.8-1.77-1.77.8-1.77 1.77-1.77z" />
  </svg>
);

export const Icons = {
  Dashboard: LayoutDashboard,
  NewPost: PencilRuler,
  Facebook,
  Instagram,
  WordPress,
};
