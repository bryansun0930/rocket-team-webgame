# Rocket-Team-WebGame Final AI Pack

最终版独立游戏开发包。

目标：
制作一款 GBA 宝可梦绿宝石风格的火箭队 Web RPG。

技术：
Vue3 + Phaser3 + TypeScript + Pinia + Vite + GitHub Pages

开发理念：
- Codex负责工程实现
- AI负责策划辅助
- 图片AI负责美术资产
- 数据驱动全部系统
## 当前可玩版本

现已实现可通关的单人 Alpha：十章主线、两张地图、386 种宝可梦遭遇与本地像素图片、捕获/研究/交易、基地升级、资源经营、通缉与本地存档。电脑支持键盘，手机支持屏幕方向键和交互按钮。

启动：`npm ci` → `npm run dev`。

- [试玩指南](PLAY_GUIDE.md)
- [开发、测试与触屏说明](DEVELOPMENT.md)

运行 `npm test` 需要 Node 22.12+；推荐 Node 24。生产构建使用 `npm run build`，输出到 `dist/`。GitHub Pages 游戏地址：https://bryansun0930.github.io/rocket-team-webgame/。

新增可玩内容：9 份地区捕获委托、3 类探索选择事件、侦察/运输/分析派遣及属性加成。入口为“行动”和“队伍”，规则见 PLAY_GUIDE.md。
