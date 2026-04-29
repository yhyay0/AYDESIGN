# 作品集管理系統操作指南

本指南將詳細說明如何使用您的作品集網站後台管理系統 (`admin.html`)，以便您輕鬆更新個人資料和作品集項目，而無需修改任何代碼。

## 1. 訪問管理系統

請在瀏覽器中打開 `admin.html` 文件。您將看到一個包含三個主要選項卡的儀表板：`Profile` (個人資料)、`Projects` (作品集) 和 `Export/Import` (匯出/匯入)。

## 2. Profile (個人資料) 管理

此選項卡允許您編輯網站首頁和「關於我」部分顯示的個人資訊。

### 可編輯欄位：
*   **Name (姓名)**：您的姓名，將顯示在網站的 Hero Section。
*   **Role (職稱)**：您的專業職稱，將顯示在 Hero Section。
*   **Bio (個人簡介)**：關於您的詳細介紹，將顯示在「關於我」部分。
*   **Skills (技能)**：您的專業技能列表，請使用逗號 `,` 分隔每個技能。例如：`UI/UX Design, Web Development, Branding`。
*   **Email (電子郵件)**：您的聯絡電子郵件地址。
*   **LinkedIn (領英)**：您的 LinkedIn 個人資料連結。
*   **Instagram (Instagram)**：您的 Instagram 個人資料連結。

### 操作步驟：
1.  在相應的輸入框中填寫或修改您的個人資訊。
2.  點擊 **`Save Profile`** 按鈕儲存更改。
3.  儲存後，您會收到一個提示，提醒您需要匯出更新後的 `portfolio.json` 文件並替換網站根目錄下的舊文件，才能使更改在網站前台生效。

## 3. Projects (作品集) 管理

此選項卡允許您新增、編輯和刪除作品集項目。

### 3.1 編輯現有作品集項目

頁面會列出所有現有的作品集項目。每個項目都包含以下可編輯欄位：
*   **Title (標題)**：作品的名稱。
*   **Category (類別)**：作品所屬的類別，例如 `Branding Design`、`UI/UX`。
*   **Year (年份)**：作品完成的年份。
*   **Size (大小)**：作品在網格佈局中的顯示大小，可選擇 `Small` (小) 或 `Large` (大)。`Large` 項目會佔用更大的空間，營造非對稱佈局效果。
*   **Image URL (圖片網址)**：作品的封面圖片網址。您可以上傳圖片到圖床（如 Imgur, Cloudinary）後貼上連結，或使用網站 `assets/img/projects/` 目錄下的圖片路徑（例如：`assets/img/projects/page-02.png`）。
*   **Description (描述)**：作品的詳細介紹。
*   **Tools (工具)**：作品中使用的工具或技術，請使用逗號 `,` 分隔每個工具。例如：`Figma, Adobe Illustrator`。

### 操作步驟：
1.  直接在每個作品項目的輸入框中修改內容。
2.  所有更改都會即時反映在底部的 JSON 預覽區。
3.  若要刪除某個作品，點擊該作品右上角的 **`Delete`** 按鈕。

### 3.2 新增作品集項目

在「Add New Project」區塊，您可以填寫新作品的資訊：
1.  填寫所有必要的欄位，包括標題、類別、年份、大小、圖片網址、描述和工具。
2.  點擊 **`Add Project`** 按鈕。新作品將會被添加到作品集列表的末尾。

## 4. Export/Import (匯出/匯入) 數據

此選項卡用於管理您的 `portfolio.json` 數據文件。

### 4.1 Export JSON (匯出 JSON)

1.  點擊 **`Download JSON`** 按鈕。瀏覽器會自動下載一個名為 `portfolio.json` 的文件，其中包含您在管理系統中所有最新的個人資料和作品集數據。
2.  **重要**：下載後，請將此文件替換掉您網站根目錄下 `data/portfolio.json` 的舊文件。這是讓網站前台顯示最新內容的關鍵步驟。

### 4.2 Import JSON (匯入 JSON)

1.  點擊 **`Choose File`** 按鈕，選擇您本地的 `portfolio.json` 文件。
2.  點擊 **`Import JSON`** 按鈕。系統將載入該文件中的數據，並更新管理系統中的顯示內容。
    *   **注意**：匯入操作會覆蓋當前管理系統中的所有數據，請謹慎操作。

### 4.3 Current JSON Data (當前 JSON 數據)

此區域會即時顯示當前管理系統中的所有數據，格式為 JSON。您可以：
*   直接查看數據結構。
*   點擊 **`Copy to Clipboard`** 按鈕將 JSON 數據複製到剪貼簿。

## 5. 圖片管理

管理系統本身不提供圖片上傳功能。您需要：
1.  將圖片上傳到一個公開可訪問的圖床服務（例如 Imgur, Cloudinary, GitHub Pages 等）。
2.  獲取圖片的直接連結 (URL)。
3.  將該 URL 填入作品集項目中的 **`Image URL`** 欄位。
4.  如果您將圖片放在網站的 `assets/img/projects/` 目錄下，可以直接使用相對路徑，例如 `assets/img/projects/my-project-image.jpg`。

## 6. 部署與更新

每次您更新 `portfolio.json` 文件後，請確保將新文件上傳到您的網站託管服務（例如 Netlify, GitHub Pages）的 `data/` 目錄中，覆蓋舊文件。這樣，您的網站前台就會顯示最新的內容。

希望這份指南能幫助您輕鬆管理您的專業作品集網站！
