# 变更日志

## 2019-2-2

- 重构目录结构，文件名称
- 添加 README.md、CHANGELOG.md、TODO.md
- 添加 .editorconfig
- 添加 pre-commit 校验，会在 commit 的时候进行 eslint 校验
- `npm run deploy` 自动发布 Github Page 页
- 优化 bezier 曲线坐标计算方式 (本来以为用公式来求会提高效率，没想到效率反而没有直接用控制点求的方式高)
- 添加重绘按钮

## 2019-2-1

- 根据所选控制点生成对应 bezier 曲线
- 动画后可移动控制点，变换曲线
- 可配置控制点个数、动画时长、动画效果