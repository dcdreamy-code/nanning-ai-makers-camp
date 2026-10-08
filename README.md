# 南宁 AI 造物营

面向南宁 10–18 岁青少年的 8 周项目制 AI 学习计划落地页。

基于 [ai.novastella.consulting](https://ai.novastella.consulting/) 的设计体系复刻，
并针对南宁本地生源与竞赛生态做了数据本地化。

## 技术栈

- Astro 5（静态输出，无运行时依赖）
- 纯 CSS + 原生 JS
- 思源宋体按 unicode-range 分 17 子集本地托管

## 目录

```
src/
├── data/
│   ├── content.js      全站文案（改文案只动这里）
│   └── nanning.js      南宁本地调研数据（带来源标注）
├── components/         各章节组件
├── layouts/Base.astro  SEO meta + JSON-LD
├── pages/index.astro   页面组装
├── scripts/main.js     交互与动画
└── styles/global.css   设计 token 与基础样式
public/fonts/           字体子集
```

## 本地开发

```bash
npm install
npm run dev            # 开发
npm run build          # 构建到 dist/
```

本地预览构建产物：

```bash
cd dist && python3 -m http.server 4321
```

## 生成单文件版本

用于只接受单文件的托管平台：

```bash
python3 scripts/build-single.mjs.py dist dist-single/nanning-ai-makers-camp.html
```

## 部署

推送到 GitHub 后，Actions 会自动构建并发布到 GitHub Pages：

```
https://dcdreamy-code.github.io/nanning-ai-makers-camp/
```

## 数据来源

南宁本地数据均来自官方公开文件，来源清单见 `src/data/nanning.js` 顶部：

- 南宁市统计局《2025 年南宁市国民经济和社会发展统计公报》
- 南宁市教育局 2026 年中考等级成绩组合情况
- 广西壮族自治区教育厅《广西推进人工智能赋能教育行动方案(2025—2027年)》
- 南宁市科学技术协会第 39 届广西青少年科技创新大赛通报
