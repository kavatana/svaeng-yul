import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="starfield relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Brand showTagline />
        </div>
        {children}
        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Practice Demography, Nursing Sciences, History, Infection Disease
          Agents, and Embryology.
        </p>
      </div>
    </div>
  );
}
