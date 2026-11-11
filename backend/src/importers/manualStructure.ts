import { countTokens } from "../textTokens";

export const PDF_PARSER_VERSION = "seraph-pdf-structure-v1";
export const MANUAL_CHUNKER_VERSION = "seraph-semantic-chunker-v1";

export type StructuredPageInput = {
  pageNumber: number;
  printedPageLabel?: string;
  textContent: string;
  isEmbeddable: boolean;
  layoutMetadata: Record<string, unknown>;
};

export type ManualSectionInput = {
  sectionKey: string;
  parentSectionKey?: string;
  level: number;
  ordinal: number;
  title: string;
  pageStart: number | null;
  pageEnd: number | null;
  metadata: Record<string, unknown>;
};

export type ManualChunkInput = {
  pageStart: number | null;
  pageEnd: number | null;
  content: string;
  embeddingContent: string;
  tokenCount: number;
  contentType:
    | "overview"
    | "procedure"
    | "warning"
    | "note"
    | "troubleshooting"
    | "reference"
    | "visual";
  sectionKey?: string;
  metadata: Record<string, unknown>;
};

type TocEntry = {
  title: string;
  pageNumber: number;
  level: 1 | 2;
};

type ContentBlock = {
  pageNumber: number;
  content: string;
  contentType: ManualChunkInput["contentType"];
  sectionKey?: string;
  sectionPath: string[];
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isFooterLine(line: string, pageNumber: number) {
  if (line === String(pageNumber)) {
    return true;
  }

  return (
    new RegExp(`^${pageNumber}\\s+제\\s*\\d+\\s*장\\s+`).test(line) ||
    new RegExp(`제\\s*\\d+\\s*장\\s+.+\\s+${pageNumber}$`).test(line) ||
    new RegExp(`^${pageNumber}\\s+차례$`).test(line) ||
    new RegExp(`^차례\\s+${pageNumber}$`).test(line)
  );
}

function cleanPageLines(rawText: string, pageNumber: number) {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\u00c2(?=\s)/g, "•")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .filter((line) => !isFooterLine(line.trim(), pageNumber));
}

function pageParagraphs(rawText: string, pageNumber: number) {
  const paragraphs: string[] = [];
  let lines: string[] = [];

  const flush = () => {
    const normalized = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .join(" ")
      .replace(/[ \t]+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();

    if (normalized) {
      paragraphs.push(normalized);
    }

    lines = [];
  };

  for (const line of cleanPageLines(rawText, pageNumber)) {
    if (!line.trim()) {
      flush();
      continue;
    }

    lines.push(line);
  }

  flush();
  return paragraphs;
}

export function normalizePageText(rawText: string, pageNumber: number) {
  return pageParagraphs(rawText, pageNumber).join("\n\n");
}

function parseTocEntries(rawPages: string[]) {
  const entries: TocEntry[] = [];
  const seen = new Set<string>();
  const tocPages = rawPages
    .slice(0, 12)
    .filter((rawPage) => rawPage.includes("차례"));

  for (const rawPage of tocPages) {
    for (const rawLine of rawPage.replace(/\r\n/g, "\n").split("\n")) {
      const line = normalizeWhitespace(rawLine);
      const match = line.match(/^(\d{1,3})\s+(.+)$/);

      if (!match) {
        continue;
      }

      const pageNumber = Number(match[1]);
      const title = match[2].trim();

      if (
        pageNumber < 1 ||
        pageNumber > rawPages.length ||
        title.length < 2 ||
        title === "차례"
      ) {
        continue;
      }

      const key = `${pageNumber}:${title}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      entries.push({
        title,
        pageNumber,
        level: /^(제\s*\d+\s*장|부록\s*[A-Z])/i.test(title) ? 1 : 2
      });
    }
  }

  return entries.sort(
    (left, right) =>
      left.pageNumber - right.pageNumber || left.level - right.level
  );
}

function buildSections(entries: TocEntry[], totalPages: number) {
  const sections: ManualSectionInput[] = [];
  let parentSectionKey: string | undefined;

  for (const [ordinal, entry] of entries.entries()) {
    const nextEntry = entries[ordinal + 1];
    const sectionKey = `section-${ordinal}-${slugify(entry.title) || "untitled"}`;

    if (entry.level === 1) {
      parentSectionKey = sectionKey;
    }

    sections.push({
      sectionKey,
      parentSectionKey: entry.level === 1 ? undefined : parentSectionKey,
      level: entry.level,
      ordinal,
      title: entry.title,
      pageStart: entry.pageNumber,
      pageEnd: nextEntry
        ? Math.max(entry.pageNumber, nextEntry.pageNumber)
        : totalPages,
      metadata: {
        generatedBy: PDF_PARSER_VERSION,
        source: "table-of-contents"
      }
    });
  }

  return sections;
}

function titleWithoutChapterPrefix(title: string) {
  return title
    .replace(/^제\s*\d+\s*장\s*:\s*/u, "")
    .replace(/^부록\s*[A-Z]\s*:\s*/iu, "")
    .trim();
}

function findSectionForBlock(
  block: string,
  pageNumber: number,
  sections: ManualSectionInput[],
  activeSection?: ManualSectionInput
) {
  const blockText = normalizeWhitespace(block);
  const exact = sections
    .filter((section) => section.pageStart === pageNumber)
    .find((section) => {
      const title = normalizeWhitespace(titleWithoutChapterPrefix(section.title));
      return blockText === title || blockText.startsWith(`${title} `);
    });

  if (exact) {
    return exact;
  }

  if (
    activeSection &&
    (activeSection.pageEnd === null || activeSection.pageEnd >= pageNumber)
  ) {
    return activeSection;
  }

  return sections
    .filter(
      (section) =>
        section.pageStart !== null && section.pageStart < pageNumber
    )
    .sort(
      (left, right) =>
        (right.pageStart ?? 0) - (left.pageStart ?? 0) ||
        right.level - left.level ||
        right.ordinal - left.ordinal
    )[0];
}

function sectionPathFor(
  section: ManualSectionInput | undefined,
  sectionsByKey: Map<string, ManualSectionInput>
) {
  if (!section) {
    return [];
  }

  const path = [titleWithoutChapterPrefix(section.title)];
  let parentKey = section.parentSectionKey;

  while (parentKey) {
    const parent = sectionsByKey.get(parentKey);
    if (!parent) {
      break;
    }

    path.unshift(titleWithoutChapterPrefix(parent.title));
    parentKey = parent.parentSectionKey;
  }

  return path;
}

function classifyContent(
  content: string,
  sectionPath: string[]
): ManualChunkInput["contentType"] {
  if (/^(경고|중요사항)\s*:/u.test(content)) {
    return "warning";
  }

  if (/^(참고|팁)\s*:/u.test(content)) {
    return "note";
  }

  if (sectionPath.some((title) => title.includes("문제해결"))) {
    return "troubleshooting";
  }

  if (
    /(^|\s)\d+\s+\S/u.test(content) ||
    /(?:설정|설치|추가|삭제|연결|사용|보기|열기|전송|변경|재설정)하기\s*:/u.test(
      content
    )
  ) {
    return "procedure";
  }

  return sectionPath.length <= 1 ? "overview" : "reference";
}

function isHeadingOnly(
  content: string,
  pageNumber: number,
  sections: ManualSectionInput[]
) {
  return sections
    .filter((section) => section.pageStart === pageNumber)
    .some(
      (section) =>
        normalizeWhitespace(content) ===
        normalizeWhitespace(titleWithoutChapterPrefix(section.title))
    );
}

function splitLongBlock(block: ContentBlock, maxTokens: number) {
  if (countTokens(block.content) <= maxTokens) {
    return [block];
  }

  const sentences = block.content
    .split(/(?<=[.!?。]|습니다\.|십시오\.)\s+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const parts: ContentBlock[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && countTokens(candidate) > maxTokens) {
      parts.push({ ...block, content: current });
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) {
    parts.push({ ...block, content: current });
  }

  return parts.length > 0 ? parts : [block];
}

function makeEmbeddingContent(
  documentTitle: string,
  softwareVersion: string | undefined,
  sectionPath: string[],
  content: string
) {
  return [
    `문서: ${documentTitle}`,
    softwareVersion ? `소프트웨어: ${softwareVersion}` : null,
    sectionPath.length > 0 ? `위치: ${sectionPath.join(" > ")}` : null,
    "",
    content
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function buildSemanticChunks(
  blocks: ContentBlock[],
  documentTitle: string,
  softwareVersion?: string
) {
  const targetTokens = 450;
  // Leave room for the document/version/section context prefix so the final
  // embedding input remains close to the 800-token ceiling.
  const maxTokens = 720;
  const overlapTokens = 80;
  const chunks: ManualChunkInput[] = [];
  let current: ContentBlock[] = [];

  const flush = (keepOverlap: boolean) => {
    if (current.length === 0) {
      return;
    }

    const content = current.map((block) => block.content).join("\n\n");
    const first = current[0];
    const last = current[current.length - 1];
    const embeddingContent = makeEmbeddingContent(
      documentTitle,
      softwareVersion,
      first.sectionPath,
      content
    );

    chunks.push({
      pageStart: Math.min(...current.map((block) => block.pageNumber)),
      pageEnd: Math.max(...current.map((block) => block.pageNumber)),
      content,
      embeddingContent,
      tokenCount: countTokens(embeddingContent),
      contentType: current.some(
        (block) => block.contentType === "troubleshooting"
      )
        ? "troubleshooting"
        : current.some((block) => block.contentType === "warning")
          ? "warning"
          : current.some((block) => block.contentType === "note")
            ? "note"
            : current.some((block) => block.contentType === "procedure")
              ? "procedure"
              : first.contentType,
      sectionKey: first.sectionKey,
      metadata: {
        generatedBy: MANUAL_CHUNKER_VERSION,
        sectionPath: first.sectionPath,
        sourcePages: Array.from(
          new Set(current.map((block) => block.pageNumber))
        )
      }
    });

    const overlap =
      keepOverlap &&
      last.contentType !== "warning" &&
      last.contentType !== "note" &&
      countTokens(last.content) <= overlapTokens
        ? [last]
        : [];
    current = overlap;
  };

  for (const originalBlock of blocks) {
    for (const block of splitLongBlock(originalBlock, maxTokens)) {
      const isSpecial = block.contentType === "warning" || block.contentType === "note";
      const sectionChanged =
        current.length > 0 && current[0].sectionKey !== block.sectionKey;
      const candidate = [...current, block]
        .map((item) => item.content)
        .join("\n\n");

      if (
        current.length > 0 &&
        (sectionChanged || isSpecial || countTokens(candidate) > maxTokens)
      ) {
        flush(!sectionChanged && !isSpecial);
      }

      current.push(block);

      if (isSpecial || countTokens(current.map((item) => item.content).join("\n\n")) >= targetTokens) {
        flush(!isSpecial);
      }
    }
  }

  flush(false);
  return chunks;
}

export function structureManualPdf(input: {
  rawPages: string[];
  documentTitle: string;
  softwareVersion?: string;
}) {
  const entries = parseTocEntries(input.rawPages);
  const sections = buildSections(entries, input.rawPages.length);
  const sectionsByKey = new Map(
    sections.map((section) => [section.sectionKey, section])
  );
  const firstContentPage =
    sections.find((section) => section.level === 1)?.pageStart ?? 1;
  const pages: StructuredPageInput[] = [];
  const blocks: ContentBlock[] = [];
  let activeSection: ManualSectionInput | undefined;

  for (const [index, rawText] of input.rawPages.entries()) {
    const pageNumber = index + 1;
    const paragraphs = pageParagraphs(rawText, pageNumber);
    const textContent = paragraphs.join("\n\n");
    const isEmbeddable =
      pageNumber >= firstContentPage && textContent.trim().length > 0;
    const nonEmptyLineCount = cleanPageLines(rawText, pageNumber).filter((line) =>
      line.trim()
    ).length;

    pages.push({
      pageNumber,
      printedPageLabel:
        pageNumber >= firstContentPage ? String(pageNumber) : undefined,
      textContent,
      isEmbeddable,
      layoutMetadata: {
        parserVersion: PDF_PARSER_VERSION,
        rawCharacterCount: rawText.length,
        nonEmptyLineCount,
        needsVisualReview:
          isEmbeddable &&
          (textContent.length < 420 || /\s{8,}/u.test(rawText))
      }
    });

    if (!isEmbeddable) {
      continue;
    }

    for (const paragraph of paragraphs) {
      const section = findSectionForBlock(
        paragraph,
        pageNumber,
        sections,
        activeSection
      );
      activeSection = section;

      if (isHeadingOnly(paragraph, pageNumber, sections)) {
        continue;
      }

      const sectionPath = sectionPathFor(section, sectionsByKey);
      blocks.push({
        pageNumber,
        content: paragraph,
        contentType: classifyContent(paragraph, sectionPath),
        sectionKey: section?.sectionKey,
        sectionPath
      });
    }
  }

  return {
    pages,
    sections,
    chunks: buildSemanticChunks(
      blocks,
      input.documentTitle,
      input.softwareVersion
    ),
    parserVersion: PDF_PARSER_VERSION,
    chunkerVersion: MANUAL_CHUNKER_VERSION,
    firstContentPage
  };
}
