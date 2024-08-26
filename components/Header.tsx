import Image from "next/image";
import Link from "next/link";
import logo from "../public/logo.png";
import GithubIcon from "./github-icon";
import galleryIcon from "../public/down-arrow.svg";
import togetherAI from "../public/togetherAI.svg";

export default function Header() {
  return (
    <header className="relative mx-auto mt-5 flex w-full items-center justify-between px-2 pb-7 sm:px-4">
      <a
        href="#"
        target="_blank"
        className="hidden items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-100 sm:flex sm:px-6"
      >
        <Image className="h-4 w-4" src={galleryIcon} alt="Gallery Icon" />
        <span>View Gallery</span>
      </a>
      <div className="absolute left-1/2 flex -translate-x-1/2 transform items-center gap-2">
        <Image alt="Small Square Logo" src={logo} className="h-5 w-5" />
        <h1 className="whitespace-nowrap text-lg tracking-tight">
          <span className="text-blue-600">Llama</span>Coder
        </h1>
        <div className="mx-2 hidden h-6 border-l border-gray-300 sm:block" />
        <div className="flex items-center gap-2">
          <Image
            alt="Together AI Logo"
            src={togetherAI}
            className="h-[20px] w-auto max-w-[80px] sm:h-[28px] sm:max-w-none"
          />
        </div>
      </div>
      <a
        href="https://github.com/nutlope/llamacoder"
        target="_blank"
        className="hidden items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-100 sm:flex sm:px-6"
      >
        <GithubIcon className="h-4 w-4" />
        <span>GitHub Repo</span>
      </a>
    </header>
  );
}
