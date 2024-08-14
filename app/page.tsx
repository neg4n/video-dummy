import { VideoToolPanel } from "@/components/Video";

export default function Home() {
  return (
    <main className="flex flex-col gap-12 justify-center items-center pt-8">
      <div className="bg-gray-200 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] w-full max-w-4xl">
        <div className="bg-blue-800 text-white font-bold px-2 py-1 flex justify-between items-center">
          <h1>video-dummy</h1>
          <button className="bg-gray-200 text-black font-bold px-2 leading-none border-2 border-gray-400 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.25),-1px_-1px_0px_0px_rgba(255,255,255,1)]">
            ×
          </button>
        </div>
        <div className="p-4">
          <VideoToolPanel />
        </div>
      </div>
      <div className="bg-gray-200 border-2 border-gray-400 shadow-[2px_2px_0px_0px_rgba(255,255,255,1),-2px_-2px_0px_0px_rgba(0,0,0,0.25)] px-4 py-2">
        <p className="font-sans text-sm">
          created with <span className="text-red-600">&lt;3</span> by{" "}
          <a className="font-bold underline" href="https://github.com/neg4n/">Igor Klepacki (neg4n)</a>
        </p>
      </div>
    </main>
  );
}

export const dynamic = "force-static"
export const fetchCache = "force-cache"
