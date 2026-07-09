import React from 'react';
import type { LegalBlock, LegalDocument } from './types';
import { renderInlineWeb } from './parse-inline';

type WebLinkProps = {
  href: string;
  children: React.ReactNode;
};

type RenderOptions = {
  Link: React.ComponentType<WebLinkProps>;
};

function renderBlock(block: LegalBlock, options: RenderOptions, key: number) {
  const inline = (text: string) => renderInlineWeb(text, options);

  switch (block.type) {
    case 'h2':
      return <h2 key={key}>{block.text}</h2>;
    case 'h3':
      return <h3 key={key}>{block.text}</h3>;
    case 'p':
      return <p key={key}>{inline(block.text)}</p>;
    case 'ul':
      return (
        <ul key={key}>
          {block.items.map((item, index) => (
            <li key={index}>{inline(item)}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key}>
          {block.items.map((item, index) => (
            <li key={index}>{inline(item)}</li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <table key={key}>
          <thead>
            <tr>
              {block.headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{inline(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    default:
      return null;
  }
}

export function renderLegalDocumentWeb(document: LegalDocument, options: RenderOptions) {
  let sectionIndex = 0;
  let currentSection: React.ReactNode[] = [];
  const sections: React.ReactNode[] = [];

  const flushSection = () => {
    if (currentSection.length === 0) return;
    sections.push(
      <section key={`section-${sectionIndex}`}>{currentSection}</section>,
    );
    sectionIndex += 1;
    currentSection = [];
  };

  document.blocks.forEach((block, index) => {
    if (block.type === 'h2' && currentSection.length > 0) {
      flushSection();
    }
    currentSection.push(renderBlock(block, options, index));
  });
  flushSection();

  return sections;
}
