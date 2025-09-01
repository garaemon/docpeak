import React, {useEffect} from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markdown';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div className={`${styles.markdownRenderer} ${className}`}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({children}) => <h1 className={styles.heading1}>{children}</h1>,
          h2: ({children}) => <h2 className={styles.heading2}>{children}</h2>,
          h3: ({children}) => <h3 className={styles.heading3}>{children}</h3>,
          h4: ({children}) => <h4 className={styles.heading4}>{children}</h4>,
          h5: ({children}) => <h5 className={styles.heading5}>{children}</h5>,
          h6: ({children}) => <h6 className={styles.heading6}>{children}</h6>,
          p: ({children}) => <p className={styles.paragraph}>{children}</p>,
          ul: ({children}) => (
            <ul className={styles.unorderedList}>{children}</ul>
          ),
          ol: ({children}) => (
            <ol className={styles.orderedList}>{children}</ol>
          ),
          li: ({children}) => <li className={styles.listItem}>{children}</li>,
          blockquote: ({children}) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),
          code: ({className, children, ...props}) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
              <code className={styles.inlineCode} {...props}>
                {children}
              </code>
            ) : (
              <pre className={styles.codeBlock}>
                <code className={`${className} ${styles.code}`} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table: ({children}) => (
            <div className={styles.tableContainer}>
              <table className={styles.table}>{children}</table>
            </div>
          ),
          thead: ({children}) => (
            <thead className={styles.tableHead}>{children}</thead>
          ),
          tbody: ({children}) => (
            <tbody className={styles.tableBody}>{children}</tbody>
          ),
          tr: ({children}) => <tr className={styles.tableRow}>{children}</tr>,
          th: ({children}) => (
            <th className={styles.tableHeader}>{children}</th>
          ),
          td: ({children}) => <td className={styles.tableData}>{children}</td>,
          a: ({children, href}) => (
            <a
              href={href}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: ({src, alt}) => (
            <img src={src} alt={alt} className={styles.image} />
          ),
          hr: () => <hr className={styles.horizontalRule} />,
          strong: ({children}) => (
            <strong className={styles.strong}>{children}</strong>
          ),
          em: ({children}) => <em className={styles.emphasis}>{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
