"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  EXTERNAL_URL_RE: () => EXTERNAL_URL_RE,
  cacheAllGitTimestamps: () => cacheAllGitTimestamps,
  debugTime: () => debugTime,
  fastMD5: () => fastMD5,
  formatDate: () => formatDate,
  formatShowDate: () => formatShowDate,
  getCacheTimestamp: () => getCacheTimestamp,
  getDefaultTitle: () => getDefaultTitle,
  getFileBirthTimeByFs: () => getFileBirthTimeByFs,
  getFileLastModifyTime: () => getFileLastModifyTime,
  getFileLastModifyTimeByFs: () => getFileLastModifyTimeByFs,
  getFileLastModifyTimeByGit: () => getFileLastModifyTimeByGit,
  getFileMD5: () => getFileMD5,
  getFileQuickSummary: () => getFileQuickSummary,
  getGitTimestamp: () => getGitTimestamp,
  getLocaleForPath: () => getLocaleForPath,
  getTextSummary: () => getTextSummary,
  getVitePressPages: () => getVitePressPages,
  grayMatter: () => grayMatter,
  inBrowser: () => inBrowser,
  isActive: () => isActive,
  isExternal: () => isExternal,
  isInitGitRepo: () => isInitGitRepo,
  isWindows: () => isWindows,
  joinPath: () => joinPath,
  normalizePath: () => normalizePath,
  normalizeUrl: () => normalizeUrl,
  renderDynamicMarkdown: () => renderDynamicMarkdown,
  slash: () => slash,
  withBase: () => withBase
});
module.exports = __toCommonJS(src_exports);

// src/fs.ts
var import_node_crypto = __toESM(require("crypto"));
var import_node_fs2 = __toESM(require("fs"));
var import_node_os = __toESM(require("os"));
var import_node_path2 = __toESM(require("path"));
var import_cross_spawn2 = require("cross-spawn");
var import_gray_matter = __toESM(require("gray-matter"));

// src/getGitTimestamp.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var import_node_stream = require("stream");
var import_cross_spawn = require("cross-spawn");
var cache = /* @__PURE__ */ new Map();
var RS = 30;
var NUL = 0;
var LF = 10;
var GitLogParser = class extends import_node_stream.Transform {
  #state = "READ_TS";
  #tsBytes = [];
  #fileBytes = [];
  #files = [];
  constructor() {
    super({ readableObjectMode: true });
  }
  _transform(chunk, _enc, cb) {
    try {
      for (let i = 0; i < chunk.length; i++) {
        const b = chunk[i] === LF ? NUL : chunk[i];
        switch (this.#state) {
          case "READ_TS": {
            if (b === RS) {
            } else if (b === NUL) {
              this.#state = "READ_FILE";
            } else {
              this.#tsBytes.push(b);
            }
            break;
          }
          case "READ_FILE": {
            if (b === RS) {
              this.#emitRecord();
            } else if (b === NUL) {
              if (this.#fileBytes.length > 0) {
                this.#files.push(Buffer.from(this.#fileBytes).toString("utf8"));
                this.#fileBytes.length = 0;
              }
            } else {
              this.#fileBytes.push(b);
            }
            break;
          }
        }
      }
      cb();
    } catch (err) {
      cb(err);
    }
  }
  _flush(cb) {
    try {
      if (this.#state === "READ_FILE") {
        if (this.#fileBytes.length > 0) {
          throw new Error("GitLogParser: unexpected EOF while reading filename");
        } else {
          this.#emitRecord();
        }
      }
      cb();
    } catch (err) {
      cb(err);
    }
  }
  #emitRecord() {
    const ts = Buffer.from(this.#tsBytes).toString("utf8");
    const rec = {
      ts: Number.parseInt(ts, 10) * 1e3,
      files: this.#files.slice()
    };
    if (rec.ts > 0 && rec.files.length > 0)
      this.push(rec);
    this.#tsBytes.length = 0;
    this.#fileBytes.length = 0;
    this.#files.length = 0;
    this.#state = "READ_TS";
  }
};
var cacheRoot = /* @__PURE__ */ new Map();
async function cacheAllGitTimestamps(root, pathspec = ["*.md"]) {
  if (cacheRoot.has(root))
    return Promise.resolve(cache);
  cacheRoot.set(root, true);
  const cp = (0, import_cross_spawn.sync)("git", ["rev-parse", "--show-toplevel"], { cwd: root });
  if (cp.error) {
    return cache;
  }
  const gitRoot = cp.stdout.toString("utf8").trim();
  const args = [
    "log",
    "--pretty=format:%x1e%at%x00",
    // RS + epoch + NUL
    "--name-only",
    "-z",
    "--",
    ...pathspec
  ];
  return new Promise((resolve, reject) => {
    cache.clear();
    const child = (0, import_cross_spawn.spawn)("git", args, { cwd: root });
    child.stdout.pipe(new GitLogParser()).on("data", (rec) => {
      for (const file of rec.files) {
        const slashed = slash(import_node_path.default.resolve(gitRoot, file));
        if (!cache.has(slashed))
          cache.set(slashed, rec.ts);
      }
    }).on("error", reject).on("end", resolve);
    child.on("error", reject);
  });
}
function getCacheTimestamp(file) {
  return cache.get(file);
}
var _isInsideWorkTree;
function isInitGitRepo(root) {
  if (_isInsideWorkTree !== void 0) {
    return _isInsideWorkTree;
  }
  try {
    const cp = (0, import_cross_spawn.sync)("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root });
    _isInsideWorkTree = cp.status === 0 && cp.stdout.toString("utf8").trim() === "true";
  } catch (error) {
    _isInsideWorkTree = false;
  }
  return _isInsideWorkTree;
}
async function getGitTimestamp(file) {
  const cached = cache.get(file);
  if (cached)
    return cached;
  if (!isInitGitRepo(import_node_path.default.dirname(file)))
    return 0;
  if (!import_node_fs.default.existsSync(file))
    return 0;
  return new Promise((resolve, reject) => {
    const child = (0, import_cross_spawn.spawn)(
      "git",
      ["log", "-1", "--pretty=%at", "--", import_node_path.default.basename(file)],
      { cwd: import_node_path.default.dirname(file) }
    );
    let output = "";
    child.stdout.on("data", (d) => output += String(d));
    child.on("close", () => {
      const ts = Number.parseInt(output.trim(), 10) * 1e3;
      if (!(ts > 0))
        return resolve(0);
      cache.set(file, ts);
      resolve(ts);
    });
    child.on("error", reject);
  });
}

// src/fs.ts
function getDefaultTitle(content) {
  const match = content.match(/^(#+)\s+(.+)/m);
  return match?.[2] || "";
}
var cache2 = /* @__PURE__ */ new Map();
var fileSummaryCache = /* @__PURE__ */ new Map();
function getFileMD5(filePath) {
  try {
    const cacheKey = filePath;
    const cached = fileSummaryCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const fileBuffer = import_node_fs2.default.readFileSync(filePath);
    const hashSum = import_node_crypto.default.createHash("md5");
    hashSum.update(fileBuffer);
    const hash = hashSum.digest("hex");
    fileSummaryCache.set(filePath, hash);
    return hash;
  } catch (error) {
    const hashSum = import_node_crypto.default.createHash("md5");
    hashSum.update(filePath);
    return hashSum.digest("hex");
  }
}
function getFileQuickSummary(filePath) {
  try {
    const stats = import_node_fs2.default.statSync(filePath);
    const hashSum = import_node_crypto.default.createHash("md5");
    hashSum.update(`${filePath}:${stats.size}:${stats.mtime.getTime()}:${stats.ino}`);
    return hashSum.digest("hex");
  } catch (error) {
    const hashSum = import_node_crypto.default.createHash("md5");
    hashSum.update(filePath);
    return hashSum.digest("hex");
  }
}
async function fastMD5(filePath) {
  return getFileMD5(filePath);
}
function generateCacheKey(filePath, useQuickSummary = false) {
  const md5 = getFileMD5(filePath);
  const basename = import_node_path2.default.basename(filePath);
  return `${md5}_${basename}`;
}
async function readTimestampFromCache(cacheDir, cacheKey) {
  try {
    const cacheFilePath = import_node_path2.default.join(cacheDir, `${cacheKey}.cache`);
    if (!import_node_fs2.default.existsSync(cacheFilePath)) {
      return null;
    }
    const timestamp = import_node_fs2.default.readFileSync(cacheFilePath, "utf-8").trim();
    return new Date(parseInt(timestamp));
  } catch (error) {
    return null;
  }
}
async function writeTimestampToCache(cacheDir, cacheKey, date) {
  try {
    if (!import_node_fs2.default.existsSync(cacheDir)) {
      import_node_fs2.default.mkdirSync(cacheDir, { recursive: true });
    }
    const cacheFilePath = import_node_path2.default.join(cacheDir, `${cacheKey}.cache`);
    import_node_fs2.default.writeFileSync(cacheFilePath, date.getTime().toString());
  } catch (error) {
    console.warn("Failed to write cache:", error);
  }
}
async function getFileLastModifyTime(url, cacheDir) {
  if (cacheDir) {
    cacheDir = import_node_path2.default.join(cacheDir, "fileLastModifyTime");
  }
  const cached = cache2.get(url);
  if (cached) {
    return cached;
  }
  const cacheTimeStamp = getCacheTimestamp(url);
  if (cacheTimeStamp) {
    cache2.set(url, new Date(cacheTimeStamp));
    return new Date(cacheTimeStamp);
  }
  if (cacheDir && isInitGitRepo(import_node_path2.default.dirname(url))) {
    const cacheKey = generateCacheKey(url);
    const cachedDate = await readTimestampFromCache(cacheDir, cacheKey);
    if (cachedDate) {
      cache2.set(url, cachedDate);
      return cachedDate;
    }
  }
  let date;
  const gitTimestamp = await getGitTimestamp(url);
  if (gitTimestamp) {
    date = new Date(gitTimestamp);
  }
  let localFlag = false;
  if (!date) {
    localFlag = true;
    date = await getFileLastModifyTimeByFs(url);
  }
  if (date) {
    cache2.set(url, date);
    if (cacheDir && !localFlag) {
      const cacheKey = generateCacheKey(url);
      await writeTimestampToCache(cacheDir, cacheKey, date);
    }
  }
  return date;
}
function getFileLastModifyTimeByGit(url) {
  return new Promise((resolve) => {
    const cwd = import_node_path2.default.dirname(url);
    try {
      const fileName = import_node_path2.default.basename(url);
      const child = (0, import_cross_spawn2.spawn)("git", ["log", "-1", '--pretty="%ai"', fileName], {
        cwd
      });
      let output = "";
      child.stdout.on("data", (d) => output += String(d));
      child.on("close", async () => {
        let date;
        if (output.trim()) {
          date = new Date(output);
        }
        resolve(date);
      });
      child.on("error", async () => {
        resolve(void 0);
      });
    } catch {
      resolve(void 0);
    }
  });
}
async function getFileBirthTimeByFs(url) {
  try {
    const fsStat = await import_node_fs2.default.promises.stat(url);
    return fsStat.birthtime;
  } catch {
    return void 0;
  }
}
async function getFileLastModifyTimeByFs(url) {
  try {
    const fsStat = await import_node_fs2.default.promises.stat(url);
    return fsStat.mtime;
  } catch {
    return void 0;
  }
}
var EXTERNAL_URL_RE = /^[a-z]+:/i;
function joinPath(base, path4) {
  return `${base}${path4}`.replace(/\/+/g, "/");
}
function withBase(base, path4) {
  return EXTERNAL_URL_RE.test(path4) || path4.startsWith(".") ? path4 : joinPath(base, path4);
}
var grayMatter = import_gray_matter.default;
function getTextSummary(text, count = 100) {
  return text?.replace(/^#+\s+.*/, "")?.replace(/#/g, "")?.replace(/!\[.*?\]\(.*?\)/g, "")?.replace(/\[(.*?)\]\(.*?\)/g, "$1")?.replace(/\*\*(.*?)\*\*/g, "$1")?.split("\n")?.filter((v) => !!v)?.join("\n")?.replace(/>(.*)/, "")?.replace(/</g, "&lt;").replace(/>/g, "&gt;")?.trim()?.slice(0, count);
}
var windowsSlashRE = /\\/g;
var isWindows = import_node_os.default.platform() === "win32";
function slash(p) {
  return p.replace(windowsSlashRE, "/");
}
function normalizePath(id) {
  return import_node_path2.default.posix.normalize(isWindows ? slash(id) : id);
}

// src/date.ts
function formatDate(d, fmt = "yyyy-MM-dd hh:mm:ss") {
  if (!(d instanceof Date)) {
    d = new Date(d);
  }
  const o = {
    "M+": d.getMonth() + 1,
    // 月份
    "d+": d.getDate(),
    // 日
    "h+": d.getHours(),
    // 小时
    "m+": d.getMinutes(),
    // 分
    "s+": d.getSeconds(),
    // 秒
    "q+": Math.floor((d.getMonth() + 3) / 3),
    // 季度
    "S": d.getMilliseconds()
    // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      `${d.getFullYear()}`.substr(4 - RegExp.$1.length)
    );
  }
  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(`${o[k]}`.length)
      );
  }
  return fmt;
}
function formatShowDate(date) {
  const source = +new Date(date);
  const now = +/* @__PURE__ */ new Date();
  const diff = now - source;
  const oneSeconds = 1e3;
  const oneMinute = oneSeconds * 60;
  const oneHour = oneMinute * 60;
  const oneDay = oneHour * 24;
  const oneWeek = oneDay * 7;
  if (diff < oneMinute) {
    return `${Math.floor(diff / oneSeconds)}\u79D2\u524D`;
  }
  if (diff < oneHour) {
    return `${Math.floor(diff / oneMinute)}\u5206\u949F\u524D`;
  }
  if (diff < oneDay) {
    return `${Math.floor(diff / oneHour)}\u5C0F\u65F6\u524D`;
  }
  if (diff < oneWeek) {
    return `${Math.floor(diff / oneDay)}\u5929\u524D`;
  }
  return formatDate(new Date(date), "yyyy-MM-dd");
}

// src/vitepress.ts
var import_path = __toESM(require("path"));
var import_node_fs3 = __toESM(require("fs"));
function getVitePressPages(vpConfig) {
  const { pages, dynamicRoutes, rewrites } = vpConfig;
  const result = [];
  const srcDir = vpConfig.srcDir;
  const _dynamicRoutes = Array.isArray(dynamicRoutes) ? dynamicRoutes : dynamicRoutes?.routes || [];
  const vitepressDynamicRoutes = new Map(
    // @ts-ignore
    _dynamicRoutes?.map((r) => [
      r.fullPath,
      slash(import_path.default.join(srcDir, r.route))
    ]) || []
  );
  const vitepressRewrites = new Map(
    Object.entries(vpConfig?.rewrites.map || {}).map(([key, value]) => [
      slash(import_path.default.join(srcDir, key)),
      slash(import_path.default.join(srcDir, value))
    ]) || []
  );
  for (const page of pages) {
    const rewritePath = rewrites.map[page];
    const isRewrite = !!rewritePath;
    const originRoute = `/${normalizePath(page).replace(/\.md$/, "")}`;
    const rewriteRoute = rewritePath ? `/${normalizePath(rewritePath).replace(/\.md$/, "")}` : "";
    const dynamicRoute = _dynamicRoutes?.find((r) => r.path === page);
    const isDynamic = !!dynamicRoute;
    const route = rewriteRoute || originRoute;
    const filepath = isDynamic ? normalizePath(import_path.default.resolve(vpConfig.srcDir, dynamicRoute.route)) : normalizePath(`${vpConfig.srcDir}/${page}`);
    let file = import_path.default.resolve(vpConfig.srcDir, page);
    const fileOrig = vitepressDynamicRoutes.get(file) || file;
    file = vitepressRewrites.get(file) || file;
    const relativePath = slash(import_path.default.relative(srcDir, file));
    const cleanUrls = !!vpConfig.cleanUrls;
    const includes = [];
    const localeIndex = getLocaleForPath(vpConfig.site, relativePath);
    const env = {
      path: file,
      relativePath,
      cleanUrls,
      includes,
      realPath: fileOrig,
      localeIndex
    };
    result.push({
      page,
      route,
      isRewrite,
      isDynamic,
      filepath,
      originRoute,
      rewriteRoute,
      dynamicRoute,
      rewritePath,
      env
    });
  }
  return result;
}
function renderDynamicMarkdown(routeFile, params, content) {
  let baseContent = import_node_fs3.default.readFileSync(routeFile, "utf-8");
  if (content) {
    baseContent = baseContent.replace(/<!--\s*@content\s*-->/, content);
  }
  return baseContent.replace(/\{\{(.*?)\}\}/g, (all, $1) => {
    const key = $1?.trim?.() || "";
    if (key.startsWith("$params")) {
      const value = key.split(".").reduce((prev, curr) => {
        if (prev !== null && typeof prev === "object") {
          return prev[curr];
        }
        return void 0;
      }, { $params: params });
      return value;
    }
    return all;
  });
}
var HASH_RE = /#.*$/;
var HASH_OR_QUERY_RE = /[?#].*$/;
var INDEX_OR_EXT_RE = /(?:(^|\/)index)?\.(?:md|html)$/;
function normalize(path4) {
  return decodeURI(path4).replace(HASH_OR_QUERY_RE, "").replace(INDEX_OR_EXT_RE, "$1");
}
var inBrowser = typeof document !== "undefined";
function isActive(currentPath, matchPath, asRegex = false) {
  if (matchPath === void 0) {
    return false;
  }
  currentPath = normalize(`/${currentPath}`);
  if (asRegex) {
    return new RegExp(matchPath).test(currentPath);
  }
  if (normalize(matchPath) !== currentPath) {
    return false;
  }
  const hashMatch = matchPath.match(HASH_RE);
  if (hashMatch) {
    return (inBrowser ? location.hash : "") === hashMatch[0];
  }
  return true;
}
function isExternal(path4) {
  return /^(?:[a-z]+:|\/\/)/i.test(path4);
}
function getLocaleForPath(siteData, relativePath) {
  return Object.keys(siteData?.locales || {}).find(
    (key) => key !== "root" && !isExternal(key) && isActive(relativePath, `/${key}/`, true)
  ) || "root";
}

// src/utils.ts
var import_node_perf_hooks = require("perf_hooks");
var import_node_process = __toESM(require("process"));
function debugTime(flag) {
  const start = import_node_perf_hooks.performance.now();
  const end = () => {
    const result = import_node_perf_hooks.performance.now() - start;
    import_node_process.default.env.DEBUG && console.log(`[${flag}]`, result);
    return result;
  };
  return end;
}
function normalizeUrl(url) {
  return url.replace(/([^:]\/)\/+/g, "$1");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EXTERNAL_URL_RE,
  cacheAllGitTimestamps,
  debugTime,
  fastMD5,
  formatDate,
  formatShowDate,
  getCacheTimestamp,
  getDefaultTitle,
  getFileBirthTimeByFs,
  getFileLastModifyTime,
  getFileLastModifyTimeByFs,
  getFileLastModifyTimeByGit,
  getFileMD5,
  getFileQuickSummary,
  getGitTimestamp,
  getLocaleForPath,
  getTextSummary,
  getVitePressPages,
  grayMatter,
  inBrowser,
  isActive,
  isExternal,
  isInitGitRepo,
  isWindows,
  joinPath,
  normalizePath,
  normalizeUrl,
  renderDynamicMarkdown,
  slash,
  withBase
});
