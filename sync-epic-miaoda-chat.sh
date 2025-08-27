#!/bin/bash

# MiaoDa Chat Epic Sync Commands
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

epic_number=$(gh issue create \
  --title "Epic: miaoda-chat" \
  --body-file /tmp/epic-body.md \
  --label "epic,epic:miaoda-chat,$epic_type" \
  --json number -q .number)

echo "✅ Epic created: #$epic_number"

# 2. Create Task Issues in Parallel (8 tasks >= 5, use parallel strategy)
echo "📋 Creating 8 sub-issues in parallel..."

# Since gh-sub-issue is not available, use regular issue creation
subissue_cmd="gh issue create"

# Create temporary directory for parallel processing
mkdir -p /tmp/batch-processing
> /tmp/task-mapping.txt

# Process tasks in parallel batches
# Batch 1: Tasks 001-003
echo "🔄 Batch 1: Creating tasks 001-003..."
(
  for task_file in .claude/epics/miaoda-chat/{001,002,003}.md; do
    [ -f "$task_file" ] || continue
    
    # Extract task name (use first line after frontmatter)
    task_name=$(sed -n '/^---$/,/^---$/d; /^#/p; q' "$task_file" | sed 's/^# *//')
    
    # Strip frontmatter from task content
    sed '1,/^---$/d; 1,/^---$/d' "$task_file" > "/tmp/task-body-$(basename "$task_file" .md).md"
    
    # Create sub-issue
    task_number=$(gh issue create \
      --title "$task_name" \
      --body-file "/tmp/task-body-$(basename "$task_file" .md).md" \
      --label "task,epic:miaoda-chat" \
      --json number -q .number)
    
    # Record mapping
    echo "$task_file:$task_number" >> /tmp/batch-1-mapping.txt
    echo "✅ Created #$task_number: $task_name"
  done
) &

# Batch 2: Tasks 004-006  
echo "🔄 Batch 2: Creating tasks 004-006..."
(
  for task_file in .claude/epics/miaoda-chat/{004,005,006}.md; do
    [ -f "$task_file" ] || continue
    
    task_name=$(sed -n '/^---$/,/^---$/d; /^#/p; q' "$task_file" | sed 's/^# *//')
    sed '1,/^---$/d; 1,/^---$/d' "$task_file" > "/tmp/task-body-$(basename "$task_file" .md).md"
    
    task_number=$(gh issue create \
      --title "$task_name" \
      --body-file "/tmp/task-body-$(basename "$task_file" .md).md" \
      --label "task,epic:miaoda-chat" \
      --json number -q .number)
    
    echo "$task_file:$task_number" >> /tmp/batch-2-mapping.txt
    echo "✅ Created #$task_number: $task_name"
  done
) &

# Batch 3: Tasks 007-008
echo "🔄 Batch 3: Creating tasks 007-008..."
(
  for task_file in .claude/epics/miaoda-chat/{007,008}.md; do
    [ -f "$task_file" ] || continue
    
    task_name=$(sed -n '/^---$/,/^---$/d; /^#/p; q' "$task_file" | sed 's/^# *//')
    sed '1,/^---$/d; 1,/^---$/d' "$task_file" > "/tmp/task-body-$(basename "$task_file" .md).md"
    
    task_number=$(gh issue create \
      --title "$task_name" \
      --body-file "/tmp/task-body-$(basename "$task_file" .md).md" \
      --label "task,epic:miaoda-chat" \
      --json number -q .number)
    
    echo "$task_file:$task_number" >> /tmp/batch-3-mapping.txt
    echo "✅ Created #$task_number: $task_name"
  done
) &

# Wait for all background jobs to complete
wait

# Consolidate all mappings
cat /tmp/batch-*-mapping.txt >> /tmp/task-mapping.txt

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
  
  # Read file content
  content=$(cat "$task_file")
  
  # Update depends_on and conflicts_with references
  while IFS=: read -r old_num new_num; do
    content=$(echo "$content" | sed "s/\\b$old_num\\b/$new_num/g")
  done < /tmp/id-mapping.txt
  
  # Write updated content to new file
  echo "$content" > "$new_name"
  
  # Remove old file if different
  [ "$task_file" != "$new_name" ] && rm "$task_file"
  
  # Update frontmatter with GitHub URL and timestamp
  repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
  github_url="https://github.com/$repo/issues/$task_number"
  current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  # Update frontmatter (create basic frontmatter if missing)
  if ! grep -q "^---" "$new_name"; then
    # Add basic frontmatter
    temp_content=$(cat "$new_name")
    cat > "$new_name" << EOF
---
name: $(sed -n '/^#/p; q' "$new_name" | sed 's/^# *//')
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
  else
    # Update existing frontmatter
    sed -i.bak "s|^github:.*|github: $github_url|" "$new_name"
    sed -i.bak "s|^updated:.*|updated: $current_date|" "$new_name"
    rm "${new_name}.bak"
  fi
  
  echo "✅ Updated: $task_file → $new_name (#$task_number)"
done < /tmp/task-mapping.txt

# 5. Update epic file
echo "📝 Updating epic file with GitHub information..."

repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
epic_url="https://github.com/$repo/issues/$epic_number"
current_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update epic frontmatter
sed -i.bak "s|^github:.*|github: $epic_url|" .claude/epics/miaoda-chat/epic.md
rm .claude/epics/miaoda-chat/epic.md.bak

# Update Tasks Created section with real issue numbers
cat > /tmp/tasks-section.md << 'EOF'
## Tasks Created
EOF

for task_file in .claude/epics/miaoda-chat/[0-9]*.md; do
  [ -f "$task_file" ] || continue
  
  issue_num=$(basename "$task_file" .md)
  task_name=$(sed -n '/^#/p; q' "$task_file" | sed 's/^# *//')
  
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
  task_name=$(sed -n '/^#/p; q' "$task_file" | sed 's/^# *//')
  
  echo "- #${issue_num}: ${task_name} - https://github.com/${repo}/issues/${issue_num}" >> .claude/epics/miaoda-chat/github-mapping.md
done

echo "" >> .claude/epics/miaoda-chat/github-mapping.md
echo "Synced: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .claude/epics/miaoda-chat/github-mapping.md

# 7. Create worktree
echo "🌲 Creating development worktree..."
git checkout main
git pull origin main
git worktree add ../epic-miaoda-chat -b epic/miaoda-chat

echo "✅ Sync completed successfully!"
echo ""
echo "📊 Summary:"
echo "  - Epic: #${epic_number} - Epic: miaoda-chat"
echo "  - Tasks: $total_count sub-issues created"
echo "  - Labels applied: epic, task, epic:miaoda-chat"
echo "  - Files renamed: 001.md → {issue_id}.md"
echo "  - References updated: depends_on/conflicts_with now use issue IDs"  
echo "  - Worktree: ../epic-miaoda-chat"
echo ""
echo "🔗 Links:"
echo "  - Epic: https://github.com/${repo}/issues/${epic_number}"
echo "  - Mapping: .claude/epics/miaoda-chat/github-mapping.md"
echo ""
echo "🚀 Next steps:"
echo "  - Start parallel execution: /pm:epic-start miaoda-chat"
echo "  - Or work on single issue: /pm:issue-start {issue_number}"

# Cleanup
rm -rf /tmp/batch-*
rm /tmp/task-mapping.txt /tmp/id-mapping.txt /tmp/epic-body*.md /tmp/task-body-*.md