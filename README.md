# Easy flow chrome-extension

A chrome extension to manage bookmarks and workflow.

## Dev setup

It is recommended to use node version 24.14 or higher.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Mode

```bash
npm run dev
```

### 4. Build the Extension

```bash
npm run build
```

The compiled extension files will be generated inside the **dist/** folder.

### 5. Loading the Extension in Chrome

1. Open Chrome
2. Go to `chrome://extensions`
3. Enable **Developer Mode**
4. Click **Load unpacked**
5. Select the project's **dist/** folder

The extension will now be installed locally.

### 6. Run Lint

run lint before committing the changes

```bash
npm run lint
```