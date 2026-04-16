import type { MDXComponents } from "mdx/types";
import type { Route } from "next";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 className="text-xl" {...props} />,
    h2: (props) => <h2 className="text-lg mt-6" {...props} />,
    h3: (props) => <h3 className="text-base mt-4" {...props} />,
    p: (props) => <p className="text-sm my-3" {...props} />,
    ul: (props) => <ul className="text-sm list-disc pl-5 my-3" {...props} />,
    ol: (props) => <ol className="text-sm list-decimal pl-5 my-3" {...props} />,
    li: (props) => <li className="my-1" {...props} />,
    code: (props) => <code className="text-xs" {...props} />,
    pre: (props) => (
      <pre className="border p-3 text-xs overflow-x-auto my-4 whitespace-pre" {...props} />
    ),
    a: ({ href = "", children, ...rest }) => {
      if (href.startsWith("/")) {
        return (
          <Link href={href as Route} {...rest}>
            {children}
          </Link>
        );
      }
      return (
        <a href={href} rel="noopener" {...rest}>
          {children}
        </a>
      );
    },
    ...components,
  };
}
