#!/bin/bash

# MiaoDa Chat Epic Sync Commands (Compatible with older gh CLI)
# Run these commands after completing GitHub authentication

set -e  # Exit on any error

echo "🚀 Starting MiaoDa Chat Epic Sync to GitHub..."

# 1. Create Epic Issue
echo "📝 Creating epic issue..."

if grep -qi "bug\|fix\|issue\|problem\|error" /tmp/epic-body.md; then
  epic_type="bug"
else
  epic_type="feature"
fi

# Create epic and capture URL, then extract number
epic_url=$(gh issue create \
  --title "Epic: miaoda-chat" \
  --body-file /tmp/epic-body.md \
  --label "epic,epic:miaoda-chat,$epic_type")

# Extract issue number from URL
epic_number=$(echo "$epic_url" | sed 's/.*\/issues\///')

echo "✅ Epic created: #$epic_number"
echo "🔗 Epic URL: $epic_url"

# 2. Create Task Issues sequentially (safer approach)
echo "📋 Creating 8 sub-issues..."

> /tmp/task-mapping.txt

# Process each task file
for task_file in .claude/epics/miaoda-chat/{001,002,003,004,005,006,007,008}.md; do
    [ -f "$task_file" ] || continue
    
    echo "🔄 Processing $(basename "$task_file")..."
    
    # Extract task name (use first line with # after frontmatter)
    task_name=$(sed -n '/^---$/,/^---$/d; /^# /p; q' "$task_file" | sed 's/^# *//')
    
    # If no frontmatter, get first # line
    if [ -z "$task_name" ]; then
        task_name=$(sed -n '/^# /p; q' "$task_file" | sed 's/^# *//')
    fi
    
    echo "  Task name: $task_name"
    
    # Strip frontmatter from task content if it exists
    if grep -q "^---$" "$task_file"; then
        sed '1,/^---$/d; 1,/^---$/d' "$task_file" > "/tmp/task-body-$(basename "$task_file" .md).md"
    else
        cp "$task_file" "/tmp/task-body-$(basename "$task_file" .md).md"
    fi
    
    # Create sub-issue and capture URL
    task_url=$(gh issue create \
      --title "$task_name" \
      --body-file "/tmp/task-body-$(basename "$task_file" .md).md" \
      --label "task,epic:miaoda-chat")
    
    # Extract issue number from URL
    task_number=$(echo "$task_url" | sed 's/.*\/issues\///')
    
    # Record mapping
    echo "$task_file:$task_number" >> /tmp/task-mapping.txt
    echo "✅ Created #$task_number: $task_name"
done

echo "📊 Task creation completed. Processing file updates..."

# 3. Build ID mapping for reference updates
> /tmp/id-mapping.txt
while IFS=: read -r task_file task_number; do
  old_num=$(basename "$task_file" .md)
  echo "$old_num:$task_number" >> /tmp/id-mapping.txt
done < /tmp/task-mapping.txt

# 4. Rename files and update references
echo "🔄 Updating task references and renaming files..."
while IFS=: read -r task_file task_number; do
  new_name="$(dirname "$task_file")/${task_number}.md"
  
  echo "  Processing: $(basename "$task_file") → $(basename "$new_name")"
  
  # Read file content
  content=$(cat "$task_file")
  
  # Update depends_on and conflicts_with references
  while IFS=: read -r old_num new_num; do
    content=$(echo "$content" | sed "s/\\[$old_num\\]/[$new_num]/g")
    content=$(echo "$content" | sed "s/\\[$old_num,/[$new_num,/g")
    content=$(echo "$content" | sed "s/, *$old_num\\]/, $new_num]/g")
    content=$(echo "$content" | sed "s/, *$old_num,/, $new_num,/g")
  done < /tmp/id-mapping.txt
  
  # Write updated content to new file
  echo "$content" > "$new_name"
  
  # Remove old file if different
  [ "$task_file" != "$new_name" ] && rm "$task_file"
  
  # Get repo info
  repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || gh repo view | grep "^name:" | cut -d: -f2- | tr -d ' ')
  if [ -z "$repo" ]; then
    # Fallback method
    repo=$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/\.git$//')
  fi
  
  github_url="https://github.com/$repo/issues/$task_number"
  current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Add basic frontmatter if missing
  if ! grep -q "^---" "$new_name"; then
    temp_content=$(cat "$new_name")
    cat > "$new_name" << EOF
---
name: $(echo "$task_name" | head -1)
status: open
created: $current_date
updated: $current_date
github: $github_url
depends_on: []
parallel: true
conflicts_with: []
---

$temp_content
EOF
  fi
  
  echo "✅ Updated: $(basename "$task_file") → #$task_number"
done < /tmp/task-mapping.txt

# 5. Update epic file
echo "📝 Updating epic file with GitHub information..."

repo=$(git remote get-url origin | sed 's/.*github.com[:/]//' | sed 's/\.git$//')
epic_github_url="https://github.com/$repo/issues/$epic_number"

# Update epic frontmatter if it exists
if grep -q "^github:" .claude/epics/miaoda-chat/epic.md; then
  sed -i.bak "s|^github:.*|github: $epic_github_url|" .claude/epics/miaoda-chat/epic.md
  rm .claude/epics/miaoda-chat/epic.md.bak 2>/dev/null || true
fi

# Update Tasks Created section with real issue numbers
cat > /tmp/tasks-section.md << 'EOF'
## Tasks Created
EOF

for task_file in .claude/epics/miaoda-chat/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  
  issue_num=$(basename "$task_file" .md)
  # Get task name from first header line
  task_name=$(sed -n '/^# /p; q' "$task_file" | sed 's/^# *//' | head -1)
  
  echo "- [ ] #${issue_num} - ${task_name}" >> /tmp/tasks-section.md
done

# Add summary statistics  
total_count=$(ls .claude/epics/miaoda-chat/[0-9]*.md 2>/dev/null | wc -l)

cat >> /tmp/tasks-section.md << EOF

**Total tasks**: $total_count
**All tasks created as GitHub issues**
**Epic**: #$epic_number
EOF

# Replace Tasks Created section in epic
cp .claude/epics/miaoda-chat/epic.md .claude/epics/miaoda-chat/epic.md.backup
awk '
  /^## Tasks Created/ { 
    skip=1
    while ((getline line < "/tmp/tasks-section.md") > 0) print line
    close("/tmp/tasks-section.md")
  }
  /^## / && !/^## Tasks Created/ { skip=0 }
  !skip && !/^## Tasks Created/ { print }
' .claude/epics/miaoda-chat/epic.md.backup > .claude/epics/miaoda-chat/epic.md

rm .claude/epics/miaoda-chat/epic.md.backup /tmp/tasks-section.md

# 6. Create mapping file
echo "📋 Creating GitHub mapping file..."
cat > .claude/epics/miaoda-chat/github-mapping.md << EOF
# GitHub Issue Mapping

Epic: #${epic_number} - https://github.com/${repo}/issues/${epic_number}

Tasks:
EOF

for task_file in .claude/epics/miaoda-chat/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  
  issue_num=$(basename "$task_file" .md)
  task_name=$(sed -n '/^# /p; q' "$task_file" | sed 's/^# *//')
  
  echo "- #${issue_num}: ${task_name} - https://github.com/${repo}/issues/${issue_num}" >> .claude/epics/miaoda-chat/github-mapping.md
done

echo "" >> .claude/epics/miaoda-chat/github-mapping.md
echo "Synced: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .claude/epics/miaoda-chat/github-mapping.md

# 7. Create worktree (if not already exists)
echo "🌲 Creating development worktree..."
if [ ! -d "../epic-miaoda-chat" ]; then
  git checkout main
  git pull origin main 2>/dev/null || echo "⚠️ Could not pull latest changes"
  git worktree add ../epic-miaoda-chat -b epic/miaoda-chat
  echo "✅ Created worktree: ../epic-miaoda-chat"
else
  echo "ℹ️ Worktree ../epic-miaoda-chat already exists"
fi

echo ""
echo "🎉 Sync completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - Epic: #${epic_number} - Epic: miaoda-chat"  
echo "  - Tasks: $total_count sub-issues created"
echo "  - Labels applied: epic, task, epic:miaoda-chat"
echo "  - Files renamed: 001.md → {issue_id}.md"
echo "  - References updated: depends_on arrays now use issue IDs"
echo "  - Worktree: ../epic-miaoda-chat"
echo ""
echo "🔗 Links:"
echo "  - Epic: $epic_github_url"
echo "  - Mapping: .claude/epics/miaoda-chat/github-mapping.md"
echo ""
echo "🚀 Next steps:"
echo "  - Start parallel execution: /pm:epic-start miaoda-chat"
echo "  - Or work on single issue: /pm:issue-start {issue_number}"
echo "  - View all issues: gh issue list --label epic:miaoda-chat"

# Cleanup
rm /tmp/task-mapping.txt /tmp/id-mapping.txt /tmp/epic-body*.md 2>/dev/null || true
rm /tmp/task-body-*.md 2>/dev/null || true

echo ""
echo "✨ GitHub sync complete!"