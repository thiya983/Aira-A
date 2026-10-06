/**
 * GitHub API Direct Pusher for Aira AI
 * Pushes project files directly to GitHub repository using GitHub REST API
 * (Requires no local Git installation)
 */

const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'thiya983';
const REPO_NAME = 'Aira-A';
const BRANCH = 'main';

// Excluded patterns
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', '.gemini', 'brain', '.vscode', '.idea']);
const IGNORED_FILES = new Set(['.env', 'Thumbs.db', '.DS_Store', 'index.html']);

function getAllFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      if (IGNORED_FILES.has(entry.name)) continue;
      if (entry.name.endsWith('.log')) continue;
      results.push({ relPath, fullPath });
    }
  }
  return results;
}

async function pushToGitHub(token) {
  if (!token) {
    throw new Error('GitHub Personal Access Token is required.');
  }

  const rootDir = path.resolve(__dirname, '..');
  const files = getAllFiles(rootDir);
  console.log(`Found ${files.length} project files to upload to https://github.com/${REPO_OWNER}/${REPO_NAME}...`);

  const headers = {
    'Authorization': `Bearer ${token.trim()}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Aira-AI-Pusher'
  };

  // 1. Upload each file as a blob
  const treeItems = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const content = fs.readFileSync(f.fullPath);
    const isText = !content.includes(0); // Simple binary check

    const body = isText
      ? { content: content.toString('utf-8'), encoding: 'utf-8' }
      : { content: content.toString('base64'), encoding: 'base64' };

    const blobRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!blobRes.ok) {
      const err = await blobRes.json().catch(() => ({}));
      throw new Error(`Failed to upload blob ${f.relPath}: ${err.message || blobRes.statusText}`);
    }

    const blobData = await blobRes.json();
    treeItems.push({
      path: f.relPath,
      mode: '100644',
      type: 'blob',
      sha: blobData.sha
    });

    console.log(`[${i + 1}/${files.length}] Uploaded: ${f.relPath}`);
  }

  // 2. Create Tree
  console.log('Creating Git Tree on GitHub...');
  const treeRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tree: treeItems })
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create tree: ${err.message || treeRes.statusText}`);
  }
  const treeData = await treeRes.json();

  // 3. Create Commit
  console.log('Creating Commit on GitHub...');
  const commitRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: 'feat: complete full-stack Aira AI assistant with local Ollama integration',
      tree: treeData.sha
    })
  });

  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${err.message || commitRes.statusText}`);
  }
  const commitData = await commitRes.json();

  // 4. Update or create ref: refs/heads/main
  console.log(`Updating ${BRANCH} branch reference...`);
  let refRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`, {
    headers
  });

  if (refRes.ok) {
    // Update existing ref
    const updateRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: commitData.sha, force: true })
    });
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(`Failed to update ref: ${err.message || updateRes.statusText}`);
    }
  } else {
    // Create new ref
    const createRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: commitData.sha })
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(`Failed to create ref: ${err.message || createRes.statusText}`);
    }
  }

  console.log(`\n🎉 SUCCESS! Project successfully pushed to https://github.com/${REPO_OWNER}/${REPO_NAME}`);
}

module.exports = { pushToGitHub };

// Run from CLI if token provided as argument
if (require.main === module) {
  const token = process.argv[2] || process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('Usage: node push-to-github.js <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>');
    process.exit(1);
  }
  pushToGitHub(token).catch(err => {
    console.error('\n❌ Push failed:', err.message);
    process.exit(1);
  });
}
