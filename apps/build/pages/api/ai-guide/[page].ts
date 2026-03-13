import type { NextApiRequest, NextApiResponse } from 'next';

import buildData from 'components/BuildAnAgent/data.json';
import hireData from 'components/HireAnAgent/data.json';
import monetizeData from 'components/MonetizeYourAgent/data.json';

const STACK_URL = 'https://stack.olas.network';

type TextSegment = {
  text: string;
  code?: boolean;
};

type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'richText'; segments: TextSegment[] }
  | {
      type: 'note';
      title: string;
      value?: string;
      segments?: TextSegment[];
      children?: ContentBlock[];
    };

type QuickstartItem = {
  title: string;
  description?: string;
  contentBlocks?: ContentBlock[];
  codeBlocks?: string[];
  afterNote?: string;
  afterCodeBlocks?: string[];
};

function renderSegments(segments: TextSegment[]): string {
  return segments.map((seg) => (seg.code ? `\`${seg.text}\`` : seg.text)).join('');
}

function renderContentBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text':
      return block.value;
    case 'code':
      return `\`\`\`\n${block.value}\n\`\`\``;
    case 'richText':
      return renderSegments(block.segments);
    case 'note': {
      const body = block.segments ? renderSegments(block.segments) : (block.value ?? '');
      const lines = [`> **${block.title}** ${body}`];
      if (block.children) {
        for (const child of block.children) {
          const rendered = renderContentBlock(child);
          lines.push(...rendered.split('\n').map((line) => `> ${line}`));
        }
      }
      return lines.join('\n');
    }
    default:
      return '';
  }
}

function renderQuickstartItem(item: QuickstartItem): string {
  const lines: string[] = [`### ${item.title}`];

  if (item.contentBlocks) {
    for (const block of item.contentBlocks) {
      lines.push(renderContentBlock(block as ContentBlock));
    }
  } else if (item.description) {
    lines.push(item.description);
  }

  if (item.codeBlocks && item.codeBlocks.length > 0) {
    for (const block of item.codeBlocks) {
      lines.push(`\`\`\`\n${block}\n\`\`\``);
    }
  }

  if (item.afterNote) {
    lines.push(item.afterNote);
  }

  if (item.afterCodeBlocks) {
    for (const block of item.afterCodeBlocks) {
      lines.push(`\`\`\`\n${block}\n\`\`\``);
    }
  }

  return lines.join('\n\n');
}

function generateBuildGuide(): string {
  const lines: string[] = [`# ${buildData.title}`, '## Resources'];

  for (const resource of buildData.resources) {
    lines.push(`- **${resource.label}**: [${resource.linkText}](${resource.link})`);
  }

  return lines.join('\n\n');
}

function generateQuickstartGuide(guideData: {
  title: string;
  prerequisites: string[];
  quickstartIntro: string;
  quickstartItems: QuickstartItem[];
  alertText: string;
  docsLink: string;
  afterQuickstart?: string;
}): string {
  const lines: string[] = [
    `# ${guideData.title}`,
    '## Prerequisites',
    ...guideData.prerequisites.map((p) => `- \`${p}\``),
    '## Quickstart',
    guideData.quickstartIntro,
  ];

  for (const item of guideData.quickstartItems) {
    lines.push(renderQuickstartItem(item));
  }

  if (guideData.afterQuickstart) {
    lines.push(guideData.afterQuickstart);
  }

  lines.push(
    `---\n\n${guideData.alertText}\n\n[Explore Documentation](${STACK_URL}${guideData.docsLink})`,
  );

  return lines.join('\n\n');
}

const generators: Record<string, () => string> = {
  build: generateBuildGuide,
  hire: () => generateQuickstartGuide(hireData as Parameters<typeof generateQuickstartGuide>[0]),
  monetize: () =>
    generateQuickstartGuide(monetizeData as Parameters<typeof generateQuickstartGuide>[0]),
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page } = req.query;

  if (typeof page !== 'string' || !generators[page]) {
    res
      .status(404)
      .send(
        'Not found. Available guides: /api/ai-guide/build, /api/ai-guide/hire, /api/ai-guide/monetize',
      );
    return;
  }

  const markdown = generators[page]();

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  res.status(200).send(markdown);
}
