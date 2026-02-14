# GitHub Release 操作（v1.0.0）

## 1. 提交代码并打标签
在仓库根目录执行：

`ash
git add .
git commit -m "release: v1.0.0"
git tag v1.0.0
git push origin main
git push origin v1.0.0
`

## 2. 在 GitHub 网页创建 Release
1. 打开仓库：https://github.com/Yzinuo/ZaneHydrateMate
2. 进入 Releases -> Draft a new release
3. 选择标签：1.0.0
4. 标题：1.0.0
5. 内容：粘贴 RELEASE_NOTES_v1.0.0.md 内容
6. 上传附件：
   - elease/v1.0.0/app-v1.0.0-release.apk
   - elease/v1.0.0/app-v1.0.0-release.aab
   - elease/v1.0.0/SHA256SUMS.txt
7. 点击 Publish release

## 3. keystore 备份（非常重要）
请妥善备份：
- elease/hydratemate-release.keystore
- alias: hydratemate
- store password / key password: 你当前发布用的密码

如果 keystore 丢失，后续将无法对同包名应用进行正常升级发布。
