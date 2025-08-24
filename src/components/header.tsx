import { getUserFromCookie } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";


export default async function Header() {
  // Server-side auth check
  const user = await getUserFromCookie();
  const avatar = "https://images.icon-icons.com/1736/PNG/512/4043233-anime-away-face-no-nobody-spirited_113254.png"

  return (
    <header className="w-full fixed z-50 flex justify-between items-center px-6 bg-white shadow-sm  overflow-x-scroll md:overflow-hidden">
      <h1 className="p-6 text-2xl font-extrabold whitespace-nowrap">🚀 AcelerAi</h1>

      <Link
        href={`/profile/${user?.id}/info`}
        className="flex items-center gap-3 hover:bg-gray-100 rounded-full px-3 py-2 transition"
      >
        <img
          src={avatar}
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="font-medium text-gray-700 whitespace-nowrap">{user?.name}</span>
      </Link>
    </header>
  );
}
