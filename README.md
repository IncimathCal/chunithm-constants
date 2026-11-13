# CHUNITHM 定数时光机

拖动时间轴，查看 CHUNITHM 任意历史日期的定数表快照——从 2015 年初代首日到今天，一张谱面的定数如何随版本更迭升降，一目了然。

> **EN** | CHUNITHM Constant Time Machine — drag the timeline to view the difficulty-constant table of all CHUNITHM songs on any date since the game's launch (2015). Fan-made tool; data sourced from the community wiki. UI in Chinese, multilingual support planned.

**在线访问**：<https://incimathcal.github.io/chunithm-constants/>

## 使用说明

- **时间轴**：点击或拖动顶部代际色带选择日期（竖线为当前日期），也可直接输入日期、±1 天微调、一键跳到最新。
- **代吸附**：开启后日期自动吸附到所属代的最后一天，方便对比"换代前夜"的全表快照。
- **▶ 播放**：自动快进时间轴，直观回放定数随各代更迭的变化过程。
- **筛选**：难度勾选（EXPERT / MASTER / ULTIMA）、定数区间、标题搜索、现役/下架状态、"只看本代有变动"。
- **单元格标记**：▲ 本代升 ▼ 本代降 ★ 本代首次登场（新曲或本代追加谱面）。
- **变迁轨迹**：每行右侧显示 MASTER 定数的历代演变；`⏸曾下架` 表示该曲中途下架后又复归（悬浮显示日期段）。
- **点击曲名**即复制。
- **外链**：🔗 前往 wikiwiki 词条；🎼 前往 [sdvx.in](https://sdvx.in/) 谱面平面图（主难度优先：有 ULTIMA 进 ULTIMA，否则 MASTER）。
- 列表支持按定数、曲名、配信日排序。

## 数据来源与致谢

- [wikiwiki CHUNITHM Wiki](https://wikiwiki.jp/chunithmwiki/) — 历史定数变迁、配信/下架信息（权威依据）
- [arcade-songs](https://arcade-songs.zetaraku.dev/chunithm/) — 曲目清单与当前定数快照
- [sdvx.in](https://sdvx.in/) — 谱面平面图

感谢上述站点及其维护者的持续付出，本工具才成为可能。

## 数据覆盖

- **1983 首**曲目（含已下架曲，下架期间自动从快照中隐藏），覆盖全部 **22 个版本代际**（CHUNITHM 2015-07-16 至今）
- 定数范围 1.0 ~ 16.0，EXPERT / MASTER / ULTIMA 三难度各自持有完整时间线
- 数据锚点：**2026-10-31**（CHUNITHM MATE）

## 数据管线

以 arcade-songs 的曲目清单为底，抓取 wikiwiki 的定数顺索引与各歌曲页，解析出每张谱面在每次版本更新时的定数变动，合并为逐日可查询的时间线数据；谱面图链接通过与 sdvx.in 的公开曲目数据按曲名对齐生成。全部由 Python 脚本离线处理，最终产物为零依赖的纯静态页面。

## 更新策略

- 版本号 `v<MMDD>`（如 v1113），同日多次更新追加字母递增（v1113b、v1113c…）。
- 数据**由维护者手动更新**，跟随游戏版本更迭，**可能有滞后**——每次换代需等待 wiki 信息整理完善后再行采集。
- 当前数据锚点：2026-10-31（MATE）。

## 版权与免责声明

- 本项目为**非官方粉丝自制工具**，与 SEGA 无关。
- 本项目由 IncimathCal 在 AI（Zhipu GLM）辅助下开发。
- CHUNITHM 及相关名称、曲目与图像的版权归 SEGA 及各权利方所有。
- 定数等数据来自上述社区站点，版权归各来源站点；本仓库不作任何商用。
- 数据仅供参考，一切以游戏内实际为准。
- 如有侵权，请通过 [GitHub Issues](https://github.com/IncimathCal/chunithm-constants/issues) 联系删除。
