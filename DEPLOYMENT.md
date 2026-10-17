# GitHub Pages 发布

项目以静态站点发布，无需服务器或数据库。自动发布流程位于 `.github/workflows/deploy-pages.yml`：main 分支更新后，使用 Node 24 安装依赖，执行测试和构建，只有全部通过才发布 dist。

仓库应将 Settings → Pages → Build and deployment → Source 设置为 GitHub Actions。也可在 Actions 中手动运行 Deploy game to GitHub Pages。

Vite 在发布时读取 GitHub Pages 提供的 base_path；本地默认继续使用相对路径，不影响局域网开发。可用 `VITE_BASE_PATH=/rocket-team-webgame/ npm run build` 验证仓库子目录构建。静态资源、地图和宝可梦 JSON 均使用该路径前缀。

网站与本地/局域网地址的浏览器存档各自独立。迁移已有进度：在原游戏的“更多 → 存档与设置”导出 JSON，再到线上游戏导入。发布更新不会自动复制本地存档。

来源：[GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
