# Dream Garden Note Web

AI画像で制作した森の絵本作品を、紙の絵本をめくるように読める静的Webサイトです。

## 目的

- Web上で絵本として読む体験を公開する。
- 作品追加に耐えるデータ構造を維持する。
- 将来的な紙の絵本販売、予約、告知導線につなげる。

## 構成

```text
.
├── index.html
├── styles.css
├── script.js
├── data/
│   └── stories.js
├── assets/
│   ├── stories/
│   └── book-materials/
├── docs/
└── AGENTS.md
```

## 表示方法

`index.html` をブラウザで開くと表示できます。

```text
index.html
```

GitHub Pagesで公開する場合は、リポジトリの `main` ブランチのルートを公開対象にします。

## 作品追加

作品データは `data/stories.js` に追加します。

- 読者向けUIには管理番号を表示しない。
- Web用に最適化した画像だけを `assets/stories/{storyId}/` に入れる。
- Midjourneyなどの生成元画像、高解像度原本、Instagram取得データ、Excel管理ファイルはこのリポジトリに入れない。

詳しい手順は `docs/story_addition_workflow.md` を参照してください。

## 開発判断

決定済みのデザイン方針は `docs/design_decisions.md` に記録します。
開発の優先順位と保留事項は `docs/development_policy.md` に記録します。
