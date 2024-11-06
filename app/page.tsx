import { AddUML } from "@/components/AddClassCard";
import Canvas from "@/components/Canvas";

export default function Home() {
  return (
    <div className="w-full h-screen flex">
      {/* Sidebar */}
      <section className="w-1/5 h-full py-5 px-2 bg-gray-100">
        <AddUML />
      </section>

      {/* Main Content */}
      <section className="w-4/5 h-full bg-white">
        <Canvas />
      </section>
    </div>
  );
}
