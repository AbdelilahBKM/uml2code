import Link from "next/link";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter();
    const goBack = () => {
        router.back();
    }
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Oops! The page you are looking for does not exist.</p>
      <Button onClick={goBack}>
            Go Back
      </Button>
    </div>
  );
}