"use client";

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-5 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-500 mr-1">Coach está respondendo</span>
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}
