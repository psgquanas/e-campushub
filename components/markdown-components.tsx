"use client";

import { useTheme } from "next-themes";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ inline, className, children, ...props }: any) {
  const { theme } = useTheme();
  const match = /language-(\w+)/.exec(className || "");

  if (!inline && match) {
    return (
      <SyntaxHighlighter
        style={theme === "dark" ? oneDark : oneLight}
        language={match[1]}
        PreTag="div"
        className="rounded-md my-4 max-w-full! overflow-x-auto text-xs md:text-sm"
        customStyle={{
          margin: 0,
          maxWidth: "100%",
        }}
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    );
  }

  return (
    <code
      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
      {...props}
    >
      {children}
    </code>
  );
}

export const MarkdownComponents = {
  code: CodeBlock,
  p: ({ children }: any) => (
    <p className="mb-4 leading-relaxed wrap-break-word">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside mb-4 space-y-2 ml-4 wrap-break-word">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-2 ml-4 wrap-break-word">
      {children}
    </ol>
  ),
  li: ({ children }: any) => <li className="ml-4">{children}</li>,
  h1: ({ children }: any) => (
    <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r overflow-x-auto">
      {children}
    </blockquote>
  ),
  a: ({ children, href }: any) => (
    <a
      href={href}
      className="text-primary hover:underline underline-offset-2"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold">{children}</strong>
  ),
  em: ({ children }: any) => <em className="italic">{children}</em>,
};
