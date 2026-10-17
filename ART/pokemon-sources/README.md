# 宝可梦资料与图片来源

- 数据：[PokéAPI](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv)，全国图鉴编号 1–386。目录保留名称、种族、属性、能力数据 CSV 快照。
- 图片：[PokeAPI/sprites](https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/versions/generation-iii/emerald)，第三世代 Emerald 正面静态像素图，64×64 PNG，原样保存于 `public/assets/pokemon/sprites/`。
- 原仓库许可保留在 `SPRITES-LICENCE.txt`，其开头注明图片内容版权属于 The Pokémon Company；仓库的 CC0 声明不代表对宝可梦图片或商标的独立商业授权。
- 本项目保留原有 12 种的自编游戏描述和经营数值；其余简述由名称、分类、属性、栖息地组合生成，经营数值为游戏演示设定。

通过 `node scripts/import-pokemon.mjs` 更新，构建后图片随站点发布，运行时无需访问 PokéAPI。导入时间与来源路径见 `sources.json`。存档继续使用物种编号，扩充图鉴不更改存档格式。
