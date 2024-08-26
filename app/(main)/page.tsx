"use client";

import CodeViewer from "@/components/code-viewer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { domain } from "@/utils/domain";
import { CheckIcon } from "@heroicons/react/16/solid";
import { ArrowLongRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { ArrowUpOnSquareIcon } from "@heroicons/react/24/outline";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import LoadingDots from "../../components/loading-dots";
import { shareApp } from "./actions";
import { Dialog } from "@headlessui/react";

export default function Home() {
  let [status, setStatus] = useState<
    "initial" | "creating" | "created" | "updating" | "updated"
  >("initial");
  let [generatedCode, setGeneratedCode] = useState("");
  let [initialAppConfig, setInitialAppConfig] = useState({
    model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
    shadcn: false,
  });
  let [ref, scrollTo] = useScrollTo();
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  let [isPublishing, setIsPublishing] = useState(false);
  let [isSettingsOpen, setIsSettingsOpen] = useState(false);
  let [temperature, setTemperature] = useState(0.43);
  let [language, setLanguage] = useState("React");
  let [promptInput, setPromptInput] = useState(""); // New state for the input value

  let loading = status === "creating" || status === "updating";

  const suggestions = [
    "Daily quotes",
    "Calculator app",
    "Recipe finder",
    "Expense tracker",
    "Random number generator",
    "E-commerce store",
  ];

  async function generateCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (status !== "initial") {
      scrollTo({ delay: 0.5 });
    }

    setStatus("creating");
    setGeneratedCode("");

    let formData = new FormData(e.currentTarget);
    let model = formData.get("model");
    let prompt = formData.get("prompt");
    let shadcn = !!formData.get("shadcn");
    if (typeof prompt !== "string" || typeof model !== "string") {
      return;
    }
    let newMessages = [{ role: "user", content: prompt }];

    const chatRes = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        model,
        shadcn,
      }),
    });
    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    // This data is a ReadableStream
    const data = chatRes.body;
    if (!data) {
      return;
    }
    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          setGeneratedCode((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    };

    // https://web.dev/streams/#the-getreader-and-read-methods
    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    newMessages = [
      ...newMessages,
      { role: "assistant", content: generatedCode },
    ];

    setInitialAppConfig({ model, shadcn });
    setMessages(newMessages);
    setStatus("created");
  }

  async function modifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus("updating");

    let formData = new FormData(e.currentTarget);
    let prompt = formData.get("prompt");
    if (typeof prompt !== "string") {
      return;
    }
    let newMessages = [...messages, { role: "user", content: prompt }];

    setGeneratedCode("");
    const chatRes = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        model: initialAppConfig.model,
        shadcn: initialAppConfig.shadcn,
      }),
    });
    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    // This data is a ReadableStream
    const data = chatRes.body;
    if (!data) {
      return;
    }
    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          setGeneratedCode((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    };

    // https://web.dev/streams/#the-getreader-and-read-methods
    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    newMessages = [
      ...newMessages,
      { role: "assistant", content: generatedCode },
    ];

    setMessages(newMessages);
    setStatus("updated");
  }

  useEffect(() => {
    let el = document.querySelector(".cm-scroller");
    if (el && loading) {
      let end = el.scrollHeight - el.clientHeight;
      el.scrollTo({ top: end });
    }
  }, [loading, generatedCode]);

  const handleSuggestionClick = (suggestion: string) => {
    setPromptInput(suggestion);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center py-2">
      <Header />

      <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-20">
        <h1 className="my-6 max-w-3xl text-4xl font-bold text-gray-800 sm:text-6xl">
          Turn your <span className="text-blue-600">idea</span>
          <br /> into an <span className="text-blue-600">app</span>
        </h1>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <span
              key={suggestion}
              className="inline-flex cursor-pointer items-center rounded-[6px] bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:underline"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </span>
          ))}
        </div>

        <form className="relative w-full max-w-xl" onSubmit={generateCode}>
          <fieldset disabled={loading} className="disabled:opacity-75">
            <div className="relative mt-5 flex gap-2">
              <div className="shadow-custom relative flex w-full rounded-[6px] bg-white">
                <input
                  required
                  name="prompt"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="w-full rounded-[6px] border border-gray-300 bg-transparent px-6 py-4 pr-14 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Build me a calculator app..."
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="text-bleu absolute right-3 top-1/2 inline-flex -translate-y-1/2 transform items-center justify-center rounded-[10px] bg-white p-2 text-sm font-semibold text-blue-500 hover:bg-blue-500 hover:text-white focus-visible:outline-none focus-visible:ring-blue-500"
                >
                  {status === "creating" ? (
                    <LoadingDots color="white" style="large" />
                  ) : (
                    <ArrowLongRightIcon className="h-7 w-7" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="shadow-custom ml-2 flex h-[63px] w-[63px] items-center justify-center rounded-[6px] bg-blue-500 p-4 text-white hover:bg-white hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <AdjustmentsHorizontalIcon className="h-7 w-7" />
              </button>
            </div>

            <Dialog
              open={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            >
              <div className="w-[340px] rounded-[12px] bg-gray-100 p-6 shadow-lg">
                <h2 className="mb-4 text-lg font-bold text-gray-700">
                  Settings
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="font-small mb-2 block text-sm text-gray-700">
                      MODELS
                    </label>
                    <Select.Root
                      name="model"
                      value={initialAppConfig.model}
                      onValueChange={(value) =>
                        setInitialAppConfig({
                          ...initialAppConfig,
                          model: value,
                        })
                      }
                      disabled={loading}
                    >
                      <Select.Trigger className="flex w-full items-center rounded-[6px] border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        <Select.Value className="text-gray-700" />
                        <Select.Icon className="ml-auto">
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 overflow-hidden rounded-[6px] bg-white shadow-lg">
                          <Select.Viewport className="p-2">
                            {[
                              {
                                label: "Llama 3.1 405B",
                                value:
                                  "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                              },
                              {
                                label: "Llama 3.1 70B",
                                value:
                                  "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
                              },
                              {
                                label: "Gemma 2 27B",
                                value: "google/gemma-2-27b-it",
                              },
                            ].map((model) => (
                              <Select.Item
                                key={model.value}
                                value={model.value}
                                className="flex cursor-pointer items-center rounded-[6px] px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Select.ItemText>{model.label}</Select.ItemText>
                                <Select.ItemIndicator className="ml-auto">
                                  <CheckIcon className="h-5 w-5 text-blue-600" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <div>
                    <label className="font-sm mb-2 block text-sm text-gray-700">
                      LANGUAGE
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`rounded-[6px] px-4 py-2 text-sm ${
                          language === "React"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-200 text-gray-700"
                        } shadow-sm`}
                        onClick={() => setLanguage("React")}
                      >
                        React
                      </button>
                      <button
                        type="button"
                        className={`rounded-[6px] px-4 py-2 text-sm ${
                          language === "Python"
                            ? "bg-gray-900 text-white"
                            : "bg-gray-200 text-gray-700"
                        } shadow-sm`}
                        onClick={() => setLanguage("Python")}
                      >
                        Python
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-sm mb-2 block text-sm text-gray-700">
                      SHADCN/UI
                    </label>
                    <Switch.Root
                      className={`group flex h-[24px] w-[48px] items-center rounded-full p-0.5 shadow-inner transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                        initialAppConfig.shadcn ? "bg-black" : "bg-gray-200"
                      }`}
                      checked={initialAppConfig.shadcn}
                      onCheckedChange={(checked) =>
                        setInitialAppConfig({
                          ...initialAppConfig,
                          shadcn: checked,
                        })
                      }
                    >
                      <Switch.Thumb
                        className={`h-[20px] w-[20px] rounded-full bg-white shadow transition ${
                          initialAppConfig.shadcn
                            ? "translate-x-[24px]"
                            : "translate-x-0"
                        }`}
                      />
                    </Switch.Root>
                  </div>

                  <div>
                    <label className="font-sm mb-2 block text-sm text-gray-700">
                      TEMPERATURE
                    </label>
                    <div className="relative">
                      <div className="flex items-center overflow-hidden rounded-[6px] bg-gray-200">
                        <div
                          className="bg-gray-900 px-4 py-2 text-sm text-white"
                          style={{ width: `${temperature * 100}%` }}
                        >
                          {temperature.toFixed(2)}
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={temperature}
                          onChange={(e) =>
                            setTemperature(parseFloat(e.target.value))
                          }
                          className="absolute inset-0 w-full cursor-pointer opacity-0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      className="rounded-[6px] bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm"
                      onClick={() => {
                        setInitialAppConfig({
                          model:
                            "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
                          shadcn: false,
                        });
                        setLanguage("React");
                        setTemperature(0.43);
                      }}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className="rounded-[6px] bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      Save settings
                    </button>
                  </div>
                </div>
              </div>
            </Dialog>
          </fieldset>
        </form>

        <hr className="border-1 mb-20 h-px bg-gray-700 dark:bg-gray-700" />

        {status !== "initial" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{
              height: "auto",
              overflow: "hidden",
              transitionEnd: { overflow: "visible" },
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="w-full pb-[25vh] pt-10"
            onAnimationComplete={() => scrollTo()}
            ref={ref}
          >
            <div className="mt-5 flex gap-4">
              <form className="w-full" onSubmit={modifyCode}>
                <fieldset disabled={loading} className="group">
                  <div className="relative">
                    <div className="relative flex rounded-[10px] bg-white shadow-sm group-disabled:bg-gray-50">
                      <div className="relative flex flex-grow items-stretch focus-within:z-10">
                        <input
                          required
                          name="prompt"
                          className="w-full rounded-l-3xl bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                          placeholder="Build me a calculator app..."
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-blue-500 hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:text-gray-900"
                      >
                        {status === "creating" ? (
                          <LoadingDots color="black" style="large" />
                        ) : (
                          <ArrowLongRightIcon className="-ml-0.5 size-6" />
                        )}
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
              <div>
                <Toaster invert={true} />
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button
                        disabled={loading || isPublishing}
                        onClick={async () => {
                          setIsPublishing(true);
                          let userMessages = messages.filter(
                            (message) => message.role === "user",
                          );
                          let prompt =
                            userMessages[userMessages.length - 1].content;

                          const appId = await minDelay(
                            shareApp({
                              generatedCode,
                              prompt,
                              model: initialAppConfig.model,
                            }),
                            1000,
                          );
                          setIsPublishing(false);
                          toast.success(
                            `Your app has been published & copied to your clipboard! llamacoder.io/share/${appId}`,
                          );
                          navigator.clipboard.writeText(
                            `${domain}/share/${appId}`,
                          );
                        }}
                        className="inline-flex h-[68px] w-40 items-center justify-center gap-2 rounded-[10px] bg-blue-500 transition enabled:hover:bg-blue-600 disabled:grayscale"
                      >
                        <span className="relative">
                          {isPublishing && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <LoadingDots color="white" style="large" />
                            </span>
                          )}

                          <ArrowUpOnSquareIcon
                            className={`${isPublishing ? "invisible" : ""} size-5 text-xl text-white`}
                          />
                        </span>

                        <p className="text-lg font-medium text-white">
                          Publish app
                        </p>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="select-none rounded-[10px] bg-white px-4 py-2.5 text-sm leading-none shadow-md shadow-black/20"
                        sideOffset={5}
                      >
                        Publish your app to the internet.
                        <Tooltip.Arrow className="fill-white" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
            <div className="relative mt-8 w-full overflow-hidden">
              <div className="isolate">
                <CodeViewer code={generatedCode} showEditor />
              </div>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={status === "updating" ? { x: "100%" } : undefined}
                    animate={status === "updating" ? { x: "0%" } : undefined}
                    exit={{ x: "100%" }}
                    transition={{
                      type: "spring",
                      bounce: 0,
                      duration: 0.85,
                      delay: 0.5,
                    }}
                    className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center rounded-[10px] border border-gray-400 bg-gradient-to-br from-gray-100 to-gray-300 md:inset-y-0 md:left-1/2 md:right-0"
                  >
                    <p className="animate-pulse text-3xl font-bold">
                      {status === "creating"
                        ? "Building your app..."
                        : "Updating your app..."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}

async function minDelay<T>(promise: Promise<T>, ms: number) {
  let delay = new Promise((resolve) => setTimeout(resolve, ms));
  let [p] = await Promise.all([promise, delay]);

  return p;
}
