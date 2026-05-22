import { BrandMark } from "./brand-mark";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-black px-6 text-white">
      <div className="flex flex-col items-center text-center">
        <BrandMark className="animate-pulse text-[3rem] text-white" />
        <p className="mt-3 text-sm font-bold uppercase tracking-[0.24em] text-white/40">
          Preparing the details
        </p>
      </div>
    </main>
  );
}
