# RepertoireTracker

## 项目介绍

一个纯静态高性能的歌单记录网站

## 使用技术栈

- 页面框架：astro
- 编程语言：typescript
- ui 框架：vue
- 非主页相关组件库：element-plus
- css 框架：unocss
- 包管理器：pnpm

## 启动、构建流程

### 启动

```shell
pnpm dev
```

页面在 `localhost:4321` 展示

### 构建

```shell
pnpm build
```

## 开发服务器与自定义编辑器

本项目基于 `vite-plugin-mock-dev-server` 魔改出的开发服务器，在开发期间实现了一个项目编辑器。其工作机制如下：

- 用户在开发期间正常运行前端页面
- 前端页面调用 `/src/dev-server` 中的 mock 端口
- 服务端动态更新放置于 `/custom` 底下的配置文件、自定义组件等
- `/custom` 已被 `.gitignore` 忽略，避免污染主项目 git 仓库
- 其他人可直接通过 git 拉取更新本项目，而不会影响用户的自定义配置

## 配置与组件的加载机制

配置文件和自定义组件的加载请参考以下两个核心模块：

- `configLoader.ts` — 配置文件加载器
- `componentLoader.ts` — 自定义组件加载器

加载策略为 **带 fallback 的用户配置读取机制**：

1. 优先从 `/custom` 对应目录下读取用户的配置文件或自定义组件
2. 若 `/custom` 下文件不存在，则回退到 `/src` 下的默认文件

这种设计确保了用户可自由覆盖默认配置，同时不会因缺少自定义文件而导致系统异常。

## 注意事项

- 项目暂无 eslint 等检查流程
- 日常开发中，**不要每次都重新运行 `pnpm build` 进行构建验证**，那样太浪费时间。IDE 的静态类型检查已经足以发现绝大多数问题，仅在需要正式构建产出时运行 `pnpm build` 即可。
