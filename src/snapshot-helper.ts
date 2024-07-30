import {
  PageAssertionsToHaveScreenshotOptions,
  TestInfo,
} from '@playwright/test';
import path from 'path';
import {
  sanitizeForFilePath,
  calculateSha1,
  addSuffixToFilePath,
} from 'playwright-core/lib/utils';

function sanitizeFilePathBeforeExtension(filePath: string): string {
  const ext = path.extname(filePath);
  const base = filePath.substring(0, filePath.length - ext.length);
  return sanitizeForFilePath(base) + ext;
}

const snapshotNamesSymbol = Symbol('snapshotNames');

type SnapshotNames = {
  anonymousSnapshotIndex: number;
  namedSnapshotIndex: { [key: string]: number };
};

function trimLongString(s: string, length = 100) {
  if (s.length <= length) return s;
  const hash = calculateSha1(s);
  const middle = `-${hash.substring(0, 5)}-`;
  const start = Math.floor((length - middle.length) / 2);
  const end = length - middle.length - start;
  return s.substring(0, start) + middle + s.slice(-end);
}

export const windowsFilesystemFriendlyLength = 60;

export class SnapshotHelper {
  readonly testInfo: TestInfo;
  readonly attachmentBaseName: string;
  readonly legacyExpectedPath: string;
  readonly expectedPath: string;
  readonly matcherName: string;
  readonly options: PageAssertionsToHaveScreenshotOptions;

  constructor(
    testInfo: TestInfo,
    anonymousSnapshotExtension: string,
    nameOrOptions: string | string[],
  ) {
    let name: string | string[];
    if (Array.isArray(nameOrOptions) || typeof nameOrOptions === 'string') {
      name = nameOrOptions;
    }

    let snapshotNames = (testInfo as any)[snapshotNamesSymbol] as SnapshotNames;
    if (!(testInfo as any)[snapshotNamesSymbol]) {
      snapshotNames = {
        anonymousSnapshotIndex: 0,
        namedSnapshotIndex: {},
      };
      (testInfo as any)[snapshotNamesSymbol] = snapshotNames;
    }

    let expectedPathSegments: string[];
    let outputBasePath: string;
    if (!name) {
      // Consider the use case below. We should save actual to different paths.
      // Therefore we auto-increment |anonymousSnapshotIndex|.
      //
      //   expect.toMatchSnapshot('a.png')
      //   // noop
      //   expect.toMatchSnapshot('a.png')
      const fullTitleWithoutSpec = [
        ...testInfo.titlePath.slice(1),
        ++snapshotNames.anonymousSnapshotIndex,
      ].join(' ');
      // Note: expected path must not ever change for backwards compatibility.
      expectedPathSegments = [
        sanitizeForFilePath(trimLongString(fullTitleWithoutSpec)) +
          '.' +
          anonymousSnapshotExtension,
      ];
      // Trim the output file paths more aggressively to avoid hitting Windows filesystem limits.
      const sanitizedName =
        sanitizeForFilePath(
          trimLongString(fullTitleWithoutSpec, windowsFilesystemFriendlyLength),
        ) +
        '.' +
        anonymousSnapshotExtension;
      outputBasePath = (testInfo as any)._getOutputPath(sanitizedName);
      this.attachmentBaseName = sanitizedName;
    } else {
      // We intentionally do not sanitize user-provided array of segments, assuming
      // it is a file system path. See https://github.com/microsoft/playwright/pull/9156.
      // Note: expected path must not ever change for backwards compatibility.
      expectedPathSegments = Array.isArray(name)
        ? name
        : [sanitizeFilePathBeforeExtension(name)];
      const joinedName = Array.isArray(name)
        ? name.join(path.sep)
        : sanitizeFilePathBeforeExtension(
            trimLongString(name, windowsFilesystemFriendlyLength),
          );
      snapshotNames.namedSnapshotIndex[joinedName] =
        (snapshotNames.namedSnapshotIndex[joinedName] || 0) + 1;
      const index = snapshotNames.namedSnapshotIndex[joinedName];
      const sanitizedName =
        index > 1
          ? addSuffixToFilePath(joinedName, `-${index - 1}`)
          : joinedName;
      outputBasePath = (testInfo as any)._getOutputPath(sanitizedName);
      this.attachmentBaseName = sanitizedName;
    }
    this.expectedPath = testInfo.snapshotPath(...expectedPathSegments);
  }
}
