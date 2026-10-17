# 像素素材生成记录

使用内置 image_gen 生成，源图保留在本目录。通过 Sharp 0.35.5 做裁切、透明边界定位、统一脚底基线和 nearest-neighbor 缩放，不向游戏增加运行时依赖。

运行时文件：
- `public/assets/characters/player/player_sheet.png`：96×128，3 列×4 行；每帧 32×32；行顺序 down、left、right、up，列顺序 idle、walk 1、walk 2。
- `public/assets/tiles/rocket_base/tiles.png`：64×16，依次为地板、墙、木箱、红色走道；每块 16×16，保留原有地块 ID 与碰撞属性。

动画参数在 `src/data/player.json`；步行播放 idle → walk 1 → idle → walk 2，8 fps。停止时显示当前方向的 idle 帧。

重新整理源图：安装 Sharp 后，在工程目录运行 `node scripts/prepare-pixel-assets.cjs /path/to/node_modules/sharp`。裁切坐标对应本次源图，换源图需重新检查。

## 玩家生成提示词

Use case: stylized-concept. Create a production pixel-art sprite sheet for a GBA top-down RPG. EXACT 3 columns x 4 rows evenly spaced on a transparent canvas, no labels, no grid lines. Every cell same size. One identical young underground-team recruit in charcoal uniform, red R on chest, black cap, red trim, pale gloves, boots. Row 1 faces DOWN toward viewer; row 2 faces LEFT; row 3 faces RIGHT; row 4 faces UP away from viewer. Each row columns are idle feet together, walking left foot forward, walking right foot forward. 12 full body sprites total, consistent size, centered horizontally in each cell, feet on same baseline within every cell. Crisp low-resolution pixel art designed as 32x32 pixel frames, hard square pixels, limited black/red/white palette, handheld RPG proportions, tiny face, no anti-aliasing, no shadows outside sprites. Output aligned sheet, transparent background. Save output image for project integration.

## 地块生成提示词

Use case stylized-concept. Game-ready GBA 16-bit pixel art tileset image. EXACT 2 by 2 square tiles filling entire square image, each quadrant same dimensions, no gaps, no margins, no labels. Top left: seamless dark blue-gray metal floor tile with subtle panel corner rivets, quiet low contrast. Top right: solid underground base metal wall face, dark charcoal with raised silver-gray upper bevel and narrow crimson stripe, repeatable horizontally. Bottom left: top-down wooden storage crate, warm brown wood slats, dark outline, fills tile. Bottom right: deep red floor runner tile with subtle darker edges, seamless vertically, no symbols. Orthographic top-down handheld RPG perspective, hard crisp pixel edges, designed as 16x16 pixels per quadrant enlarged by nearest neighbor. Limited coordinated charcoal, slate, muted red, brown palette. No perspective scene, no text, no gradients, no UI. Must be exactly four tiles in 2x2 arrangement.
