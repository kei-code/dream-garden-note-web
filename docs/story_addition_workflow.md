# 作品追加手順

## 前提

- 管理番号は制作管理用であり、読者向けサイトには表示しない。
- 本文の起点は、制作管理側で保管している `03-outputs/instagram/dream_garden_note_instagram_captions.xlsx` の `Captions` シートにあるキャプションとする。
- Web絵本では、Instagram原文をそのまま長文化するのではなく、絵本として読むテンポに合わせて本文を拡張する。
- Web絵本本文の編集マスターは、制作管理側の `data/editorial/dream_garden_note_story_text_master.xlsx` とする。
- 新規作品追加は必ずExcel本文マスターを起点に進める。`data/stories.js` の直接編集を起点にしない。
- 公開サイト用の作品データは、Excel本文マスターから `data/stories.js` に生成する。
- 表紙・裏表紙画像は必ずstoryごとに作成する。共通素材へのフォールバックは仮対応に限定する。
- このリポジトリには、Web公開に使う最適化済み画像だけを入れる。
- Midjourney等の生成元画像、高解像度原本、Excel管理ファイルは制作管理側で保管し、このリポジトリには入れない。

## 追加手順

1. 制作管理側の `01-dream_garden_note-素材/{No}` に作品画像が入っていることを確認する。
2. Excelの `Captions` シートで同じNoのキャプションを確認する。
3. キャプションから、作品タイトル、短い説明、タグ、本文の方向性を決める。
4. 画像をWeb用に変換する。
5. `assets/stories/{No}/scene-01.jpg` の形式で画像が配置されたことを確認する。
6. story専用の表紙・裏表紙画像を作成し、制作管理側の原本管理用と公開用の両方に配置する。
7. 制作管理側のExcel本文マスターを編集する。
8. Excel本文マスターから `data/stories.js` を生成する。
9. `#stories` と `#reader/{No}` で表示確認する。

## 画像ルール

- 出力先: `assets/stories/{No}/`
- ファイル名: `scene-01.jpg`, `scene-02.jpg`, `scene-03.jpg` ...
- 基準サイズ: `896 x 1280`
- 形式: JPEG
- 品質: 82
- 元画像は削除しない。

## 表紙・裏表紙ルール

- 作品ごとに表紙・裏表紙を必ず作成する。
- 共通の表紙・裏表紙素材はフォールバック用であり、公開作品の完成状態としては使わない。
- 生成元画像は制作管理側の `02-generated-book-materials/story-{No}-{slug}-{yyyy-mm-dd}/selected/` に保管する。
- 公開用画像は `assets/book-materials/story-{No}/` に配置する。
- ファイル名は `dream-garden-note-{slug}-cover.jpg` / `dream-garden-note-{slug}-back-cover.jpg` を基本にする。
- 制作管理側のExcel本文マスターの `BookMaterials` シートに `cover_image` / `back_cover_image` を記入する。
- `data/stories.js` はExcel本文マスターから生成し、手作業の直書きを正としない。

## 本文ルール

- `description`: 作品ページやメタ情報向けの短い説明。
- `listDescription`: 作品一覧カード向けの短い説明。
- `heroCopy`: トップページで代表作品として表示する場合の説明。
- `desktopText`: PC見開き用。1ページあたり2段落を基本にする。
- `mobileText`: スマホ用。画像上に重ねるため、短く読み切れる文にする。

## No.011 の例

Excelキャプション:

```text
蛍の光の架け橋。満月とつながる夜。
```

Web絵本での拡張方針:

```text
小さな森の案内人が、蛍の光に導かれて満月へ続く橋を見つける。
```
