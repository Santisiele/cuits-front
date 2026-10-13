import Markdown, { type Components } from "react-markdown"

const components: Components = {
  h1: ({ children }) => <h3 className="text-base font-semibold mt-4 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="text-base font-semibold mt-4 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="text-sm font-semibold mt-3 first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="text-sm font-semibold mt-3 first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="text-sm list-disc pl-5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="text-sm list-decimal pl-5 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-cyan-600 dark:text-cyan-400 hover:underline break-words"
    >
      {children}
    </a>
  ),
}

export function ResearchSummary({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      <Markdown components={components}>{text}</Markdown>
    </div>
  )
}
