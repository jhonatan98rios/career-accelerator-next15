import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { connectDB } from "@/lib/db";
import { Profile } from "@/models/Profile";

export default async function Header() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login?returnTo=/gateway");
  }

  await connectDB();

  const user = await Profile.findOne({ email: session.user.email });

  const avatar =
    "https://images.icon-icons.com/1736/PNG/512/4043233-anime-away-face-no-nobody-spirited_113254.png";

  return (
    <header className="w-full fixed z-50 flex items-center px-6 pl-16 md:pl-6 bg-white shadow-sm">
      <h1 className="flex-1 md:flex-none text-center md:text-left p-4 md:p-6 text-2xl font-extrabold whitespace-nowrap">
        🚀 AcelerAi
      </h1>

      <Link
        href={`/profile/${user?.id}/config`}
        className="flex items-center gap-3 hover:bg-gray-100 rounded-full px-3 py-2 transition"
      >
        <Image
          src={session.user.picture || avatar}
          alt="Profile"
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="hidden md:inline font-medium text-gray-700 whitespace-nowrap">
          {user?.name}
        </span>
      </Link>
    </header>
  );
}
