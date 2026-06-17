import matter from 'gray-matter';
import { SiteConfig, ResolvedRouteConfig, MarkdownEnv, SiteData } from 'vitepress';

/**
 * 获取 markdown 内容中的标题
 */
declare function getDefaultTitle(content: string): string;
/**
 * 计算文件内容的MD5哈希值 - 优化版本
 */
declare function getFileMD5(filePath: string): string;
/**
 * 快速生成文件摘要 - 仅基于文件统计信息
 */
declare function getFileQuickSummary(filePath: string): string;
declare function fastMD5(filePath: string): Promise<string>;
/**
 * 获取文件最后修改时间
 * 优先使用 git 命令获取，如果失败则使用 fs.stat 获取
 * @param url 文件路径
 * @param cacheDir 缓存目录（可选）
 */
declare function getFileLastModifyTime(url: string, cacheDir?: string): Promise<Date | undefined>;
declare function getFileLastModifyTimeByGit(url: string): Promise<Date | undefined>;
declare function getFileBirthTimeByFs(url: string): Promise<Date | undefined>;
declare function getFileLastModifyTimeByFs(url: string): Promise<Date | undefined>;
declare const EXTERNAL_URL_RE: RegExp;
/**
 * Join two paths by resolving the slash collision.
 */
declare function joinPath(base: string, path: string): string;
declare function withBase(base: string, path: string): string;
declare const grayMatter: typeof matter;
declare function getTextSummary(text: string, count?: number): string;
declare const isWindows: boolean;
declare function slash(p: string): string;
declare function normalizePath(id: string): string;

declare function formatDate(d: any, fmt?: string): string;
declare function formatShowDate(date: Date | string): string;

declare function getVitePressPages(vpConfig: SiteConfig): {
    page: string;
    route: string;
    isRewrite: boolean;
    isDynamic: boolean;
    filepath: string;
    originRoute: string;
    rewriteRoute: string;
    dynamicRoute?: ResolvedRouteConfig | undefined;
    rewritePath?: string | undefined;
    env: MarkdownEnv;
}[];
declare function renderDynamicMarkdown(routeFile: string, params: Record<string, any>, content?: string): string;
declare const inBrowser: boolean;
declare function isActive(currentPath: string, matchPath?: string, asRegex?: boolean): boolean;
declare function isExternal(path: string): boolean;
declare function getLocaleForPath(siteData: SiteData | undefined, relativePath: string): string;

/**
 * process.env.DEBUG=true
 * @param flag
 */
declare function debugTime(flag: string | number): () => number;
/**
 * URL 规范化函数，移除多余的斜杠（保留协议的双斜杠）
 * @param url - 待规范化的 URL
 * @returns 规范化后的 URL
 * @example
 * normalizeUrl('https://example.com/test//rss.xml') // 'https://example.com/test/rss.xml'
 */
declare function normalizeUrl(url: string): string;

declare function cacheAllGitTimestamps(root: string, pathspec?: string[]): Promise<Map<string, number>>;
declare function getCacheTimestamp(file: string): number | undefined;
declare function isInitGitRepo(root: string): boolean;
declare function getGitTimestamp(file: string): Promise<number>;

export { EXTERNAL_URL_RE, cacheAllGitTimestamps, debugTime, fastMD5, formatDate, formatShowDate, getCacheTimestamp, getDefaultTitle, getFileBirthTimeByFs, getFileLastModifyTime, getFileLastModifyTimeByFs, getFileLastModifyTimeByGit, getFileMD5, getFileQuickSummary, getGitTimestamp, getLocaleForPath, getTextSummary, getVitePressPages, grayMatter, inBrowser, isActive, isExternal, isInitGitRepo, isWindows, joinPath, normalizePath, normalizeUrl, renderDynamicMarkdown, slash, withBase };
